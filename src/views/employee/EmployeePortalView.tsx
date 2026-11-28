import React, { useEffect, useMemo, useState } from 'react';
import {
  AttendanceRecord,
  BallInventory,
  CurrentUser,
  SalesRecord,
  SteamSortirRecord,
  StoreAnnouncement,
} from '../../types';
import { StorageService } from '../../services/storage';
import { resolveCurrentEmployeeProfile } from '../../utils/employeeSalary';
import {
  getEmployeePermissions,
  isOwnEmployeeRecord,
} from '../../utils/employeePermissions';
import {
  formatDateIndo,
  getTodayString,
  roleLabels,
} from '../../utils/formatters';
import {
  EmployeeInputSubTab,
  EmployeeInputViews,
} from './EmployeeInputViews';
import {
  EmployeeDataSubTab,
  EmployeeDataViews,
} from './EmployeeDataViews';
import { EmployeeGajiView } from './EmployeeGajiView';
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  Database,
  Download,
  Home,
  LogOut,
  Megaphone,
  Package,
  PlusCircle,
  RefreshCw,
  Ruler,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react';

type PortalSection = 'home' | 'input' | 'data' | 'gaji';

interface EmployeePortalViewProps {
  currentUser: CurrentUser;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenProfile: () => void;
  onOpenLogout: () => void;
  onOpenInstallGuide?: () => void;
  onOpenUpdateModal?: () => void;
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({
  currentUser,
  onNotify,
  onOpenProfile,
  onOpenLogout,
  onOpenInstallGuide,
  onOpenUpdateModal,
}) => {
  const storeId = currentUser.storeId;
  const todayStr = getTodayString();

  const [section, setSection] = useState<PortalSection>('home');
  const [inputSubTab, setInputSubTab] = useState<EmployeeInputSubTab>('kehadiran');
  const [dataSubTab, setDataSubTab] = useState<EmployeeDataSubTab>('kehadiran');

  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [editingSale, setEditingSale] = useState<SalesRecord | null>(null);
  const [editingInventory, setEditingInventory] = useState<BallInventory | null>(null);
  const [editingMeasurement, setEditingMeasurement] = useState<SteamSortirRecord | null>(null);

  const [announcements, setAnnouncements] = useState<StoreAnnouncement[]>(() =>
    StorageService.getActiveAnnouncements(storeId)
  );

  useEffect(() => {
    const refresh = () => {
      setAnnouncements(StorageService.getActiveAnnouncements(storeId));
    };
    refresh();
    const unsub = StorageService.subscribe(refresh);
    return () => unsub();
  }, [storeId]);

  const employeeProfile = useMemo(
    () => resolveCurrentEmployeeProfile(currentUser),
    [currentUser]
  );

  const permissions = useMemo(
    () => getEmployeePermissions(currentUser),
    [currentUser]
  );

  const roleText = useMemo(() => {
    const roles = currentUser.roles?.length ? currentUser.roles : employeeProfile.roles;
    if (!roles || roles.length === 0) return 'Pegawai Toko';
    return roles.map((r) => roleLabels[r] || r).join(' · ');
  }, [currentUser.roles, employeeProfile.roles]);

  const clearEditing = () => {
    setEditingAttendance(null);
    setEditingSale(null);
    setEditingInventory(null);
    setEditingMeasurement(null);
  };

  const openInputTab = (tab: EmployeeInputSubTab) => {
    if (!permissions.allowedInputTabs.includes(tab)) {
      onNotify('Peran Anda hanya dapat mengakses menu input yang diizinkan.', 'error');
      return;
    }
    clearEditing();
    setInputSubTab(tab);
    setSection('input');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openDataTab = (tab: EmployeeDataSubTab) => {
    setDataSubTab(tab);
    setSection('data');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openGajiSection = () => {
    setSection('gaji');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const latestAnnouncement = announcements[0];

  const inputMenuButtons: {
    key: EmployeeInputSubTab;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
  }[] = [
    {
      key: 'kehadiran',
      title: 'Kehadiran',
      subtitle: 'Absen & jam kerja',
      icon: CalendarCheck,
      accentClass: 'bg-blue-50 text-blue-600',
    },
    {
      key: 'penjualan',
      title: 'Penjualan',
      subtitle: 'Omzet, paket & pcs',
      icon: TrendingUp,
      accentClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'stok',
      title: 'Stok',
      subtitle: 'Stok masuk / ball',
      icon: Package,
      accentClass: 'bg-amber-50 text-amber-600',
    },
    {
      key: 'pengukuran',
      title: 'Pengukuran',
      subtitle: 'Barang diukur & QC',
      icon: Ruler,
      accentClass: 'bg-indigo-50 text-indigo-600',
    },
  ];

  const dataMenuButtons: {
    key: EmployeeDataSubTab;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
  }[] = [
    {
      key: 'kehadiran',
      title: 'Kehadiran',
      subtitle: 'Lihat riwayat absen & jam kerja',
      icon: CalendarCheck,
      accentClass: 'bg-blue-50 text-blue-600',
    },
    {
      key: 'penjualan',
      title: 'Omzet dan Pcs Terjual',
      subtitle: 'Lihat rekap penjualan & bulanan',
      icon: BarChart3,
      accentClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'stok',
      title: 'Stok Masuk, Stok Keluar, Sisa Stok',
      subtitle: 'Lihat jumlah stok masuk, keluar & sisa',
      icon: Package,
      accentClass: 'bg-amber-50 text-amber-600',
    },
    {
      key: 'pengukuran',
      title: 'Total Barang yang Diukur',
      subtitle: 'Lihat total barang diukur, layak & reject',
      icon: Ruler,
      accentClass: 'bg-indigo-50 text-indigo-600',
    },
  ];

  const initials = (currentUser.name || currentUser.username || 'P')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="employee-portal-shell min-h-screen flex flex-col bg-[#F6F8FB] text-slate-900 overflow-x-hidden">
      {/* Top Bar (Clean 3-zone header) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left Zone */}
          <div className="flex items-center gap-2.5 min-w-0">
            {section !== 'home' ? (
              <button
                type="button"
                onClick={() => {
                  clearEditing();
                  setSection('home');
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Beranda</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {currentUser.storeName || 'Ruang Kerja Pegawai'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center Nav (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {(
              [
                { key: 'home', label: 'Beranda' },
                { key: 'input', label: 'Input' },
                { key: 'data', label: 'Data' },
                { key: 'gaji', label: 'Gaji' },
              ] as { key: PortalSection; label: string }[]
            ).map((nav) => {
              const isActive = section === nav.key;
              return (
                <button
                  key={nav.key}
                  type="button"
                  onClick={() => {
                    if (nav.key === 'home') clearEditing();
                    setSection(nav.key);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className={`px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Right Zone */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenUpdateModal && (
              <button
                type="button"
                onClick={onOpenUpdateModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
                title="Cek & Update Aplikasi Terbaru"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Update</span>
              </button>
            )}

            {onOpenInstallGuide && (
              <button
                type="button"
                onClick={onOpenInstallGuide}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition whitespace-nowrap shrink-0 cursor-pointer"
                title="Pasang Aplikasi"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Aplikasi</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-left cursor-pointer max-w-[150px] sm:max-w-[200px]"
              title="Pengaturan Profil"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-800 truncate">
                {currentUser.name || currentUser.username}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-24 md:pb-12">
        {section === 'home' && (
          <div className="space-y-6">
            {/* Compact Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-blue-600">
                  {formatDateIndo(todayStr)}
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Halo, {currentUser.name || currentUser.username}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">{roleText}</p>
            </div>

            {/* Optional Store Announcement */}
            {latestAnnouncement && (
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900">
                    {latestAnnouncement.title}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {latestAnnouncement.content}
                  </p>
                </div>
              </div>
            )}

            {/* 1. INPUT (PALING ATAS — HANYA TAMPILKAN MENU SESUAI ROLE) */}
            <section aria-labelledby="heading-input" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="heading-input" className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Input
                </h2>
                <span className="text-xs text-slate-500">Sesuai akses role Anda</span>
              </div>

              {(() => {
                const visibleInputButtons = inputMenuButtons.filter((b) =>
                  permissions.allowedInputTabs.includes(b.key)
                );
                const gridCols =
                  visibleInputButtons.length === 1
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : visibleInputButtons.length === 2
                    ? 'grid-cols-2'
                    : visibleInputButtons.length === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 lg:grid-cols-4';
                return (
                  <div className={`grid ${gridCols} gap-3`}>
                    {visibleInputButtons.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => openInputTab(item.key)}
                          className="group bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm rounded-2xl p-4 text-left transition cursor-pointer flex flex-col justify-between gap-3.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.accentClass}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <PlusCircle className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition shrink-0" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </section>

            {/* 2. DATA (TOMBOL KLIK MASUK KE PAGE DATA) */}
            <section aria-labelledby="heading-data" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="heading-data" className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Data
                </h2>
                <span className="text-xs text-slate-500">Klik untuk buka halaman data</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dataMenuButtons.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => openDataTab(item.key)}
                      className="group bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm rounded-2xl px-4 py-3.5 text-left transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.accentClass}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. GAJI (TOMBOL KLIK MASUK KE PAGE GAJI) */}
            <section aria-labelledby="heading-gaji" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="heading-gaji" className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Gaji
                </h2>
                <span className="text-xs text-slate-500">Klik untuk buka rincian gaji</span>
              </div>

              <button
                type="button"
                onClick={openGajiSection}
                className="group w-full bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm rounded-2xl px-4 py-4 text-left transition cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      Tampilan Total Gaji
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Buka halaman untuk melihat total gaji, insentif, dan status pembayaran Anda
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 whitespace-nowrap shrink-0">
                  <span className="hidden sm:inline">Buka</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            </section>
          </div>
        )}

        {section === 'input' && (
          <EmployeeInputViews
            activeSubTab={inputSubTab}
            onChangeSubTab={(tab) => {
              clearEditing();
              setInputSubTab(tab);
            }}
            currentUser={currentUser}
            onNotify={onNotify}
            onDoneNavigateToData={(dataTab) => {
              clearEditing();
              openDataTab(dataTab);
            }}
            editingAttendance={editingAttendance}
            editingSale={editingSale}
            editingInventory={editingInventory}
            editingMeasurement={editingMeasurement}
            onClearEditing={clearEditing}
          />
        )}

        {section === 'data' && (
          <EmployeeDataViews
            activeSubTab={dataSubTab}
            onChangeSubTab={setDataSubTab}
            currentUser={currentUser}
            onNotify={onNotify}
            onGoToInput={(tab) => openInputTab(tab)}
            onEditAttendance={(att) => {
              if (
                permissions.canOnlySelfAttendance &&
                !isOwnEmployeeRecord(currentUser, employeeProfile, att.employeeId, att.employeeName)
              ) {
                onNotify('Kehadiran hanya dapat diubah untuk data milik Anda sendiri.', 'error');
                return;
              }
              clearEditing();
              setEditingAttendance(att);
              setInputSubTab('kehadiran');
              setSection('input');
            }}
            onEditSale={(sale) => {
              if (!permissions.canEditSales) {
                onNotify('Hanya Admin yang dapat mengubah data penjualan.', 'error');
                return;
              }
              clearEditing();
              setEditingSale(sale);
              setInputSubTab('penjualan');
              setSection('input');
            }}
            onEditInventory={(inv) => {
              if (!permissions.canEditStock) {
                onNotify('Hanya bagian Sortir & Ukur yang dapat mengubah data stok.', 'error');
                return;
              }
              clearEditing();
              setEditingInventory(inv);
              setInputSubTab('stok');
              setSection('input');
            }}
            onEditMeasurement={(rec) => {
              if (!permissions.canEditMeasurement) {
                onNotify('Hanya bagian Sortir & Ukur yang dapat mengubah data pengukuran.', 'error');
                return;
              }
              clearEditing();
              setEditingMeasurement(rec);
              setInputSubTab('pengukuran');
              setSection('input');
            }}
          />
        )}

        {section === 'gaji' && <EmployeeGajiView currentUser={currentUser} />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Navigasi Utama Pegawai"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white border-t border-slate-200 grid grid-cols-4"
      >
        {(
          [
            { key: 'home', label: 'Beranda', icon: Home },
            { key: 'input', label: 'Input', icon: PlusCircle },
            { key: 'data', label: 'Data', icon: Database },
            { key: 'gaji', label: 'Gaji', icon: Wallet },
          ] as {
            key: PortalSection;
            label: string;
            icon: React.ComponentType<{ className?: string }>;
          }[]
        ).map((item) => {
          const Icon = item.icon;
          const isActive = section === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.key === 'home') clearEditing();
                setSection(item.key);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition cursor-pointer ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
