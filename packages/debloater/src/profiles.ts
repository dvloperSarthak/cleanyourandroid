import { PackageCategory, PackageRiskLevel } from '@cleanyourandroid/shared';

export interface BloatwareRule {
  packageName: string;
  label: string;
  risk: PackageRiskLevel;
  category: PackageCategory;
  description: string;
}

export interface ManufacturerProfile {
  name: string;
  identifiers: string[]; // e.g. ["samsung", "sec"]
  rules: BloatwareRule[];
}

export const UNIVERSAL_CRITICAL_PACKAGES: Set<string> = new Set([
  'android',
  'com.android.systemui',
  'com.android.settings',
  'com.android.phone',
  'com.android.server.telecom',
  'com.google.android.packageinstaller',
  'com.android.packageinstaller',
  'com.google.android.permissioncontroller',
  'com.android.permissioncontroller',
  'com.google.android.gms', // Google Play Services
  'com.android.vending', // Google Play Store
  'com.android.providers.settings',
  'com.android.providers.telephony',
  'com.android.providers.media',
  'com.android.providers.downloads'
]);

export const SAMSUNG_PROFILE: ManufacturerProfile = {
  name: 'Samsung',
  identifiers: ['samsung'],
  rules: [
    {
      packageName: 'com.samsung.android.bixby.agent',
      label: 'Bixby Voice / Agent',
      risk: 'safe',
      category: 'oem_bloat',
      description: 'Samsung Bixby smart assistant background service'
    },
    {
      packageName: 'com.samsung.android.bixby.service',
      label: 'Bixby System Service',
      risk: 'safe',
      category: 'oem_bloat',
      description: 'Samsung Bixby wake and trigger component'
    },
    {
      packageName: 'com.samsung.android.spay',
      label: 'Samsung Pay / Wallet',
      risk: 'recommended',
      category: 'oem_bloat',
      description: 'Samsung contactless payment application'
    },
    {
      packageName: 'com.sec.android.app.sbrowser',
      label: 'Samsung Internet Browser',
      risk: 'safe',
      category: 'unneeded_system_app',
      description: 'Samsung default web browser'
    },
    {
      packageName: 'com.samsung.android.app.tips',
      label: 'Samsung Tips',
      risk: 'safe',
      category: 'oem_bloat',
      description: 'Tips and tricks notification daemon'
    },
    {
      packageName: 'com.facebook.katana',
      label: 'Facebook App',
      risk: 'safe',
      category: 'trialware',
      description: 'Pre-installed Facebook main client'
    },
    {
      packageName: 'com.facebook.system',
      label: 'Facebook App Installer',
      risk: 'safe',
      category: 'telemetry_analytics',
      description: 'Preloaded Facebook background updater service'
    },
    {
      packageName: 'com.facebook.appmanager',
      label: 'Facebook App Manager',
      risk: 'safe',
      category: 'telemetry_analytics',
      description: 'Facebook analytics telemetry tracker'
    },
    {
      packageName: 'com.facebook.services',
      label: 'Facebook Services',
      risk: 'safe',
      category: 'telemetry_analytics',
      description: 'Facebook background sync daemon'
    },
    {
      packageName: 'com.samsung.android.game.gamehome',
      label: 'Samsung Gaming Hub',
      risk: 'safe',
      category: 'oem_bloat',
      description: 'Promotional gaming launcher and ads hub'
    },
    {
      packageName: 'com.samsung.android.game.gametools',
      label: 'Samsung Game Tools',
      risk: 'safe',
      category: 'oem_bloat',
      description: 'In-game floating toolbar and screen recording helper'
    }
  ]
};

export const XIAOMI_PROFILE: ManufacturerProfile = {
  name: 'Xiaomi / Redmi / POCO',
  identifiers: ['xiaomi', 'redmi', 'poco'],
  rules: [
    {
      packageName: 'com.miui.msa.global',
      label: 'MIUI System Ads (MSA)',
      risk: 'safe',
      category: 'ad_services',
      description: 'Xiaomi core advertising network daemon'
    },
    {
      packageName: 'com.miui.analytics',
      label: 'MIUI Analytics',
      risk: 'safe',
      category: 'telemetry_analytics',
      description: 'Xiaomi user behavior tracking and telemetry service'
    },
    {
      packageName: 'com.mi.globalbrowser',
      label: 'Mi Browser',
      risk: 'safe',
      category: 'unneeded_system_app',
      description: 'Xiaomi default web browser often filled with news feeds'
    },
    {
      packageName: 'com.miui.yellowpage',
      label: 'Yellow Pages / Caller ID',
      risk: 'safe',
      category: 'ad_services',
      description: 'MIUI caller identification and commercial directory'
    },
    {
      packageName: 'com.xiaomi.glgm',
      label: 'Xiaomi Games',
      risk: 'safe',
      category: 'trialware',
      description: 'Preloaded game store app'
    },
    {
      packageName: 'com.miui.bugreport',
      label: 'MIUI Bug Reporter',
      risk: 'safe',
      category: 'telemetry_analytics',
      description: 'Automatic crash and telemetry reporter'
    },
    {
      packageName: 'com.miui.hybrid',
      label: 'Quick Apps',
      risk: 'safe',
      category: 'ad_services',
      description: 'Instant app loader with tracking and targeted push banners'
    }
  ]
};

