import React, { useState, useEffect, useCallback } from 'react';
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

// Category Page
import { CategoryPageView } from './views/CategoryPageView';

// Feature Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { RoleManagementView } from './views/RoleManagementView';
import { ModalStokView } from './views/ModalStokView';
import { SteamSortirView } from './views/SteamSortirView';
import { AdminShopeeView } from './views/AdminShopeeView';
import { KehadiranView } from './views/KehadiranView';
import { PenjualanView } from './views/PenjualanView';
import { ReturnView } from './views/ReturnView';
import { GajiView } from './views/GajiView';
import { LabaRugiView } from './views/LabaRugiView';
import { CashflowView } from './views/CashflowView';
import { LabaBersihView } from './views/LabaBersihView';
import { IndexPerformaView } from './views/IndexPerformaView';
import { StatistikView } from './views/StatistikView';
import { PersonalFinanceView } from './views/PersonalFinanceView';
import { KalkulasiPaketView } from './views/KalkulasiPaketView';

// Top Up Saldo Specialized Views
import { TopupSaldoHubView } from './views/TopupSaldoHubView';
import { TopupSaldoInputView } from './views/TopupSaldoInputView';
import { TopupSaldoRiwayatView } from './views/TopupSaldoRiwayatView';
import { LiveChatView } from './views/LiveChatView';

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
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
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

  // Centralized Navigation Handler
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

      setIsNavigating(true);
      setCurrentRoute(resolvedPath);
      window.scrollTo({ top: 0, behavior: 'instant' });

      setTimeout(() => {
        setIsNavigating(false);
      }, 1000);
    },
    [currentUser, handleNotify]
  );

  // Initialize store, session & URL route on mount with time machine warp audio
  useEffect(() => {
    // 1. Initialize global tactile robot click sounds on all buttons
    SoundFx.initGlobalButtonSound();

    // 2. Play sound like entering time machine upon opening app
    SoundFx.playTimeMachineWarp();

    // 3. Opening loading takes 4.5 seconds (4-5 seconds as requested)
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
        }, 300);
      } else {
        setCurrentRoute('/dashboard');
      }
      setIsLoading(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  // Listen to browser Back and Forward button events (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = normalizePath(window.location.pathname);
      setIsNavigating(true);
      if (currentUser && !isRouteAllowed(path, currentUser)) {
        handleNotify('Akses menu ini dibatasi untuk peran Anda.', 'error');
        setCurrentRoute('/dashboard');
        window.history.replaceState({}, '', '/dashboard');
      } else {
        setCurrentRoute(path);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        setIsNavigating(false);
      }, 1000);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, handleNotify]);

  const handleLoginSuccess = (user: CurrentUser) => {
    // Immediate audio unlock on user click gesture
    SoundFx.unlockAudio();
    setIsLoading(true);
    // Play time machine warp sound during login transition
    SoundFx.playTimeMachineWarp();

    // Login loading duration 4.5 seconds (4-5 seconds as requested)
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
      }, 350);
    }, 4500);
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      StorageService.setCurrentUser(null);
      setCurrentUser(null);
      window.history.replaceState({}, '', '/dashboard');
      setIsLoading(false);
    }, 300);
  };

  // Loading Screen (Item 2 & Item 4 - 4.5s duration)
  if (isLoading) {
    return <LoadingScreen storeName={currentUser?.storeName} durationMs={4500} />;
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

      {/* Page Navigation Transition Screen with App Logo (~1s) */}
      {isNavigating && (
        <div className="fixed inset-0 z-[99999] bg-[#0b0c10] flex flex-col items-center justify-center transition-all animate-fadeIn select-none cursor-wait">
          {/* Neon Glow Ambient */}
          <div className="absolute w-60 h-60 rounded-full bg-[#FE2C55]/20 blur-3xl pointer-events-none -translate-x-1/4" />
          <div className="absolute w-60 h-60 rounded-full bg-[#25F4EE]/20 blur-3xl pointer-events-none translate-x-1/4" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            {/* App Logo with animated rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-2.5 rounded-3xl border-2 border-[#25F4EE]/60 animate-ping opacity-60 pointer-events-none" style={{ animationDuration: '1.4s' }} />
              <div className="absolute -inset-1 rounded-2xl border-2 border-[#FE2C55]/60 animate-spin opacity-80 pointer-events-none" style={{ animationDuration: '2s' }} />
              <div className="relative z-10 p-2 rounded-2xl bg-[#161823] border border-white/20 shadow-2xl animate-pulse">
                <AppLogo size="lg" showText={false} />
              </div>
            </div>

            {/* App Brand & Loading indicator */}
            <div className="space-y-1 pt-1">
              <div className="font-black text-sm text-white tracking-wide flex items-center justify-center gap-1">
                <span>Seller</span>
                <span className="bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] bg-clip-text text-transparent">
                  Profit
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25F4EE] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FE2C55] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Navbar */}
      <Navbar
        currentUser={currentUser}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenInstallGuide={() => setShowInstallGuide(true)}
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
      <main className={`flex-1 pb-16 transition-opacity duration-200 ${isNavigating ? 'opacity-30' : 'opacity-100'}`}>
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
        {currentRoute === '/informasi/live-chat' && (
          <LiveChatView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onNotify={handleNotify}
          />
        )}
      </main>

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
