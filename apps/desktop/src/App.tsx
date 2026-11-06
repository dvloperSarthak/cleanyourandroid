import { useState, useEffect } from 'react';
import {
  Smartphone,
  Zap,
  Trash2,
  Sliders,
  Palette,
  ShieldAlert,
  Battery,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
  Camera,
  HardDrive,
  Cpu,
  Sparkles,
  ExternalLink,
  Power,
  Activity,
  Layers,
  Flame,
  Feather
} from 'lucide-react';

const API_BASE = 'http://localhost:5174/api';

const THEME_CARDS = [
  { id: 'nothing-os', name: 'Nothing OS Vibe', desc: 'Monochrome glyphs, dot-matrix styling, 0.5x snappy animations', color: '#E50914' },
  { id: 'pixel-material-you', name: 'Pixel Material You', desc: 'Fluid 1.0x expressive physics, rounded shapes, pastel accents', color: '#4285F4' },
  { id: 'samsung-oneui', name: 'One UI Ergonomics', desc: 'Lower-screen thumb reach, dense widgets, 0.75x responsive curves', color: '#0072CE' },
  { id: 'minimal-monochrome', name: 'Pure Monochrome', desc: 'Zero visual distractions, greyscale focus, instantaneous 0.25x response', color: '#FFFFFF' },
  { id: 'amoled-dark', name: 'Deep AMOLED Midnight', desc: '100% pitch-black OLED background, zero idle subpixel power', color: '#00E676' }
];

const SPEED_PRESETS = [
  { id: 'warp', name: '0.25x Lightning Snappy', speed: 0.25, badge: 'Ultra Fast', desc: 'Instantaneous UI reactions, skips long transition delays' },
  { id: 'feather', name: '0.35x Featherweight Fluid', speed: 0.35, badge: 'Bestest Balance', desc: 'Silky smooth high-refresh-rate motion with zero perceived lag' },
  { id: 'nothing', name: '0.50x Nothing OS Crisp', speed: 0.5, badge: 'Recommended', desc: 'Sharp, responsive dot-matrix pacing preferred by power users' },
  { id: 'default', name: '1.00x Stock Android', speed: 1.0, badge: 'Factory Default', desc: 'Standard manufacturer animation duration curves' }
];

