import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  AdbBinaryNotFoundError,
  CleanYourAndroidError,
  DeviceSummary,
  DeviceConnectionState,
  ConnectionTransport
} from '@cleanyourandroid/shared';

export interface AdbExecOptions {
  timeoutMs?: number;
  serial?: string;
  env?: NodeJS.ProcessEnv;
}

export interface AdbExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface IAdbClient {
  adbPath: string;
  execute(args: string[], options?: AdbExecOptions): Promise<AdbExecResult>;
  shell(serial: string, commandArgs: string[], options?: Omit<AdbExecOptions, 'serial'>): Promise<AdbExecResult>;
  getDevices(): Promise<DeviceSummary[]>;
  connect(host: string, port?: number): Promise<{ success: boolean; message: string }>;
  disconnect(host?: string, port?: number): Promise<{ success: boolean; message: string }>;
  pair(host: string, port: number, code: string): Promise<{ success: boolean; message: string }>;
}

export function resolveAdbPath(customPath?: string): string {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }
  if (process.env.ADB_PATH && fs.existsSync(process.env.ADB_PATH)) {
    return process.env.ADB_PATH;
  }
  if (process.env.ANDROID_HOME) {
    const candidate = path.join(process.env.ANDROID_HOME, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
    if (fs.existsSync(candidate)) return candidate;
  }
  if (process.env.ANDROID_SDK_ROOT) {
    const candidate = path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
    if (fs.existsSync(candidate)) return candidate;
  }

  // Windows standard paths
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const winCandidate = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
    if (fs.existsSync(winCandidate)) {
      return winCandidate;
    }
  }

  // Unix standard paths
  const unixCandidates = [
    path.join(os.homedir(), 'Android', 'Sdk', 'platform-tools', 'adb'),
    path.join(os.homedir(), 'Library', 'Android', 'sdk', 'platform-tools', 'adb'),
    '/usr/bin/adb',
    '/usr/local/bin/adb',
    '/opt/homebrew/bin/adb'
  ];
  for (const c of unixCandidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }

  return 'adb';
}

export class AdbClient implements IAdbClient {
  public adbPath: string;

  constructor(customPath?: string) {
    this.adbPath = resolveAdbPath(customPath);
  }

  public async execute(args: string[], options: AdbExecOptions = {}): Promise<AdbExecResult> {
    const timeout = options.timeoutMs ?? 15000;
    const finalArgs: string[] = [];

    if (options.serial) {
      finalArgs.push('-s', options.serial);
    }
    finalArgs.push(...args);

    return new Promise<AdbExecResult>((resolve, reject) => {
      let proc: ReturnType<typeof spawn>;
      try {
        proc = spawn(this.adbPath, finalArgs, {
          windowsHide: true,
          env: options.env ?? process.env
        });
      } catch (err: unknown) {
        return reject(
          new AdbBinaryNotFoundError(
            `Failed to spawn ADB binary at '${this.adbPath}': ${(err as Error).message}`
          )
        );
      }

      let stdout = '';
      let stderr = '';
      let timer: NodeJS.Timeout | null = null;

      if (timeout > 0) {
        timer = setTimeout(() => {
          proc.kill('SIGTERM');
          reject(
            new CleanYourAndroidError(
              `ADB command '${finalArgs.slice(0, 3).join(' ')}...' timed out after ${timeout}ms`,
              'ADB_TIMEOUT',
              true,
              'Check if device is locked, waiting for user confirmation dialog, or re-plug USB cable.'
            )
          );
        }, timeout);
      }

      proc.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('error', (err) => {
        if (timer) clearTimeout(timer);
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          reject(new AdbBinaryNotFoundError(this.adbPath));
        } else {
          reject(new CleanYourAndroidError(`ADB process error: ${err.message}`, 'ADB_EXEC_ERROR'));
        }
      });

      proc.on('close', (code) => {
        if (timer) clearTimeout(timer);
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? 0
        });
      });
    });
  }

  public async shell(
    serial: string,
    commandArgs: string[],
    options: Omit<AdbExecOptions, 'serial'> = {}
  ): Promise<AdbExecResult> {
    return this.execute(['shell', ...commandArgs], { ...options, serial });
  }

  public async getDevices(): Promise<DeviceSummary[]> {
    const res = await this.execute(['devices', '-l']);
    const lines = res.stdout.split('\n');
    const devices: DeviceSummary[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('List of devices attached') || line.startsWith('* daemon')) {
        continue;
      }

      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const serial = parts[0];
      const rawState = parts[1].toLowerCase();

      let state: DeviceConnectionState = 'device';
      if (rawState.includes('unauthorized')) state = 'unauthorized';
      else if (rawState.includes('offline')) state = 'offline';
      else if (rawState.includes('authorizing')) state = 'authorizing';
      else if (rawState.includes('recovery')) state = 'recovery';
      else if (rawState.includes('sideload')) state = 'sideload';
      else if (rawState === 'device') state = 'device';
      else state = 'disconnected';

      let transport: ConnectionTransport = 'usb';
      let ipAddress: string | undefined;
      let port: number | undefined;

      if (serial.includes(':')) {
        const [ip, portStr] = serial.split(':');
        ipAddress = ip;
        port = parseInt(portStr, 10);
        transport = 'wifi_legacy';
      }

      let model: string | undefined;
      let product: string | undefined;
      let deviceName: string | undefined;

      for (let i = 2; i < parts.length; i++) {
        const item = parts[i];
        if (item.startsWith('model:')) model = item.replace('model:', '');
        else if (item.startsWith('product:')) product = item.replace('product:', '');
        else if (item.startsWith('device:')) deviceName = item.replace('device:', '');
        else if (item.startsWith('transport_id:')) {
          // ignore or record
        }
      }

      devices.push({
        serial,
        state,
        transport,
        model,
        product,
        device: deviceName,
        ipAddress,
        port
      });
    }

    return devices;
  }

  public async connect(host: string, port = 5555): Promise<{ success: boolean; message: string }> {
    const target = `${host}:${port}`;
    const res = await this.execute(['connect', target]);
    const out = res.stdout || res.stderr;
    const success = out.toLowerCase().includes('connected to');
    return {
      success,
      message: out
    };
  }

  public async disconnect(host?: string, port?: number): Promise<{ success: boolean; message: string }> {
    const args = ['disconnect'];
    if (host) {
      args.push(port ? `${host}:${port}` : host);
    }
    const res = await this.execute(args);
    return {
      success: res.exitCode === 0,
      message: res.stdout || res.stderr || 'Disconnected'
    };
  }

  public async pair(host: string, port: number, code: string): Promise<{ success: boolean; message: string }> {
    const target = `${host}:${port}`;
    // Pairing code must be passed via adb pair <host>:<port> <code>
    const res = await this.execute(['pair', target, code], { timeoutMs: 25000 });
    const out = res.stdout || res.stderr;
    const success = out.toLowerCase().includes('successfully paired');
    return {
      success,
      message: out
    };
  }
}

