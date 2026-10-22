import { useEffect, useState } from 'react';
import {
  Heart,
  Download,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { THEMES } from '@/lib/themes';
import { ThemeSelector } from '@/components/ThemeSelector';
import { AuthView } from '@/components/AuthView';
import { DonorDashboard } from '@/components/DonorDashboard';
import { NGODashboard } from '@/components/NGODashboard';
import { ImpactDashboard } from '@/components/ImpactDashboard';

const THEME_STORAGE_KEY = 'caredrop-theme';

function AppContent() {
  const { session, profile, loading, signOut, updateRole } = useAuth();
  const [view, setView] = useState<'dashboard' | 'impact'>('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [themeId, setThemeId] = useState('green');
  const theme = THEMES[themeId];

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES[saved]) setThemeId(saved);
  }, []);

  // Save theme changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, [themeId]);

  // Splash timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void> });
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    }
  };

  const handleSwitchRole = async () => {
    if (!profile) return;
    await updateRole(profile.role === 'donor' ? 'ngo' : 'donor');
    setView('dashboard');
  };

  if (showSplash) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${theme.gradient} fixed inset-0 z-[100] transition-colors duration-500`}
      >
        <div className="flex flex-col items-center animate-pulse">
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl mb-6 shadow-black/10">
            <Heart className={`w-20 h-20 ${theme.textPrimary}`} fill="currentColor" />
          </div>
          <h1 className="text-6xl sm:text-7xl font-extrabold text-white tracking-tight mb-3 drop-shadow-lg">
            CareDrop
          </h1>
          <p
            className={`${theme.textLight} text-lg sm:text-xl font-bold tracking-widest uppercase opacity-90`}
          >
            Digital Logistics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${theme.bgSoft} to-slate-100 transition-colors duration-500`}
      >
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className={`w-12 h-12 ${theme.textPrimary} animate-spin`} />
          <h2 className={`text-2xl font-semibold ${theme.textDark} tracking-wider`}>Loading CareDrop</h2>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthView theme={theme} themeId={themeId} setThemeId={setThemeId} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex flex-col transition-colors duration-500">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setView('dashboard')}
            >
              <div
                className={`bg-gradient-to-br ${theme.gradient} p-2.5 rounded-2xl shadow-lg ${theme.shadow} group-hover:scale-105 transition-transform duration-300`}
              >
                <Heart className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <span
                className={`text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${theme.textGradient} tracking-tight`}
              >
                CareDrop
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  view === 'dashboard' ? theme.activeTab : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('impact')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  view === 'impact' ? theme.activeTab : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Impact
              </button>

              <div className="hidden md:flex items-center space-x-4 pl-6 ml-2 border-l border-slate-200">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-bold text-slate-900">{profile.name}</span>
                  <span
                    className={`text-xs font-medium ${theme.textPrimary} uppercase tracking-wider`}
                  >
                    {profile.role}
                  </span>
                </div>

                {deferredPrompt && (
                  <button
                    onClick={handleInstallApp}
                    title="Install App"
                    className={`px-3 py-2 rounded-xl ${theme.bgSoft} ${theme.textPrimary} ${theme.hoverBgLight} transition-colors flex items-center shadow-sm`}
                  >
                    <Download className="w-5 h-5" />
                    <span className="ml-2 text-sm font-bold hidden lg:inline-block">Install App</span>
                  </button>
                )}

                <ThemeSelector activeThemeId={themeId} setThemeId={setThemeId} />

                <button
                  onClick={handleSwitchRole}
                  title="Switch Role"
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-500">
        {view === 'impact' ? (
          <ImpactDashboard theme={theme} />
        ) : profile.role === 'donor' ? (
          <DonorDashboard theme={theme} />
        ) : (
          <NGODashboard theme={theme} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
