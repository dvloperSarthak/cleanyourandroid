import { z } from 'zod';

export type DeviceConnectionState = 'device' | 'unauthorized' | 'offline' | 'authorizing' | 'connecting' | 'disconnected' | 'recovery' | 'sideload';

export type ConnectionTransport = 'usb' | 'wifi_legacy' | 'wifi_pairing';

export const DeviceIdSchema = z.string().min(1, 'Device ID is required');

export const DeviceSummarySchema = z.object({
  serial: z.string(),
  state: z.enum(['device', 'unauthorized', 'offline', 'authorizing', 'connecting', 'disconnected', 'recovery', 'sideload']),
  transport: z.enum(['usb', 'wifi_legacy', 'wifi_pairing']),
  model: z.string().optional(),
  product: z.string().optional(),
  device: z.string().optional(),
  ipAddress: z.string().optional(),
  port: z.number().optional()
});
export type DeviceSummary = z.infer<typeof DeviceSummarySchema>;

export const DeviceHardwareInfoSchema = z.object({
  manufacturer: z.string(),
  brand: z.string(),
  model: z.string(),
  product: z.string(),
  board: z.string(),
  hardware: z.string(),
  cpuAbi: z.array(z.string()),
  totalRamBytes: z.number().optional(),
  availableRamBytes: z.number().optional(),
  batteryLevelPercent: z.number().optional(),
  batteryTemperatureC: z.number().optional(),
  batteryStatus: z.string().optional(),
  batteryHealth: z.string().optional(),
  screenResolution: z.string().optional(),
  screenDensityDpi: z.number().optional()
});
export type DeviceHardwareInfo = z.infer<typeof DeviceHardwareInfoSchema>;

export const DeviceSoftwareInfoSchema = z.object({
  androidVersion: z.string(),
  apiLevel: z.number(),
  buildId: z.string(),
  securityPatch: z.string(),
  fingerprint: z.string(),
  isRooted: z.boolean(),
  selinuxEnforcing: z.boolean().optional(),
  customRom: z.string().optional()
});
export type DeviceSoftwareInfo = z.infer<typeof DeviceSoftwareInfoSchema>;

export const DeviceDetailsSchema = z.object({
  serial: z.string(),
  state: z.enum(['device', 'unauthorized', 'offline', 'authorizing', 'connecting', 'disconnected', 'recovery', 'sideload']),
  transport: z.enum(['usb', 'wifi_legacy', 'wifi_pairing']),
  hardware: DeviceHardwareInfoSchema,
  software: DeviceSoftwareInfoSchema
});
export type DeviceDetails = z.infer<typeof DeviceDetailsSchema>;

export type PackageRiskLevel = 'safe' | 'recommended' | 'advanced' | 'expert' | 'unsafe_core';

export type PackageCategory = 
  | 'telemetry_analytics'
  | 'carrier_bloat'
  | 'oem_bloat'
  | 'ad_services'
  | 'unneeded_system_app'
  | 'trialware'
  | 'user_installed'
  | 'critical_system';

export const PackageInfoSchema = z.object({
  packageName: z.string(),
  applicationLabel: z.string(),
  versionName: z.string().optional(),
  versionCode: z.number().optional(),
  isSystem: z.boolean(),
  isEnabled: z.boolean(),
  isInstalledForUser: z.boolean(),
  riskLevel: z.enum(['safe', 'recommended', 'advanced', 'expert', 'unsafe_core']),
  category: z.enum([
    'telemetry_analytics',
    'carrier_bloat',
    'oem_bloat',
    'ad_services',
    'unneeded_system_app',
    'trialware',
    'user_installed',
    'critical_system'
  ]),
  description: z.string().optional(),
  apkPath: z.string().optional(),
  requiresRootToModify: z.boolean().default(false)
});
export type PackageInfo = z.infer<typeof PackageInfoSchema>;

export const ThemeIdentifierSchema = z.enum([
  'nothing-os',
  'pixel-material-you',
  'samsung-oneui',
  'minimal-monochrome',
  'amoled-dark',
  'custom'
]);
export type ThemeIdentifier = z.infer<typeof ThemeIdentifierSchema>;

