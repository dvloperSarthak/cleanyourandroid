import http from 'node:http';
import { createDeviceManager, ThemeIdentifier } from '@cleanyourandroid/core';

const manager = createDeviceManager();
const PORT = 5174;

async function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function sendJson(res: http.ServerResponse, status: number, body: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    // 1. Devices list
    if (pathname === '/api/devices' && req.method === 'GET') {
      const devices = await manager.getConnectedDevices();
      return sendJson(res, 200, { devices });
    }

    // 2. Device info / telemetry
    if (pathname === '/api/device/info' && req.method === 'GET') {
      const serial = url.searchParams.get('serial');
      const devices = await manager.getConnectedDevices();
      const targetSerial = serial || (devices.length > 0 ? devices[0].serial : null);

      if (!targetSerial) {
        return sendJson(res, 404, { error: 'No connected Android device found' });
      }

      const info = await manager.getDeviceInfo(targetSerial);
      const settings = await manager.customizer.getCurrentSettings(targetSerial);
      return sendJson(res, 200, { info, settings });
    }

    // 3. Inspect Bloatware
    if (pathname === '/api/device/bloatware' && req.method === 'GET') {
      const serial = url.searchParams.get('serial');
      const devices = await manager.getConnectedDevices();
      const targetSerial = serial || (devices.length > 0 ? devices[0].serial : null);

      if (!targetSerial) {
        return sendJson(res, 404, { error: 'No connected Android device found' });
      }

      const info = await manager.getDeviceInfo(targetSerial);
      const bloat = await manager.inspectBloatware(targetSerial, info.hardware.manufacturer);
      return sendJson(res, 200, { bloatware: bloat });
    }

    // 4. Uninstall/Remove Bloatware
    if (pathname === '/api/device/debloat' && req.method === 'POST') {
      const body = await parseBody(req);
      const { serial, packages, dryRun } = body;
      const report = await manager.debloater.batchExecute(serial, packages, 'uninstall', !!dryRun);
      return sendJson(res, 200, { report });
    }

    // 5. Apply Theme
    if (pathname === '/api/device/theme' && req.method === 'POST') {
      const body = await parseBody(req);
      const { serial, themeId } = body;
      await manager.applyTheme(serial, themeId as ThemeIdentifier);
      const settings = await manager.customizer.getCurrentSettings(serial);
      return sendJson(res, 200, { success: true, settings });
    }

    // 6. Custom Tuning (Animation, Density, Dark Mode)
    if (pathname === '/api/device/settings' && req.method === 'POST') {
      const body = await parseBody(req);
      const { serial, animationScale, displayDensityDpi, darkModeEnabled } = body;

      if (animationScale !== undefined) {
        await manager.customizer.setAnimationScales(serial, {
          window: animationScale,
          transition: animationScale,
          animator: animationScale
        });
      }
      if (displayDensityDpi !== undefined) {
        await manager.customizer.setDisplayDensity(serial, displayDensityDpi);
      }
      if (darkModeEnabled !== undefined) {
        await manager.customizer.setDarkMode(serial, darkModeEnabled);
      }

      const updated = await manager.customizer.getCurrentSettings(serial);
      return sendJson(res, 200, { success: true, settings: updated });
    }

    sendJson(res, 404, { error: 'Endpoint not found' });
  } catch (err: any) {
    sendJson(res, 500, { error: err.message || 'Internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`CleanYourAndroid API bridge listening at http://localhost:${PORT}`);
});

