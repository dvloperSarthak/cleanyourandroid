import { IAdbClient } from '@cleanyourandroid/adb';
import { CustomizationSettings } from '@cleanyourandroid/shared';

export interface ICustomizerEngine {
  getCurrentSettings(serial: string): Promise<CustomizationSettings>;
  applySettings(serial: string, settings: CustomizationSettings): Promise<void>;
  setAnimationScales(
    serial: string,
    scales: { window?: number; transition?: number; animator?: number }
  ): Promise<void>;
  setDisplayDensity(serial: string, dpi: number | 'reset'): Promise<void>;
  setDarkMode(serial: string, enabled: boolean): Promise<void>;
  setFontScale(serial: string, scale: number): Promise<void>;
  setWallpaper(serial: string, localFilePath: string): Promise<void>;
}

export class CustomizerEngine implements ICustomizerEngine {
  constructor(private adb: IAdbClient) {}

  public async getCurrentSettings(serial: string): Promise<CustomizationSettings> {
    const [winScale, transScale, animScale, densityRes, darkModeRes, fontScaleRes] =
      await Promise.all([
        this.adb.shell(serial, ['settings', 'get', 'global', 'window_animation_scale']),
        this.adb.shell(serial, ['settings', 'get', 'global', 'transition_animation_scale']),
        this.adb.shell(serial, ['settings', 'get', 'global', 'animator_duration_scale']),
        this.adb.shell(serial, ['wm', 'density']),
        this.adb.shell(serial, ['cmd', 'uimode', 'night']),
        this.adb.shell(serial, ['settings', 'get', 'system', 'font_scale'])
      ]);

    const parseScale = (val: string) => {
      const parsed = parseFloat(val.trim());
      return isNaN(parsed) ? 1.0 : parsed;
    };

    let displayDensityDpi: number | undefined;
    const densityMatch = densityRes.stdout.match(/Override density:\s*(\d+)/) || densityRes.stdout.match(/Physical density:\s*(\d+)/);
    if (densityMatch) {
      displayDensityDpi = parseInt(densityMatch[1], 10);
    }

    const darkModeEnabled = darkModeRes.stdout.toLowerCase().includes('yes');
    const fontScale = parseFloat(fontScaleRes.stdout.trim()) || 1.0;

    return {
      windowAnimationScale: parseScale(winScale.stdout),
      transitionAnimationScale: parseScale(transScale.stdout),
      animatorDurationScale: parseScale(animScale.stdout),
      displayDensityDpi,
      darkModeEnabled,
      fontScale
    };
  }

  public async setAnimationScales(
    serial: string,
    scales: { window?: number; transition?: number; animator?: number }
  ): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (scales.window !== undefined) {
      promises.push(
        this.adb.shell(serial, [
          'settings',
          'put',
          'global',
          'window_animation_scale',
          scales.window.toString()
        ])
      );
    }
    if (scales.transition !== undefined) {
      promises.push(
        this.adb.shell(serial, [
          'settings',
          'put',
          'global',
          'transition_animation_scale',
          scales.transition.toString()
        ])
      );
    }
    if (scales.animator !== undefined) {
      promises.push(
        this.adb.shell(serial, [
          'settings',
          'put',
          'global',
          'animator_duration_scale',
          scales.animator.toString()
        ])
      );
    }

    await Promise.all(promises);
  }

  public async setDisplayDensity(serial: string, dpi: number | 'reset'): Promise<void> {
    if (dpi === 'reset') {
      await this.adb.shell(serial, ['wm', 'density', 'reset']);
    } else {
      if (dpi < 72 || dpi > 1200) {
        throw new Error('Display density must be between 72 and 1200 DPI for screen safety.');
      }
      await this.adb.shell(serial, ['wm', 'density', dpi.toString()]);
    }
  }

  public async setDarkMode(serial: string, enabled: boolean): Promise<void> {
    await this.adb.shell(serial, ['cmd', 'uimode', 'night', enabled ? 'yes' : 'no']);
  }

  public async setFontScale(serial: string, scale: number): Promise<void> {
    if (scale < 0.5 || scale > 3.0) {
      throw new Error('Font scale must be between 0.5 and 3.0.');
    }
    await this.adb.shell(serial, ['settings', 'put', 'system', 'font_scale', scale.toFixed(2)]);
  }

  public async setWallpaper(serial: string, localFilePath: string): Promise<void> {
    const remoteDest = '/sdcard/Download/cya_wallpaper.png';
    await this.adb.execute(['push', localFilePath, remoteDest], { serial });
    // Broadcast gallery scanner to make image readily available to user's wallpaper picker
    await this.adb.shell(serial, [
      'am',
      'broadcast',
      '-a',
      'android.intent.action.MEDIA_SCANNER_SCAN_FILE',
      '-d',
      `file://${remoteDest}`
    ]);
  }

  public async applySettings(serial: string, settings: CustomizationSettings): Promise<void> {
    if (
      settings.windowAnimationScale !== undefined ||
      settings.transitionAnimationScale !== undefined ||
      settings.animatorDurationScale !== undefined
    ) {
      await this.setAnimationScales(serial, {
        window: settings.windowAnimationScale,
        transition: settings.transitionAnimationScale,
        animator: settings.animatorDurationScale
      });
    }

    if (settings.displayDensityDpi !== undefined) {
      await this.setDisplayDensity(serial, settings.displayDensityDpi);
    }

    if (settings.darkModeEnabled !== undefined) {
      await this.setDarkMode(serial, settings.darkModeEnabled);
    }

    if (settings.fontScale !== undefined) {
      await this.setFontScale(serial, settings.fontScale);
    }
  }
}

