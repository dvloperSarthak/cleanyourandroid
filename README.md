# CleanYourAndroid

<p align="center">
  <img src="https://raw.githubusercontent.com/cleanyourandroid/cleanyourandroid/main/docs/assets/banner.png" alt="CleanYourAndroid Banner" width="800" />
</p>

<p align="center">
  <strong>Production-Grade Android Debloating, Customization, and Device Management Toolkit</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cleanyourandroid"><img src="https://img.shields.io/npm/v/cleanyourandroid.svg?style=flat-square&color=E50914" alt="npm version" /></a>
  <a href="https://github.com/cleanyourandroid/cleanyourandroid/actions"><img src="https://img.shields.io/github/actions/workflow/status/cleanyourandroid/cleanyourandroid/ci.yml?branch=main&style=flat-square" alt="CI Status" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <a href="https://www.npmjs.com/package/cleanyourandroid"><img src="https://img.shields.io/npm/dm/cleanyourandroid?style=flat-square&color=black" alt="Downloads" /></a>
  <a href="https://github.com/cleanyourandroid/cleanyourandroid/stargazers"><img src="https://img.shields.io/github/stars/cleanyourandroid/cleanyourandroid.svg?style=flat-square" alt="GitHub stars" /></a>
</p>

---

## ⚡ Overview

**CleanYourAndroid (`cya`)** gives everyday Android users complete control over their smartphones **without requiring root access**.

Inspired by the raw industrial elegance of **Nothing OS**, **Linear**, and **Material 3**, CleanYourAndroid lets you connect via **USB** or **Android 11+ Wireless Debugging** to safely inspect hardware sensors, remove OEM bloatware in user-space, tune fluid 0.25x–0.50x lightweight animation curves, adjust display densities, inspect live running processes, mirror screens, and audit your device for Android upgrades and Project Treble GSIs.

---

## 🌟 Key Features

### 🔌 Universal ADB Connection Manager
- Auto-detects connected USB devices, unauthorized states, and Wi-Fi ADB devices.
- Connects to Wi-Fi ADB (`cya connect <host> [port]`).
- Supports **Android 11+ Wireless Debugging Pairing Codes** (`cya pair <host> <port> <code>`).
- Injection-safe execution using typed array arguments with `child_process.spawn`.
- Auto-detects local Android SDK platform-tools on Windows, macOS, and Linux without requiring manual PATH exports.

### 🛡️ Evidence-Based Debloater Engine
- Curated bloatware profiles for **Samsung**, **Xiaomi / Redmi / POCO**, **OnePlus**, **Realme**, **Motorola**, **Google Pixel**, and **Nothing**.
- Safe non-root user-space isolation (`pm uninstall -k --user 0`).
- **Universal Safety Guard**: Hardcoded bootloop-protection locks critical Android core components (`SystemUI`, `Settings`, `Telephony`, `PackageInstaller`, `Play Services`).
- Dry-run simulation mode (`--dry-run`).
- Instant user-space reinstallation mechanism (`cmd package install-existing <package>`).

### 🪶 Lightweight & Fluid Animations Engine
- Instant speed presets to eliminate perceived touch latency on 60Hz, 90Hz, and 120Hz displays:
  - **`0.35x` Featherweight Fluid (Best Balance)**: Retains high-refresh-rate motion physics with near-zero latency.
  - **`0.25x` Lightning Snappy**: Ultra-fast UI for older and budget devices.
  - **`0.50x` Nothing OS Crisp**: Snappy, modern dot-matrix pacing.
  - **`1.00x` Stock Android Default**: Standard manufacturer animation duration curves.
- Custom precision decimal scale slider.

### 📲 OS Modernizer & Android Upgrade Hub
- Hardware capability diagnostics for **Project Treble**, **VNDK version**, and **A/B Partition Schemes**.
- **Generic System Image (GSI) target identification** (e.g. `arm64_bvN` for modern Android 15/16).
- Step-by-step guides for **Dynamic System Updates (DSU)**, bootloader unlocking, and official LineageOS custom ROMs.