export const CustomizationSettingsSchema = z.object({
  windowAnimationScale: z.number().min(0).max(10).optional(),
  transitionAnimationScale: z.number().min(0).max(10).optional(),
  animatorDurationScale: z.number().min(0).max(10).optional(),
  displayDensityDpi: z.number().min(72).max(1200).optional(),
  darkModeEnabled: z.boolean().optional(),
  fontScale: z.number().min(0.5).max(3.0).optional(),
  accentColorHex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  wallpaperUrlOrPath: z.string().optional()
});
export type CustomizationSettings = z.infer<typeof CustomizationSettingsSchema>;

export const CapabilityLevelSchema = z.enum([
  'unsupported',
  'standard_adb',
  'special_permission',
  'root_required'
]);
export type CapabilityLevel = z.infer<typeof CapabilityLevelSchema>;

export const DeviceCapabilitiesSchema = z.object({
  canUninstallUserPackages: z.boolean(),
  canDisablePackages: z.boolean(),
  canModifyAnimationScale: z.boolean(),
  canModifyDisplayDensity: z.boolean(),
  canToggleDarkMode: z.boolean(),
  canPushWallpaper: z.boolean(),
  canInstallApk: z.boolean(),
  canAccessBatteryDump: z.boolean(),
  canReadProcessStats: z.boolean(),
  customRomFeatures: z.array(z.string()).default([])
});
export type DeviceCapabilities = z.infer<typeof DeviceCapabilitiesSchema>;

export const DebloatOperationResultSchema = z.object({
  packageName: z.string(),
  success: z.boolean(),
  action: z.enum(['uninstall', 'disable', 'enable', 'reinstall']),
  message: z.string(),
  error: z.string().optional(),
  revertCommand: z.string().optional()
});
export type DebloatOperationResult = z.infer<typeof DebloatOperationResultSchema>;

export const DebloatReportSchema = z.object({
  deviceSerial: z.string(),
  timestamp: z.string(),
  dryRun: z.boolean(),
  results: z.array(DebloatOperationResultSchema),
  totalTargeted: z.number(),
  totalSucceeded: z.number(),
  totalFailed: z.number()
});
export type DebloatReport = z.infer<typeof DebloatReportSchema>;

export const BackupManifestSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  deviceSerial: z.string(),
  deviceModel: z.string(),
  androidVersion: z.string(),
  installedPackages: z.array(z.string()),
  disabledPackages: z.array(z.string()),
  uninstalledSystemPackages: z.array(z.string()),
  settings: CustomizationSettingsSchema
});
export type BackupManifest = z.infer<typeof BackupManifestSchema>;

export class CleanYourAndroidError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = false,
    public readonly troubleshootingGuide?: string
  ) {
    super(message);
    this.name = 'CleanYourAndroidError';
  }
}

export class DeviceNotFoundError extends CleanYourAndroidError {
  constructor(serial: string) {
    super(
      `Device '${serial}' was not found or is disconnected.`,
      'DEVICE_NOT_FOUND',
      true,
      'Ensure USB debugging is enabled and the cable is firmly connected, or check Wi-Fi ADB connection.'
    );
  }
}

export class AdbBinaryNotFoundError extends CleanYourAndroidError {
  constructor(pathSearched?: string) {
    super(
      `ADB binary not found. ${pathSearched ? `Checked path: ${pathSearched}` : ''}`,
      'ADB_NOT_FOUND',
      false,
      'Install Android SDK platform-tools or run "cya doctor" for automatic setup guidance.'
    );
  }
}

export class UnauthorizedDeviceError extends CleanYourAndroidError {
  constructor(serial: string) {
    super(
      `Device '${serial}' is unauthorized.`,
      'DEVICE_UNAUTHORIZED',
      true,
      'Unlock your phone screen and tap "Always allow from this computer" when prompted with the USB debugging dialog.'
    );
  }
}

export class OperationBlockedBySafetyError extends CleanYourAndroidError {
  constructor(packageName: string, reason: string) {
    super(
      `Safety guard prevented operation on '${packageName}': ${reason}`,
      'SAFETY_GUARD_BLOCKED',
      false,
      'Critical system applications cannot be uninstalled because doing so would soft-brick your device.'
    );
  }
}

