import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Employee, UserRole, SalaryType, IncentiveType, CurrentUser, IncentiveConfig, TierCalculationMode } from '../types';
import { formatRupiah, formatNumber, roleLabels, roleBadgeColors } from '../utils/formatters';
import { CommaNumberInput } from '../components/CommaNumberInput';
import { ViewSubNav, SubTabType } from '../components/ViewSubNav';
import { 
  Users, 
  Trash2, 
  Edit3, 
  Check, 
  KeyRound, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  ChevronRight,
  UserPlus,
  Search, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface RoleManagementViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ALL_ROLES: UserRole[] = ['owner', 'host', 'admin_toko', 'sortir', 'steam'];

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formStep, setFormStep] = useState<number>(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialUsername, setInitialUsername] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['host']);
  const [salaryType, setSalaryType] = useState<SalaryType>('hourly');
  const [salaryRate, setSalaryRate] = useState<number>(30000);

  // Incentive configs mapped per role with Tier and Bundling/Satuan support
  const [incentiveMap, setIncentiveMap] = useState<{
    [key in UserRole]?: {
      type: IncentiveType;
      rate: number;
      description: string;
      hasTierRule?: boolean;
      tierThresholdPackages?: number;
      tierRate?: number;
      tierRateBundling?: number;
      tierRateSatuan?: number;
      tierCalculationMode?: TierCalculationMode;
      hasSeparateBundlingSatuan?: boolean;
      satuanRate?: number;
      satuanIncentiveType?: 'per_pcs_sold' | 'per_package_sold' | 'percentage';
      bundlingRate?: number;
      bundlingIncentiveType?: 'per_package_sold' | 'per_pcs_sold' | 'percentage';
    }
  }>({
    host: { 
      type: 'per_pcs_sold', 
      rate: 1000, 
      description: 'Insentif per pcs terjual', 
      hasTierRule: false, 
      tierThresholdPackages: 15, 
      tierRate: 3000,
      tierRateBundling: 3000,
      tierRateSatuan: 1500,
      tierCalculationMode: 'excess_only',
      hasSeparateBundlingSatuan: false,
      satuanRate: 1000,
      satuanIncentiveType: 'per_pcs_sold',
      bundlingRate: 2500,
      bundlingIncentiveType: 'per_package_sold',
    },
    admin_toko: { 
      type: 'per_package_sold', 
      rate: 500, 
      description: 'Insentif per paket', 
      hasTierRule: false, 
      tierThresholdPackages: 15, 
      tierRate: 1500,
      tierRateBundling: 1500,
      tierRateSatuan: 1000,
      tierCalculationMode: 'excess_only' 
    },
    sortir: { type: 'per_ball_pcs', rate: 150, description: 'Insentif per pcs sortir' },
    steam: { type: 'per_ball_pcs', rate: 200, description: 'Insentif per pcs steam' },
    owner: { type: 'none', rate: 0, description: 'Tanpa insentif tambahan' },
  });

  // Multi-Role Sales Bonus Rule State (Requirement 2 & 8)
  const [multiRoleActive, setMultiRoleActive] = useState(false);
  const [multiRoleThreshold, setMultiRoleThreshold] = useState<number>(100);
  const [multiRoleBenefitType, setMultiRoleBenefitType] = useState<'bonus_per_package' | 'bonus_per_pcs' | 'hourly_rate_override' | 'fixed_amount'>('bonus_per_package');
  const [multiRoleBenefitValue, setMultiRoleBenefitValue] = useState<number>(500);
  const [multiRoleDesc, setMultiRoleDesc] = useState('Bonus tambahan rangkap role saat capai target penjualan');

  // Monthly Omzet Bonus Rule State (Requirement 4 & 9)
  const [monthlyBonusActive, setMonthlyBonusActive] = useState(false);
  const [monthlyTargetOmzet, setMonthlyTargetOmzet] = useState<number>(100000000);
  const [monthlyBonusType, setMonthlyBonusType] = useState<'percentage' | 'percentage_laba_bersih' | 'fixed'>('percentage');
  const [monthlyBonusValue, setMonthlyBonusValue] = useState<number>(1.0);
  const [monthlyBonusDesc, setMonthlyBonusDesc] = useState('Bonus pencapaian omzet bulanan toko');

  const loadData = () => {
    const list = StorageService.getEmployees(currentUser.storeId);
    setEmployees(list);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const toggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // at least 1 role
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleIncentiveChange = (
    role: UserRole,
    type: IncentiveType,
    rate?: number,
    description?: string,
    hasTierRule?: boolean,
    tierThresholdPackages?: number,
    tierRate?: number,
    tierCalculationMode?: TierCalculationMode,
    tierRateBundling?: number,
    tierRateSatuan?: number,
  ) => {
    setIncentiveMap(prev => {
      const cur = prev[role] || { type: 'none', rate: 0, description: '' };
      const effectiveBundling = tierRateBundling !== undefined 
        ? tierRateBundling 
        : (tierRate !== undefined ? tierRate : (cur.tierRateBundling || cur.tierRate || 3000));
      const effectiveSatuan = tierRateSatuan !== undefined 
        ? tierRateSatuan 
        : (cur.tierRateSatuan || (cur.tierRate ? Math.round(cur.tierRate / 2) : 1500));

      return {
        ...prev,
        [role]: {
          type,
          rate: rate !== undefined ? rate : cur.rate,
          description: description !== undefined ? description : cur.description,
          hasTierRule: hasTierRule !== undefined ? hasTierRule : cur.hasTierRule,
          tierThresholdPackages: tierThresholdPackages !== undefined ? tierThresholdPackages : (cur.tierThresholdPackages || 15),
          tierRate: effectiveBundling,
          tierRateBundling: effectiveBundling,
          tierRateSatuan: effectiveSatuan,
          tierCalculationMode: tierCalculationMode !== undefined ? tierCalculationMode : (cur.tierCalculationMode || 'excess_only'),
        }
      };
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setInitialUsername('');
    setName('');
    setUsername('');
    setPassword('');
    setSelectedRoles(['host']);
    setSalaryType('hourly');
    setSalaryRate(30000);
    setIncentiveMap({
      host: { 
        type: 'per_pcs_sold', 
        rate: 1000, 
        description: 'Insentif per pcs terjual', 
        hasTierRule: false, 
        tierThresholdPackages: 15, 
        tierRate: 3000, 
        tierRateBundling: 3000,
        tierRateSatuan: 1500,
        tierCalculationMode: 'excess_only' 
      },
      admin_toko: { 
        type: 'per_package_sold', 
        rate: 500, 
        description: 'Insentif per paket', 
        hasTierRule: false, 
        tierThresholdPackages: 15, 
        tierRate: 1500, 
        tierRateBundling: 1500,
        tierRateSatuan: 1000,
        tierCalculationMode: 'excess_only' 
      },
      sortir: { type: 'per_ball_pcs', rate: 150, description: 'Insentif per pcs sortir' },
      steam: { type: 'per_ball_pcs', rate: 200, description: 'Insentif per pcs steam' },
      owner: { type: 'none', rate: 0, description: 'Tanpa insentif tambahan' },
    });
    setMultiRoleActive(false);
    setMultiRoleThreshold(100);
    setMultiRoleBenefitType('bonus_per_package');
    setMultiRoleBenefitValue(500);
    setMultiRoleDesc('Bonus tambahan rangkap role saat capai target penjualan');
    setMonthlyBonusActive(false);
    setMonthlyTargetOmzet(100000000);
    setMonthlyBonusType('percentage');
    setMonthlyBonusValue(1.0);
    setMonthlyBonusDesc('Bonus pencapaian omzet bulanan toko');
    setEditingId(null);
    setFormStep(1);
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setInitialUsername(emp.username || '');
    setName(emp.name);
    setUsername(emp.username);
    setPassword(emp.password || '');
    setSelectedRoles(emp.roles);
    setSalaryType(emp.salaryType);
    setSalaryRate(emp.salaryRate);
    if (emp.incentiveConfigs) {
      setIncentiveMap(prev => ({
        ...prev,
        ...emp.incentiveConfigs,
      }));
    }

    if (emp.multiRoleSalesRule) {
      setMultiRoleActive(emp.multiRoleSalesRule.active);
      setMultiRoleThreshold(emp.multiRoleSalesRule.thresholdPackages || 100);
      setMultiRoleBenefitType((emp.multiRoleSalesRule.benefitType as any) || 'bonus_per_package');
      setMultiRoleBenefitValue(emp.multiRoleSalesRule.benefitValue || 500);
      setMultiRoleDesc(emp.multiRoleSalesRule.description || 'Bonus rangkap role penjualan paket');
    } else {
      setMultiRoleActive(false);
    }

    if (emp.monthlyOmzetBonusRule) {
      setMonthlyBonusActive(emp.monthlyOmzetBonusRule.active);
      setMonthlyTargetOmzet(emp.monthlyOmzetBonusRule.targetOmzet || 100000000);
      setMonthlyBonusType(emp.monthlyOmzetBonusRule.bonusType || 'percentage');
      setMonthlyBonusValue(emp.monthlyOmzetBonusRule.bonusValue || 1.0);
      setMonthlyBonusDesc(emp.monthlyOmzetBonusRule.description || 'Bonus pencapaian omzet bulanan');
    } else {
      setMonthlyBonusActive(false);
    }

    setFormStep(1);
    setViewMode('form');
  };

  const handleCancelEdit = () => {
    resetForm();
    setViewMode('list');
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus data pegawai ini?')) {
      StorageService.deleteEmployee(id);
      loadData();
      onNotify('Data pegawai berhasil dihapus.', 'info');
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) {
      onNotify('Nama dan Username wajib diisi!', 'error');
      return;
    }

    const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
    if (StorageService.isUsernameTaken(cleanUsername, editingId || undefined, currentUser.storeId)) {
      onNotify(`Username "${cleanUsername}" already exist please use another name`, 'error');
      return;
    }

    const formattedIncentiveConfigs: { [key in UserRole]?: IncentiveConfig } = {};
    selectedRoles.forEach(r => {
      const cfg = incentiveMap[r] || { type: 'none', rate: 0, description: '' };
      const hasSeparate = Boolean(cfg.hasSeparateBundlingSatuan);
      const fallbackRate = Number(cfg.rate) || 0;
      const sRate = hasSeparate ? (Number(cfg.satuanRate) || fallbackRate) : fallbackRate;
      const bRate = hasSeparate ? (Number(cfg.bundlingRate) || fallbackRate) : fallbackRate;
      const sType = hasSeparate ? (cfg.satuanIncentiveType || 'per_pcs_sold') : (cfg.type === 'per_package_sold' ? 'per_package_sold' : 'per_pcs_sold');
      const bType = hasSeparate ? (cfg.bundlingIncentiveType || 'per_package_sold') : (cfg.type === 'per_pcs_sold' ? 'per_pcs_sold' : 'per_package_sold');

      formattedIncentiveConfigs[r] = {
        type: cfg.type,
        rate: cfg.type === 'none' ? 0 : (hasSeparate ? sRate : fallbackRate),
        description: cfg.description,
        hasTierRule: Boolean(cfg.hasTierRule),
        tierThresholdPackages: cfg.hasTierRule ? (Number(cfg.tierThresholdPackages) || 0) : undefined,
        tierRate: cfg.hasTierRule ? (Number(cfg.tierRateBundling || cfg.tierRate || bRate) || 0) : undefined,
        tierRateBundling: cfg.hasTierRule ? (Number(cfg.tierRateBundling || cfg.tierRate || bRate) || 0) : undefined,
        tierRateSatuan: cfg.hasTierRule ? (Number(cfg.tierRateSatuan || sRate) || 0) : undefined,
        tierCalculationMode: cfg.tierCalculationMode || 'excess_only',
        hasSeparateBundlingSatuan: r === 'host' ? hasSeparate : undefined,
        satuanRate: r === 'host' ? sRate : undefined,
        satuanIncentiveType: r === 'host' ? sType : undefined,
        bundlingRate: r === 'host' ? bRate : undefined,
        bundlingIncentiveType: r === 'host' ? bType : undefined,
      };
    });

    const empData: Employee = {
      id: editingId || 'emp-' + Date.now(),
      storeId: currentUser.storeId,
      name,
      username: cleanUsername,
      password: password || '123',
      roles: selectedRoles,
      salaryType,
      salaryRate,
      isActive: true,
      incentiveConfigs: formattedIncentiveConfigs,
      multiRoleSalesRule: {
        active: multiRoleActive,
        thresholdPackages: multiRoleThreshold,
        benefitType: multiRoleBenefitType,
        benefitValue: multiRoleBenefitValue,
        description: multiRoleDesc,
      },
      monthlyOmzetBonusRule: {
        active: monthlyBonusActive,
        targetOmzet: monthlyTargetOmzet,
        bonusType: monthlyBonusType,
        bonusValue: monthlyBonusValue,
        description: monthlyBonusDesc,
      },
      createdAt: new Date().toISOString(),
    };

    StorageService.addOrUpdateEmployee(empData);
    if (editingId) {
      onNotify('Perubahan data pegawai berhasil disimpan!', 'success');
    } else {
      onNotify('Pegawai baru berhasil didaftarkan!', 'success');
    }

    loadData();
    resetForm();
    setViewMode('list');
  };

  const handleNextStep = () => {
    if (formStep === 1) {
      if (!name.trim()) {
        onNotify('Nama lengkap wajib diisi!', 'error');
        return;
      }
      if (!username.trim()) {
        onNotify('Username login wajib diisi!', 'error');
        return;
      }
      const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
      if (
        (!editingId || cleanUsername !== initialUsername.toLowerCase().replace(/\s+/g, '')) &&
        StorageService.isUsernameTaken(cleanUsername, editingId || undefined, currentUser.storeId)
      ) {
        onNotify(`Username "${cleanUsername}" sudah digunakan, silakan gunakan username lain!`, 'error');
        return;
      }
      setFormStep(2);
    } else if (formStep === 2) {
      if (selectedRoles.length === 0) {
        onNotify('Pilih minimal 1 role jabatan untuk pegawai!', 'error');
        return;
      }
      setFormStep(3);
    } else if (formStep === 3) {
      setFormStep(4);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(prev => prev - 1);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return emp.name.toLowerCase().includes(q) || emp.username.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* 1. HALAMAN DAFTAR PEGAWAI (OUTPUT) */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Header Bar Output */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161823] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToDashboard}
                className="p-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-zinc-300 hover:text-white hover:border-[#25F4EE] transition cursor-pointer"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#25F4EE]" />
                  <span>Data Pegawai &amp; Akses Role</span>
                </h2>
                <p className="text-xs text-zinc-400">Kelola daftar tim, hak akses akun, dan skema gaji/komisi</p>
              </div>
            </div>

            <button
              onClick={() => {
                resetForm();
                setViewMode('form');
                setFormStep(1);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Registrasi Pegawai Baru</span>
            </button>
          </div>

          {/* Search Bar & Total Summary */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama atau username..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-[#161823] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] transition"
              />
            </div>
            <div className="text-xs font-bold text-zinc-400 self-center">
              Total Pegawai: <strong className="text-white">{filteredEmployees.length} orang</strong>
            </div>
          </div>

          {/* Daftar Kartu Pegawai */}
          <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            {filteredEmployees.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredEmployees.map(emp => (
                  <div key={emp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-white">
                          {emp.name}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono bg-[#0b0c10] px-2 py-0.5 rounded-lg border border-white/5">
                          @{emp.username}
                        </span>
                      </div>

                      {/* Role Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {emp.roles.map(r => (
                          <span
                            key={r}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30"
                          >
                            {roleLabels[r]}
                          </span>
                        ))}

                        {emp.roles.includes('host') && emp.incentiveConfigs?.host && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/30">
                            {emp.incentiveConfigs.host.hasSeparateBundlingSatuan ? (
                              <>🏷️ Satuan: {formatRupiah(emp.incentiveConfigs.host.satuanRate || emp.incentiveConfigs.host.rate)} • 📦 Bundling: {formatRupiah(emp.incentiveConfigs.host.bundlingRate || emp.incentiveConfigs.host.rate)}</>
                            ) : (
                              <>Tarif Live: {formatRupiah(emp.incentiveConfigs.host.rate)} / {emp.incentiveConfigs.host.type === 'per_package_sold' ? 'Paket' : 'Pcs'}</>
                            )}
                          </span>
                        )}

                        {Object.values(emp.incentiveConfigs || {}).some(c => Boolean((c as IncentiveConfig)?.hasTierRule)) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/40">
                            ✨ Tier Target Aktif
                          </span>
                        )}

                        {emp.multiRoleSalesRule?.active && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            🎁 Bonus Rangkap Role
                          </span>
                        )}

                        {emp.monthlyOmzetBonusRule?.active && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            🏆 Target Omzet Toko
                          </span>
                        )}
                      </div>

                      {/* Detail Ringkas */}
                      <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Gaji Pokok: <strong className="text-zinc-200">{formatRupiah(emp.salaryRate)}</strong> / {emp.salaryType === 'hourly' ? 'Jam' : emp.salaryType === 'daily' ? 'Hari' : 'Bulan'}</span>
                        {emp.multiRoleSalesRule?.active && (
                          <span>Target Rangkap: $\ge$ {emp.multiRoleSalesRule.thresholdPackages} paket</span>
                        )}
                        {emp.monthlyOmzetBonusRule?.active && (
                          <span>Target Omzet: {formatRupiah(emp.monthlyOmzetBonusRule.targetOmzet)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition text-xs font-bold cursor-pointer"
                        title="Edit Pegawai"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                        title="Hapus Pegawai"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Belum ada data pegawai yang cocok dengan pencarian.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. HALAMAN FORM WIZARD (INPUT / EDIT) */}
      {viewMode === 'form' && (
        <div className="space-y-6">
          {/* Header Form dengan Tombol Kembali ke Daftar */}
          <div className="flex items-center justify-between bg-[#161823] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-2.5 rounded-2xl bg-[#0b0c10] border border-white/10 text-zinc-300 hover:text-white hover:border-[#25F4EE] transition cursor-pointer"
                title="Kembali ke Daftar Pegawai"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  {editingId ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <UserPlus className="w-5 h-5 text-[#25F4EE]" />}
                  <span>{editingId ? 'Edit Data Pegawai' : 'Form Registrasi Pegawai Baru'}</span>
                </h2>
                <p className="text-xs text-zinc-400">Pengisian bertahap agar informasi terstruktur dan nyaman dibaca</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#25F4EE]">
              Langkah {formStep} dari 4
            </div>
          </div>

          {/* Wizard Stepper Progress Bar */}
          <div className="grid grid-cols-4 gap-2 bg-[#161823] p-3 rounded-2xl border border-white/10 text-xs">
            {[
              { step: 1, label: 'Akun Login', icon: '👤' },
              { step: 2, label: 'Hak Akses Role', icon: '🛡️' },
              { step: 3, label: 'Gaji & Insentif', icon: '💰' },
              { step: 4, label: 'Bonus & Target', icon: '🏆' },
            ].map(item => {
              const isActive = formStep === item.step;
              const isDone = formStep > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    // Hanya izinkan lompat ke step yang sudah atau step 1
                    if (isDone || item.step <= formStep) {
                      setFormStep(item.step);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-[#25F4EE] font-black'
                      : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold cursor-pointer'
                      : 'bg-[#0b0c10] border-white/5 text-zinc-500 font-medium cursor-not-allowed'
                  }`}
                >
                  <span className="text-sm">{isDone ? '✓' : item.icon}</span>
                  <span className="truncate text-[11px] sm:text-xs">
                    {item.step}. {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            {/* TAHAP 1: DATA IDENTITAS & AKUN */}
            {formStep === 1 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#25F4EE] text-black flex items-center justify-center text-xs font-black">1</span>
                    <span>Data Akun &amp; Kredensial Login Pegawai</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Masukkan nama pegawai dan akun yang digunakan untuk login ke aplikasi.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Nama Lengkap <span className="text-[#FE2C55]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Contoh: Siti Rahma"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Username Login <span className="text-[#FE2C55]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="siti_host"
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border text-white focus:border-[#25F4EE] ${
                        username.trim() &&
                        (!editingId || username.trim().toLowerCase().replace(/\s+/g, '') !== initialUsername.trim().toLowerCase().replace(/\s+/g, '')) &&
                        StorageService.isUsernameTaken(username.toLowerCase().replace(/\s+/g, ''), editingId || undefined, currentUser.storeId)
                          ? 'border-[#FE2C55]'
                          : 'border-white/10'
                      }`}
                    />
                    {username.trim() &&
                      (!editingId || username.trim().toLowerCase().replace(/\s+/g, '') !== initialUsername.trim().toLowerCase().replace(/\s+/g, '')) &&
                      StorageService.isUsernameTaken(username.toLowerCase().replace(/\s+/g, ''), editingId || undefined, currentUser.storeId) && (
                      <p className="text-[#FE2C55] text-[11px] font-bold mt-1">
                        Username sudah digunakan, silakan pilih yang lain
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Password Login <span className="text-[#FE2C55]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="123"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-mono focus:border-[#25F4EE]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/5 text-xs text-zinc-400">
                  💡 Akun ini akan digunakan pegawai saat login. Password default dapat diisi <strong>123</strong> untuk kemudahan setup awal.
                </div>
              </div>
            )}

            {/* TAHAP 2: ROLE & HAK AKSES */}
            {formStep === 2 && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#25F4EE] text-black flex items-center justify-center text-xs font-black">2</span>
                    <span>Pilih Hak Akses Role Pegawai</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Satu pegawai dapat memegang lebih dari satu role (bisa rangkap jabatan).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ALL_ROLES.map(role => {
                    const isChecked = selectedRoles.includes(role);
                    const descriptions: { [key in UserRole]: string } = {
                      owner: 'Akses penuh seluruh data finansial, modal, dan konfigurasi sistem',
                      host: 'Mencatat sesi live streaming, penjualan per sesi, dan komisi live',
                      admin_toko: 'Pencatatan pesanan harian, status packing, dan operasional toko',
                      sortir: 'Pencatatan sortir ball pakaian baru dan grading kualitas',
                      steam: 'Pencatatan proses steam, finishing pakaian, dan kelayakan jual',
                    };

                    return (
                      <div
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`p-4 rounded-2xl border cursor-pointer transition select-none flex flex-col justify-between gap-3 ${
                          isChecked
                            ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white shadow-md shadow-[#25F4EE]/10'
                            : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize font-black text-sm text-white">
                            {roleLabels[role]}
                          </span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                            isChecked ? 'bg-[#25F4EE] text-black' : 'border border-white/20 text-transparent'
                          }`}>
                            ✓
                          </div>
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-400">
                          {descriptions[role]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAHAP 3: GAJI POKOK & INSENTIF PER ROLE */}
            {formStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#25F4EE] text-black flex items-center justify-center text-xs font-black">3</span>
                    <span>Pengaturan Gaji Pokok &amp; Insentif Role</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Tentukan skema gaji pokok dan komisi per pcs / paket untuk role yang telah dipilih.</p>
                </div>

                {/* Pengaturan Gaji Pokok */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-[#25F4EE] flex items-center gap-1.5">
                    <span>💵 Skema Gaji Pokok</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Tipe Hitungan Gaji Pokok
                      </label>
                      <select
                        value={salaryType}
                        onChange={e => setSalaryType(e.target.value as SalaryType)}
                        className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                      >
                        <option value="hourly">Per Jam (Cocok untuk Host Live)</option>
                        <option value="daily">Per Hari / Shift (Cocok untuk Admin / Sortir / Steam)</option>
                        <option value="monthly">Bulanan (Gaji Tetap)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Nominal Gaji Pokok (Rp)
                      </label>
                      <CommaNumberInput
                        value={salaryRate}
                        onChange={setSalaryRate}
                        className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                      />
                    </div>
                  </div>
                </div>

                {/* Pengaturan Insentif Per Role */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#25F4EE]" />
                    <span>Insentif / Komisi untuk Role yang Dipilih:</span>
                  </h4>

                  {selectedRoles.map(role => {
                    const config = incentiveMap[role] || { type: 'none', rate: 0, description: '' };
                    const isHostOrAdmin = role === 'host' || role === 'admin_toko';

                    return (
                      <div key={role} className="p-4 sm:p-5 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <span className="text-xs font-black text-white flex items-center gap-2">
                            <span>Insentif Role:</span>
                            <span className="text-[#25F4EE] bg-[#25F4EE]/10 px-2 py-0.5 rounded-lg border border-[#25F4EE]/30">
                              {roleLabels[role]}
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                              Tipe Insentif
                            </label>
                            <select
                              value={config.type}
                              onChange={e => handleIncentiveChange(role, e.target.value as IncentiveType)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                            >
                              <option value="none">Tanpa Insentif</option>
                              {role === 'host' && (
                                <>
                                  <option value="per_pcs_sold">Per Pcs Terjual Live</option>
                                  <option value="per_package_sold">Per Paket Terjual</option>
                                </>
                              )}
                              {role === 'admin_toko' && (
                                <>
                                  <option value="per_package_sold">Per Paket Dicatat &amp; Packing</option>
                                  <option value="per_pcs_sold">Per Pcs Dicatat</option>
                                </>
                              )}
                              {(role === 'sortir' || role === 'steam') && (
                                <option value="per_ball_pcs">Per Pcs Layak Jual (Reject Tidak Dihitung)</option>
                              )}
                              <option value="fixed_amount">Nominal Tetap (Flat)</option>
                            </select>
                          </div>

                          {config.type !== 'none' && !(role === 'host' && config.hasSeparateBundlingSatuan) && (
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                                {config.type === 'fixed_amount' 
                                  ? 'Nominal Komisi Flat (Rp)' 
                                  : role === 'host'
                                    ? (config.type === 'per_pcs_sold' ? 'Tarif Komisi Dasar per Pcs Live (Rp)' : 'Tarif Komisi Dasar per Paket Live (Rp)')
                                    : role === 'admin_toko'
                                      ? (config.type === 'per_package_sold' ? 'Tarif per Paket Packing (Rp)' : 'Tarif per Pcs Dicatat (Rp)')
                                      : 'Tarif Komisi (Rp)'}
                              </label>
                              <CommaNumberInput
                                value={config.rate}
                                onChange={val => handleIncentiveChange(role, config.type, val)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                              />
                            </div>
                          )}
                        </div>

                        {/* Pengaturan Terpisah Satuan & Bundling untuk Host */}
                        {role === 'host' && (
                          <div className="pt-3 border-t border-white/5 space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(config.hasSeparateBundlingSatuan)}
                                onChange={e => {
                                  const checked = e.target.checked;
                                  setIncentiveMap(prev => ({
                                    ...prev,
                                    host: {
                                      ...(prev.host || { type: 'per_pcs_sold', rate: 1000, description: '' }),
                                      hasSeparateBundlingSatuan: checked,
                                      satuanRate: prev.host?.satuanRate || 1000,
                                      satuanIncentiveType: prev.host?.satuanIncentiveType || 'per_pcs_sold',
                                      bundlingRate: prev.host?.bundlingRate || 2500,
                                      bundlingIncentiveType: prev.host?.bundlingIncentiveType || 'per_package_sold',
                                    }
                                  }));
                                }}
                                className="w-4 h-4 rounded accent-[#25F4EE]"
                              />
                              <span className="text-xs font-bold text-[#25F4EE] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
                                Pisahkan Perhitungan Insentif Penjualan Satuan &amp; Bundling
                              </span>
                            </label>

                            {config.hasSeparateBundlingSatuan && (
                              <div className="p-3.5 rounded-2xl bg-[#161823] border border-[#25F4EE]/30 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Bundling */}
                                  <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/5 space-y-2">
                                    <span className="text-xs font-bold text-amber-300">📦 Insentif Bundling</span>
                                    <CommaNumberInput
                                      value={config.bundlingRate || 2500}
                                      onChange={val => {
                                        setIncentiveMap(prev => ({
                                          ...prev,
                                          host: {
                                            ...prev.host!,
                                            bundlingRate: val,
                                          }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-amber-300 font-bold focus:border-[#25F4EE]"
                                    />
                                  </div>

                                  {/* Satuan */}
                                  <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/5 space-y-2">
                                    <span className="text-xs font-bold text-[#25F4EE]">🏷️ Insentif Satuan</span>
                                    <CommaNumberInput
                                      value={config.satuanRate || 1000}
                                      onChange={val => {
                                        setIncentiveMap(prev => ({
                                          ...prev,
                                          host: {
                                            ...prev.host!,
                                            satuanRate: val,
                                          }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-[#25F4EE] font-bold focus:border-[#25F4EE]"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tier Rule */}
                        {config.type !== 'none' && isHostOrAdmin && (
                          <div className="pt-3 border-t border-white/5 space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(config.hasTierRule)}
                                onChange={e => handleIncentiveChange(role, config.type, undefined, undefined, e.target.checked)}
                                className="w-4 h-4 rounded accent-[#25F4EE]"
                              />
                              <span className="text-xs font-bold text-[#25F4EE] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
                                Aktifkan Skema Insentif Berjenjang (Tier Target Penjualan)
                              </span>
                            </label>

                            {config.hasTierRule && (
                              <div className="p-3.5 rounded-xl bg-[#161823] border border-[#25F4EE]/30 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                                      Target Minimal (Paket)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={config.tierThresholdPackages || 15}
                                      onChange={e => handleIncentiveChange(role, config.type, undefined, undefined, true, Number(e.target.value))}
                                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                                      Tier Bundling (Rp)
                                    </label>
                                    <CommaNumberInput
                                      value={config.tierRateBundling || config.tierRate || 3000}
                                      onChange={val => handleIncentiveChange(role, config.type, undefined, undefined, true, undefined, undefined, undefined, val, undefined)}
                                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-amber-300 font-bold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-[#25F4EE] mb-1">
                                      Tier Satuan (Rp)
                                    </label>
                                    <CommaNumberInput
                                      value={config.tierRateSatuan || 1500}
                                      onChange={val => handleIncentiveChange(role, config.type, undefined, undefined, true, undefined, undefined, undefined, undefined, val)}
                                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-[#25F4EE] font-bold"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAHAP 4: BONUS TARGET & KONFIRMASI SIMPAN */}
            {formStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#25F4EE] text-black flex items-center justify-center text-xs font-black">4</span>
                    <span>Bonus Target Tambahan &amp; Konfirmasi Simpan</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Aturan bonus tambahan pencapaian target toko dan ringkasan data sebelum disimpan.</p>
                </div>

                {/* Bonus Rangkap Role */}
                {selectedRoles.length > 1 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0c10] border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">Multi-Role</span>
                        <span>Bonus Rangkap Role Penjualan Paket</span>
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={multiRoleActive}
                          onChange={e => setMultiRoleActive(e.target.checked)}
                          className="w-4 h-4 rounded accent-purple-400"
                        />
                        <span className="text-xs font-bold text-purple-300">{multiRoleActive ? 'Aktif' : 'Nonaktif'}</span>
                      </label>
                    </div>

                    {multiRoleActive && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-300 mb-1">Target Paket</label>
                          <input
                            type="number"
                            min="1"
                            value={multiRoleThreshold}
                            onChange={e => setMultiRoleThreshold(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-300 mb-1">Nominal Benefit (Rp)</label>
                          <CommaNumberInput
                            value={multiRoleBenefitValue}
                            onChange={setMultiRoleBenefitValue}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-purple-300 font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bonus Omzet Bulanan */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0c10] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Monthly Target</span>
                      <span>Bonus Pencapaian Target Omzet Bulanan</span>
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={monthlyBonusActive}
                        onChange={e => setMonthlyBonusActive(e.target.checked)}
                        className="w-4 h-4 rounded accent-amber-400"
                      />
                      <span className="text-xs font-bold text-amber-300">{monthlyBonusActive ? 'Aktif' : 'Nonaktif'}</span>
                    </label>
                  </div>

                  {monthlyBonusActive && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">Target Omzet (Rp)</label>
                        <CommaNumberInput
                          value={monthlyTargetOmzet}
                          onChange={setMonthlyTargetOmzet}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-amber-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">Persentase Bonus (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={monthlyBonusValue}
                          onChange={e => setMonthlyBonusValue(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-amber-300 font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Ringkasan Konfirmasi */}
                <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-2 text-xs">
                  <div className="text-zinc-400 font-bold mb-1">📋 Ringkasan Data Pegawai:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-300">
                    <div>Nama: <strong className="text-white block">{name || '-'}</strong></div>
                    <div>Username: <strong className="text-[#25F4EE] block font-mono">@{username || '-'}</strong></div>
                    <div>Role: <strong className="text-white block">{selectedRoles.map(r => roleLabels[r]).join(', ') || '-'}</strong></div>
                    <div>Gaji Pokok: <strong className="text-emerald-400 block">{formatRupiah(salaryRate)}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {formStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tahap Sebelumnya</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar</span>
                </button>
              )}

              {formStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black text-xs font-black shadow-lg shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  <span>Lanjut: {formStep === 1 ? 'Pilih Role' : formStep === 2 ? 'Gaji & Insentif' : 'Bonus Target'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-submit-employee"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 active:scale-98 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan Pegawai' : 'Daftarkan Pegawai Sekarang'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