export const ONEPLUS_PROFILE: ManufacturerProfile = {
  name: 'OnePlus',
  identifiers: ['oneplus'],
  rules: [
    {
      packageName: 'net.oneplus.commonsoft',
      label: 'OnePlus Device Diagnostics',
      risk: 'safe',
      category: 'telemetry_analytics',
      description: 'Background diagnostics and hardware tracking'
    },
    {
      packageName: 'com.heytap.mcs',
      label: 'HeyTap Push Service',
      risk: 'safe',
      category: 'ad_services',
      description: 'OPPO/OnePlus cross-device push notifications and ads'
    },
    {
      packageName: 'com.oneplus.membership',
      label: 'Red Cable Club',
      risk: 'safe',
      category: 'oem_bloat',
      description: 'OnePlus membership promotion and marketing portal'
    }
  ]
};

export const REALME_PROFILE: ManufacturerProfile = {
  name: 'Realme',
  identifiers: ['realme'],
  rules: [
    {
      packageName: 'com.coloros.phonemanager',
      label: 'Phone Manager Clean Engine',
      risk: 'recommended',
      category: 'oem_bloat',
      description: 'Realme memory cleaner with intrusive warnings'
    },
    {
      packageName: 'com.heytap.market',
      label: 'HeyTap App Market',
      risk: 'safe',
      category: 'ad_services',
      description: 'Alternative app store with push notification spam'
    }
  ]
};

export const MOTOROLA_PROFILE: ManufacturerProfile = {
  name: 'Motorola',
  identifiers: ['motorola', 'moto'],
  rules: [
    {
      packageName: 'com.motorola.ccc.notification',
      label: 'Motorola Notifications',
      risk: 'safe',
      category: 'oem_bloat',
      description: 'Marketing prompts and satisfaction surveys'
    },
    {
      packageName: 'com.motorola.moto',
      label: 'Moto App',
      risk: 'advanced',
      category: 'oem_bloat',
      description: 'Manages Moto Gestures (chop-chop flashlight). Disabling disables gestures.'
    }
  ]
};

export const GOOGLE_PIXEL_PROFILE: ManufacturerProfile = {
  name: 'Google Pixel',
  identifiers: ['google'],
  rules: [
    {
      packageName: 'com.google.android.apps.tips',
      label: 'Pixel Tips',
      risk: 'safe',
      category: 'unneeded_system_app',
      description: 'Onboarding tutorials for Pixel features'
    },
    {
      packageName: 'com.google.android.apps.wellbeing',
      label: 'Digital Wellbeing',
      risk: 'safe',
      category: 'unneeded_system_app',
      description: 'Screen-time monitor and parental usage tracker'
    }
  ]
};

export const NOTHING_PROFILE: ManufacturerProfile = {
  name: 'Nothing',
  identifiers: ['nothing'],
  rules: [
    {
      packageName: 'com.nothing.community',
      label: 'Nothing Community',
      risk: 'safe',
      category: 'oem_bloat',
      description: 'Feedback and community discussions portal'
    }
  ]
};

export const ALL_PROFILES: ManufacturerProfile[] = [
  SAMSUNG_PROFILE,
  XIAOMI_PROFILE,
  ONEPLUS_PROFILE,
  REALME_PROFILE,
  MOTOROLA_PROFILE,
  GOOGLE_PIXEL_PROFILE,
  NOTHING_PROFILE
];

export function findProfileForManufacturer(manufacturer: string): ManufacturerProfile | undefined {
  const norm = manufacturer.toLowerCase();
  return ALL_PROFILES.find((p) => p.identifiers.some((id) => norm.includes(id)));
}

