import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import {
  createDeviceManager,
  THEME_PRESETS,
  ThemeIdentifier,
  DeviceNotFoundError,
  CleanYourAndroidError
} from '@cleanyourandroid/core';

const program = new Command();
const manager = createDeviceManager();

async function resolveTargetDevice(explicitDevice?: string): Promise<string> {
  if (explicitDevice) return explicitDevice;

  const devices = await manager.getConnectedDevices();
  if (devices.length === 0) {
    console.log(chalk.red('✕ No Android devices detected.'));
    console.log(chalk.gray('  Run "cya doctor" for connection troubleshooting or connect via USB.'));
    process.exit(1);
  }

  if (devices.length === 1) {
    return devices[0].serial;
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Multiple devices detected. Select a target device:',
      choices: devices.map((d) => ({
        name: `${d.model || d.product || 'Android Device'} (${d.serial}) [${d.state}]`,
        value: d.serial
      }))
    }
  ]);

  return answer.selected;
}

program
  .name('cya')
  .description(chalk.bold('CleanYourAndroid') + ' — Open-Source Android Customization & Debloating Toolkit')
  .version('1.0.0');

// cya devices
program
  .command('devices')
  .description('List all connected USB and wireless Android devices')
  .action(async () => {
    const spinner = ora('Detecting connected devices...').start();
    try {
      const devices = await manager.getConnectedDevices();
      spinner.stop();
      if (devices.length === 0) {
        console.log(chalk.yellow('No Android devices found. Make sure USB Debugging is ON.'));
        return;
      }

      console.log(chalk.bold.cyan(`\n📱 Connected Devices (${devices.length}):`));
      console.log('─'.repeat(60));
      for (const d of devices) {
        const stateColor = d.state === 'device' ? chalk.green : chalk.red;
        console.log(
          `• Serial:    ${chalk.bold(d.serial)}\n` +
          `  State:     ${stateColor(d.state.toUpperCase())}\n` +
          `  Transport: ${chalk.gray(d.transport)}\n` +
          `  Model:     ${d.model || 'Unknown'}\n`
        );
      }
    } catch (err) {
      spinner.fail('Failed to query devices');
      console.error(chalk.red((err as Error).message));
    }
  });

// cya connect <host> [port]
program
  .command('connect <host> [port]')
  .description('Connect to a wireless ADB device via IP address')
  .action(async (host: string, portStr?: string) => {
    const port = portStr ? parseInt(portStr, 10) : 5555;
    const spinner = ora(`Connecting to ${host}:${port}...`).start();
    try {
      const res = await manager.connectDevice(host, port);
      if (res.success) {
        spinner.succeed(chalk.green(`Successfully connected to ${host}:${port}`));
      } else {
        spinner.fail(chalk.yellow(`Connection failed: ${res.message}`));
      }
    } catch (err) {
      spinner.fail('Connection error');
      console.error(chalk.red((err as Error).message));
    }
  });

// cya pair <host> <port> <code>
program
  .command('pair <host> <port> <code>')
  .description('Pair with Android 11+ Wireless Debugging pairing code')
  .action(async (host: string, portStr: string, code: string) => {
    const port = parseInt(portStr, 10);
    const spinner = ora(`Pairing with ${host}:${port}...`).start();
    try {
      const res = await manager.pairDevice(host, port, code);
      if (res.success) {
        spinner.succeed(chalk.green(`Device successfully paired!`));
      } else {
        spinner.fail(chalk.red(`Pairing failed: ${res.message}`));
      }
    } catch (err) {
      spinner.fail('Pairing failed');
      console.error(chalk.red((err as Error).message));
    }
  });

