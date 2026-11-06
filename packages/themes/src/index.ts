import { CustomizationSettings, ThemeIdentifier } from '@cleanyourandroid/shared';
import { ICustomizerEngine } from '@cleanyourandroid/customizer';

export interface ThemeDefinition {
  id: ThemeIdentifier;
  name: string;
  description: string;
  designVibe: string;
  recommendedIconPacks: string[];
  recommendedLaunchers: string[];
  settings: CustomizationSettings;
}

export const THEME_PRESETS: Record<ThemeIdentifier, ThemeDefinition> = {
  'nothing-os': {
    id: 'nothing-os',
    name: 'Nothing OS Vibe',
    description: 'Minimalist glyph & dot-matrix aesthetic, snappy 0.5x animations, AMOLED dark background',
    designVibe: 'Monochrome, ultra-minimalist, raw tech',
    recommendedIconPacks: ['Nothing Icon Pack (Black)', 'Nothing Adaptive Icons'],
    recommendedLaunchers: ['Nothing Launcher', 'Lawnchair 14', 'Niagara Launcher'],
    settings: {
      windowAnimationScale: 0.5,
      transitionAnimationScale: 0.5,
      animatorDurationScale: 0.5,
      darkModeEnabled: true,
      fontScale: 1.0,
      accentColorHex: '#E50914' // Nothing signature red dot
    }
  },
  'pixel-material-you': {
    id: 'pixel-material-you',
    name: 'Google Pixel Material You',
    description: 'Smooth, fluid 1.0x expressive animations with soft rounded shapes and Material 3 accents',
    designVibe: 'Clean, pastel accents, approachable elegance',
    recommendedIconPacks: ['Pixel Icon Pack', 'Material You Adaptive'],
    recommendedLaunchers: ['Pixel Launcher', 'Nova Launcher Prime', 'Lawnchair 14'],
    settings: {
      windowAnimationScale: 1.0,
      transitionAnimationScale: 1.0,
      animatorDurationScale: 1.0,
      darkModeEnabled: true,
      fontScale: 1.0,
      accentColorHex: '#4285F4'
    }
  },
  'samsung-oneui': {
    id: 'samsung-oneui',
    name: 'Samsung One UI Precision',
    description: 'Ergonomic, one-handed focus, clean 0.75x snappy response, rich vibrant contrasts',
    designVibe: 'Ergonomic, dense, highly functional',
    recommendedIconPacks: ['One UI Icon Pack', 'Galaxy Icons'],
    recommendedLaunchers: ['One UI Home', 'Smart Launcher 6'],
    settings: {
      windowAnimationScale: 0.75,
      transitionAnimationScale: 0.75,
      animatorDurationScale: 0.75,
      darkModeEnabled: true,
      fontScale: 1.0,
      accentColorHex: '#0072CE'
    }
  },
  'minimal-monochrome': {
    id: 'minimal-monochrome',
    name: 'Pure Monochrome',
    description: 'Zero visual distractions, greyscale focus, instantaneous app launching',
    designVibe: 'Zen, distraction-free digital well-being',
    recommendedIconPacks: ['Whicons - White Icon Pack', 'Lines - Dark Icons'],
    recommendedLaunchers: ['Olauncher', 'Before Launcher', 'Niagara Launcher'],
    settings: {
      windowAnimationScale: 0.25,
      transitionAnimationScale: 0.25,
      animatorDurationScale: 0.25,
      darkModeEnabled: true,
      fontScale: 1.0,
      accentColorHex: '#FFFFFF'
    }
  },
  'amoled-dark': {
    id: 'amoled-dark',
    name: 'Deep AMOLED Midnight',
    description: 'True #000000 pitch black surfaces to maximize battery life on OLED displays',
    designVibe: 'Battery saver, stealth high-contrast',
    recommendedIconPacks: ['Zwart - Black Icon Pack', 'Minma Icons'],
    recommendedLaunchers: ['Nova Launcher', 'Niagara Launcher'],
    settings: {
      windowAnimationScale: 0.5,
      transitionAnimationScale: 0.5,
      animatorDurationScale: 0.5,
      darkModeEnabled: true,
      fontScale: 1.0,
      accentColorHex: '#00E676'
    }
  },
  custom: {
    id: 'custom',
    name: 'User Custom Profile',
    description: 'Custom fine-tuned user scales and layout density overrides',
    designVibe: 'Bespoke tailoring',
    recommendedIconPacks: [],
    recommendedLaunchers: [],
    settings: {}
  }
};

export class ThemeManager {
  constructor(private customizer: ICustomizerEngine) {}

  public getAvailableThemes(): ThemeDefinition[] {
    return Object.values(THEME_PRESETS);
  }

  public getTheme(id: ThemeIdentifier): ThemeDefinition {
    const theme = THEME_PRESETS[id];
    if (!theme) {
      throw new Error(`Unknown theme identifier '${id}'`);
    }
    return theme;
  }

  public async applyTheme(serial: string, id: ThemeIdentifier): Promise<ThemeDefinition> {
    const theme = this.getTheme(id);
    await this.customizer.applySettings(serial, theme.settings);
    return theme;
  }
}