export class MockAdbClient implements IAdbClient {
  public adbPath = '/mock/bin/adb';
  public mockDevices: DeviceSummary[] = [];
  public shellResponses: Map<string, AdbExecResult> = new Map();

  constructor(initialDevices: DeviceSummary[] = []) {
    this.mockDevices = [...initialDevices];
  }

  public setMockResponse(commandRegex: string, result: AdbExecResult) {
    this.shellResponses.set(commandRegex, result);
  }

  public async execute(args: string[]): Promise<AdbExecResult> {
    const fullCmd = args.join(' ');
    for (const [key, val] of this.shellResponses.entries()) {
      if (new RegExp(key).test(fullCmd)) {
        return val;
      }
    }
    if (args[0] === 'devices') {
      const header = 'List of devices attached\n';
      const body = this.mockDevices
        .map((d) => `${d.serial}\t${d.state} product:${d.product || 'mock'} model:${d.model || 'MockPhone'} device:${d.device || 'mock'}`)
        .join('\n');
      return { stdout: header + body, stderr: '', exitCode: 0 };
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  public async shell(serial: string, commandArgs: string[]): Promise<AdbExecResult> {
    const cmdStr = commandArgs.join(' ');
    for (const [key, val] of this.shellResponses.entries()) {
      if (new RegExp(key).test(cmdStr)) {
        return val;
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  public async getDevices(): Promise<DeviceSummary[]> {
    return [...this.mockDevices];
  }

  public async connect(host: string, port = 5555): Promise<{ success: boolean; message: string }> {
    const serial = `${host}:${port}`;
    this.mockDevices.push({
      serial,
      state: 'device',
      transport: 'wifi_legacy',
      model: 'Wireless_Android',
      ipAddress: host,
      port
    });
    return { success: true, message: `connected to ${host}:${port}` };
  }

  public async disconnect(host?: string, port?: number): Promise<{ success: boolean; message: string }> {
    if (!host) {
      this.mockDevices = [];
    } else {
      const target = port ? `${host}:${port}` : host;
      this.mockDevices = this.mockDevices.filter((d) => !d.serial.startsWith(target));
    }
    return { success: true, message: 'disconnected' };
  }

  public async pair(host: string, port: number, code: string): Promise<{ success: boolean; message: string }> {
    if (code.length === 6) {
      return { success: true, message: `Successfully paired to ${host}:${port}` };
    }
    return { success: false, message: 'Failed: Incorrect pairing code' };
  }
}