// cya info
program
  .command('info')
  .description('Display detailed hardware, software, and battery information')
  .option('-d, --device <serial>', 'Target device serial')
  .action(async (opts) => {
    try {
      const serial = await resolveTargetDevice(opts.device);
      const spinner = ora('Reading device hardware and telemetry...').start();
      const details = await manager.getDeviceInfo(serial);
      spinner.succeed('Device telemetry retrieved');

      console.log(chalk.bold.green(`\n📊 Device Information [${details.serial}]`));
      console.log('─'.repeat(55));
      console.log(chalk.bold('Hardware:'));
      console.log(`  Manufacturer:    ${details.hardware.manufacturer}`);
      console.log(`  Model:           ${details.hardware.model}`);
      console.log(`  Screen:          ${details.hardware.screenResolution || 'N/A'} @ ${details.hardware.screenDensityDpi || 'N/A'} DPI`);
      console.log(`  Battery:         ${details.hardware.batteryLevelPercent}% (${details.hardware.batteryStatus || 'N/A'}) - ${details.hardware.batteryTemperatureC ?? 'N/A'}°C`);
      
      console.log(chalk.bold('\nSoftware:'));
      console.log(`  Android Version: ${details.software.androidVersion} (API ${details.software.apiLevel})`);
      console.log(`  Build ID:        ${details.software.buildId}`);
      console.log(`  Security Patch:  ${details.software.securityPatch}`);
      console.log(`  Root Access:     ${details.software.isRooted ? chalk.green('Yes') : chalk.gray('No (Standard Non-Root ADB)')}`);
    } catch (err) {
      console.error(chalk.red((err as Error).message));
    }
  });

