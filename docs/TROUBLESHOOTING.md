# Troubleshooting Guide

### 1. `cya devices` reports no devices
- Enable **USB Debugging** on your phone:
  - Go to **Settings** > **About Phone**.
  - Tap **Build Number** 7 times until Developer Options is unlocked.
  - Return to **Settings** > **System / Additional Settings** > **Developer Options**.
  - Enable **USB Debugging**.
- Re-plug the USB cable and change USB mode from "Charging Only" to "File Transfer (MTP)".

### 2. Device shows as `UNAUTHORIZED`
- Unlock your phone screen.
- Look for the dialog box: *"Allow USB debugging from this computer?"*.
- Check the box *"Always allow from this computer"* and tap **Allow**.

### 3. Android 11+ Wireless Debugging Pairing
- Open **Developer Options** > **Wireless Debugging** (must be on the same Wi-Fi network).
- Tap **Pair device with pairing code**.
- Run:
  ```bash
  cya pair <IP> <PORT> <6-DIGIT_CODE>
  ```
- Then connect using the main wireless debugging port:
  ```bash
  cya connect <IP> <MAIN_PORT>
  ```

### 4. How to undo a package uninstallation
If you removed an application and want it back:
```bash
adb shell cmd package install-existing <package_name>
```
CleanYourAndroid also automatically creates restore commands in the backup snapshot file (`cya backup` / `cya restore`).