### 🖥️ Desktop Studio Dashboard
- Modern web dashboard built with **React 19**, **Vite**, and **Tailwind CSS**.
- **📸 Live Screen Mirroring & Capture**: Take instant high-res screenshots over ADB and inspect the phone's live display.
- **⚡ One-Click App Cache Trimmer**: Free up storage and RAM by clearing inactive app caches via ADB `trim-caches`.
- **📊 Real-Time Storage & RAM Diagnostics**: Inspect internal storage usage and active physical memory in real time.
- **⚡ Running Processes Inspector**: Monitor live system tasks, PID, user, `%CPU`, and `%MEM`.
- **🚀 Deep Settings Intent Launchers**: Remotely trigger Developer Options, Battery Saver, and Display settings directly on your phone screen.

---

## 🚀 Quick Start Guide

### 1. Run Directly with NPX (No Installation Needed)
```bash
npx cleanyourandroid
```

### 2. Global Installation
```bash
# Using npm
npm install -g cleanyourandroid

# Using pnpm
pnpm add -g cleanyourandroid
```

---

## 📱 Connecting Your Phone

### Method A: USB Cable (Easiest)
1. On your phone, go to **Settings** > **About Phone**.
2. Tap **Build Number** 7 times to unlock **Developer Options**.
3. Go to **Settings** > **Developer Options** > Turn on **USB Debugging**.
4. Connect your phone with a USB cable.
5. Tap **"Always allow from this computer"** on your phone screen.

### Method B: Wireless Debugging (No Cable, Android 11+)
1. Ensure your PC and phone are on the same Wi-Fi network.
2. In **Developer Options**, tap **Wireless Debugging** > **"Pair device with pairing code"**.
3. Run the pairing command:
   ```bash
   cya pair <IP> <PAIRING_PORT> <6-DIGIT_CODE>
   ```
4. Connect using the main connection port displayed on your phone:
   ```bash
   cya connect <IP> <CONNECTION_PORT>
   ```

---

## 💻 CLI Commands Reference

| Command | Description |
| :--- | :--- |
| `cya` | Launch the interactive terminal UI |
| `cya doctor` | Diagnose ADB binary, drivers, and device permissions |
| `cya devices` | List connected USB and Wi-Fi Android devices |
| `cya connect <host> [port]` | Connect to a device via IP and port |
| `cya pair <host> <port> <code>`| Pair through Android 11+ Wireless Debugging |
| `cya info` | Display hardware, software, display DPI, and battery sensors |
| `cya apps [--filter <type>]` | List installed applications (`all`, `system`, `3rd-party`, `disabled`) |
| `cya debloat [--dry-run]` | Inspect and safely remove OEM bloatware |
| `cya themes [--apply <id>]` | Apply curated aesthetic theme presets |
| `cya customize` | Tune animation scales, DPI overrides, and system dark mode |
| `cya backup [-o <dir>]` | Create a snapshot manifest of packages and settings |
| `cya restore <file>` | Restore packages and appearance settings from manifest |

---

## 🎨 Theme Presets

- **Nothing OS Vibe (`nothing-os`)**: Minimalist glyph dot-matrix aesthetic, 0.5x snappy animations, AMOLED dark background, Nothing red accent.
- **Pixel Material You (`pixel-material-you`)**: Fluid 1.0x expressive physics, rounded shapes, pastel accents.
- **Samsung One UI (`samsung-oneui`)**: Ergonomic thumb-reach spacing, dense widgets, 0.75x responsive curves.
- **Pure Monochrome (`minimal-monochrome`)**: Zen distraction-free greyscale focus, 0.25x instant response.
- **Deep AMOLED Midnight (`amoled-dark`)**: Pitch-black `#000000` background to minimize power draw on OLED screens.

---

## 🖥️ Running the Desktop Studio Locally

```bash
# Clone the repository
git clone https://github.com/cleanyourandroid/cleanyourandroid.git
cd cleanyourandroid

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Start the desktop studio
pnpm --filter @cleanyourandroid/desktop run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 🧪 Automated Testing

The project includes unit and integration tests with a custom `MockAdbClient` that requires no physical phone connected:

```bash
pnpm test
```

---

## 📄 License

CleanYourAndroid is free and open-source software licensed under the [MIT License](LICENSE).
