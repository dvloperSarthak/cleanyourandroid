import fs from 'node:fs/promises';
import path from 'node:path';
import { BackupManifest, BackupManifestSchema } from '@cleanyourandroid/shared';
import { IDeviceInspector } from '@cleanyourandroid/device';
import { IDebloatEngine } from '@cleanyourandroid/debloater';
import { ICustomizerEngine } from '@cleanyourandroid/customizer';

export interface IBackupManager {
  createBackup(serial: string, outputDirectory: string): Promise<{ manifestPath: string; manifest: BackupManifest }>;
  loadBackup(manifestPath: string): Promise<BackupManifest>;
  restoreFromManifest(serial: string, manifest: BackupManifest, options?: { restoreSettings?: boolean; restorePackages?: boolean }): Promise<{ reinstalledCount: number; settingsRestored: boolean }>;
}

export class BackupManager implements IBackupManager {
  constructor(
    private deviceInspector: IDeviceInspector,
    private debloater: IDebloatEngine,
    private customizer: ICustomizerEngine
  ) {}

  public async createBackup(
    serial: string,
    outputDirectory: string
  ): Promise<{ manifestPath: string; manifest: BackupManifest }> {
    const details = await this.deviceInspector.getDeviceDetails(serial);
    const packages = await this.debloater.listPackages(serial, 'all');
    const settings = await this.customizer.getCurrentSettings(serial);

    const installed = packages.filter((p) => p.isEnabled).map((p) => p.packageName);
    const disabled = packages.filter((p) => !p.isEnabled).map((p) => p.packageName);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = `cya-backup-${details.hardware.model.replace(/\s+/g, '_')}-${timestamp}`;

    const manifest: BackupManifest = {
      id,
      createdAt: new Date().toISOString(),
      deviceSerial: serial,
      deviceModel: details.hardware.model,
      androidVersion: details.software.androidVersion,
      installedPackages: installed,
      disabledPackages: disabled,
      uninstalledSystemPackages: [],
      settings
    };

    await fs.mkdir(outputDirectory, { recursive: true });
    const manifestPath = path.join(outputDirectory, `${id}.json`);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    return { manifestPath, manifest };
  }

  public async loadBackup(manifestPath: string): Promise<BackupManifest> {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const parsed = JSON.parse(content);
    return BackupManifestSchema.parse(parsed);
  }

  public async restoreFromManifest(
    serial: string,
    manifest: BackupManifest,
    options: { restoreSettings?: boolean; restorePackages?: boolean } = { restoreSettings: true, restorePackages: true }
  ): Promise<{ reinstalledCount: number; settingsRestored: boolean }> {
    let reinstalledCount = 0;
    let settingsRestored = false;

    if (options.restorePackages) {
      for (const pkg of manifest.installedPackages) {
        try {
          await this.debloater.reinstallPackage(serial, pkg);
          reinstalledCount++;
        } catch {
          // Non-critical if package was already installed
        }
      }
      for (const disabledPkg of manifest.disabledPackages) {
        try {
          await this.debloater.disablePackage(serial, disabledPkg);
        } catch {
          // Best effort
        }
      }
    }

    if (options.restoreSettings && manifest.settings) {
      await this.customizer.applySettings(serial, manifest.settings);
      settingsRestored = true;
    }

    return { reinstalledCount, settingsRestored };
  }
}

