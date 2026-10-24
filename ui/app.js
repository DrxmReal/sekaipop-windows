// SekaiPop Windows 11 Controller

const tauriCore = (typeof window !== "undefined" && window.__TAURI__) ? (window.__TAURI__.core || window.__TAURI__) : null;
const invoke = (tauriCore && typeof tauriCore.invoke === "function") 
    ? tauriCore.invoke.bind(tauriCore) 
    : async () => [];

const tauriEvent = (typeof window !== "undefined" && window.__TAURI__ && window.__TAURI__.event) ? window.__TAURI__.event : null;
const listen = (tauriEvent && typeof tauriEvent.listen === "function") 
    ? tauriEvent.listen.bind(tauriEvent) 
    : () => {};

let allApps = [];
let allShortcuts = [];
let filteredApps = [];
let selectedIndex = 0;
let isLandscape = false;

const themes = [
    { id: "indigo", label: "INDIGO NIGHT" },
    { id: "virtual", label: "VIRTUAL SINGER" },
    { id: "nightcord", label: "N25: NIGHTCORD" },
    { id: "vivid", label: "VIVID BAD SQUAD" }
];
let currentThemeIdx = 0;

// DOM Elements
const phoneContainer = document.getElementById("phone-container");
const phoneBody = document.getElementById("phone-body");
const portraitView = document.getElementById("portrait-view");
const settingsView = document.getElementById("settings-view");

const searchInput = document.getElementById("search-input");
const appList = document.getElementById("app-list");
const appCounter = document.getElementById("app-counter");
const searchCount = document.getElementById("search-count");

const statusTime = document.getElementById("status-time");
const statusDate = document.getElementById("status-date");
const lsTime = document.getElementById("ls-time");
const lsDate = document.getElementById("ls-date");
const statusBattery = document.getElementById("status-battery");
const profileDate = document.getElementById("profile-date");

const themeBtn = document.getElementById("theme-btn");
const themeLabel = document.getElementById("theme-label");
const closeBtn = document.getElementById("close-btn");
const refreshBtn = document.getElementById("refresh-btn");
const btnOpenSettings = document.getElementById("btn-open-settings");
const pinSettings = document.getElementById("pin-settings");
const settingsCloseBtn = document.getElementById("settings-close-btn");
const sectionPinned = document.getElementById("section-pinned");
const toast = document.getElementById("toast");

function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
}

// Clock & Date Tick (Updates both portrait and landscape clocks)
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

    if (statusTime) statusTime.textContent = timeStr;
    if (statusDate) statusDate.textContent = dateStr;
    if (profileDate) profileDate.textContent = dateStr;
    if (lsTime) lsTime.textContent = timeStr;
    if (lsDate) lsDate.textContent = dateStr;
}
setInterval(updateClock, 1000);
updateClock();

// Battery Status
if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
        function updateBat() {
            const level = Math.round(battery.level * 100);
            if (statusBattery) {
                statusBattery.innerHTML = `${level}% <svg class="svg-icon" viewBox="0 0 24 24" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/></svg>`;
            }
        }
        updateBat();
        battery.addEventListener("levelchange", updateBat);
        battery.addEventListener("chargingchange", updateBat);
    });
}

let openedTime = Date.now();

// Animation Trigger
window.triggerOpen = function() {
    openedTime = Date.now();
    syncSystemControls();
    if (phoneContainer) {
        phoneContainer.style.pointerEvents = "auto";
        phoneContainer.classList.remove("rise-up");
        void phoneContainer.offsetWidth; // Force reflow
        phoneContainer.classList.add("rise-up");
    }
    const pb = document.getElementById("phone-body");
    const ps = document.querySelector(".phone-screen");
    const deck = document.querySelector(".system-deck");
    const pv = document.getElementById("portrait-view");
    if (pb) pb.style.pointerEvents = "auto";
    if (ps) ps.style.pointerEvents = "auto";
    if (pv) pv.style.pointerEvents = "auto";
    if (deck) {
        deck.style.pointerEvents = "auto";
        deck.style.zIndex = "9999999";
    }
    ["btn-lock", "btn-sleep", "btn-restart", "btn-power"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.pointerEvents = "auto";
            btn.style.cursor = "pointer";
            btn.style.zIndex = "9999999";
        }
    });

    // Automatically synchronize color palette with Wallpaper Engine on open
    if (typeof syncWallpaperPalette === "function") {
        syncWallpaperPalette();
    }
};

