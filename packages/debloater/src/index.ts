import { IAdbClient } from '@cleanyourandroid/adb';
import {
  PackageInfo,
  DebloatOperationResult,
  DebloatReport,
  OperationBlockedBySafetyError,
  PackageRiskLevel,
  PackageCategory
} from '@cleanyourandroid/shared';
import {
  findProfileForManufacturer,
  UNIVERSAL_CRITICAL_PACKAGES,
  BloatwareRule
} from './profiles.js';

export interface IDebloatEngine {
  listPackages(serial: string, filter?: 'all' | 'system' | '3rd-party' | 'disabled'): Promise<PackageInfo[]>;
  inspectBloatware(serial: string, manufacturer: string): Promise<PackageInfo[]>;
  uninstallPackage(serial: string, packageName: string, dryRun?: boolean): Promise<DebloatOperationResult>;
  disablePackage(serial: string, packageName: string, dryRun?: boolean): Promise<DebloatOperationResult>;
  enablePackage(serial: string, packageName: string, dryRun?: boolean): Promise<DebloatOperationResult>;
  reinstallPackage(serial: string, packageName: string, dryRun?: boolean): Promise<DebloatOperationResult>;
  batchExecute(
    serial: string,
    packageNames: string[],
    action: 'uninstall' | 'disable' | 'enable',
    dryRun?: boolean
  ): Promise<DebloatReport>;
}

export class DebloatEngine implements IDebloatEngine {
  constructor(private adb: IAdbClient) {}

  public async listPackages(
    serial: string,
    filter: 'all' | 'system' | '3rd-party' | 'disabled' = 'all'
  ): Promise<PackageInfo[]> {
    const args = ['pm', 'list', 'packages', '-f', '-u'];
    if (filter === 'system') args.push('-s');
    else if (filter === '3rd-party') args.push('-3');
    else if (filter === 'disabled') args.push('-d');

    const res = await this.adb.shell(serial, args);
    const lines = res.stdout.split('\n');
    const packages: PackageInfo[] = [];

    // Get list of disabled packages to accurately flag isEnabled
    const disabledRes = await this.adb.shell(serial, ['pm', 'list', 'packages', '-d']);
    const disabledSet = new Set(
      disabledRes.stdout
        .split('\n')
        .map((l) => l.trim().replace(/^package:/, ''))
        .filter(Boolean)
    );

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('package:')) continue;

      // format: package:/data/app/.../base.apk=com.example.app
      const withoutPrefix = line.substring(8);
      const splitIdx = withoutPrefix.lastIndexOf('=');
      let apkPath = '';
      let packageName = withoutPrefix;

      if (splitIdx !== -1) {
        apkPath = withoutPrefix.substring(0, splitIdx);
        packageName = withoutPrefix.substring(splitIdx + 1);
      }

      const isSystem = apkPath.startsWith('/system') || apkPath.startsWith('/product') || apkPath.startsWith('/apex');
      const isEnabled = !disabledSet.has(packageName);

      let riskLevel: PackageRiskLevel = isSystem ? 'advanced' : 'safe';
      let category: PackageCategory = isSystem ? 'unneeded_system_app' : 'user_installed';

      if (UNIVERSAL_CRITICAL_PACKAGES.has(packageName)) {
        riskLevel = 'unsafe_core';
        category = 'critical_system';
      }

