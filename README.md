# CleanYourAndroid

<p align="center">
  <img src="https://raw.githubusercontent.com/cleanyourandroid/cleanyourandroid/main/docs/assets/banner.png" alt="CleanYourAndroid Banner" width="750" />
</p>

<p align="center">
  <strong>Production-grade Android Customization, Safe Debloating, and Device Management Toolkit</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cleanyourandroid"><img src="https://img.shields.io/npm/v/cleanyourandroid.svg?style=flat-square&color=E50914" alt="npm version" /></a>
  <a href="https://github.com/cleanyourandroid/cleanyourandroid/actions"><img src="https://img.shields.io/github/actions/workflow/status/cleanyourandroid/cleanyourandroid/ci.yml?branch=main&style=flat-square" alt="CI Status" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <a href="https://github.com/cleanyourandroid/cleanyourandroid/stargazers"><img src="https://img.shields.io/github/stars/cleanyourandroid/cleanyourandroid.svg?style=flat-square" alt="GitHub stars" /></a>
</p>

---

## ⚡ Overview

**CleanYourAndroid (`cya`)** gives normal Android users total ownership over their phones without requiring root access. Designed with a Nothing OS-inspired, minimalist aesthetic, it allows you to connect via USB or Wi-Fi (ADB / Android 11+ Wireless Debugging Pairing) to safely inspect hardware, uninstall OEM bloatware, modify system animations, adjust DPI densities, and apply curated theme presets.

### Key Capabilities

- 🔌 **Universal ADB Connection Manager**: Seamlessly connects via USB, legacy Wi-Fi ADB, and Android 11+ 6-digit wireless pairing codes.
- 🛡️ **Fail-Safe User-Space Debloating**: Removes preinstalled carrier/OEM junk for `user 0` while keeping critical system packages locked against bootloops.
- 🎨 **Aesthetic Theme Engine**: Transform any phone into a **Nothing OS**, **Pixel Material You**, **Samsung One UI**, or **Deep AMOLED** design language with 0.5x snappy animation scales.
- 🩺 **Built-in Diagnostic Doctor**: Analyzes ADB drivers, connection authorization states, and hardware battery/display metrics.
- 💾 **Snapshot Backup & Restore**: One-click configuration manifests to restore packages and display values anytime.
- 🖥️ **Desktop Studio & Modern CLI**: Use the terminal via `cya` or launch the interactive web/desktop dashboard.

---

## 🚀 Quick Start

### Installation

Run directly with `npx` or install globally:

```bash
# Direct run
npx cleanyourandroid

# Global installation
npm install -g cleanyourandroid
# or with pnpm
pnpm add -g cleanyourandroid
```

### CLI Quick Commands

```bash
# Launch interactive terminal UI
cya

# Run doctor diagnostic
cya doctor

# Detect devices
cya devices

# Connect wirelessly
cya connect 192.168.1.150 5555

# Pair wireless debugging (Android 11+)
cya pair 192.168.1.150 38472 123456

# Hardware and battery specs
cya info

# Inspect and safely debloat
cya debloat --dry-run
cya debloat

# Apply aesthetic themes
cya themes --apply nothing-os
```

---

## 🏗️ Monorepo Architecture

The repository is built as a modular TypeScript monorepo using `pnpm` workspaces:

```
cleanyourandroid/
├── packages/
│   ├── shared/         # Zod schemas, data contracts, and typed errors
│   ├── adb/            # Safe, injection-proof spawn wrapper for adb platform-tools
│   ├── device/         # Battery telemetry, prop inspector, and screenshot engine
│   ├── debloater/      # Evidence-based manufacturer profiles & debloat engine
│   ├── customizer/     # System animations, density (DPI), dark mode controller
│   ├── themes/         # Nothing OS, Pixel, One UI, AMOLED theme definitions
│   ├── backup/         # Snapshot manifests and restore handlers
│   ├── core/           # Unified orchestrator & createDeviceManager API
│   └── cli/            # Commander.js interactive command line tool (`cya`)
├── apps/
│   └── desktop/        # React + Tailwind CSS desktop studio dashboard
└── tests/              # Vitest test suite with MockAdbClient
```

---

## 🛡️ Safety & Reliability Principles

1. **No Root Required**: All debloating utilizes Android's non-destructive `pm uninstall -k --user 0` and `pm disable-user --user 0`.
2. **Hardcoded Core Protection**: System UI, package installers, telephony, and Google Play Services can never be uninstalled.
3. **Reversible**: Reinstall uninstalled system apps anytime using `cmd package install-existing <package>`.
4. **Shell Injection Prevention**: All commands execute through typed argument arrays using `child_process.spawn`.

---

## 📱 Supported Manufacturer Profiles

- **Samsung** (One UI bloat, Bixby, Gaming Hub, Meta services)
- **Xiaomi / Redmi / POCO** (MIUI Analytics, MSA ads, Quick Apps, Mi Browser)
- **OnePlus** (Diagnostics telemetry, HeyTap push services)
- **Realme** (Ad markets, bloatware cleanup)
- **Motorola** (Marketing notifications, Moto companion tools)
- **Google Pixel** (Tips, wellbeing, analytics)
- **Nothing** (Community tools, system telemetry)

---

## 🧪 Testing

```bash
# Run the automated Vitest suite
pnpm test
```

Unit tests use `MockAdbClient` and do not require a physical Android phone connected.

---

## 📄 License

CleanYourAndroid is open-source software licensed under the [MIT License](LICENSE).

