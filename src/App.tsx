import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { CurrentUser, ViewState } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { BreadcrumbBar } from './components/BreadcrumbBar';
import { InstallGuideModal } from './components/InstallGuideModal';
import { LoadingScreen } from './components/LoadingScreen';
import { ProcessingModal } from './components/ProcessingModal';
import { AppLogo } from './components/AppLogo';
import { SoundFx } from './services/soundFx';
import { CheckCircle2, AlertCircle, Info, X, Bot, Volume2 } from 'lucide-react';
import { 
  RoutePath, 
  normalizePath, 
  isRouteAllowed, 
  viewStateToPath 
} from './services/navigation';

// Primary Views (Loaded Immediately)
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';

// Secondary Feature Views (Code-Split via React.lazy for Fast Startup and Low RAM usage)
const CategoryPageView = lazy(() => import('./views/CategoryPageView').then(m => ({ default: m.CategoryPageView })));
const RoleManagementView = lazy(() => import('./views/RoleManagementView').then(m => ({ default: m.RoleManagementView })));
const ModalStokView = lazy(() => import('./views/ModalStokView').then(m => ({ default: m.ModalStokView })));
const SteamSortirView = lazy(() => import('./views/SteamSortirView').then(m => ({ default: m.SteamSortirView })));
const AdminShopeeView = lazy(() => import('./views/AdminShopeeView').then(m => ({ default: m.AdminShopeeView })));
const KehadiranView = lazy(() => import('./views/KehadiranView').then(m => ({ default: m.KehadiranView })));
const PenjualanView = lazy(() => import('./views/PenjualanView').then(m => ({ default: m.PenjualanView })));
const ReturnView = lazy(() => import('./views/ReturnView').then(m => ({ default: m.ReturnView })));
const GajiView = lazy(() => import('./views/GajiView').then(m => ({ default: m.GajiView })));
const LabaRugiView = lazy(() => import('./views/LabaRugiView').then(m => ({ default: m.LabaRugiView })));
const CashflowView = lazy(() => import('./views/CashflowView').then(m => ({ default: m.CashflowView })));
const LabaBersihView = lazy(() => import('./views/LabaBersihView').then(m => ({ default: m.LabaBersihView })));
const IndexPerformaView = lazy(() => import('./views/IndexPerformaView').then(m => ({ default: m.IndexPerformaView })));
const StatistikView = lazy(() => import('./views/StatistikView').then(m => ({ default: m.StatistikView })));
const PersonalFinanceView = lazy(() => import('./views/PersonalFinanceView').then(m => ({ default: m.PersonalFinanceView })));
const KalkulasiPaketView = lazy(() => import('./views/KalkulasiPaketView').then(m => ({ default: m.KalkulasiPaketView })));
const TopupSaldoHubView = lazy(() => import('./views/TopupSaldoHubView').then(m => ({ default: m.TopupSaldoHubView })));
const TopupSaldoInputView = lazy(() => import('./views/TopupSaldoInputView').then(m => ({ default: m.TopupSaldoInputView })));
const TopupSaldoRiwayatView = lazy(() => import('./views/TopupSaldoRiwayatView').then(m => ({ default: m.TopupSaldoRiwayatView })));
const LiveChatView = lazy(() => import('./views/LiveChatView').then(m => ({ default: m.LiveChatView })));
const PengumumanView = lazy(() => import('./views/PengumumanView').then(m => ({ default: m.PengumumanView })));

import { ProfileModal } from './components/ProfileModal';
import { FloatingAssistiveNav } from './components/FloatingAssistiveNav';

