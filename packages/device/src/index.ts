import { IAdbClient } from '@cleanyourandroid/adb';
import {
  DeviceDetails,
  DeviceCapabilities,
  DeviceSummary,
  UnauthorizedDeviceError,
  DeviceNotFoundError
} from '@cleanyourandroid/shared';

export interface IDeviceInspector {
  getDeviceDetails(serial: string): Promise<DeviceDetails>;
  getCapabilities(serial: string): Promise<DeviceCapabilities>;
  captureScreenshot(serial: string, localOutputPath: string): Promise<string>;
  reboot(serial: string, mode?: 'system' | 'recovery' | 'bootloader'): Promise<void>;
}

export class DeviceInspector implements IDeviceInspector {
  constructor(private adb: IAdbClient) {}

  public async getProp(serial: string, key: string): Promise<string> {
    const res = await this.adb.shell(serial, ['getprop', key]);
    return res.stdout.trim();
  }

  public async getDeviceDetails(serial: string): Promise<DeviceDetails> {
    const devices = await this.adb.getDevices();
    const current = devices.find((d) => d.serial === serial);
    if (!current) {
      throw new DeviceNotFoundError(serial);
    }
    if (current.state === 'unauthorized') {
      throw new UnauthorizedDeviceError(serial);
    }

    const [
      manufacturer,
      brand,
      model,
      product,
      board,
      hardware,
      cpuAbiStr,
      androidVersion,
      apiLevelStr,
      buildId,
      securityPatch,
      fingerprint
    ] = await Promise.all([
      this.getProp(serial, 'ro.product.manufacturer'),
      this.getProp(serial, 'ro.product.brand'),
      this.getProp(serial, 'ro.product.model'),
      this.getProp(serial, 'ro.product.name'),
      this.getProp(serial, 'ro.product.board'),
      this.getProp(serial, 'ro.hardware'),
      this.getProp(serial, 'ro.product.cpu.abilist'),
      this.getProp(serial, 'ro.build.version.release'),
      this.getProp(serial, 'ro.build.version.sdk'),
      this.getProp(serial, 'ro.build.id'),
      this.getProp(serial, 'ro.build.version.security_patch'),
      this.getProp(serial, 'ro.build.fingerprint')
    ]);

    const apiLevel = parseInt(apiLevelStr, 10) || 0;
    const cpuAbi = cpuAbiStr ? cpuAbiStr.split(',').map((s) => s.trim()) : ['arm64-v8a'];

    // Check root status safely
    let isRooted = false;
    const suCheck = await this.adb.shell(serial, ['which', 'su']);
    if (suCheck.stdout && !suCheck.stdout.includes('not found') && suCheck.exitCode === 0) {
      isRooted = true;
    }

    // Battery status
    let batteryLevelPercent: number | undefined;
    let batteryTemperatureC: number | undefined;
    let batteryStatus: string | undefined;
    let batteryHealth: string | undefined;

    const batteryDump = await this.adb.shell(serial, ['dumpsys', 'battery']);
    if (batteryDump.exitCode === 0) {
      for (const line of batteryDump.stdout.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('level:')) {
          batteryLevelPercent = parseInt(trimmed.replace('level:', '').trim(), 10);
        } else if (trimmed.startsWith('temperature:')) {
          const rawTemp = parseInt(trimmed.replace('temperature:', '').trim(), 10);
          batteryTemperatureC = rawTemp ? rawTemp / 10 : undefined;
        } else if (trimmed.startsWith('status:')) {
          const code = trimmed.replace('status:', '').trim();
          batteryStatus = code === '2' ? 'Charging' : code === '3' ? 'Discharging' : code === '5' ? 'Full' : 'Not Charging';
        } else if (trimmed.startsWith('health:')) {
          const healthCode = trimmed.replace('health:', '').trim();
          batteryHealth = healthCode === '2' ? 'Good' : 'Overheat/Degraded';
        }
      }
    }

    // Display & Resolution
    let screenResolution: string | undefined;
    let screenDensityDpi: number | undefined;
    const wmSize = await this.adb.shell(serial, ['wm', 'size']);
    if (wmSize.exitCode === 0) {
      const match = wmSize.stdout.match(/Physical size:\s*(\d+x\d+)/);
      if (match) screenResolution = match[1];
    }
    const wmDensity = await this.adb.shell(serial, ['wm', 'density']);
    if (wmDensity.exitCode === 0) {
      const match = wmDensity.stdout.match(/Physical density:\s*(\d+)/);
      if (match) screenDensityDpi = parseInt(match[1], 10);
    }

    // RAM Info
    let totalRamBytes: number | undefined;
    let availableRamBytes: number | undefined;
    const meminfo = await this.adb.shell(serial, ['cat', '/proc/meminfo']);
    if (meminfo.exitCode === 0) {
      for (const line of meminfo.stdout.split('\n')) {
        if (line.startsWith('MemTotal:')) {
          const kb = parseInt(line.replace(/[^0-9]/g, ''), 10);
          if (kb) totalRamBytes = kb * 1024;
        } else if (line.startsWith('MemAvailable:')) {
          const kb = parseInt(line.replace(/[^0-9]/g, ''), 10);
          if (kb) availableRamBytes = kb * 1024;
        }
      }
    }

    return {
      serial,
      state: current.state,
      transport: current.transport,
      hardware: {
        manufacturer: manufacturer || 'Unknown OEM',
        brand: brand || 'Android',
        model: model || current.model || 'Generic Device',
        product: product || 'generic',
        board: board || 'unknown',
        hardware: hardware || 'unknown',
        cpuAbi,
        totalRamBytes,
        availableRamBytes,
        batteryLevelPercent,
        batteryTemperatureC,
        batteryStatus,
        batteryHealth,
        screenResolution,
        screenDensityDpi
      },
      software: {
        androidVersion: androidVersion || 'Unknown',
        apiLevel,
        buildId: buildId || 'Unknown',
        securityPatch: securityPatch || 'Unknown',
        fingerprint: fingerprint || 'Unknown',
        isRooted
      }
    };
  }

  public async getCapabilities(serial: string): Promise<DeviceCapabilities> {
    const details = await this.getDeviceDetails(serial);
    const api = details.software.apiLevel;

    return {
      canUninstallUserPackages: true, // pm uninstall -k --user 0
      canDisablePackages: true, // pm disable-user --user 0
      canModifyAnimationScale: true, // settings put global window_animation_scale
      canModifyDisplayDensity: true, // wm density
      canToggleDarkMode: api >= 29, // Android 10+ (cmd uimode night yes/no)
      canPushWallpaper: true, // adb push to storage
      canInstallApk: true,
      canAccessBatteryDump: true,
      canReadProcessStats: api < 34, // Process stats restricted in Android 14+
      customRomFeatures: []
    };
  }

  public async captureScreenshot(serial: string, localOutputPath: string): Promise<string> {
    const remotePath = '/sdcard/cya_screenshot_temp.png';
    await this.adb.shell(serial, ['screencap', '-p', remotePath]);
    await this.adb.execute(['pull', remotePath, localOutputPath], { serial });
    await this.adb.shell(serial, ['rm', '-f', remotePath]);
    return localOutputPath;
  }

  public async reboot(serial: string, mode: 'system' | 'recovery' | 'bootloader' = 'system'): Promise<void> {
    if (mode === 'system') {
      await this.adb.execute(['reboot'], { serial });
    } else {
      await this.adb.execute(['reboot', mode], { serial });
    }
  }
}

