import React, { useState, useEffect } from 'react';
import { CurrentUser, ViewState } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { InstallGuideModal } from './components/InstallGuideModal';
import { LoadingScreen } from './components/LoadingScreen';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { RoleManagementView } from './views/RoleManagementView';
import { ModalStokView } from './views/ModalStokView';
import { SteamSortirView } from './views/SteamSortirView';
import { AdminShopeeView } from './views/AdminShopeeView';
import { KehadiranView } from './views/KehadiranView';
import { PenjualanView } from './views/PenjualanView';
import { ReturnView } from './views/ReturnView';
import { IklanKoinView } from './views/IklanKoinView';
import { GajiView } from './views/GajiView';
import { LabaRugiView } from './views/LabaRugiView';
import { CashflowView } from './views/CashflowView';
import { LabaBersihView } from './views/LabaBersihView';
import { IndexPerformaView } from './views/IndexPerformaView';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Initialize store and session with smooth loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      const user = StorageService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setCurrentView('dashboard');
      }
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleNotify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastState = {
      id: Date.now() + Math.random(),
      message,
      type,
    };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLoginSuccess = (user: CurrentUser) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentUser(user);
      setCurrentView('dashboard');
      setIsLoading(false);
    }, 400);
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      StorageService.setCurrentUser(null);
      setCurrentUser(null);
      setCurrentView('login');
      setIsLoading(false);
    }, 300);
  };

  const handleNavigate = (view: ViewState) => {
    if (view === currentView) return;
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        setIsNavigating(false);
      }, 150);
    }, 200);
  };

  // Loading Screen (Requirement 10)
  if (isLoading) {
    return <LoadingScreen storeName={currentUser?.storeName} />;
  }

  // If not logged in, render LoginView
  if (!currentUser || currentView === 'login') {
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
    <div className="min-h-screen bg-[#0b0c10] text-[#f4f4f6] flex flex-col font-sans selection:bg-[#FE2C55] selection:text-white relative">
      {/* Page Navigation Loading Overlay / Progress Bar */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 bg-[#0b0c10]/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-[#161823] border border-white/20 flex items-center justify-center shadow-2xl relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] opacity-50 animate-pulse blur-xs" />
            <div className="w-6 h-6 border-2 border-[#25F4EE] border-t-transparent rounded-full animate-spin relative z-10" />
          </div>
          <p className="mt-3 text-xs font-bold text-zinc-300 tracking-wider">
            Memuat Halaman...
          </p>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenInstallGuide={() => setShowInstallGuide(true)}
        onNotify={handleNotify}
      />

      {/* Main Content Area */}
      <main className={`flex-1 pb-16 transition-opacity duration-200 ${isNavigating ? 'opacity-30' : 'opacity-100'}`}>
        {currentView === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenInstallGuide={() => setShowInstallGuide(true)}
          />
        )}

        {currentView === 'role_management' && (
          <RoleManagementView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'modal_stok' && (
          <ModalStokView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'steam_sortir' && (
          <SteamSortirView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'admin_shopee' && (
          <AdminShopeeView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'kehadiran' && (
          <KehadiranView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'penjualan' && (
          <PenjualanView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'return' && (
          <ReturnView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'iklan_koin' && (
          <IklanKoinView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'gaji' && (
          <GajiView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'laba_rugi' && (
          <LabaRugiView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'cashflow' && (
          <CashflowView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onNotify={handleNotify}
          />
        )}

        {currentView === 'laba_bersih' && (
          <LabaBersihView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'index_performa' && (
          <IndexPerformaView
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
          />
        )}
      </main>

      {/* Floating Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
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
      <footer className="border-t border-white/10 bg-[#161823]/80 py-4 text-center text-xs text-zinc-400">
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
    </div>
  );
}
