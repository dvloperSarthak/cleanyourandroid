# AGENT.MD — CleanYourAndroid AI Agentic IDE & Copilot Guide

This specification file is designed for AI Coding Agents (such as Antigravity, Claude Code, Cursor, Copilot Workspace, Aider, and Windsurf) operating inside the **CleanYourAndroid** codebase.

---

## 🤖 1. System Persona & Core Role

When working on CleanYourAndroid:
- Act as a senior Android systems engineer, TypeScript architect, and security-conscious OSS maintainer.
- Understand low-level ADB internals, Android `dumpsys`, `pm` package managers, `wm` window managers, and `settings` providers.
- Maintain high security standards: **never introduce shell injection vectors**, never execute unvalidated strings via subshell, and **never touch hardcoded Android core packages**.

---

## 🏛️ 2. Repository Architecture & Package Boundaries

This project is a strict **pnpm workspace** monorepo using TypeScript project references (`tsc -b`).

```
CleanYourAndroid/
├── packages/
│   ├── shared/         # Ground-truth Zod schemas, models, typed error classes
│   ├── adb/            # Safe spawn-based ADB platform-tools client (IAdbClient, MockAdbClient)
│   ├── device/         # Hardware specs, battery sensors, display DPI & screenshot engine
│   ├── debloater/      # Evidence-based OEM bloatware profiles, risk levels & batch uninstaller
│   ├── customizer/     # System animations (0.25x - 1.0x), DPI bounds, dark mode controller
│   ├── themes/         # Nothing OS, Pixel, One UI, Pure Monochrome, AMOLED theme engines
│   ├── backup/         # Backup snapshots & restore manifest handlers
│   ├── core/           # Master orchestrator exporting `createDeviceManager()`
│   └── cli/            # Commander.js interactive binary (`cya`)
├── apps/
│   └── desktop/        # React 19 + Tailwind CSS desktop studio dashboard & live bridge
└── tests/              # Vitest test suite using MockAdbClient (no physical phone required)
```

### Dependency Rules:
1. `shared` has zero internal dependencies. All packages import schemas and error types from `@cleanyourandroid/shared`.
2. `adb` only depends on `shared`. It abstracts all ADB child processes.
3. `core` re-exports all package engines and provides the unified factory `createDeviceManager(customAdbClient?)`.
4. `cli` depends on `core` and `shared`.
5. When writing tests, always inject `MockAdbClient` into `createDeviceManager()` so the test suite runs hermetically in CI without physical devices.

---

## 🛡️ 3. Safety Protocols & Invariants (CRITICAL)

When modifying or extending this codebase, adhere strictly to these invariants:

### A. Zero Shell Command Injection
- **NEVER** use `child_process.exec()` or construct concatenated shell command strings like ``exec(`adb shell ${cmd}`)``.
- **ALWAYS** pass arguments as distinct array elements using `child_process.spawn()` with `windowsHide: true`.

### B. Universal Core Safety Guard
Never allow uninstallation or disabling of core system components. The set of protected packages in `packages/debloater/src/profiles.ts` includes:
- `android`
- `com.android.systemui`
- `com.android.settings`
- `com.android.phone`
- `com.android.server.telecom`
- `com.google.android.packageinstaller`
- `com.android.packageinstaller`
- `com.google.android.gms` (Google Play Services)
- `com.android.vending` (Google Play Store)

Attempting to uninstall these must throw `OperationBlockedBySafetyError`.

### C. Non-Root User Isolation
All package removal for standard non-root devices must execute via:
```bash
pm uninstall -k --user 0 <package>
```
and be reversible via:
```bash
cmd package install-existing <package>
```

---

## 🔧 4. Common Agent Tasks & Workflows

### Task 1: Adding a New OEM Debloating Profile
1. Open `packages/debloater/src/profiles.ts`.
2. Define a new `ManufacturerProfile` (e.g. `ASUS_PROFILE`, `SONY_PROFILE`, `VIVO_PROFILE`).
3. Classify rules with appropriate risk levels:
   - `safe`: Pure promotional apps, third-party preloads (Facebook, Netflix, games).
   - `recommended`: OEM analytics, push notification daemons, duplicate browsers.
   - `advanced`: Assistive services or custom gesture companions where disabling removes features.
4. Add the profile to `ALL_PROFILES`.
5. Add unit tests in `tests/suite.test.ts`.

### Task 2: Adding a New Custom Aesthetic Theme
1. Open `packages/themes/src/index.ts`.
2. Add a new `ThemeDefinition` to `THEME_PRESETS`.
3. Specify `windowAnimationScale`, `transitionAnimationScale`, `animatorDurationScale`, `darkModeEnabled`, and accent colors.
4. Update `apps/desktop/src/App.tsx` if adding visual theme preview cards in the desktop UI.

### Task 3: Running Tests and Building
Always verify your edits before concluding:
```bash
# Run unit test suite
pnpm test

# Build all TypeScript workspace packages
pnpm run build

# Build desktop dashboard
pnpm --filter @cleanyourandroid/desktop run build
```

---

## 📦 5. NPM Package Structure

- **Main CLI Package**: `cleanyourandroid` (located in `packages/cli`)
- **Binary Aliases**: `cleanyourandroid` and `cya`
- **Core Library**: `@cleanyourandroid/core`
- **Publish Workflow**: Handled via `.github/workflows/publish.yml` on release creation with GitHub secret `NPM_TOKEN`.

---

## 🩺 6. Troubleshooting for Agents

- **ADB missing in PATH**: The ADB resolver in `packages/adb/src/index.ts` automatically searches `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and standard platform-tools directories across Windows, macOS, and Linux. If testing in an unusual environment, set the `ADB_PATH` environment variable.
- **Wireless Port Switching**: Android 11+ uses a temporary pairing port for `adb pair <ip>:<pair_port> <code>`, and a persistent connection port for `adb connect <ip>:<connect_port>`. Do not mix the two.

