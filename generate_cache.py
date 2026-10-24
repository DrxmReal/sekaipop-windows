import subprocess
import json

curated = [
    {"name": "WezTerm (Terminal)", "id": "wezterm", "icon": "terminal", "category": "System", "shortcut": "Alt + Enter"},
    {"name": "File Explorer", "id": "explorer.exe", "icon": "folder", "category": "Files", "shortcut": "Win + E"},
    {"name": "Task Manager", "id": "taskmgr.exe", "icon": "activity", "category": "System", "shortcut": "Ctrl + Shift + Esc"},
    {"name": "Snipping Tool", "id": "snippingtool", "icon": "camera", "category": "Capture", "shortcut": "Win + Shift + S"},
    {"name": "Windows Settings", "id": "ms-settings:", "icon": "settings", "category": "System", "shortcut": "Win + I"},
    {"name": "Web Browser", "id": "chrome.exe", "icon": "globe", "category": "Web", "shortcut": "Alt + B"},
    {"name": "Run Dialog", "id": "action:run", "icon": "terminal", "category": "System", "shortcut": "Win + R"},
    {"name": "Clipboard History", "id": "action:clipboard", "icon": "message", "category": "Utility", "shortcut": "Win + V"},
    {"name": "Project Display", "id": "action:project", "icon": "activity", "category": "Display", "shortcut": "Win + P"},
    {"name": "GlazeWM Reload", "id": "action:glazewm_reload", "icon": "settings", "category": "Window Manager", "shortcut": "Alt + Shift + R"},
    {"name": "GlazeWM Toggle Pause", "id": "action:glazewm_pause", "icon": "activity", "category": "Window Manager", "shortcut": "Alt + P"},
    {"name": "Calculator", "id": "calc.exe", "icon": "code", "category": "Utility", "shortcut": "Calc"},
    {"name": "Lock Screen", "id": "action:lock", "icon": "settings", "category": "Security", "shortcut": "Win + L"},
    {"name": "Quick Search", "id": "action:search", "icon": "globe", "category": "Search", "shortcut": "Win + S"},
    {"name": "Power User Menu", "id": "action:power_menu", "icon": "settings", "category": "System", "shortcut": "Win + X"}
]

res = subprocess.check_output(["powershell", "-NoProfile", "-Command", "Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Compress"])
apps_raw = json.loads(res.decode("utf-8", errors="ignore"))
installed = []
curated_names = {c["name"].lower() for c in curated}

for a in apps_raw:
    name = (a.get("Name") or "").strip()
    appid = (a.get("AppID") or "").strip()
    if not name or name.lower() in curated_names:
        continue
    lower = name.lower()
    icon = "app"
    if any(k in lower for k in ["term", "shell", "cmd"]): icon = "terminal"
    elif any(k in lower for k in ["code", "studio", "dev"]): icon = "code"
    elif any(k in lower for k in ["music", "spotify", "sound"]): icon = "music"
    elif any(k in lower for k in ["browser", "chrome", "edge", "firefox"]): icon = "globe"
    elif any(k in lower for k in ["game", "steam", "play"]): icon = "gamepad"
    elif any(k in lower for k in ["discord", "chat", "telegram"]): icon = "message"
    elif any(k in lower for k in ["setting", "control"]): icon = "settings"

    cat = "Apps"
    if any(k in lower for k in ["code", "studio", "terminal"]): cat = "Development"
    elif any(k in lower for k in ["game", "steam", "riot"]): cat = "Gaming"
    elif any(k in lower for k in ["music", "spotify", "media"]): cat = "Media"

    installed.append({
        "name": name,
        "id": appid,
        "icon": icon,
        "category": cat,
        "shortcut": None
    })

installed.sort(key=lambda x: x["name"].lower())
all_apps = curated + installed

with open(r"C:\Users\Admin\sekaipop\apps_cache.json", "w", encoding="utf-8") as f:
    json.dump(all_apps, f, ensure_ascii=False, indent=2)

print("Generated apps_cache.json with", len(all_apps), "items")
