import { describe, it, expect, beforeEach } from 'vitest';
import { MockAdbClient } from '../packages/adb/src/index.js';
import { createDeviceManager } from '../packages/core/src/index.js';
import { THEME_PRESETS } from '../packages/themes/src/index.js';
import { SAMSUNG_PROFILE, XIAOMI_PROFILE } from '../packages/debloater/src/profiles.js';

describe('CleanYourAndroid Test Suite', () => {
  let mockAdb: MockAdbClient;

  beforeEach(() => {
    mockAdb = new MockAdbClient([
      {
        serial: 'emulator-5554',
        state: 'device',
        transport: 'usb',
        model: 'Pixel_8_Pro',
        product: 'husky',
        device: 'husky'
      }
    ]);
  });

  describe('Device Detection & ADB Connection', () => {
    it('detects connected USB devices correctly', async () => {
      const manager = createDeviceManager(mockAdb);
      const devices = await manager.getConnectedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].serial).toBe('emulator-5554');
      expect(devices[0].state).toBe('device');
      expect(devices[0].model).toBe('Pixel_8_Pro');
    });

    it('handles wireless device connection', async () => {
      const manager = createDeviceManager(mockAdb);
      const res = await manager.connectDevice('192.168.1.100', 5555);

      expect(res.success).toBe(true);
      expect(res.message).toContain('connected to 192.168.1.100:5555');

      const devices = await manager.getConnectedDevices();
      expect(devices).toHaveLength(2);
      expect(devices.find((d) => d.serial === '192.168.1.100:5555')).toBeDefined();
    });

    it('pairs with Android 11+ wireless code', async () => {
      const manager = createDeviceManager(mockAdb);
      const goodPair = await manager.pairDevice('192.168.1.100', 38291, '123456');
      expect(goodPair.success).toBe(true);

      const badPair = await manager.pairDevice('192.168.1.100', 38291, '12');
      expect(badPair.success).toBe(false);
    });

    it('handles device disconnection', async () => {
      const manager = createDeviceManager(mockAdb);
      await manager.connectDevice('192.168.1.105', 5555);
      expect((await manager.getConnectedDevices()).length).toBe(2);

      await mockAdb.disconnect('192.168.1.105', 5555);
      expect((await manager.getConnectedDevices()).length).toBe(1);
    });
  });

  describe('Device Information & Telemetry', () => {
    it('parses hardware and software props cleanly', async () => {
      mockAdb.setMockResponse('getprop ro\\.product\\.manufacturer', { stdout: 'Samsung', stderr: '', exitCode: 0 });
      mockAdb.setMockResponse('getprop ro\\.product\\.brand', { stdout: 'samsung', stderr: '', exitCode: 0 });
      mockAdb.setMockResponse('getprop ro\\.product\\.model', { stdout: 'SM-S928B', stderr: '', exitCode: 0 });
      mockAdb.setMockResponse('getprop ro\\.build\\.version\\.release', { stdout: '14', stderr: '', exitCode: 0 });
      mockAdb.setMockResponse('getprop ro\\.build\\.version\\.sdk', { stdout: '34', stderr: '', exitCode: 0 });
      mockAdb.setMockResponse('dumpsys battery', { stdout: 'Current Battery Service state:\n  level: 84\n  temperature: 280\n  status: 2\n  health: 2', stderr: '', exitCode: 0 });

      const manager = createDeviceManager(mockAdb);
      const info = await manager.getDeviceInfo('emulator-5554');

      expect(info.hardware.manufacturer).toBe('Samsung');
      expect(info.hardware.model).toBe('SM-S928B');
      expect(info.software.androidVersion).toBe('14');
      expect(info.software.apiLevel).toBe(34);
      expect(info.hardware.batteryLevelPercent).toBe(84);
      expect(info.hardware.batteryTemperatureC).toBe(28);
    });

    it('evaluates device capabilities accurately', async () => {
      mockAdb.setMockResponse('getprop ro\\.build\\.version\\.sdk', { stdout: '34', stderr: '', exitCode: 0 });
      const manager = createDeviceManager(mockAdb);
      const caps = await manager.getDeviceCapabilities('emulator-5554');

      expect(caps.canUninstallUserPackages).toBe(true);
      expect(caps.canModifyAnimationScale).toBe(true);
      expect(caps.canToggleDarkMode).toBe(true);
    });
  });

  describe('Debloater Engine & Safety Guards', () => {
    it('prevents accidental deletion of critical Android system core packages', async () => {
      const manager = createDeviceManager(mockAdb);

      await expect(
        manager.uninstallPackage('emulator-5554', 'com.android.systemui')
      ).rejects.toThrow(/Safety guard prevented operation/);

      await expect(
        manager.uninstallPackage('emulator-5554', 'android')
      ).rejects.toThrow(/Safety guard prevented operation/);
    });

    it('performs safe dry-run without executing destructive commands', async () => {
      const manager = createDeviceManager(mockAdb);
      const res = await manager.uninstallPackage('emulator-5554', 'com.samsung.android.bixby.agent', true);

      expect(res.success).toBe(true);
      expect(res.message).toContain('[DRY RUN]');
      expect(res.revertCommand).toBe('cmd package install-existing com.samsung.android.bixby.agent');
    });

    it('inspects OEM bloatware according to manufacturer profiles', async () => {
      mockAdb.setMockResponse('pm list packages', {
        stdout: [
          'package:/system/priv-app/Bixby/Bixby.apk=com.samsung.android.bixby.agent',
          'package:/system/app/Tips/Tips.apk=com.samsung.android.app.tips',
          'package:/data/app/fb/fb.apk=com.facebook.katana',
          'package:/system/priv-app/SystemUI/SystemUI.apk=com.android.systemui'
        ].join('\n'),
        stderr: '',
        exitCode: 0
      });

      const manager = createDeviceManager(mockAdb);
      const detected = await manager.inspectBloatware('emulator-5554', 'Samsung');

      expect(detected.length).toBeGreaterThanOrEqual(3);
      expect(detected.some((p) => p.packageName === 'com.samsung.android.bixby.agent')).toBe(true);
      expect(detected.some((p) => p.packageName === 'com.facebook.katana')).toBe(true);
      // Ensure critical packages are never listed as removable bloatware
      expect(detected.some((p) => p.packageName === 'com.android.systemui')).toBe(false);
    });
  });

  describe('UI Customization & Themes Engine', () => {
    it('contains all required theme presets', () => {
      expect(THEME_PRESETS['nothing-os']).toBeDefined();
      expect(THEME_PRESETS['pixel-material-you']).toBeDefined();
      expect(THEME_PRESETS['samsung-oneui']).toBeDefined();
      expect(THEME_PRESETS['minimal-monochrome']).toBeDefined();
      expect(THEME_PRESETS['amoled-dark']).toBeDefined();
    });

    it('applies Nothing OS snappy animation and dark mode preset', async () => {
      const manager = createDeviceManager(mockAdb);
      await expect(manager.applyTheme('emulator-5554', 'nothing-os')).resolves.not.toThrow();
    });

    it('validates display density limits for screen safety', async () => {
      const manager = createDeviceManager(mockAdb);

      // Dangerous DPI values should throw
      await expect(manager.customizer.setDisplayDensity('emulator-5554', 10)).rejects.toThrow(/Display density/);
      await expect(manager.customizer.setDisplayDensity('emulator-5554', 2000)).rejects.toThrow(/Display density/);

      // Safe DPI should pass
      await expect(manager.customizer.setDisplayDensity('emulator-5554', 420)).resolves.not.toThrow();
    });
  });

  describe('Manufacturer Profile Coverage', () => {
    it('verifies Samsung and Xiaomi profiles have safe risk classifications', () => {
      expect(SAMSUNG_PROFILE.rules.length).toBeGreaterThan(0);
      expect(XIAOMI_PROFILE.rules.length).toBeGreaterThan(0);

      for (const rule of [...SAMSUNG_PROFILE.rules, ...XIAOMI_PROFILE.rules]) {
        expect(['safe', 'recommended', 'advanced']).toContain(rule.risk);
        expect(rule.description.length).toBeGreaterThan(5);
      }
    });
  });
});

