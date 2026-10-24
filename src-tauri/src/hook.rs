use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::Sender;
use std::time::{SystemTime, UNIX_EPOCH};
use windows_sys::Win32::Foundation::*;
use windows_sys::Win32::System::Threading::*;
use windows_sys::Win32::UI::Accessibility::*;
use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
use windows_sys::Win32::UI::WindowsAndMessaging::*;

static WIN_PRESSED: AtomicBool = AtomicBool::new(false);
static COMBO_OCCURRED: AtomicBool = AtomicBool::new(false);
static LAST_TRIGGER_MS: AtomicU64 = AtomicU64::new(0);
static mut TRIGGER_TX: Option<Sender<()>> = None;

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn trigger_sekai() {
    let now = now_ms();
    let last = LAST_TRIGGER_MS.load(Ordering::SeqCst);
    if now.saturating_sub(last) < 320 {
        return;
    }
    LAST_TRIGGER_MS.store(now, Ordering::SeqCst);

    unsafe {
        if let Some(ref tx) = TRIGGER_TX {
            let _ = tx.send(());
        }
    }
}

pub fn start_win_hook(tx: Sender<()>) {
    unsafe {
        TRIGGER_TX = Some(tx);
    }
    std::thread::spawn(|| unsafe {
        let kb_hook = SetWindowsHookExW(
            WH_KEYBOARD_LL,
            Some(ll_keyboard_proc),
            std::ptr::null_mut(),
            0,
        );
        if kb_hook.is_null() {
            eprintln!("Failed to install low-level keyboard hook");
        }

        // Intercept native StartMenu foreground activation (e.g. mouse click on taskbar Start icon)
        let event_hook = SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            std::ptr::null_mut(),
            Some(win_event_proc),
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS,
        );
        if event_hook.is_null() {
            eprintln!("Failed to install WinEvent hook");
        }

        let mut msg: MSG = std::mem::zeroed();
        while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }

        if !kb_hook.is_null() {
            UnhookWindowsHookEx(kb_hook);
        }
        if !event_hook.is_null() {
            UnhookWinEvent(event_hook);
        }
    });
}

unsafe extern "system" fn ll_keyboard_proc(code: i32, wparam: usize, lparam: isize) -> isize {
    if code >= 0 {
        unsafe {
            let kbd = *(lparam as *const KBDLLHOOKSTRUCT);
            // Ignore synthetic/injected keys (LLKHF_INJECTED = 0x10) to avoid re-triggering loops
            if (kbd.flags & 0x10) != 0 {
                return CallNextHookEx(std::ptr::null_mut(), code, wparam, lparam);
            }

            let vk = kbd.vkCode as u16;
            let is_win = vk == 0x5B || vk == 0x5C; // VK_LWIN or VK_RWIN

            if wparam == WM_KEYDOWN as usize || wparam == WM_SYSKEYDOWN as usize {
                if is_win {
                    WIN_PRESSED.store(true, Ordering::SeqCst);
                    COMBO_OCCURRED.store(false, Ordering::SeqCst);
                } else if WIN_PRESSED.load(Ordering::SeqCst) {
                    // Another key was pressed while Win was held -> legitimate shortcut combo
                    COMBO_OCCURRED.store(true, Ordering::SeqCst);
                }
            } else if wparam == WM_KEYUP as usize || wparam == WM_SYSKEYUP as usize {
                if is_win {
                    let was_pressed = WIN_PRESSED.swap(false, Ordering::SeqCst);
                    let combo = COMBO_OCCURRED.swap(false, Ordering::SeqCst);

                    // Intercept if Win was pressed and released ALONE
                    if was_pressed && !combo {
                        // Inject VK_NONAME (0xE8) while Win is in release cycle
                        // This informs Windows DWM that a combo occurred with the Win key,
                        // completely suppressing the native Windows 11 Start Menu.
                        keybd_event(0xE8, 0, 0, 0);
                        keybd_event(0xE8, 0, 2, 0);

                        // Signal toggle to SekaiPop phone launcher
                        trigger_sekai();

                        // Pass WM_KEYUP so Windows clears VK_LWIN down state in input buffer
                    }
                }
            }
        }
    }

    unsafe { CallNextHookEx(std::ptr::null_mut(), code, wparam, lparam) }
}

unsafe extern "system" fn win_event_proc(
    _h_win_event_hook: HWINEVENTHOOK,
    _event: u32,
    hwnd: HWND,
    _id_object: i32,
    _id_child: i32,
    _id_event_thread: u32,
    _dwms_event_time: u32,
) {
    if hwnd.is_null() {
        return;
    }

    let mut pid = 0u32;
    unsafe {
        GetWindowThreadProcessId(hwnd, &mut pid);
        if pid == 0 {
            return;
        }

        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if !handle.is_null() {
            let mut buf = [0u16; 512];
            let mut size = 512u32;
            if QueryFullProcessImageNameW(handle, 0, buf.as_mut_ptr(), &mut size) != 0 {
                let path = String::from_utf16_lossy(&buf[..size as usize]);
                if path.ends_with("StartMenuExperienceHost.exe") {
                    // Suppress and dismiss native Windows 11 Start Menu
                    ShowWindow(hwnd, SW_HIDE);
                    PostMessageW(hwnd, WM_CLOSE, 0, 0);

                    // Clear Start Menu state
                    keybd_event(0xE8, 0, 0, 0);
                    keybd_event(0xE8, 0, 2, 0);

                    // Trigger SekaiPop
                    trigger_sekai();
                }
            }
            CloseHandle(handle);
        }
    }
}