// Wallpaper Engine DOM Elements
const wallpaperView = document.getElementById("wallpaper-view");
const wpBackBtn = document.getElementById("wp-back-btn");
const wpCloseBtn = document.getElementById("wp-close-btn");
const wpSyncPcBtn = document.getElementById("wp-sync-pc-btn");
const wpOpenAppBtn = document.getElementById("wp-open-app-btn");
const wpApplyDesktopBtn = document.getElementById("wp-apply-desktop-btn");
const wpGrid = document.getElementById("wp-grid");
const wpStatusText = document.getElementById("wp-status-text");

let allWallpapers = [];
let selectedWallpaper = null;

// Multi-View Navigation: Portrait <-> Landscape Settings <-> Wallpaper Engine
function showView(viewName) {
    portraitView.classList.remove("active");
    settingsView.classList.remove("active");
    if (wallpaperView) wallpaperView.classList.remove("active");

    if (viewName === "portrait") {
        isLandscape = false;
        phoneBody.classList.remove("landscape");
        portraitView.classList.add("active");
        invoke("set_window_mode", { mode: "portrait" });
        setTimeout(() => {
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }, 120);
    } else if (viewName === "settings") {
        isLandscape = true;
        phoneBody.classList.add("landscape");
        settingsView.classList.add("active");
        invoke("set_window_mode", { mode: "landscape" });
    } else if (viewName === "wallpaper") {
        isLandscape = true;
        phoneBody.classList.add("landscape");
        if (wallpaperView) wallpaperView.classList.add("active");
        invoke("set_window_mode", { mode: "landscape" });
        loadWallpapers();
    }
}

async function setLandscapeMode(landscape) {
    showView(landscape ? "settings" : "portrait");
}

if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", () => setLandscapeMode(true));
}
if (pinSettings) {
    pinSettings.addEventListener("click", () => setLandscapeMode(true));
}
if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener("click", () => setLandscapeMode(false));
}
if (wpBackBtn) {
    wpBackBtn.addEventListener("click", () => showView("settings"));
}
if (wpCloseBtn) {
    wpCloseBtn.addEventListener("click", () => showView("portrait"));
}

// 6 Settings Tiles Interaction (Image 4)
document.querySelectorAll(".setting-card").forEach(card => {
    card.addEventListener("click", async () => {
        const tile = card.getAttribute("data-tile");
        switch (tile) {
            case "quick":
                showToast("Quick Controls: Wi-Fi & Audio Toggled");
                break;
            case "general":
                showToast("Opening Windows Settings...");
                launchApp("ms-settings:");
                break;
            case "wallpaper":
                showView("wallpaper");
                break;
            case "desktop":
                currentThemeIdx = (currentThemeIdx + 1) % themes.length;
                const t = themes[currentThemeIdx];
                document.documentElement.setAttribute("data-theme", t.id);
                if (themeLabel) themeLabel.textContent = t.label;
                showToast(`Desktop Theme: ${t.label}`);
                break;
            case "wm":
                showToast("GlazeWM Config Reloaded");
                launchApp("action:glazewm_reload");
                break;
            case "about":
                showToast("SekaiPop v2.0 • In-Process Mod by Dr4m");
                break;
        }
    });
});

// Wallpaper Engine Logic
const wpSearchInput = document.getElementById("wp-search-input");
let filteredWallpapers = [];

function loadWallpapers() {
    if (window.SEKAI_WALLPAPERS && Array.isArray(window.SEKAI_WALLPAPERS) && window.SEKAI_WALLPAPERS.length > 0) {
        allWallpapers = window.SEKAI_WALLPAPERS;
    } else {
        allWallpapers = [];
    }
    filteredWallpapers = allWallpapers;
    renderWallpaperGrid();
}

if (wpSearchInput) {
    wpSearchInput.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) {
            filteredWallpapers = allWallpapers;
        } else {
            filteredWallpapers = allWallpapers.filter(w => 
                (w.title && w.title.toLowerCase().includes(q)) || 
                (w.desc && w.desc.toLowerCase().includes(q))
            );
        }
        renderWallpaperGrid();
    });
}

