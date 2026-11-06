import { AdbClient, IAdbClient } from '@cleanyourandroid/adb';
import { DeviceInspector, IDeviceInspector } from '@cleanyourandroid/device';
import { DebloatEngine, IDebloatEngine } from '@cleanyourandroid/debloater';
import { CustomizerEngine, ICustomizerEngine } from '@cleanyourandroid/customizer';
import { ThemeManager } from '@cleanyourandroid/themes';
import { BackupManager, IBackupManager } from '@cleanyourandroid/backup';
import {
  DeviceSummary,
  DeviceDetails,
  DeviceCapabilities,
  PackageInfo,
  DebloatOperationResult,
  DebloatReport,
  BackupManifest,
  ThemeIdentifier,
  CustomizationSettings
} from '@cleanyourandroid/shared';

export interface CleanYourAndroidInstance {
  adb: IAdbClient;
  device: IDeviceInspector;
  debloater: IDebloatEngine;
  customizer: ICustomizerEngine;
  themes: ThemeManager;
  backup: IBackupManager;

  // High-level convenience methods matching architecture spec
  getConnectedDevices(): Promise<DeviceSummary[]>;
  connectDevice(host: string, port?: number): Promise<{ success: boolean; message: string }>;
  pairDevice(host: string, port: number, code: string): Promise<{ success: boolean; message: string }>;
  getDeviceInfo(serial: string): Promise<DeviceDetails>;
  getDeviceCapabilities(serial: string): Promise<DeviceCapabilities>;
  getInstalledApps(serial: string, filter?: 'all' | 'system' | '3rd-party' | 'disabled'): Promise<PackageInfo[]>;
  inspectBloatware(serial: string, manufacturer: string): Promise<PackageInfo[]>;
  uninstallPackage(serial: string, packageName: string, dryRun?: boolean): Promise<DebloatOperationResult>;
  disablePackage(serial: string, packageName: string, dryRun?: boolean): Promise<DebloatOperationResult>;
  enablePackage(serial: string, packageName: string, dryRun?: boolean): Promise<DebloatOperationResult>;
  applyTheme(serial: string, themeId: ThemeIdentifier): Promise<void>;
  createBackup(serial: string, outputDir: string): Promise<{ manifestPath: string; manifest: BackupManifest }>;
}

export function createDeviceManager(customAdbClient?: IAdbClient): CleanYourAndroidInstance {
  const adb = customAdbClient ?? new AdbClient();
  const device = new DeviceInspector(adb);
  const debloater = new DebloatEngine(adb);
  const customizer = new CustomizerEngine(adb);
  const themes = new ThemeManager(customizer);
  const backup = new BackupManager(device, debloater, customizer);

  return {
    adb,
    device,
    debloater,
    customizer,
    themes,
    backup,

    async getConnectedDevices() {
      return adb.getDevices();
    },
    async connectDevice(host: string, port = 5555) {
      return adb.connect(host, port);
    },
    async pairDevice(host: string, port: number, code: string) {
      return adb.pair(host, port, code);
    },
    async getDeviceInfo(serial: string) {
      return device.getDeviceDetails(serial);
    },
    async getDeviceCapabilities(serial: string) {
      return device.getCapabilities(serial);
    },
    async getInstalledApps(serial: string, filter) {
      return debloater.listPackages(serial, filter);
    },
    async inspectBloatware(serial: string, manufacturer: string) {
      return debloater.inspectBloatware(serial, manufacturer);
    },
    async uninstallPackage(serial: string, packageName: string, dryRun = false) {
      return debloater.uninstallPackage(serial, packageName, dryRun);
    },
    async disablePackage(serial: string, packageName: string, dryRun = false) {
      return debloater.disablePackage(serial, packageName, dryRun);
    },
    async enablePackage(serial: string, packageName: string, dryRun = false) {
      return debloater.enablePackage(serial, packageName, dryRun);
    },
    async applyTheme(serial: string, themeId: ThemeIdentifier) {
      await themes.applyTheme(serial, themeId);
    },
    async createBackup(serial: string, outputDir: string) {
      return backup.createBackup(serial, outputDir);
    }
  };
}

export * from '@cleanyourandroid/shared';
export * from '@cleanyourandroid/adb';
export * from '@cleanyourandroid/device';
export * from '@cleanyourandroid/debloater';
export * from '@cleanyourandroid/customizer';
export * from '@cleanyourandroid/themes';
export * from '@cleanyourandroid/backup';

