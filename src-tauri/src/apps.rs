use serde::{Deserialize, Serialize};
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
use windows_sys::Win32::UI::Input::KeyboardAndMouse::keybd_event;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;
#[cfg(windows)]
const DETACHED_PROCESS: u32 = 0x00000008;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppItem {
    pub name: String,
    pub id: String,
    pub icon: String,
    pub category: String,
    pub shortcut: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SystemStats {
    pub username: String,
    pub computer_name: String,
    pub battery_percent: u32,
    pub is_charging: bool,
}

pub fn fetch_start_apps() -> Vec<AppItem> {
    let mut shortcuts = Vec::new();

    // Curated high-value system & utility shortcuts
    shortcuts.push(AppItem {
        name: "WezTerm (Terminal)".to_string(),
        id: "wezterm".to_string(),
        icon: "terminal".to_string(),
        category: "System".to_string(),
        shortcut: Some("Alt + Enter".to_string()),
    });
    shortcuts.push(AppItem {
        name: "File Explorer".to_string(),
        id: "explorer.exe".to_string(),
        icon: "folder".to_string(),
        category: "Files".to_string(),
        shortcut: Some("Win + E".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Task Manager".to_string(),
        id: "taskmgr.exe".to_string(),
        icon: "activity".to_string(),
        category: "System".to_string(),
        shortcut: Some("Ctrl + Shift + Esc".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Snipping Tool".to_string(),
        id: "snippingtool".to_string(),
        icon: "camera".to_string(),
        category: "Capture".to_string(),
        shortcut: Some("Win + Shift + S".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Windows Settings".to_string(),
        id: "ms-settings:".to_string(),
        icon: "settings".to_string(),
        category: "System".to_string(),
        shortcut: Some("Win + I".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Web Browser".to_string(),
        id: "chrome.exe".to_string(),
        icon: "globe".to_string(),
        category: "Web".to_string(),
        shortcut: Some("Alt + B".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Run Dialog".to_string(),
        id: "action:run".to_string(),
        icon: "terminal".to_string(),
        category: "System".to_string(),
        shortcut: Some("Win + R".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Clipboard History".to_string(),
        id: "action:clipboard".to_string(),
        icon: "message".to_string(),
        category: "Utility".to_string(),
        shortcut: Some("Win + V".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Project Display".to_string(),
        id: "action:project".to_string(),
        icon: "activity".to_string(),
        category: "Display".to_string(),
        shortcut: Some("Win + P".to_string()),
    });
    shortcuts.push(AppItem {
        name: "GlazeWM Reload".to_string(),
        id: "action:glazewm_reload".to_string(),
        icon: "settings".to_string(),
        category: "Window Manager".to_string(),
        shortcut: Some("Alt + Shift + R".to_string()),
    });
    shortcuts.push(AppItem {
        name: "GlazeWM Toggle Pause".to_string(),
        id: "action:glazewm_pause".to_string(),
        icon: "activity".to_string(),
        category: "Window Manager".to_string(),
        shortcut: Some("Alt + P".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Calculator".to_string(),
        id: "calc.exe".to_string(),
        icon: "code".to_string(),
        category: "Utility".to_string(),
        shortcut: Some("Calc".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Lock Screen".to_string(),
        id: "action:lock".to_string(),
        icon: "settings".to_string(),
        category: "Security".to_string(),
        shortcut: Some("Win + L".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Quick Search".to_string(),
        id: "action:search".to_string(),
        icon: "globe".to_string(),
        category: "Search".to_string(),
        shortcut: Some("Win + S".to_string()),
    });
    shortcuts.push(AppItem {
        name: "Power User Menu".to_string(),
        id: "action:power_menu".to_string(),
        icon: "settings".to_string(),
        category: "System".to_string(),
        shortcut: Some("Win + X".to_string()),
    });

    let mut installed = Vec::new();
    let script = "Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Compress";
    let mut cmd = Command::new("powershell");
    cmd.args(["-NoProfile", "-Command", script]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    if let Ok(output) = cmd.output() {
        let json_str = String::from_utf8_lossy(&output.stdout);
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&json_str) {
            if let Some(list) = val.as_array() {
                for item in list {
                    if let (Some(name), Some(id)) = (
                        item.get("Name").and_then(|n| n.as_str()),
                        item.get("AppID").and_then(|a| a.as_str()),
                    ) {
                        let trimmed = name.trim();
                        if trimmed.is_empty() {
                            continue;
                        }

                        // Skip if already in curated shortcuts
                        if shortcuts.iter().any(|s| s.name.eq_ignore_ascii_case(trimmed)) {
                            continue;
                        }

                        let lower = trimmed.to_lowercase();
                        let icon = if lower.contains("term") || lower.contains("shell") || lower.contains("cmd") {
                            "terminal"
                        } else if lower.contains("code") || lower.contains("studio") || lower.contains("dev") {
                            "code"
                        } else if lower.contains("music") || lower.contains("spotify") || lower.contains("sound") {
                            "music"
                        } else if lower.contains("browser") || lower.contains("chrome") || lower.contains("edge") || lower.contains("firefox") {
                            "globe"
                        } else if lower.contains("game") || lower.contains("steam") || lower.contains("play") {
                            "gamepad"
                        } else if lower.contains("discord") || lower.contains("chat") || lower.contains("telegram") {
                            "message"
                        } else if lower.contains("setting") || lower.contains("control") {
                            "settings"
                        } else {
                            "app"
                        };

                        let category = if lower.contains("code") || lower.contains("studio") || lower.contains("terminal") {
                            "Development".to_string()
                        } else if lower.contains("game") || lower.contains("steam") || lower.contains("riot") {
                            "Gaming".to_string()
                        } else if lower.contains("music") || lower.contains("spotify") || lower.contains("media") {
                            "Media".to_string()
                        } else {
                            "Apps".to_string()
                        };

                        installed.push(AppItem {
                            name: trimmed.to_string(),
                            id: id.to_string(),
                            icon: icon.to_string(),
                            category,
                            shortcut: None,
                        });
                    }
                }
            }
        }
    }

    installed.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    
    // Curated shortcuts stay at top, followed by installed apps
    let mut all = shortcuts;
    all.extend(installed);
    all
}

pub fn run_app(id: &str) -> Result<(), String> {
    match id {
        "snippingtool" => {
            let mut cmd = Command::new("cmd");
            cmd.args(["/c", "start", "", "ms-screenclip:"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
            return Ok(());
        }
        "action:run" => {
            let mut cmd = Command::new("powershell");
            cmd.args(["-NoProfile", "-Command", "(New-Object -ComObject Shell.Application).FileRun()"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
            return Ok(());
        }
        "action:clipboard" => {
            #[cfg(windows)]
            unsafe {
                keybd_event(0x5B, 0, 0, 0); // LWIN down
                keybd_event(0x56, 0, 0, 0); // V down
                keybd_event(0x56, 0, 2, 0); // V up
                keybd_event(0x5B, 0, 2, 0); // LWIN up
            }
            return Ok(());
        }
        "action:project" => {
            let mut cmd = Command::new("displayswitch.exe");
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
            return Ok(());
        }
        "action:search" => {
            #[cfg(windows)]
            unsafe {
                keybd_event(0x5B, 0, 0, 0);
                keybd_event(0x53, 0, 0, 0);
                keybd_event(0x53, 0, 2, 0);
                keybd_event(0x5B, 0, 2, 0);
            }
            return Ok(());
        }
        "action:power_menu" => {
            #[cfg(windows)]
            unsafe {
                keybd_event(0x5B, 0, 0, 0);
                keybd_event(0x58, 0, 0, 0);
                keybd_event(0x58, 0, 2, 0);
                keybd_event(0x5B, 0, 2, 0);
            }
            return Ok(());
        }
        "action:lock" => {
            return run_power("lock");
        }
        "action:glazewm_reload" => {
            let mut cmd = Command::new("glazewm");
            cmd.args(["command", "reload-config"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
            return Ok(());
        }
        "action:glazewm_pause" => {
            let mut cmd = Command::new("glazewm");
            cmd.args(["command", "toggle-pause"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
            return Ok(());
        }
        _ => {}
    }

    if id.starts_with("ms-") {
        let mut cmd = Command::new("cmd");
        cmd.args(["/c", "start", "", id]);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }

    if id.ends_with(".exe") && (id.contains(":") || id.contains("\\")) {
        let mut cmd = Command::new(id);
        #[cfg(windows)]
        cmd.creation_flags(DETACHED_PROCESS);
        cmd.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }

    if id == "wezterm" || id == "wezterm.exe" || id == "calc.exe" || id == "taskmgr.exe" || id == "explorer.exe" || id == "chrome.exe" {
        let mut cmd = Command::new(id);
        #[cfg(windows)]
        cmd.creation_flags(DETACHED_PROCESS);
        match cmd.spawn() {
            Ok(_) => return Ok(()),
            Err(_) => {
                let mut fallback = Command::new("cmd");
                fallback.args(["/c", "start", "", id]);
                #[cfg(windows)]
                fallback.creation_flags(CREATE_NO_WINDOW);
                fallback.spawn().map_err(|e| e.to_string())?;
                return Ok(());
            }
        }
    }

    let mut cmd = Command::new("explorer.exe");
    cmd.arg(format!("shell:appsFolder\\{}", id));
    #[cfg(windows)]
    cmd.creation_flags(DETACHED_PROCESS);
    cmd.spawn().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn run_power(action: &str) -> Result<(), String> {
    match action {
        "lock" => {
            let mut cmd = Command::new("rundll32.exe");
            cmd.args(["user32.dll,LockWorkStation"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
        }
        "sleep" => {
            let mut cmd = Command::new("rundll32.exe");
            cmd.args(["powrprof.dll,SetSuspendState", "0,1,0"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
        }
        "restart" => {
            let mut cmd = Command::new("shutdown.exe");
            cmd.args(["/r", "/t", "0"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
        }
        "shutdown" => {
            let mut cmd = Command::new("shutdown.exe");
            cmd.args(["/s", "/t", "0"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.spawn().map_err(|e| e.to_string())?;
        }
        _ => return Err(format!("Unknown action: {}", action)),
    }
    Ok(())
}

pub fn get_system_stats() -> SystemStats {
    let username = std::env::var("USERNAME").unwrap_or_else(|_| "Admin".to_string());
    let computer_name = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "Windows".to_string());

    SystemStats {
        username,
        computer_name,
        battery_percent: 100,
        is_charging: true,
    }
}