function renderWallpaperGrid() {
    if (!wpGrid) return;
    const activeId = localStorage.getItem("sekaipop_active_wp") || "current_desktop";
    const list = filteredWallpapers.length > 0 ? filteredWallpapers : allWallpapers;
    
    wpGrid.innerHTML = list.map((wp) => {
        const isActive = wp.id === activeId;
        if (isActive) selectedWallpaper = wp;
        return `
            <div class="wp-card ${isActive ? "active" : ""}" data-id="${wp.id}">
                <div class="wp-thumb-wrap">
                    <img src="${wp.preview}" alt="${escapeHtml(wp.title)}" class="wp-thumb" loading="lazy">
                    ${isActive ? '<span class="wp-badge-active">ACTIVE</span>' : ''}
                </div>
                <div class="card-title wp-card-title">${escapeHtml(wp.title)}</div>
            </div>
        `;
    }).join("");

    if (selectedWallpaper && wpStatusText) {
        wpStatusText.textContent = `Active: ${selectedWallpaper.title}`;
    }

    wpGrid.querySelectorAll(".wp-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-id");
            const wp = allWallpapers.find(w => w.id === id);
            if (!wp) return;
            selectedWallpaper = wp;
            localStorage.setItem("sekaipop_active_wp", wp.id);
            applyPhoneWallpaper(wp.preview);
            if (wp.palette) {
                applyThemePalette(wp.palette);
            }
            renderWallpaperGrid();
            showToast(`Phone Wallpaper: ${wp.title}`);
        });
    });
}

function applyThemePalette(palette) {
    if (!palette) return;
    const pal = palette.palette || palette;
    const r = document.documentElement.style;
    if (pal.accent) {
        r.setProperty("--accent-pjsk", pal.accent);
        r.setProperty("--accent-blue", pal.accent);
    }
    let rVal = 216, gVal = 44, bVal = 26;
    if (pal.accent_rgb) {
        r.setProperty("--accent-rgb", pal.accent_rgb);
        const parts = pal.accent_rgb.split(",").map(x => parseInt(x.trim(), 10));
        if (parts.length === 3 && !isNaN(parts[0])) {
            rVal = parts[0]; gVal = parts[1]; bVal = parts[2];
        }
    } else if (pal.accent && pal.accent.startsWith("#")) {
        const hex = pal.accent.replace("#", "");
        if (hex.length === 6) {
            rVal = parseInt(hex.substring(0, 2), 16);
            gVal = parseInt(hex.substring(2, 4), 16);
            bVal = parseInt(hex.substring(4, 6), 16);
            r.setProperty("--accent-rgb", `${rVal}, ${gVal}, ${bVal}`);
        }
    }
    if (pal.glow) r.setProperty("--accent-glow", pal.glow);
    if (pal.border) {
        const borderStr = pal.border.includes(")") ? pal.border : `${pal.border}, 0.35)`;
        r.setProperty("--card-border", borderStr);
        r.setProperty("--border-frame", borderStr);
    }
    if (pal.bg_dark) r.setProperty("--bg-frame", pal.bg_dark);
    if (pal.card_bg) r.setProperty("--card-bg", pal.card_bg);

    // Compute dynamic chassis gradients matching the palette hue
    const dark1 = `rgba(${Math.round(rVal * 0.16)}, ${Math.round(gVal * 0.16)}, ${Math.round(bVal * 0.16)}, 0.98)`;
    const dark2 = `rgba(${Math.round(rVal * 0.08)}, ${Math.round(gVal * 0.08)}, ${Math.round(bVal * 0.08)}, 0.98)`;
    const darkBtn = `rgba(${Math.round(rVal * 0.28)}, ${Math.round(gVal * 0.28)}, ${Math.round(bVal * 0.28)}, 1)`;
    const darkBtn2 = `rgba(${Math.round(rVal * 0.12)}, ${Math.round(gVal * 0.12)}, ${Math.round(bVal * 0.12)}, 1)`;
    const extrusion1 = `rgba(${Math.round(rVal * 0.18)}, ${Math.round(gVal * 0.18)}, ${Math.round(bVal * 0.18)}, 1)`;
    const extrusion2 = `rgba(${Math.round(rVal * 0.06)}, ${Math.round(gVal * 0.06)}, ${Math.round(bVal * 0.06)}, 1)`;

    r.setProperty("--chassis-bg", `linear-gradient(155deg, ${dark1} 0%, ${dark2} 100%)`);
    r.setProperty("--chassis-border", `rgba(${rVal}, ${gVal}, ${bVal}, 0.45)`);
    r.setProperty("--chassis-btn-bg", `linear-gradient(180deg, ${darkBtn} 0%, ${darkBtn2} 100%)`);
    r.setProperty("--chassis-extrusion", extrusion1);
    r.setProperty("--chassis-extrusion-dark", extrusion2);

    const tl = document.getElementById("theme-label");
    if (tl) tl.textContent = "WALLPAPER ACCENT";

    // Enforce theme accents across Landscape Settings & Wallpaper Engine views
    try {
        const titles = document.querySelectorAll(".settings-main-title, .wp-main-title");
        titles.forEach(el => {
            el.style.color = pal.accent;
            el.style.textShadow = `0 0 10px ${pal.glow || "rgba(" + pal.accent_rgb + ", 0.4)"}`;
        });
        const tealBadges = document.querySelectorAll(".card-badge.teal");
        tealBadges.forEach(el => {
            el.style.borderColor = pal.accent;
            el.style.color = pal.accent;
            el.style.background = `rgba(${pal.accent_rgb}, 0.18)`;
            el.style.boxShadow = `0 0 12px ${pal.glow || "rgba(" + pal.accent_rgb + ", 0.35)"}`;
        });
        const blueBadges = document.querySelectorAll(".card-badge.blue");
        blueBadges.forEach(el => {
            el.style.borderColor = pal.accent;
            el.style.color = pal.accent;
            el.style.background = `rgba(${pal.accent_rgb}, 0.18)`;
            el.style.boxShadow = `0 0 12px ${pal.glow || "rgba(" + pal.accent_rgb + ", 0.35)"}`;
        });
        const settingCards = document.querySelectorAll(".setting-card");
        settingCards.forEach(el => {
            el.style.borderColor = pal.border || `rgba(${pal.accent_rgb}, 0.35)`;
        });
    } catch(err) {}

    try {
        localStorage.setItem("sekaipop_theme_palette", JSON.stringify(pal));
    } catch(e) {}
}
window.applyThemePalette = applyThemePalette;

