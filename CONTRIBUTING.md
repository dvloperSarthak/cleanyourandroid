# Contributing to CleanYourAndroid

Thank you for your interest in contributing! CleanYourAndroid is built to be safe, reliable, and accessible for everyone.

## Development Setup

1. Prerequisites:
   - Node.js 20+
   - pnpm 11+
   - Android SDK platform-tools (`adb`) installed and in PATH.

2. Clone and install:
   ```bash
   git clone https://github.com/cleanyourandroid/cleanyourandroid.git
   cd cleanyourandroid
   pnpm install
   ```

3. Build all workspace packages:
   ```bash
   pnpm run build
   ```

4. Run unit and integration tests:
   ```bash
   pnpm test
   ```

5. Launch local interactive CLI:
   ```bash
   pnpm --filter cleanyourandroid run dev
   ```

6. Launch Desktop Studio locally:
   ```bash
   pnpm --filter @cleanyourandroid/desktop run dev
   ```

## Adding Manufacturer Bloatware Profiles

Manufacturer profiles are evidence-based. To add or update rules, edit `packages/debloater/src/profiles.ts`:
- Define `label`, `risk` ('safe' | 'recommended' | 'advanced'), and descriptive rationale.
- Never add critical system packages (e.g., Settings, SystemUI).
- Always include automated unit tests under `tests/suite.test.ts`.

