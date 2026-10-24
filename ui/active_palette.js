window.SEKAI_ACTIVE_PALETTE = {"accent": "#c0d845", "accent_rgb": "192, 216, 69", "glow": "rgba(192, 216, 69, 0.38)", "border": "rgba(192, 216, 69, 0.35)", "bg_dark": "#15160d", "card_bg": "rgba(31, 32, 27, 0.88)", "wp_updated": 1792851379265};
if (typeof window.applyThemePalette === 'function') window.applyThemePalette(window.SEKAI_ACTIVE_PALETTE);
if (typeof window.applyPhoneWallpaper === 'function') window.applyPhoneWallpaper('active_wallpaper.jpg?t=1792851379265');
(function(pal) {
    if (!pal) return;
    var r = document.documentElement.style;
    if (pal.accent) { r.setProperty('--accent-pjsk', pal.accent); r.setProperty('--accent-blue', pal.accent); }
    if (pal.accent_rgb) r.setProperty('--accent-rgb', pal.accent_rgb);
    if (pal.glow) r.setProperty('--accent-glow', pal.glow);
    if (pal.border) r.setProperty('--card-border', pal.border);
    if (pal.bg_dark) r.setProperty('--bg-frame', pal.bg_dark);
    if (pal.card_bg) r.setProperty('--card-bg', pal.card_bg);
    var titles = document.querySelectorAll('.settings-main-title, .wp-main-title');
    titles.forEach(function(el) { el.style.color = pal.accent; el.style.textShadow = '0 0 10px ' + (pal.glow || 'rgba(' + pal.accent_rgb + ', 0.4)'); });
    var badges = document.querySelectorAll('.card-badge.teal, .card-badge.blue');
    badges.forEach(function(el) { el.style.borderColor = pal.accent; el.style.color = pal.accent; el.style.background = 'rgba(' + pal.accent_rgb + ', 0.18)'; el.style.boxShadow = '0 0 12px ' + (pal.glow || 'rgba(' + pal.accent_rgb + ', 0.35)'); });
    var cards = document.querySelectorAll('.setting-card');
    cards.forEach(function(el) { el.style.borderColor = pal.border || ('rgba(' + pal.accent_rgb + ', 0.35)'); });
})(window.SEKAI_ACTIVE_PALETTE);
