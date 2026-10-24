pub mod apps;
pub mod hook;

use apps::{AppItem, SystemStats};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use tauri::{Manager, WebviewWindow};

static LAUNCHER_VISIBLE: AtomicBool = AtomicBool::new(false);

#[cfg(target_os = "windows")]
pub fn apply_frameless(hwnd: windows_sys::Win32::Foundation::HWND) {
    unsafe {
        use windows_sys::Win32::Graphics::Dwm::*;
        use windows_sys::Win32::UI::WindowsAndMessaging::*;
        use windows_sys::Win32::UI::Controls::MARGINS;

        // Strip WS_CAPTION, WS_THICKFRAME, WS_MINIMIZEBOX, WS_MAXIMIZEBOX, WS_SYSMENU, WS_BORDER
        let mut style = GetWindowLongW(hwnd, GWL_STYLE) as u32;
        style &= !(WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU | WS_BORDER | WS_DLGFRAME);
        style |= WS_POPUP;
        SetWindowLongW(hwnd, GWL_STYLE, style as i32);

        // Strip standard window frames, dialog frame and edge styles
        let mut ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE) as u32;
        ex_style &= !(WS_EX_DLGMODALFRAME | WS_EX_CLIENTEDGE | WS_EX_STATICEDGE | WS_EX_WINDOWEDGE);
        ex_style |= WS_EX_TOOLWINDOW | WS_EX_TOPMOST;
        SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style as i32);

        // Completely disable DWM BlurBehind that Tao turned on
        let bb = DWM_BLURBEHIND {
            dwFlags: DWM_BB_ENABLE,
            fEnable: 0,
            hRgnBlur: std::ptr::null_mut(),
            fTransitionOnMaximized: 0,
        };
        let _ = DwmEnableBlurBehindWindow(hwnd, &bb as *const _ as *const _);

        // Disable Windows 11 Acrylic / Mica background blur outside phone chassis
        // DWMWA_SYSTEMBACKDROP_TYPE = 38, DWMSBT_NONE = 1
        let backdrop_none = 1u32;
        DwmSetWindowAttribute(
            hwnd,
            38,
            &backdrop_none as *const _ as *const _,
            std::mem::size_of::<u32>() as u32,
        );

        // Disable any DWM window border: DWMWA_BORDER_COLOR = 34, DWMWA_COLOR_NONE = 0xFFFFFFFE
        let border_none = 0xFFFFFFFEu32;
        DwmSetWindowAttribute(
            hwnd,
            34,
            &border_none as *const _ as *const _,
            std::mem::size_of::<u32>() as u32,
        );

        // Force Windows 11 rounded window corners matching phone chassis
        // DWMWA_WINDOW_CORNER_PREFERENCE = 33, DWMWCP_ROUND = 2
        let corner_round = 2u32;
        DwmSetWindowAttribute(
            hwnd,
            33,
            &corner_round as *const _ as *const _,
            std::mem::size_of::<u32>() as u32,
        );

        // Reset DWM margins to 0 so no client area blur is extended
        let margins = MARGINS {
            cxLeftWidth: 0,
            cxRightWidth: 0,
            cyTopHeight: 0,
            cyBottomHeight: 0,
        };
        let _ = DwmExtendFrameIntoClientArea(hwnd, &margins as *const _ as *const _);

        SetWindowPos(
            hwnd,
            std::ptr::null_mut(),
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED | SWP_NOACTIVATE,
        );
    }
}

pub fn do_show(window: &WebviewWindow) {
    LAUNCHER_VISIBLE.store(true, Ordering::SeqCst);
    let _ = window.show();
    let _ = window.set_focus();

    #[cfg(target_os = "windows")]
    if let Ok(raw_hwnd) = window.hwnd() {
        apply_frameless(raw_hwnd.0 as windows_sys::Win32::Foundation::HWND);
    }

    let _ = window.eval(
        r#"
        if (window.triggerOpen) window.triggerOpen();
        const inp = document.getElementById("search-input");
        if (inp) { inp.focus(); inp.select(); }
        "#,
    );
}

pub fn do_hide(window: &WebviewWindow) {
    LAUNCHER_VISIBLE.store(false, Ordering::SeqCst);
    let _ = window.hide();
}

pub fn do_toggle(window: &WebviewWindow) {
    if LAUNCHER_VISIBLE.load(Ordering::SeqCst) {
        do_hide(window);
    } else {
        do_show(window);
    }
}

#[tauri::command]
fn get_apps() -> Vec<AppItem> {
    apps::fetch_start_apps()
}

#[tauri::command]
fn launch_app(id: String, window: WebviewWindow) -> Result<(), String> {
    let res = apps::run_app(&id);
    do_hide(&window);
    res
}

#[tauri::command]
fn execute_power(action: String, window: WebviewWindow) -> Result<(), String> {
    do_hide(&window);
    apps::run_power(&action)
}

#[tauri::command]
fn get_system_stats() -> SystemStats {
    apps::get_system_stats()
}

#[tauri::command]
fn hide_launcher(window: WebviewWindow) -> Result<(), String> {
    do_hide(&window);
    Ok(())
}

#[tauri::command]
fn show_launcher(window: WebviewWindow) -> Result<(), String> {
    do_show(&window);
    Ok(())
}

#[tauri::command]
fn toggle_launcher(window: WebviewWindow) -> Result<(), String> {
    do_toggle(&window);
    Ok(())
}

pub fn run() {
    let (tx, rx) = mpsc::channel();
    hook::start_win_hook(tx);

    tauri::Builder::default()
        .setup(move |app| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_decorations(false);
                let _ = win.set_shadow(false);

                #[cfg(target_os = "windows")]
                if let Ok(raw_hwnd) = win.hwnd() {
                    apply_frameless(raw_hwnd.0 as windows_sys::Win32::Foundation::HWND);
                }
            }

            let app_handle = app.handle().clone();

            // Channel listener for Win key & taskbar Start events from background hook, dispatched cleanly on main thread
            std::thread::spawn(move || {
                while let Ok(()) = rx.recv() {
                    let app_h = app_handle.clone();
                    let _ = app_handle.run_on_main_thread(move || {
                        if let Some(win) = app_h.get_webview_window("main") {
                            do_toggle(&win);
                        }
                    });
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_apps,
            launch_app,
            execute_power,
            get_system_stats,
            hide_launcher,
            show_launcher,
            toggle_launcher,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
