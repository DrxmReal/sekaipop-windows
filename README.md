# 🌸 SekaiPop for Windows

<p align="center">
  <img src="ui/avatar.png" width="96" height="96" alt="SekaiPop Logo" />
</p>

<p align="center">
  <strong>The Windows port of SekaiPop — aesthetic anime-inspired application launcher, spotlight search, and wallpaper-reactive menu for Windows 11 & 10.</strong><br>
  Bringing the ultimate Linux ricing (Hyprland / Arch) experience to modern Windows workstations.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows" alt="Platform" />
  <img src="https://img.shields.io/badge/Powered%20by-Tauri%20v2-24C8DB?style=flat-square&logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/badge/Backend-Rust-DEA584?style=flat-square&logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/Engine-WebView2-0078D4?style=flat-square" alt="WebView2" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## ✨ Features

- 🎨 **Anime-Inspired Aesthetics:** Stunning spotlight card design with character art, banners, glowing neon borders, and fluid animations.
- 🌈 **Dynamic Wallpaper Palette Sync:** Real-time color extraction from active Wallpaper Engine backgrounds, synchronizing accent colors, glow shades, and translucent dark card backdrops across the entire launcher.
- ⚡ **Rapid Application & File Indexing:** Instant application discovery across Start Menu, Program Files, Steam libraries, and custom directories powered by native Windows APIs and Voidtools Everything.
- 🪟 **True Acrylic Backdrop:** Windows 11 DWM-enhanced translucent glass effects blending smoothly with desktop setups (GlazeWM, Komorebi, YASB).
- ⌨️ **Keyboard First:** Fast type-to-search, instant arrow navigation, enter to launch, and smooth dismiss.

---

## 🚀 Quick Start (Prebuilt Executable)

1. Download the latest `sekaipop.exe` from the [**Releases**](https://github.com/DrxmReal/sekaipop-windows/releases) page.
2. Place `sekaipop.exe` alongside the `ui/` directory.
3. Run `sekaipop.exe`.
4. Press `Alt + Space` (or your configured hotkey) to summon SekaiPop!

---

## 🛠️ Tech Stack & Architecture

- **Backend:** [Rust](https://www.rust-lang.org/) + [Tauri v2](https://tauri.app/)
- **Frontend:** Vanilla HTML5, CSS3, modern ES Modules
- **Rendering:** Microsoft WebView2 Evergreen Runtime
- **IPC & Search:** Windows Shell APIs & Voidtools Everything

---

## 🏗️ Building from Source

### Prerequisites
- [Rust](https://www.rust-lang.org/) (1.78+)
- [Node.js](https://nodejs.org/) & npm
- [Tauri CLI](https://tauri.app/)
- Visual Studio C++ Build Tools

### Build Instructions
```bash
git clone https://github.com/DrxmReal/sekaipop-windows.git
cd sekaipop-windows

# Build optimized release binary
cd src-tauri
cargo build --release
```

The compiled binary will be placed at `src-tauri/target/release/sekaipop.exe`.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

<p align="center">
  Crafted with care by <a href="https://github.com/DrxmReal">Dr4m</a>
</p>
