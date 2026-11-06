# CleanYourAndroid Architecture & Technical Specification

CleanYourAndroid is engineered as an enterprise-grade, modular toolkit for Android debloating and UI customization.

## Architecture Layers

```
┌────────────────────────────────────────────────────────┐
│             Desktop UI / Web Studio (@apps/desktop)    │
│             Commander.js Interactive CLI (`cya`)      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│          Orchestration Layer (@cleanyourandroid/core)  │
│          - createDeviceManager()                       │
│          - Unified device capabilities inspection      │
└──────┬────────────┬─────────────┬─────────────┬────────┘
       │            │             │             │
┌──────▼─────┐┌─────▼───────┐┌────▼───────┐┌────▼────────┐
│  debloater ││  customizer ││   themes   ││   backup    │
│  Profiles: ││  - Anim     ││  - Nothing ││  - Snapshot │
│  Samsung   ││  - Density  ││  - Pixel   ││  - Restore  │
│  Xiaomi    ││  - DarkMode ││  - One UI  ││  - JSON     │
│  Pixel...  ││             ││  - AMOLED  ││             │
└──────┬─────┘└─────┬───────┘└────┬───────┘└────┬────────┘
       │            │             │             │
┌──────▼────────────▼─────────────▼─────────────▼────────┐
│         Device Telemetry & Props (@device)             │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│          Safe ADB Transport Engine (@adb)              │
│          - child_process.spawn (No shell injection)    │
│          - USB, Wi-Fi TCP/IP, Android 11+ Pairing      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│          Cross-Cutting Shared Types (@shared)          │
│          - Zod schemas, Data Models, Typed Errors      │
└────────────────────────────────────────────────────────┘
```

## Security & Reliability Design

1. **Injection-Proof ADB Command Pipeline**:
   All ADB invocations use array arguments without subshell interpolation (`spawn(adbPath, args)`).
2. **User-Space Isolation**:
   Non-root modifications are performed on `user 0` using `pm uninstall -k --user 0`, preserving the underlying system image in Android's read-only system partitions.
3. **Hardcoded Core Protection**:
   SystemUI, PackageInstaller, Telephony, and Google Play Services are protected by validation guards before any execution.

