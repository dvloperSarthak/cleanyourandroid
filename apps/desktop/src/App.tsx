import { useState } from 'react';
import {
  Smartphone,
  Zap,
  Trash2,
  Sliders,
  Palette,
  ShieldAlert,
  Battery,
  Terminal,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';

interface MockDevice {
  serial: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  apiLevel: number;
  battery: number;
  batteryStatus: string;
  resolution: string;
  density: number;
  isRooted: boolean;
  state: 'connected' | 'unauthorized' | 'pairing';
}

const SAMPLE_DEVICE: MockDevice = {
  serial: 'RF8N90VKZLM',
  model: 'Galaxy S24 Ultra',
  manufacturer: 'Samsung',
  androidVersion: '14.0',
  apiLevel: 34,
  battery: 89,
  batteryStatus: 'Discharging',
  resolution: '3120x1440',
  density: 560,
  isRooted: false,
  state: 'connected'
};

const SAMPLE_BLOATWARE = [
  { id: '1', name: 'Bixby Voice Assistant', pkg: 'com.samsung.android.bixby.agent', risk: 'safe', category: 'OEM Assistant', removable: true },
  { id: '2', name: 'Facebook Services & Telemetry', pkg: 'com.facebook.services', risk: 'safe', category: 'Meta Telemetry', removable: true },
  { id: '3', name: 'Samsung Gaming Hub', pkg: 'com.samsung.android.game.gamehome', risk: 'safe', category: 'OEM Marketing', removable: true },
  { id: '4', name: 'Meta App Installer', pkg: 'com.facebook.system', risk: 'safe', category: 'Analytics Tracker', removable: true },
  { id: '5', name: 'Samsung Tips Daemon', pkg: 'com.samsung.android.app.tips', risk: 'safe', category: 'OEM Prompt', removable: true },
  { id: '6', name: 'Samsung System UI Core', pkg: 'com.android.systemui', risk: 'unsafe_core', category: 'System Core', removable: false }
];

const THEME_CARDS = [
  { id: 'nothing-os', name: 'Nothing OS Vibe', desc: 'Monochrome glyphs, dot-matrix styling, 0.5x snappy animations', color: '#E50914' },
  { id: 'pixel-material-you', name: 'Pixel Material You', desc: 'Fluid 1.0x expressive physics, rounded shapes, pastel accents', color: '#4285F4' },
  { id: 'samsung-oneui', name: 'One UI Ergonomics', desc: 'Lower-screen thumb reach, dense widgets, 0.75x responsive curves', color: '#0072CE' },
  { id: 'amoled-dark', name: 'Deep AMOLED Stealth', desc: '100% pitch-black OLED background, zero idle subpixel power', color: '#00E676' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'debloat' | 'customize' | 'themes' | 'terminal'>('dashboard');
  const [device] = useState<MockDevice>(SAMPLE_DEVICE);
  const [bloatList, setBloatList] = useState(SAMPLE_BLOATWARE);
  const [selectedBloat, setSelectedBloat] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [animSpeed, setAnimSpeed] = useState<number>(0.5);
  const [dpi, setDpi] = useState<number>(560);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [appliedTheme, setAppliedTheme] = useState<string>('nothing-os');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleBloatSelect = (id: string) => {
    const item = bloatList.find((b) => b.id === id);
    if (!item?.removable) return;
    if (selectedBloat.includes(id)) {
      setSelectedBloat(selectedBloat.filter((bId) => bId !== id));
    } else {
      setSelectedBloat([...selectedBloat, id]);
    }
  };

  const handleCleanBloat = () => {
    const count = selectedBloat.length;
    setBloatList(bloatList.filter((b) => !selectedBloat.includes(b.id)));
    setSelectedBloat([]);
    showToast(`Successfully removed ${count} bloatware packages in user-space!`);
  };

  const handleApplyTheme = (themeId: string) => {
    setAppliedTheme(themeId);
    if (themeId === 'nothing-os') setAnimSpeed(0.5);
    else if (themeId === 'pixel-material-you') setAnimSpeed(1.0);
    else if (themeId === 'samsung-oneui') setAnimSpeed(0.75);
    else if (themeId === 'amoled-dark') setAnimSpeed(0.25);
    showToast(`Applied preset: ${themeId}`);
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
            <span className="block text-[10px] font-dot uppercase text-neutral-400">Toolkit Studio</span>
          </div>
        </div>

        {/* Device Status Card */}
        <div className="mt-4 rounded-xl border border-[#27272a] bg-[#121214] p-3 text-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
            <span className="font-dot text-[10px]">USB ADB</span>
          </div>
          <div className="mt-2 font-medium text-white">{device.model}</div>
          <div className="text-[11px] text-neutral-400">{device.serial}</div>
        </div>

        {/* Nav Items */}
        <nav className="mt-6 flex-1 space-y-1">
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
            onClick={() => setActiveTab('debloat')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'debloat' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            Bloatware Cleaner
            {bloatList.filter((b) => b.removable).length > 0 && (
              <span className="ml-auto rounded-full bg-[#E50914]/20 px-2 py-0.5 text-[10px] font-bold text-[#E50914]">
                {bloatList.filter((b) => b.removable).length}
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
            onClick={() => setActiveTab('customize')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'customize' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Sliders className="h-4 w-4" />
            System Tuning
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'terminal' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:bg-[#151518] hover:text-white'
            }`}
          >
            <Terminal className="h-4 w-4" />
            CLI / Doctor
          </button>
        </nav>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#27272a] text-[11px] text-neutral-500 font-dot">
          CleanYourAndroid v1.0.0
          <span className="block text-neutral-600">Open-Source Apache/MIT</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Device Diagnostics</h1>
                <p className="text-sm text-neutral-400">Inspecting hardware sensors, Android telemetry, and connection status</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => showToast('Diagnostics reloaded')}
                  className="flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#121214] px-3 py-1.5 text-xs font-medium hover:bg-[#18181b]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
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
                <div className="mt-2 text-2xl font-bold text-white">{device.battery}%</div>
                <div className="text-xs text-neutral-500">{device.batteryStatus} • Health Good</div>
              </div>

              <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs uppercase font-dot">Android OS</span>
                  <Smartphone className="h-4 w-4 text-blue-400" />
                </div>
                <div className="mt-2 text-2xl font-bold text-white">v{device.androidVersion}</div>
                <div className="text-xs text-neutral-500">API Level {device.apiLevel}</div>
              </div>

              <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs uppercase font-dot">Display</span>
                  <Sliders className="h-4 w-4 text-purple-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-white">{device.resolution}</div>
                <div className="text-xs text-neutral-500">{device.density} DPI (QHD+ OLED)</div>
              </div>

              <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs uppercase font-dot">Privilege Mode</span>
                  <ShieldAlert className="h-4 w-4 text-[#E50914]" />
                </div>
                <div className="mt-2 text-xl font-bold text-white">Non-Root ADB</div>
                <div className="text-xs text-emerald-400">Safe User-Space Isolation</div>
              </div>
            </div>

            {/* Hardware Profile Card */}
            <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5">
              <h2 className="text-base font-semibold text-white">Device Specifications</h2>
              <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                  <span className="text-neutral-400">Manufacturer</span>
                  <span className="font-medium text-white">{device.manufacturer}</span>
                </div>
                <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                  <span className="text-neutral-400">Device Model</span>
                  <span className="font-medium text-white">{device.model}</span>
                </div>
                <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                  <span className="text-neutral-400">Serial Number</span>
                  <span className="font-dot text-neutral-300">{device.serial}</span>
                </div>
                <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                  <span className="text-neutral-400">Security Patch</span>
                  <span className="font-medium text-neutral-300">November 2026</span>
                </div>
                <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                  <span className="text-neutral-400">Active Theme Preset</span>
                  <span className="font-medium text-[#E50914]">{appliedTheme}</span>
                </div>
                <div className="flex justify-between border-b border-[#27272a]/60 pb-2">
                  <span className="text-neutral-400">Animation Scale</span>
                  <span className="font-medium text-white">{animSpeed}x</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEBLOAT TAB */}
        {activeTab === 'debloat' && (
          <div className="space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Safe Bloatware Debloater</h1>
                <p className="text-sm text-neutral-400">
                  Targeted user-space removal for {device.manufacturer}. Core Android system apps are locked for safety.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  disabled={selectedBloat.length === 0}
                  onClick={handleCleanBloat}
                  className="flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-[#c40811] disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Selected ({selectedBloat.length})
                </button>
              </div>
            </header>

            {/* List */}
            <div className="rounded-xl border border-[#27272a] bg-[#121214] overflow-hidden">
              <div className="divide-y divide-[#27272a]">
                {bloatList.map((item) => {
                  const isChecked = selectedBloat.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleBloatSelect(item.id)}
                      className={`flex items-center justify-between p-4 transition cursor-pointer ${
                        !item.removable ? 'opacity-60 bg-neutral-900/40 cursor-not-allowed' : 'hover:bg-[#18181c]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!item.removable}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-[#E50914] focus:ring-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{item.name}</span>
                            <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400 font-dot">
                              {item.category}
                            </span>
                          </div>
                          <span className="font-dot text-xs text-neutral-500">{item.pkg}</span>
                        </div>
                      </div>

                      <div>
                        {item.removable ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                            Safe to Remove
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Core System Locked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* THEMES TAB */}
        {activeTab === 'themes' && (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-white">Aesthetic Theme Presets</h1>
              <p className="text-sm text-neutral-400">
                Transform device responsiveness, animation pacing, and dark-mode depth with one click.
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
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-neutral-400 leading-relaxed">{theme.desc}</p>
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#27272a] text-xs text-neutral-400">
                      <span>Click to Apply Preset</span>
                      <Play className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CUSTOMIZE TAB */}
        {activeTab === 'customize' && (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-white">System Settings Tuning</h1>
              <p className="text-sm text-neutral-400">Modify animation scales and display density reversibly.</p>
            </header>

            <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5 space-y-6">
              {/* Animation Speed */}
              <div>
                <div className="flex justify-between text-sm">
                  <label className="font-medium text-white">Window & Transition Animation Scale</label>
                  <span className="font-dot text-[#E50914] font-bold">{animSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.25"
                  value={animSpeed}
                  onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                  className="mt-3 w-full accent-[#E50914]"
                />
                <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
                  <span>0.0x (Instant)</span>
                  <span>0.5x (Snappy)</span>
                  <span>1.0x (Default)</span>
                  <span>1.5x (Relaxed)</span>
                </div>
              </div>

              {/* Display Density */}
              <div className="pt-4 border-t border-[#27272a]">
                <div className="flex justify-between text-sm">
                  <label className="font-medium text-white">Display Density (DPI Override)</label>
                  <span className="font-dot text-white">{dpi} DPI</span>
                </div>
                <input
                  type="range"
                  min="320"
                  max="640"
                  step="20"
                  value={dpi}
                  onChange={(e) => setDpi(parseInt(e.target.value, 10))}
                  className="mt-3 w-full accent-[#E50914]"
                />
                <p className="mt-1 text-[11px] text-neutral-500">Safe range clamped between 320 DPI and 640 DPI.</p>
              </div>

              {/* Dark mode */}
              <div className="pt-4 border-t border-[#27272a] flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm">System Dark Theme</div>
                  <div className="text-xs text-neutral-400">Forces system-wide night mode via ADB uimode</div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                    darkMode ? 'bg-[#E50914] text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {darkMode ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="pt-4 border-t border-[#27272a] flex justify-end gap-3">
                <button
                  onClick={() => {
                    setAnimSpeed(1.0);
                    setDpi(560);
                    setDarkMode(true);
                    showToast('Settings reset to device physical defaults');
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-[#27272a] px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-[#18181b]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Defaults
                </button>
                <button
                  onClick={() => showToast('Applied settings to connected device')}
                  className="rounded-lg bg-[#E50914] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#c40811]"
                >
                  Save & Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TERMINAL / DOCTOR TAB */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-white">CLI Companion & Doctor</h1>
              <p className="text-sm text-neutral-400">Run the commands directly from your terminal anytime.</p>
            </header>

            <div className="rounded-xl border border-[#27272a] bg-[#0c0c0e] p-5 font-mono text-xs">
              <div className="flex items-center gap-2 text-neutral-400 mb-4 pb-3 border-b border-[#27272a]">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span>cleanyourandroid terminal runner</span>
              </div>
              <div className="space-y-2 text-neutral-300">
                <div><span className="text-emerald-400">$</span> npx cleanyourandroid doctor</div>
                <div className="text-neutral-500 pl-4">✓ ADB Platform Tools OK (Android Debug Bridge v1.0.41)</div>
                <div className="text-neutral-500 pl-4">✓ Device {device.serial} Authorized</div>
                <div className="mt-3"><span className="text-emerald-400">$</span> npx cleanyourandroid debloat --dry-run</div>
                <div className="text-neutral-500 pl-4">Simulating user-space removal for {device.manufacturer}...</div>
                <div className="mt-3"><span className="text-emerald-400">$</span> npx cleanyourandroid themes --apply nothing-os</div>
                <div className="text-emerald-400 pl-4">✓ Applied Nothing OS aesthetic theme (0.5x animations, AMOLED dark)!</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