      packages.push({
        packageName,
        applicationLabel: packageName.split('.').pop() || packageName,
        apkPath,
        isSystem,
        isEnabled,
        isInstalledForUser: true,
        riskLevel,
        category,
        requiresRootToModify: false
      });
    }

    return packages;
  }

  public async inspectBloatware(serial: string, manufacturer: string): Promise<PackageInfo[]> {
    const allInstalled = await this.listPackages(serial, 'all');
    const installedMap = new Map<string, PackageInfo>(allInstalled.map((p) => [p.packageName, p]));
    const profile = findProfileForManufacturer(manufacturer);

    const detected: PackageInfo[] = [];

    if (profile) {
      for (const rule of profile.rules) {
        const existing = installedMap.get(rule.packageName);
        if (existing) {
          detected.push({
            ...existing,
            applicationLabel: rule.label,
            riskLevel: rule.risk,
            category: rule.category,
            description: rule.description
          });
        }
      }
    }

    // Also check for common generic telemetry and carrier ad software
    const commonBloatRules: BloatwareRule[] = [
      {
        packageName: 'com.facebook.katana',
        label: 'Facebook',
        risk: 'safe',
        category: 'trialware',
        description: 'Pre-installed Facebook App'
      },
      {
        packageName: 'com.facebook.system',
        label: 'Meta App Installer',
        risk: 'safe',
        category: 'telemetry_analytics',
        description: 'Background installer service for Meta services'
      },
      {
        packageName: 'com.facebook.appmanager',
        label: 'Meta App Manager',
        risk: 'safe',
        category: 'telemetry_analytics',
        description: 'Background telemetry and update checker'
      },
      {
        packageName: 'com.microsoft.skydrive',
        label: 'Microsoft OneDrive',
        risk: 'safe',
        category: 'trialware',
        description: 'Pre-installed Microsoft OneDrive cloud storage'
      },
      {
        packageName: 'com.amazon.mShop.android.shopping',
        label: 'Amazon Shopping',
        risk: 'safe',
        category: 'trialware',
        description: 'Pre-installed Amazon Shopping application'
      }
    ];

    for (const rule of commonBloatRules) {
      if (!detected.some((d) => d.packageName === rule.packageName)) {
        const existing = installedMap.get(rule.packageName);
        if (existing) {
          detected.push({
            ...existing,
            applicationLabel: rule.label,
            riskLevel: rule.risk,
            category: rule.category,
            description: rule.description
          });
        }
      }
    }

    return detected;
  }

  public async uninstallPackage(
    serial: string,
    packageName: string,
    dryRun = false
  ): Promise<DebloatOperationResult> {
    if (UNIVERSAL_CRITICAL_PACKAGES.has(packageName)) {
      throw new OperationBlockedBySafetyError(
        packageName,
        'Cannot uninstall core Android system package. This would cause a bootloop.'
      );
    }

    if (dryRun) {
      return {
        packageName,
        success: true,
        action: 'uninstall',
        message: `[DRY RUN] Would execute: pm uninstall -k --user 0 ${packageName}`,
        revertCommand: `cmd package install-existing ${packageName}`
      };
    }

    // Safe user-space removal for non-root users
    const res = await this.adb.shell(serial, ['pm', 'uninstall', '-k', '--user', '0', packageName]);
    const success = res.stdout.includes('Success');

    return {
      packageName,
      success,
      action: 'uninstall',
      message: res.stdout || res.stderr,
      error: success ? undefined : (res.stderr || res.stdout),
      revertCommand: `cmd package install-existing ${packageName}`
    };
  }

  public async disablePackage(
    serial: string,
    packageName: string,
    dryRun = false
  ): Promise<DebloatOperationResult> {
    if (UNIVERSAL_CRITICAL_PACKAGES.has(packageName)) {
      throw new OperationBlockedBySafetyError(
        packageName,
        'Cannot disable essential operating system service.'
      );
    }

    if (dryRun) {
      return {
        packageName,
        success: true,
        action: 'disable',
        message: `[DRY RUN] Would execute: pm disable-user --user 0 ${packageName}`,
        revertCommand: `pm enable ${packageName}`
      };
    }

    const res = await this.adb.shell(serial, ['pm', 'disable-user', '--user', '0', packageName]);
    const success = res.stdout.includes('new state') || res.exitCode === 0;

    return {
      packageName,
      success,
      action: 'disable',
      message: res.stdout || res.stderr,
      error: success ? undefined : (res.stderr || res.stdout),
      revertCommand: `pm enable ${packageName}`
    };
  }

  public async enablePackage(
    serial: string,
    packageName: string,
    dryRun = false
  ): Promise<DebloatOperationResult> {
    if (dryRun) {
      return {
        packageName,
        success: true,
        action: 'enable',
        message: `[DRY RUN] Would execute: pm enable ${packageName}`
      };
    }

    const res = await this.adb.shell(serial, ['pm', 'enable', packageName]);
    const success = res.stdout.includes('new state') || res.exitCode === 0;

    return {
      packageName,
      success,
      action: 'enable',
      message: res.stdout || res.stderr,
      error: success ? undefined : (res.stderr || res.stdout)
    };
  }

  public async reinstallPackage(
    serial: string,
    packageName: string,
    dryRun = false
  ): Promise<DebloatOperationResult> {
    if (dryRun) {
      return {
        packageName,
        success: true,
        action: 'reinstall',
        message: `[DRY RUN] Would execute: cmd package install-existing ${packageName}`
      };
    }

    const res = await this.adb.shell(serial, ['cmd', 'package', 'install-existing', packageName]);
    const success = res.stdout.includes('installed for user') || res.exitCode === 0;

    return {
      packageName,
      success,
      action: 'reinstall',
      message: res.stdout || res.stderr,
      error: success ? undefined : (res.stderr || res.stdout)
    };
  }

  public async batchExecute(
    serial: string,
    packageNames: string[],
    action: 'uninstall' | 'disable' | 'enable',
    dryRun = false
  ): Promise<DebloatReport> {
    const results: DebloatOperationResult[] = [];
    let succeeded = 0;
    let failed = 0;

    for (const pkg of packageNames) {
      try {
        let res: DebloatOperationResult;
        if (action === 'uninstall') {
          res = await this.uninstallPackage(serial, pkg, dryRun);
        } else if (action === 'disable') {
          res = await this.disablePackage(serial, pkg, dryRun);
        } else {
          res = await this.enablePackage(serial, pkg, dryRun);
        }

        results.push(res);
        if (res.success) succeeded++;
        else failed++;
      } catch (err: unknown) {
        failed++;
        results.push({
          packageName: pkg,
          success: false,
          action,
          message: (err as Error).message,
          error: (err as Error).message
        });
      }
    }

    return {
      deviceSerial: serial,
      timestamp: new Date().toISOString(),
      dryRun,
      results,
      totalTargeted: packageNames.length,
      totalSucceeded: succeeded,
      totalFailed: failed
    };
  }
}

export * from './profiles.js';