// Lightweight View Suspense Fallback
const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="relative w-10 h-10 flex items-center justify-center mb-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#25F4EE]/20 border-t-[#25F4EE] animate-spin" />
      <div className="absolute w-5 h-5 rounded-full border-2 border-[#FE2C55]/20 border-b-[#FE2C55] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
    </div>
    <span className="text-[11px] font-mono text-zinc-400 tracking-wider">MEMUAT MODUL...</span>
  </div>
);

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RoutePath>('/dashboard');
  const [topupEditId, setTopupEditId] = useState<string | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [robotBanner, setRobotBanner] = useState<{ text: string; name: string } | null>(null);

  // Helper toast notification
  const handleNotify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastState = {
      id: Date.now() + Math.random(),
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Instant & Fluid Navigation Handler without blocking lag
  const handleNavigate = useCallback(
    (target: RoutePath | ViewState | string, editId?: string) => {
      // Resolve path
      let resolvedPath: RoutePath;
      if (typeof target === 'string' && target.startsWith('/')) {
        resolvedPath = normalizePath(target);
      } else {
        resolvedPath = viewStateToPath(target as ViewState);
      }

      // Check permission if user is logged in
      if (currentUser && !isRouteAllowed(resolvedPath, currentUser)) {
        handleNotify('Akses menu ini dibatasi untuk peran Anda.', 'error');
        return;
      }

      if (editId) {
        setTopupEditId(editId);
      } else if (resolvedPath !== '/topup-saldo/input') {
        setTopupEditId(null);
      }

      // Update browser history
      if (window.location.pathname !== resolvedPath) {
        window.history.pushState({}, '', resolvedPath);
      }

      setCurrentRoute(resolvedPath);
      window.scrollTo({ top: 0, behavior: 'instant' });
    },
    [currentUser, handleNotify]
  );

  // Initialize store, session & URL route on mount with automatic time machine warp audio
  useEffect(() => {
    // 1. Initialize global tactile robot click sounds on buttons
    SoundFx.initGlobalButtonSound();

    // 2. Play sound like entering time machine automatically upon opening app
    SoundFx.playTimeMachineWarp();

    // 3. Crisp, responsive initial boot
    const timer = setTimeout(() => {
      const user = StorageService.getCurrentUser();
      const initialPath = normalizePath(window.location.pathname);

      if (user) {
        setCurrentUser(user);
        if (isRouteAllowed(initialPath, user)) {
          setCurrentRoute(initialPath);
          window.history.replaceState({}, '', initialPath);
        } else {
          setCurrentRoute('/dashboard');
          window.history.replaceState({}, '', '/dashboard');
        }
        // Robot welcome voice greeting in English with user name
        const targetName = user.name || user.username || user.storeName || 'Seller';
        setTimeout(() => {
          SoundFx.playRobotVoiceWelcome(targetName);
          setRobotBanner({
            name: targetName,
            text: `Welcome to Seller Profit, ${targetName}! Please enjoy your sale.`
          });
        }, 200);
      } else {
        setCurrentRoute('/dashboard');
      }
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Listen to browser Back and Forward button events (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = normalizePath(window.location.pathname);
      if (currentUser && !isRouteAllowed(path, currentUser)) {
        handleNotify('Akses menu ini dibatasi untuk peran Anda.', 'error');
        setCurrentRoute('/dashboard');
        window.history.replaceState({}, '', '/dashboard');
      } else {
        setCurrentRoute(path);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, handleNotify]);

  const handleLoginSuccess = (user: CurrentUser) => {
    SoundFx.unlockAudio();
    setIsLoading(true);
    SoundFx.playTimeMachineWarp();

    setTimeout(() => {
      setCurrentUser(user);
      const currentUrlPath = normalizePath(window.location.pathname);
      const destination = isRouteAllowed(currentUrlPath, user) ? currentUrlPath : '/dashboard';
      setCurrentRoute(destination);
      window.history.replaceState({}, '', destination);
      SoundFx.stopLoadingAudio();
      setIsLoading(false);

      // Robot welcome voice greeting with user name in English
      const targetName = user.name || user.username || user.storeName || 'Seller';
      setTimeout(() => {
        SoundFx.playRobotVoiceWelcome(targetName);
        setRobotBanner({
          name: targetName,
          text: `Welcome to Seller Profit, ${targetName}! Please enjoy your sale.`
        });
      }, 250);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      StorageService.setCurrentUser(null);
      setCurrentUser(null);
      window.history.replaceState({}, '', '/dashboard');
      setIsLoading(false);
    }, 250);
  };

  // Loading Screen (automated sound, fast & responsive)
  if (isLoading) {
    return <LoadingScreen storeName={currentUser?.storeName} durationMs={1200} />;
  }

  // If not logged in, render LoginView
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onOpenInstallGuide={() => setShowInstallGuide(true)}
          onNotify={handleNotify}
        />
        <InstallGuideModal
          isOpen={showInstallGuide}
          onClose={() => setShowInstallGuide(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-futuristic-cyber text-[#f4f4f6] flex flex-col font-sans selection:bg-[#FE2C55] selection:text-white relative overflow-x-hidden">
      {/* Ambient Futuristic Background Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#25F4EE]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-[#FE2C55]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header & Navbar */}
      <Navbar
        currentUser={currentUser}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenInstallGuide={() => setShowInstallGuide(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onNotify={handleNotify}
      />

      {/* Breadcrumb Navigation Bar */}
      <BreadcrumbBar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
      />

      {/* Sci-Fi Robot Voice Transmission Banner */}
      {robotBanner && (
        <div className="w-full bg-gradient-to-r from-[#25F4EE]/15 via-[#161823] to-[#FE2C55]/15 border-b border-[#25F4EE]/40 px-4 py-2 text-xs transition-all animate-fadeIn relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded-lg bg-[#25F4EE]/20 border border-[#25F4EE]/50 text-[#25F4EE] flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#25F4EE] uppercase flex-shrink-0">
                  ROBOT AI VOICE
                </span>
                <span className="font-semibold text-xs text-white truncate">
                  "{robotBanner.text}"
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  SoundFx.unlockAudio();
                  SoundFx.playRobotVoiceWelcome(robotBanner.name);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#25F4EE]/20 hover:bg-[#25F4EE]/30 border border-[#25F4EE]/50 text-[#25F4EE] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                title="Putar Ulang Suara Sambutan Robot"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Putar Ulang</span>
              </button>
              <button
                type="button"
                onClick={() => setRobotBanner(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white transition cursor-pointer"
                title="Tutup Banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        <Suspense fallback={<ModuleLoader />}>
          {/* 1. Dashboard Utama */}
        {currentRoute === '/dashboard' && (
          <DashboardView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenInstallGuide={() => setShowInstallGuide(true)}
            onNotify={handleNotify}
          />
        )}

        {/* 2. Halaman Kategori Utama */}
        {currentRoute === '/persiapan' && (
          <CategoryPageView
            categoryKey="persiapan"
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/penjualan' && (
          <CategoryPageView
            categoryKey="penjualan"
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/keuangan' && (
          <CategoryPageView
            categoryKey="keuangan"
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/informasi' && (
          <CategoryPageView
            categoryKey="informasi"
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}

        {/* 3. Halaman Fitur: PERSIAPAN */}
        {currentRoute === '/persiapan/manajemen-pegawai' && (
          <RoleManagementView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/persiapan')}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/persiapan/modal-stok' && (
          <ModalStokView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/persiapan')}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/persiapan/sortir-qc' && (
          <SteamSortirView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/persiapan')}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/persiapan/biaya-admin' && (
          <AdminShopeeView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/persiapan')}
            onNotify={handleNotify}
          />
        )}

        {/* TOP UP SALDO: HUB, INPUT & RIWAYAT (Halaman Khusus) */}
        {currentRoute === '/topup-saldo' && (
          <TopupSaldoHubView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/topup-saldo/input' && (
          <TopupSaldoInputView
            currentUser={currentUser}
            editId={topupEditId}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/topup-saldo/riwayat' && (
          <TopupSaldoRiwayatView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}

        {/* 4. Halaman Fitur: PENJUALAN */}
        {currentRoute === '/penjualan/kehadiran' && (
          <KehadiranView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/penjualan')}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/penjualan/transaksi' && (
          <PenjualanView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/penjualan')}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/penjualan/statistik' && (
          <StatistikView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/penjualan')}
          />
        )}

        {currentRoute === '/penjualan/retur' && (
          <ReturnView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/penjualan')}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/penjualan/laba-rugi' && (
          <LabaRugiView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/penjualan')}
          />
        )}

        {currentRoute === '/penjualan/performa' && (
          <IndexPerformaView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/penjualan')}
          />
        )}

        {currentRoute === '/penjualan/kalkulasi-paket' && (
          <KalkulasiPaketView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/penjualan')}
            onNotify={handleNotify}
          />
        )}

        {/* 5. Halaman Fitur: KEUANGAN */}
        {currentRoute === '/keuangan/gaji' && (
          <GajiView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/keuangan')}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/keuangan/cashflow' && (
          <CashflowView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/keuangan')}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/keuangan/laba-bersih' && (
          <LabaBersihView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/keuangan')}
          />
        )}

        {currentRoute === '/keuangan/pribadi' && (
          <PersonalFinanceView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('/keuangan')}
            onNotify={handleNotify}
          />
        )}

        {/* 6. Halaman Fitur: INFORMASI */}
        {currentRoute === '/informasi/pengumuman' && (
          <PengumumanView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}

        {currentRoute === '/informasi/live-chat' && (
          <LiveChatView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}
        </Suspense>
      </main>

      {/* iPhone Style Floating Assistive Navigation Shortcuts */}
      <FloatingAssistiveNav
        currentRoute={currentRoute}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* User Profile Modal (Foto, WhatsApp, Bio) */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onProfileUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
        onNotify={handleNotify}
      />

      {/* Floating Toast Container (z-[10000] per Arc'teryx Toast Layer) */}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-[#161823] text-white border-[#25F4EE]/40'
                : toast.type === 'error'
                ? 'bg-[#161823] text-[#FE2C55] border-[#FE2C55]/40'
                : 'bg-[#161823] text-white border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-[#25F4EE] shrink-0" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-[#FE2C55] shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-[#25F4EE] shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="spatial-footer border-t border-white/10 bg-[#161823]/80 backdrop-blur-xl py-4 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-white">Seller Profit</strong> • Akuntansi Penjualan Live &amp; Manajemen Toko
          </div>
          <div className="text-[11px] text-zinc-500">
            {currentUser.storeName}
          </div>
        </div>
      </footer>

      {/* PWA Install Guide Modal */}
      <InstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />

      {/* Futuristic Global Processing HUD Popup */}
      <ProcessingModal />
    </div>
  );
}