// cya apps
program
  .command('apps')
  .description('List installed packages on the device')
  .option('-d, --device <serial>', 'Target device serial')
  .option('-f, --filter <type>', 'Filter: all, system, 3rd-party, disabled', 'all')
  .action(async (opts) => {
    try {
      const serial = await resolveTargetDevice(opts.device);
      const spinner = ora(`Fetching packages (${opts.filter})...`).start();
      const apps = await manager.getInstalledApps(serial, opts.filter);
      spinner.stop();

      console.log(chalk.bold.cyan(`\n📦 Installed Packages (${apps.length}):`));
      console.log('─'.repeat(60));
      for (const app of apps.slice(0, 50)) {
        const stateStr = app.isEnabled ? chalk.green('ENABLED') : chalk.gray('DISABLED');
        console.log(`• ${chalk.bold(app.packageName)} [${stateStr}]`);
      }
      if (apps.length > 50) {
        console.log(chalk.gray(`... and ${apps.length - 50} more. Use --filter to narrow down.`));
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
    }
  });

// cya debloat
program
  .command('debloat')
  .description('Inspect and safely debloat manufacturer bloatware')
  .option('-d, --device <serial>', 'Target device serial')
  .option('--dry-run', 'Simulate debloating actions without removing packages', false)
  .action(async (opts) => {
    try {
      const serial = await resolveTargetDevice(opts.device);
      const spinner = ora('Detecting device OEM profile & bloatware...').start();
      const details = await manager.getDeviceInfo(serial);
      const bloat = await manager.inspectBloatware(serial, details.hardware.manufacturer);
      spinner.stop();

      if (bloat.length === 0) {
        console.log(chalk.green(`\n✓ No known bloatware detected for ${details.hardware.manufacturer}!`));
        return;
      }

      console.log(chalk.bold.yellow(`\n⚠️ Detected ${bloat.length} Bloatware candidates for ${details.hardware.manufacturer}:`));
      console.log('─'.repeat(70));
      for (const b of bloat) {
        console.log(
          `• ${chalk.bold(b.applicationLabel)} (${chalk.cyan(b.packageName)})\n` +
          `  Risk: ${b.riskLevel.toUpperCase()} | Category: ${b.category}\n` +
          `  Desc: ${b.description || 'No description'}\n`
        );
      }

      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selected',
          message: 'Select packages to remove for current user:',
          choices: bloat.map((b) => ({
            name: `${b.applicationLabel} [${b.riskLevel}]`,
            value: b.packageName,
            checked: b.riskLevel === 'safe'
          }))
        },
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to proceed with ${opts.dryRun ? 'DRY-RUN' : 'safe user-space uninstall'}?`,
          default: false
        }
      ]);

      if (!answers.confirm || answers.selected.length === 0) {
        console.log(chalk.gray('Debloating canceled.'));
        return;
      }

      console.log(chalk.blue(`\nProcessing ${answers.selected.length} packages...`));
      for (const pkg of answers.selected) {
        const res = await manager.uninstallPackage(serial, pkg, opts.dryRun);
        if (res.success) {
          console.log(chalk.green(`  ✓ [UNINSTALLED] ${pkg}`));
        } else {
          console.log(chalk.red(`  ✕ [FAILED] ${pkg}: ${res.error}`));
        }
      }
      console.log(chalk.green('\nDebloating batch complete. All operations were user-space reversible.'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
    }
  });

// cya themes
program
  .command('themes')
  .description('List and apply aesthetic customization themes')
  .option('-d, --device <serial>', 'Target device serial')
  .option('-a, --apply <themeId>', 'Apply theme directly (nothing-os, pixel-material-you, etc.)')
  .action(async (opts) => {
    try {
      const serial = await resolveTargetDevice(opts.device);

      if (opts.apply) {
        const spinner = ora(`Applying theme '${opts.apply}'...`).start();
        await manager.applyTheme(serial, opts.apply as ThemeIdentifier);
        spinner.succeed(chalk.green(`Theme '${opts.apply}' successfully applied!`));
        return;
      }

      const themes = Object.values(THEME_PRESETS);
      console.log(chalk.bold.magenta('\n🎨 Available Aesthetic Themes:'));
      console.log('─'.repeat(60));
      for (const t of themes) {
        console.log(`• ${chalk.bold.cyan(t.name)} (ID: ${chalk.yellow(t.id)})`);
        console.log(`  ${t.description}`);
        console.log(`  Vibe: ${chalk.gray(t.designVibe)}\n`);
      }

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'chosenTheme',
          message: 'Choose a theme to apply immediately:',
          choices: themes.map((t) => ({ name: t.name, value: t.id }))
        }
      ]);

      const spinner = ora(`Applying ${answer.chosenTheme}...`).start();
      await manager.applyTheme(serial, answer.chosenTheme as ThemeIdentifier);
      spinner.succeed(chalk.green(`Applied ${answer.chosenTheme} aesthetic!`));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
    }
  });

// cya customize
program
  .command('customize')
  .description('Interactively adjust animation speeds, display density, and dark mode')
  .option('-d, --device <serial>', 'Target device serial')
  .action(async (opts) => {
    try {
      const serial = await resolveTargetDevice(opts.device);
      const current = await manager.customizer.getCurrentSettings(serial);

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'animSpeed',
          message: 'Set System Animation Scale:',
          choices: [
            { name: '0.25x (Lightning snappy)', value: 0.25 },
            { name: '0.5x (Recommended Nothing OS speed)', value: 0.5 },
            { name: '1.0x (Android Default)', value: 1.0 },
            { name: 'Keep current', value: current.windowAnimationScale }
          ]
        },
        {
          type: 'confirm',
          name: 'darkMode',
          message: 'Enable System Dark Mode?',
          default: current.darkModeEnabled ?? true
        }
      ]);

      const spinner = ora('Applying customization adjustments...').start();
      await manager.customizer.setAnimationScales(serial, {
        window: answers.animSpeed,
        transition: answers.animSpeed,
        animator: answers.animSpeed
      });
      await manager.customizer.setDarkMode(serial, answers.darkMode);
      spinner.succeed(chalk.green('Customization settings applied!'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
    }
  });

// cya backup
program
  .command('backup')
  .description('Snapshot installed packages, state, and appearance settings')
  .option('-d, --device <serial>', 'Target device serial')
  .option('-o, --output <dir>', 'Output directory', './cya-backups')
  .action(async (opts) => {
    try {
      const serial = await resolveTargetDevice(opts.device);
      const spinner = ora('Creating backup snapshot...').start();
      const res = await manager.createBackup(serial, opts.output);
      spinner.succeed(chalk.green(`Backup saved to ${res.manifestPath}`));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
    }
  });

// cya restore <file>
program
  .command('restore <file>')
  .description('Restore settings and packages from a backup manifest')
  .option('-d, --device <serial>', 'Target device serial')
  .action(async (file: string, opts) => {
    try {
      const serial = await resolveTargetDevice(opts.device);
      const spinner = ora(`Loading manifest ${file}...`).start();
      const manifest = await manager.backup.loadBackup(file);
      spinner.text = 'Restoring packages and settings...';
      const result = await manager.backup.restoreFromManifest(serial, manifest);
      spinner.succeed(chalk.green(`Restored ${result.reinstalledCount} packages! Settings: ${result.settingsRestored ? 'Restored' : 'Skipped'}`));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
    }
  });

// cya doctor
program
  .command('doctor')
  .description('Diagnose ADB binary, driver status, device authorization, and permissions')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🩺 CleanYourAndroid Diagnostic Doctor'));
    console.log('═'.repeat(60));

    // 1. ADB check
    console.log(`Checking ADB platform tools:`);
    console.log(`  Path: ${chalk.yellow(manager.adb.adbPath)}`);
    try {
      const versionRes = await manager.adb.execute(['version']);
      console.log(`  Version: ${chalk.green(versionRes.stdout.split('\n')[0])}`);
    } catch {
      console.log(chalk.red('  ✕ ADB binary not executable or not found.'));
      console.log(chalk.gray('    Fix: Install Android SDK Platform-Tools or set ADB_PATH environment variable.'));
    }

    // 2. Connected devices
    console.log('\nChecking Connected Devices:');
    try {
      const devices = await manager.getConnectedDevices();
      if (devices.length === 0) {
        console.log(chalk.yellow('  ⚠️ No devices detected over USB or Wi-Fi.'));
        console.log(chalk.gray('    Troubleshooting Checklist:'));
        console.log('    1. Open Settings -> About Phone -> Tap "Build Number" 7 times.');
        console.log('    2. Go to Developer Options -> Enable "USB Debugging".');
        console.log('    3. Re-plug the USB cable and select "File Transfer / MTP" mode.');
      } else {
        for (const d of devices) {
          if (d.state === 'unauthorized') {
            console.log(chalk.yellow(`  ⚠️ Device ${d.serial} is UNAUTHORIZED.`));
            console.log(chalk.gray('    Unlock your phone screen and tap "Always allow" on the popup.'));
          } else {
            console.log(chalk.green(`  ✓ Device ${d.serial} is CONNECTED & AUTHORIZED.`));
          }
        }
      }
    } catch (err) {
      console.log(chalk.red(`  ✕ Error querying devices: ${(err as Error).message}`));
    }

    console.log('\n' + '═'.repeat(60));
  });

// Default interactive CLI if called with no arguments
if (process.argv.length <= 2) {
  (async () => {
    console.log(chalk.bold.cyan(`
   _____ _                  __     __                 
  / ____| |                 \\ \\   / /                 
 | |    | | ___  __ _ _ __   \\ \\_/ /__  _   _ _ __    
 | |    | |/ _ \\/ _\` | '_ \\   \\   / _ \\| | | | '__|   
 | |____| |  __/ (_| | | | |   | | (_) | |_| | |      
  \\_____|_|\\___|\\__,_|_| |_|   |_|\\___/ \\__,_|_|      
             Android Customization Toolkit v1.0.0
    `));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '1. List Connected Devices', value: 'devices' },
          { name: '2. Inspect Device Info & Battery', value: 'info' },
          { name: '3. Inspect & Debloat Bloatware', value: 'debloat' },
          { name: '4. Apply Design Themes (Nothing OS / Pixel / One UI)', value: 'themes' },
          { name: '5. Fast Customization (Animations & Dark Mode)', value: 'customize' },
          { name: '6. Backup Device Settings', value: 'backup' },
          { name: '7. Run Diagnostic Doctor', value: 'doctor' },
          { name: '8. Exit', value: 'exit' }
        ]
      }
    ]);

    if (answer.action === 'exit') process.exit(0);

    const cmdArgs = [process.argv[0], process.argv[1], answer.action];
    await program.parseAsync(cmdArgs);
  })();
} else {
  program.parseAsync(process.argv);
}