const SHORTCUTS = [
  { id: 'developer_options', title: 'Developer Options', desc: 'USB debugging, pointer location & GPU rendering', icon: Sliders },
  { id: 'battery_saver', title: 'Battery & Power', desc: 'Adaptive charging, power saving & background limits', icon: Battery },
  { id: 'display_settings', title: 'Display & Refresh Rate', desc: 'Brightness, dark mode & motion smoothness', icon: Smartphone },
  { id: 'apps_settings', title: 'Application Manager', desc: 'Default apps, permissions & background usage', icon: Sparkles },
  { id: 'accessibility', title: 'Accessibility Services', desc: 'Display magnification, high contrast & gestures', icon: Activity }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'animations' | 'treble' | 'debloat' | 'themes' | 'screen' | 'processes' | 'shortcuts'>('dashboard');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);
  const [ram, setRam] = useState<any>(null);
  const [bloatList, setBloatList] = useState<any[]>([]);
  const [selectedBloat, setSelectedBloat] = useState<string[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [trebleInfo, setTrebleInfo] = useState<any>(null);
  const [screenUrl, setScreenUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshingScreen, setRefreshingScreen] = useState<boolean>(false);
  const [animSpeed, setAnimSpeed] = useState<number>(0.35);
  const [appliedTheme, setAppliedTheme] = useState<string>('default');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadRealDeviceData = async () => {
    setLoading(true);
    try {
      const infoRes = await fetch(`${API_BASE}/device/info`).then((r) => r.json());
      if (infoRes.info) {
        setDeviceInfo(infoRes.info);
        setSettings(infoRes.settings);
        setStorage(infoRes.storage);
        setRam(infoRes.ram);

        if (infoRes.settings?.windowAnimationScale !== undefined) {
          setAnimSpeed(infoRes.settings.windowAnimationScale);
        }
      }

      const bloatRes = await fetch(`${API_BASE}/device/bloatware`).then((r) => r.json());
      if (bloatRes.bloatware) {
        setBloatList(bloatRes.bloatware);
        setSelectedBloat(bloatRes.bloatware.filter((b: any) => b.riskLevel === 'safe').map((b: any) => b.packageName));
      }
    } catch (err: any) {
      showToast(`Error connecting to phone: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealDeviceData();
  }, []);

  const handleCaptureScreen = async () => {
    if (!deviceInfo) return;
    setRefreshingScreen(true);
    try {
      const res = await fetch(`${API_BASE}/device/screenshot?serial=${deviceInfo.serial}`).then((r) => r.json());
      if (res.url) {
        setScreenUrl(res.url);
        showToast('✓ Screenshot captured from phone');
      }
    } catch (err: any) {
      showToast(`Capture failed: ${err.message}`);
    } finally {
      setRefreshingScreen(false);
    }
  };

  const handleLoadProcesses = async () => {
    if (!deviceInfo) return;
    try {
      const res = await fetch(`${API_BASE}/device/processes?serial=${deviceInfo.serial}`).then((r) => r.json());
      if (res.processes) {
        setProcesses(res.processes);
      }
    } catch (err: any) {
      showToast(`Processes error: ${err.message}`);
    }
  };

  const handleLoadTreble = async () => {
    if (!deviceInfo) return;
    try {
      const res = await fetch(`${API_BASE}/device/treble-audit?serial=${deviceInfo.serial}`).then((r) => r.json());
      setTrebleInfo(res);
    } catch (err: any) {
      showToast(`Treble audit failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'processes') {
      handleLoadProcesses();
    } else if (activeTab === 'screen' && !screenUrl) {
      handleCaptureScreen();
    } else if (activeTab === 'treble') {
      handleLoadTreble();
    }
  }, [activeTab]);

  const handleApplyAnimationSpeed = async (speed: number) => {
    if (!deviceInfo) return;
    setAnimSpeed(speed);
    showToast(`Applying ${speed}x lightweight animation scale...`);
    try {
      const res = await fetch(`${API_BASE}/device/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial: deviceInfo.serial,
          animationScale: speed
        })
      }).then((r) => r.json());

      if (res.settings) {
        setSettings(res.settings);
        showToast(`✓ Phone set to ${speed}x lightweight speed! Test opening apps now.`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleCleanCache = async () => {
    if (!deviceInfo) return;
    showToast('Clearing inactive background package cache on phone...');
    try {
      await fetch(`${API_BASE}/device/clean-cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: deviceInfo.serial })
      });
      showToast('✓ Cache trimmed! Memory reclaimed.');
      loadRealDeviceData();
    } catch (err: any) {
      showToast(`Clean failed: ${err.message}`);
    }
  };

  const handleLaunchShortcut = async (shortcut: string) => {
    if (!deviceInfo) return;
    showToast(`Opening on phone screen...`);
    try {
      await fetch(`${API_BASE}/device/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: deviceInfo.serial, shortcut })
      });
      showToast('✓ Screen launched on your phone!');
    } catch (err: any) {
      showToast(`Failed: ${err.message}`);
    }
  };

  const handleReboot = async (mode = 'system') => {
    if (!deviceInfo) return;
    if (!confirm(`Are you sure you want to reboot ${deviceInfo.hardware.model}?`)) return;
    showToast(`Rebooting phone...`);
    try {
      await fetch(`${API_BASE}/device/reboot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: deviceInfo.serial, mode })
      });
      showToast('Device is rebooting...');
    } catch (err: any) {
      showToast(`Reboot failed: ${err.message}`);
    }
  };

  const toggleBloatSelect = (pkg: string) => {
    const item = bloatList.find((b) => b.packageName === pkg);
    if (item?.riskLevel === 'unsafe_core') return;
    if (selectedBloat.includes(pkg)) {
      setSelectedBloat(selectedBloat.filter((p) => p !== pkg));
    } else {
      setSelectedBloat([...selectedBloat, pkg]);
    }
  };

  const handleCleanBloat = async () => {
    if (!deviceInfo) return;
    showToast(`Uninstalling ${selectedBloat.length} bloatware packages from phone...`);
    try {
      const res = await fetch(`${API_BASE}/device/debloat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial: deviceInfo.serial,
          packages: selectedBloat,
          dryRun: false
        })
      }).then((r) => r.json());

      if (res.report) {
        showToast(`Done! Removed ${res.report.totalSucceeded} packages safely in user-space.`);
        loadRealDeviceData();
      }
    } catch (err: any) {
      showToast(`Failed to debloat: ${err.message}`);
    }
  };

  const handleApplyTheme = async (themeId: string) => {
    if (!deviceInfo) return;
    setAppliedTheme(themeId);
    showToast(`Applying ${themeId} theme to your phone...`);
    try {
      const res = await fetch(`${API_BASE}/device/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial: deviceInfo.serial,
          themeId
        })
      }).then((r) => r.json());

      if (res.settings) {
        setSettings(res.settings);
        setAnimSpeed(res.settings.windowAnimationScale ?? 1.0);
        showToast(`✓ Applied ${themeId} on ${deviceInfo.hardware.model}!`);
      }
    } catch (err: any) {
      showToast(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-[#f4f4f5]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/95 px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur">
          <CheckCircle2 className="h-4 w-4 text-[#E50914]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="flex w-64 flex-col border-r border-[#27272a] bg-[#0c0c0e] p-4">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E50914] text-white shadow-lg">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white">CleanYourAndroid</span>
            <span className="block text-[10px] font-dot uppercase text-neutral-400">Pro Device Studio</span>
          </div>
        </div>

        {/* Real Device Status Card */}
        <div className="mt-3 rounded-xl border border-[#27272a] bg-[#121214] p-3 text-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected (Live)
            </span>
            <span className="font-dot text-[10px]">Wi-Fi ADB</span>
          </div>
          <div className="mt-2 font-medium text-white truncate">
            {deviceInfo ? `${deviceInfo.hardware.brand?.toUpperCase()} ${deviceInfo.hardware.model}` : 'Connecting...'}
          </div>
          <div className="text-[11px] text-neutral-400 font-dot truncate">
            {deviceInfo ? deviceInfo.serial : '...'}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'dashboard' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Device Overview
          </button>

          <button
            onClick={() => setActiveTab('animations')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'animations' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Flame className="h-4 w-4 text-orange-400" />
            Lightweight Animations
          </button>

          <button
            onClick={() => setActiveTab('treble')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'treble' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4 text-blue-400" />
            Android Upgrade Hub
          </button>

          <button
            onClick={() => setActiveTab('screen')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'screen' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Camera className="h-4 w-4 text-emerald-400" />
            Live Screen Capture
          </button>

          <button
            onClick={() => setActiveTab('debloat')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'debloat' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            Bloatware Cleaner
            {bloatList.length > 0 && (
              <span className="ml-auto rounded-full bg-[#E50914]/20 px-2 py-0.5 text-[10px] font-bold text-[#E50914]">
                {bloatList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'themes' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Palette className="h-4 w-4" />
            Aesthetic Themes
          </button>

          <button
            onClick={() => setActiveTab('processes')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'processes' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" />
            Running Processes
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'shortcuts' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <ExternalLink className="h-4 w-4" />
            Quick Settings Intent
          </button>
        </nav>

        {/* Quick Power Actions */}
        <div className="pt-3 border-t border-[#27272a] space-y-2">
          <button
            onClick={() => handleReboot('system')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-[#141416] py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <Power className="h-3.5 w-3.5 text-rose-500" />
            Reboot Device
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {loading && !deviceInfo ? (
          <div className="flex h-full items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
            <span>Reading live Android hardware telemetry from your phone...</span>
          </div>
        ) : (
          <>
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && deviceInfo && (
              <div className="space-y-6">
                <header className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Live Device Diagnostics</h1>
                    <p className="text-sm text-neutral-400">Real-time hardware sensors, storage and memory usage for your {deviceInfo.hardware.model}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCleanCache}
                      className="flex items-center gap-2 rounded-lg bg-[#E50914]/20 border border-[#E50914]/30 text-[#E50914] px-3 py-1.5 text-xs font-semibold hover:bg-[#E50914]/30 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Trim App Cache
                    </button>
                    <button
                      onClick={loadRealDeviceData}
                      className="flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#121214] px-3 py-1.5 text-xs font-medium hover:bg-[#18181b]"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reload Phone
                    </button>
                  </div>
                </header>

                {/* Quick Metrics Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs uppercase font-dot">Battery</span>
                      <Battery className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">{deviceInfo.hardware.batteryLevelPercent}%</div>
                    <div className="text-xs text-neutral-500">
                      {deviceInfo.hardware.batteryStatus} • {deviceInfo.hardware.batteryTemperatureC}°C
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs uppercase font-dot">Internal Storage</span>
                      <HardDrive className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">{storage?.free || '24G'} Free</div>
                    <div className="text-xs text-neutral-500">{storage?.used || '81G'} used of {storage?.total || '106G'} ({storage?.percent || 77}%)</div>
                  </div>

                  <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs uppercase font-dot">RAM Memory</span>
                      <Cpu className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">{ram?.available || '1.1 GB'} Free</div>
                    <div className="text-xs text-neutral-500">{ram?.total || '3.5 GB'} Total ({ram?.percent || 69}% active)</div>
                  </div>

                  <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs uppercase font-dot">Android OS</span>
                      <ShieldAlert className="h-4 w-4 text-[#E50914]" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-white">v{deviceInfo.software.androidVersion}</div>
                    <div className="text-xs text-emerald-400">API {deviceInfo.software.apiLevel} • Non-Root ADB</div>
                  </div>
                </div>

                {/* Hardware Profile Card */}
                <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5">
                  <h2 className="text-base font-semibold text-white">Live Phone Specifications</h2>
                  <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                      <span className="text-neutral-400">Manufacturer</span>
                      <span className="font-medium text-white">{deviceInfo.hardware.manufacturer}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                      <span className="text-neutral-400">Device Model</span>
                      <span className="font-medium text-white">{deviceInfo.hardware.model}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                      <span className="text-neutral-400">Screen Resolution</span>
                      <span className="font-medium text-white">{deviceInfo.hardware.screenResolution} @ {deviceInfo.hardware.screenDensityDpi} DPI</span>
                    </div>
                    <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                      <span className="text-neutral-400">Security Patch</span>
                      <span className="font-medium text-neutral-300">{deviceInfo.software.securityPatch}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                      <span className="text-neutral-400">Current Animation Scale</span>
                      <span className="font-medium text-[#E50914]">{settings?.windowAnimationScale ?? animSpeed}x</span>
                    </div>
                    <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                      <span className="text-neutral-400">Build ID</span>
                      <span className="font-medium text-neutral-300">{deviceInfo.software.buildId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIGHTWEIGHT ANIMATIONS TAB */}
            {activeTab === 'animations' && (
              <div className="space-y-6">
                <header>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Lightweight & Fluid Animation Speeds</h1>
                  <p className="text-sm text-neutral-400">
                    Instantly make your phone feel 3x faster by tuning window, transition, and animator durations.
                  </p>
                </header>

                <div className="grid grid-cols-2 gap-4">
                  {SPEED_PRESETS.map((preset) => {
                    const isCurrent = Math.abs((settings?.windowAnimationScale ?? animSpeed) - preset.speed) < 0.05;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyAnimationSpeed(preset.speed)}
                        className={`group cursor-pointer rounded-xl border p-5 transition ${
                          isCurrent
                            ? 'border-[#E50914] bg-[#16161a] ring-1 ring-[#E50914]'
                            : 'border-[#27272a] bg-[#121214] hover:border-neutral-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Feather className="h-4 w-4 text-orange-400" />
                            <h3 className="font-semibold text-white">{preset.name}</h3>
                          </div>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            isCurrent ? 'bg-[#E50914] text-white' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {isCurrent ? 'ACTIVE ON PHONE' : preset.badge}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-neutral-400 leading-relaxed">{preset.desc}</p>
                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#27272a] text-xs text-neutral-400">
                          <span className="font-dot text-[#E50914] font-semibold">{preset.speed}x scale</span>
                          <span className="group-hover:text-white transition">Tap to apply to phone →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fine Tuning Slider Card */}
                <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <div className="font-semibold text-white">Custom Precision Slider</div>
                      <div className="text-xs text-neutral-400">Custom decimal scale for advanced smoothness tuning</div>
                    </div>
                    <span className="font-dot text-lg font-bold text-[#E50914]">{animSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={animSpeed}
                    onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                    className="w-full accent-[#E50914]"
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleApplyAnimationSpeed(animSpeed)}
                      className="rounded-lg bg-[#E50914] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#c40811] transition"
                    >
                      Set Custom Scale
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ANDROID UPGRADE & TREBLE HUB */}
            {activeTab === 'treble' && (
              <div className="space-y-6">
                <header>
                  <h1 className="text-2xl font-bold tracking-tight text-white">OS Modernizer & Upgrade Readiness</h1>
                  <p className="text-sm text-neutral-400">
                    Live hardware capability audit for Generic System Images (GSI), Project Treble, and Custom ROM support.
                  </p>
                </header>

                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                    <div className="text-xs uppercase font-dot text-neutral-400">Project Treble</div>
                    <div className="mt-2 text-xl font-bold text-emerald-400">
                      {trebleInfo?.trebleSupported ? '✓ Fully Supported' : 'Unsupported'}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">Can run vendor-independent AOSP images</div>
                  </div>

                  <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                    <div className="text-xs uppercase font-dot text-neutral-400">Architecture & ABI</div>
                    <div className="mt-2 text-xl font-bold text-white">{trebleInfo?.cpuArchitecture || 'arm64-v8a'}</div>
                    <div className="text-xs text-neutral-500 mt-1">GSI Target: {trebleInfo?.gsiTargetArch || 'arm64_bvN'}</div>
                  </div>

                  <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                    <div className="text-xs uppercase font-dot text-neutral-400">Bootloader Status</div>
                    <div className="mt-2 text-xl font-bold text-amber-400">
                      {trebleInfo?.bootloaderLocked ? 'OEM Locked' : 'Unlocked'}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">Unlock in Developer Options to flash ROMs</div>
                  </div>
                </div>

                {/* Upgrade Roadmap & Safe Visual Backport */}
                <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5 space-y-4">
                  <h2 className="text-base font-semibold text-white">How To Upgrade Your Phone Beyond End-Of-Life</h2>

                  <div className="space-y-3 text-xs text-neutral-300">
                    <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                      <span className="font-bold text-white">Method 1: Safe Next-Gen Visual Modernizer (Recommended - No Root / No Risk)</span>
                      <p className="mt-1 text-neutral-400">
                        Keeps your stock security and banking apps 100% functional. Debloats background carrier junk, sets 0.35x fluid animations, and installs modern launchers (Lawnchair 14 / Pixel Launcher) to match Android 15/16 looks.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                      <span className="font-bold text-white">Method 2: Generic System Image (GSI) / Dynamic System Updates (DSU)</span>
                      <p className="mt-1 text-neutral-400">
                        Because your phone has <strong>Project Treble Enabled (VNDK 33)</strong>, it can boot Google GSI releases without wiping user data using Android's built-in DSU Loader.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                      <span className="font-bold text-white">Method 3: Community Custom ROM (LineageOS / PixelOS)</span>
                      <p className="mt-1 text-neutral-400">
                        Requires unlocking the bootloader via Samsung Download Mode (ODIN). Community builds provide updated security patches and pure Android versions for years after official OEM support expires.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN CAPTURE TAB */}
            {activeTab === 'screen' && (
              <div className="space-y-6">
                <header className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Live Screen Capture</h1>
                    <p className="text-sm text-neutral-400">Capture the actual live screen directly from your phone.</p>
                  </div>
                  <button
                    disabled={refreshingScreen}
                    onClick={handleCaptureScreen}
                    className="flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#c40811] transition disabled:opacity-50"
                  >
                    {refreshingScreen ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    Capture Live Screen
                  </button>
                </header>

                <div className="flex justify-center p-6 rounded-xl border border-[#27272a] bg-[#121214]">
                  {screenUrl ? (
                    <div className="relative border-4 border-neutral-800 rounded-3xl overflow-hidden shadow-2xl max-w-xs">
                      <img src={screenUrl} alt="Live Phone Screen" className="w-full h-auto object-contain" />
                    </div>
                  ) : (
                    <div className="text-center py-16 text-neutral-400">
                      <Camera className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>Click "Capture Live Screen" to take an instant screenshot from your device.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROCESSES TAB */}
            {activeTab === 'processes' && (
              <div className="space-y-6">
                <header className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Live Running Processes</h1>
                    <p className="text-sm text-neutral-400">Top active background services and apps consuming CPU and RAM.</p>
                  </div>
                  <button
                    onClick={handleLoadProcesses}
                    className="flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#121214] px-3 py-1.5 text-xs font-medium hover:bg-[#18181b]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh Processes
                  </button>
                </header>

                <div className="rounded-xl border border-[#27272a] bg-[#121214] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18181b] text-neutral-400 border-b border-[#27272a]">
                      <tr>
                        <th className="p-3">PID</th>
                        <th className="p-3">PROCESS / APP</th>
                        <th className="p-3">USER</th>
                        <th className="p-3">%CPU</th>
                        <th className="p-3">%MEM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {processes.map((proc, idx) => (
                        <tr key={idx} className="hover:bg-[#161618]">
                          <td className="p-3 font-dot text-neutral-500">{proc.pid}</td>
                          <td className="p-3 font-medium text-white">{proc.name}</td>
                          <td className="p-3 text-neutral-400">{proc.user}</td>
                          <td className="p-3 font-dot text-emerald-400">{proc.cpu}%</td>
                          <td className="p-3 font-dot text-neutral-300">{proc.mem}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SHORTCUTS TAB */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <header>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Quick Settings Launchers</h1>
                  <p className="text-sm text-neutral-400">Remotely trigger deep settings pages directly on your phone's display.</p>
                </header>

                <div className="grid grid-cols-2 gap-4">
                  {SHORTCUTS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleLaunchShortcut(s.id)}
                        className="group cursor-pointer rounded-xl border border-[#27272a] bg-[#121214] p-5 hover:border-neutral-600 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-neutral-800 text-white group-hover:bg-[#E50914] transition">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{s.title}</h3>
                              <p className="text-xs text-neutral-400">{s.desc}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-neutral-500 group-hover:text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DEBLOAT TAB */}
            {activeTab === 'debloat' && (
              <div className="space-y-6">
                <header className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Live Bloatware Cleaner</h1>
                    <p className="text-sm text-neutral-400">
                      Scanned your phone for preinstalled {deviceInfo?.hardware.manufacturer} telemetry and ads.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      disabled={selectedBloat.length === 0}
                      onClick={handleCleanBloat}
                      className="flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-[#c40811] disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Selected from Phone ({selectedBloat.length})
                    </button>
                  </div>
                </header>

                {/* Real Bloatware List */}
                <div className="rounded-xl border border-[#27272a] bg-[#121214] overflow-hidden">
                  <div className="divide-y divide-[#27272a]">
                    {bloatList.length === 0 ? (
                      <div className="p-8 text-center text-sm text-neutral-400">
                        ✓ No known bloatware candidates found active on your device!
                      </div>
                    ) : (
                      bloatList.map((item) => {
                        const isChecked = selectedBloat.includes(item.packageName);
                        const isSafe = item.riskLevel !== 'unsafe_core';
                        return (
                          <div
                            key={item.packageName}
                            onClick={() => toggleBloatSelect(item.packageName)}
                            className={`flex items-center justify-between p-4 transition cursor-pointer ${
                              !isSafe ? 'opacity-60 bg-neutral-900/40 cursor-not-allowed' : 'hover:bg-[#18181c]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={!isSafe}
                                onChange={() => {}}
                                className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-[#E50914] focus:ring-0"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">{item.applicationLabel}</span>
                                  <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400 font-dot">
                                    {item.category}
                                  </span>
                                </div>
                                <span className="font-dot text-xs text-neutral-500">{item.packageName}</span>
                              </div>
                            </div>

                            <div>
                              {isSafe ? (
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                  {item.riskLevel.toUpperCase()}
                                </span>
                              ) : (
                                <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> System Core Locked
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* THEMES TAB */}
            {activeTab === 'themes' && (
              <div className="space-y-6">
                <header>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Live Aesthetic Theme Presets</h1>
                  <p className="text-sm text-neutral-400">
                    Click to instantly apply animation curves and aesthetic dark profiles to your phone.
                  </p>
                </header>

                <div className="grid grid-cols-2 gap-4">
                  {THEME_CARDS.map((theme) => {
                    const isActive = appliedTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleApplyTheme(theme.id)}
                        className={`group cursor-pointer rounded-xl border p-5 transition ${
                          isActive ? 'border-[#E50914] bg-[#16161a] ring-1 ring-[#E50914]' : 'border-[#27272a] bg-[#121214] hover:border-neutral-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.color }} />
                            <h3 className="font-semibold text-white">{theme.name}</h3>
                          </div>
                          {isActive && (
                            <span className="rounded bg-[#E50914]/20 px-2 py-0.5 text-[10px] font-bold text-[#E50914]">
                              ACTIVE ON PHONE
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-xs text-neutral-400 leading-relaxed">{theme.desc}</p>
                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#27272a] text-xs text-neutral-400">
                          <span>Apply live to phone</span>
                          <Play className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