let g_current_phone_wp_url = "";
function applyPhoneWallpaper(previewPath) {
    if (!previewPath) previewPath = "active_wallpaper.jpg";
    const url = previewPath.includes("?") ? previewPath : (previewPath + "?t=" + Date.now());
    if (url === g_current_phone_wp_url) return;
    g_current_phone_wp_url = url;
    const screen = document.querySelector(".phone-screen");
    const banner = document.querySelector(".banner-img");
    if (screen) {
        screen.style.backgroundImage = `url("${url}")`;
    }
    if (banner) {
        banner.src = url;
    }
}
window.applyPhoneWallpaper = applyPhoneWallpaper;

// Restore saved wallpaper and palette on startup
(function() {
    const savedPal = localStorage.getItem("sekaipop_theme_palette");
    if (savedPal) {
        try {
            applyThemePalette(JSON.parse(savedPal));
        } catch(e) {}
    }
    applyPhoneWallpaper("active_wallpaper.jpg?t=" + Date.now());
})();

if (wpSyncPcBtn) {
    wpSyncPcBtn.addEventListener("click", () => {
        localStorage.setItem("sekaipop_active_wp", "current_desktop");
        applyPhoneWallpaper("wallpaper.jpg");
        const defWp = (window.SEKAI_WALLPAPERS || []).find(w => w.id === "current_desktop");
        if (defWp && defWp.palette) {
            applyThemePalette(defWp.palette);
        }
        renderWallpaperGrid();
        showToast("Synchronized with Windows desktop wallpaper!");
    });
}

if (wpOpenAppBtn) {
    wpOpenAppBtn.addEventListener("click", () => {
        invoke("launch_wallpaper_engine");
        showToast("Launching Wallpaper Engine App...");
    });
}

if (wpApplyDesktopBtn) {
    wpApplyDesktopBtn.addEventListener("click", () => {
        if (!selectedWallpaper || !selectedWallpaper.project_file) {
            showToast("Active wallpaper is already default desktop!");
            return;
        }
        if (selectedWallpaper.palette) {
            applyThemePalette(selectedWallpaper.palette);
        }
        invoke("apply_wallpaper_engine", { file: selectedWallpaper.project_file });
        showToast(`Desktop set to: ${selectedWallpaper.title}`);
    });
}

// Auto-hide when focus is lost (clicking outside on desktop)
window.addEventListener("blur", () => {
    if (Date.now() - openedTime > 600) {
        invoke("hide_launcher");
    }
});

// Theme Switcher
if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        currentThemeIdx = (currentThemeIdx + 1) % themes.length;
        const t = themes[currentThemeIdx];
        document.documentElement.setAttribute("data-theme", t.id);
        if (themeLabel) themeLabel.textContent = t.label;
    });
}

// High Quality SVG Vector Icons Mapping
function getIconGlyph(iconType) {
    switch (iconType) {
        case "terminal":
            return `<svg class="app-svg" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`;
        case "code":
            return `<svg class="app-svg" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
        case "folder":
            return `<svg class="app-svg" viewBox="0 0 24 24"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;
        case "globe":
            return `<svg class="app-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
        case "music":
            return `<svg class="app-svg" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
        case "gamepad":
            return `<svg class="app-svg" viewBox="0 0 24 24"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="6"/></svg>`;
        case "message":
            return `<svg class="app-svg" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
        case "settings":
            return `<svg class="app-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
        case "camera":
            return `<svg class="app-svg" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`;
        case "activity":
            return `<svg class="app-svg" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
        case "file":
            return `<svg class="app-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        default:
            return `<svg class="app-svg" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    }
}

// Render Apps & Shortcuts
function renderApps(apps) {
    filteredApps = apps;
    selectedIndex = 0;
    if (appCounter) appCounter.textContent = `(${apps.length})`;

    if (apps.length === 0) {
        appList.innerHTML = '<div class="loading-state">Không tìm thấy phím tắt hoặc ứng dụng phù hợp.</div>';
        return;
    }

    const html = apps.map((app, idx) => {
        const badge = app.shortcut
            ? `<kbd class="app-shortcut-badge">${escapeHtml(app.shortcut)}</kbd>`
            : (app.isEverything
                ? `<span class="app-cat ${app.isFolder ? 'dir' : 'file'}">${app.isFolder ? 'DIR' : 'FILE'}</span>`
                : `<span class="app-cat">${escapeHtml(app.category || "App")}</span>`);

        const subText = app.path 
            ? `<span class="app-sub-path" title="${escapeHtml(app.path)}">${escapeHtml(app.path)}</span>` 
            : '';

        const iconType = app.icon || (app.isFolder ? "folder" : (app.isEverything ? "file" : "default"));

        return `
        <div class="app-row ${idx === 0 ? "selected" : ""}" data-index="${idx}" data-id="${escapeHtml(app.id || app.path)}">
            <div class="app-info">
                <div class="app-icon-box">${getIconGlyph(iconType)}</div>
                <div class="app-details">
                    <div class="app-name">${escapeHtml(app.name)}</div>
                    ${subText}
                </div>
            </div>
            ${badge}
        </div>
        `;
    }).join("");

    appList.innerHTML = html;

    document.querySelectorAll(".app-row").forEach(row => {
        row.addEventListener("click", () => {
            const id = row.getAttribute("data-id");
            if (id) launchApp(id);
        });
    });
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updateSelection() {
    const rows = document.querySelectorAll(".app-row");
    rows.forEach((row, idx) => {
        if (idx === selectedIndex) {
            row.classList.add("selected");
            row.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } else {
            row.classList.remove("selected");
        }
    });
}

// Load Application & Shortcut Index from Backend
async function loadApps() {
    try {
        const items = await invoke("get_apps");
        allApps = items;
        allShortcuts = items.filter(i => !!i.shortcut);
        renderInitialShortcuts();
    } catch (e) {
        console.error("Failed to load apps:", e);
        if (appList) appList.innerHTML = `<div class="loading-state">Lỗi khi tải danh sách: ${e}</div>`;
    }
}

function renderInitialShortcuts() {
    const heading = document.getElementById("section-heading");
    if (heading) heading.textContent = "PHÍM TẮT & TIỆN ÍCH";
    if (searchCount) searchCount.textContent = "HOTKEY";
    renderApps(allShortcuts.length > 0 ? allShortcuts : allApps);
}

// Launch Application
async function launchApp(id) {
    phoneContainer.classList.remove("active");
    try {
        await invoke("launch_app", { id });
    } catch (e) {
        console.error("Failed to launch:", e);
    }
}

// Execute Power Action
function executePowerAction(action) {
    console.log("Execute power action requested:", action);
    const pc = document.getElementById("phone-container");
    if (pc) pc.classList.remove("active");

    // 1. Direct WebView2 postMessage to host
    try {
        if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === "function") {
            window.chrome.webview.postMessage({
                reqId: "req_" + Date.now(),
                cmd: "execute_power",
                action: action,
                args: { action: action }
            });
        }
    } catch (e) {
        console.error("Direct postMessage error:", e);
    }

    // 2. Fallback to Tauri invoke if available
    try {
        if (typeof invoke === "function") {
            invoke("execute_power", { action: action });
        }
    } catch (e) {
        console.error("Invoke error:", e);
    }
}
window.executePowerAction = executePowerAction;
window.triggerPower = executePowerAction;

// Search Filter & Navigation (Local Shortcuts + Everything File Search)
let everythingTimer = null;
let currentSearchSeq = 0;

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        const heading = document.getElementById("section-heading");

        if (!query) {
            currentSearchSeq++;
            clearTimeout(everythingTimer);
            if (sectionPinned) sectionPinned.style.display = "block";
            renderInitialShortcuts();
            return;
        }

        if (sectionPinned) sectionPinned.style.display = "none";
        if (heading) heading.textContent = "KẾT QUẢ TÌM KIẾM";

        const qLower = query.toLowerCase();
        const localMatches = allApps.filter(app => {
            const n = app.name.toLowerCase();
            const c = (app.category || "").toLowerCase();
            const i = (app.id || "").toLowerCase();
            const s = (app.shortcut || "").toLowerCase();
            return n.includes(qLower) || c.includes(qLower) || i.includes(qLower) || s.includes(qLower);
        });

        // Instantly display local matches
        renderApps(localMatches);
        if (searchCount) searchCount.textContent = `${localMatches.length}`;

        // Debounce Everything file search across system
        clearTimeout(everythingTimer);
        const thisSeq = ++currentSearchSeq;
        everythingTimer = setTimeout(async () => {
            try {
                const results = await invoke("search_everything", { query });
                if (thisSeq !== currentSearchSeq) return; // Discard stale responses

                if (Array.isArray(results) && results.length > 0) {
                    const everythingItems = results.map(r => ({
                        name: r.name,
                        path: r.path,
                        id: r.path,
                        isFolder: !!r.is_folder,
                        isEverything: true,
                        icon: r.is_folder ? "folder" : "file",
                        category: r.is_folder ? "Folder" : "File"
                    }));

                    const combined = [...localMatches, ...everythingItems];
                    renderApps(combined);
                    if (searchCount) searchCount.textContent = `${combined.length}`;
                }
            } catch (err) {
                console.error("Everything search error:", err);
            }
        }, 120);
    });
}

// Keyboard Controls (Enter, Arrows, Escape)
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (isLandscape) {
            setLandscapeMode(false);
            return;
        }
        phoneContainer.classList.remove("active");
        invoke("hide_launcher");
        return;
    }

    if (!isLandscape) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (filteredApps.length > 0) {
                selectedIndex = (selectedIndex + 1) % filteredApps.length;
                updateSelection();
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (filteredApps.length > 0) {
                selectedIndex = (selectedIndex - 1 + filteredApps.length) % filteredApps.length;
                updateSelection();
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredApps.length > 0 && filteredApps[selectedIndex]) {
                launchApp(filteredApps[selectedIndex].id);
            }
        }
    }
});

// Pinned Cards Click
document.querySelectorAll(".pin-card").forEach(card => {
    if (card.id === "pin-settings") return; // Handled by settings toggle
    card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        if (id) launchApp(id);
    });
});

// Power Deck Click
const btnLock = document.getElementById("btn-lock");
const btnSleep = document.getElementById("btn-sleep");
const btnRestart = document.getElementById("btn-restart");
const btnPower = document.getElementById("btn-power");

["click", "pointerdown"].forEach(evt => {
    if (btnLock) btnLock.addEventListener(evt, (e) => { e.stopPropagation(); executePowerAction("lock"); });
    if (btnSleep) btnSleep.addEventListener(evt, (e) => { e.stopPropagation(); executePowerAction("sleep"); });
    if (btnRestart) btnRestart.addEventListener(evt, (e) => { e.stopPropagation(); executePowerAction("restart"); });
    if (btnPower) btnPower.addEventListener(evt, (e) => { e.stopPropagation(); executePowerAction("shutdown"); });
});

// Top Buttons
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        phoneContainer.classList.remove("active");
        invoke("hide_launcher");
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadApps());
}

// Quick Control Toggles
const toggleWifi = document.getElementById("toggle-wifi");
const toggleBt = document.getElementById("toggle-bt");
if (toggleWifi) {
    toggleWifi.addEventListener("click", () => toggleWifi.classList.toggle("active"));
}
if (toggleBt) {
    toggleBt.addEventListener("click", () => toggleBt.classList.toggle("active"));
}

// Quick Sliders (Volume & Brightness)
const volSlider = document.getElementById("vol-slider");
const brightSlider = document.getElementById("bright-slider");

if (volSlider) {
    volSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        invoke("set_volume", { value: val });
    });
}

if (brightSlider) {
    brightSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        invoke("set_brightness", { value: val });
    });
    brightSlider.addEventListener("change", (e) => {
        const val = parseInt(e.target.value, 10);
        invoke("set_brightness_hardware", { value: val });
    });
}

// Sync System Volume & Brightness State
async function syncSystemControls() {
    try {
        const res = await invoke("get_volume");
        if (res && typeof res.volume === "number" && volSlider) {
            volSlider.value = res.volume;
        }
    } catch (e) {}
}
syncSystemControls();

// Click outside phone to dismiss
document.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".phone-body")) {
        phoneContainer.classList.remove("active");
        invoke("hide_launcher");
    }
});

// Interactive 2.5D Parallax Mouse Tracking
window.addEventListener("mousemove", (e) => {
    const body = document.getElementById("phone-body");
    if (!body) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const normX = (e.clientX / w) - 0.5;
    const normY = (e.clientY / h) - 0.5;

    if (body.classList.contains("landscape")) {
        const rotY = -5 + normX * 3.5;
        const rotX = 6.5 - normY * 3.0;
        body.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(-1deg)`;
    } else {
        const rotY = -5.5 + normX * 3.0;
        const rotX = 3.5 - normY * 2.0;
        body.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(1deg)`;
    }
});

window.addEventListener("mouseleave", () => {
    const body = document.getElementById("phone-body");
    if (!body) return;
    if (body.classList.contains("landscape")) {
        body.style.transform = "rotateY(-5deg) rotateX(6.5deg) rotateZ(-1deg)";
    } else {
        body.style.transform = "rotateY(-5.5deg) rotateX(3.5deg) rotateZ(1deg)";
    }
});

// Initial boot
const initPb = document.getElementById("phone-body");
const initPs = document.querySelector(".phone-screen");
const initDeck = document.querySelector(".system-deck");
const initPv = document.getElementById("portrait-view");
if (initPb) initPb.style.pointerEvents = "auto";
if (initPs) initPs.style.pointerEvents = "auto";
if (initPv) initPv.style.pointerEvents = "auto";
if (initDeck) {
    initDeck.style.pointerEvents = "auto";
    initDeck.style.zIndex = "999999";
}
["btn-lock", "btn-sleep", "btn-restart", "btn-power"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.style.pointerEvents = "auto";
        btn.style.cursor = "pointer";
        btn.style.zIndex = "999999";
    }
});
loadApps();
loadWallpapers();

async function syncWallpaperPalette() {
    try {
        const res = await fetch("palette.json?t=" + Date.now());
        if (res.ok) {
            const data = await res.json();
            const pal = data.palette || data;
            if (pal && pal.accent) {
                applyThemePalette(pal);
                applyPhoneWallpaper("active_wallpaper.jpg");
                return;
            }
        }
    } catch (e) {}

    try {
        const old = document.getElementById("dyn-palette-script");
        if (old) old.remove();
        const s = document.createElement("script");
        s.id = "dyn-palette-script";
        s.src = "active_palette.js?t=" + Date.now();
        document.head.appendChild(s);
    } catch (err) {}
}
window.syncWallpaperPalette = syncWallpaperPalette;

if (window.SEKAI_ACTIVE_PALETTE) {
    applyThemePalette(window.SEKAI_ACTIVE_PALETTE);
    applyPhoneWallpaper("active_wallpaper.jpg");
}
syncWallpaperPalette();
setInterval(syncWallpaperPalette, 2000);