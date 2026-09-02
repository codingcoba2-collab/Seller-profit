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
  const [subTab, setSubTab] = useState<SubTabType>('output');
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

  // Incentive configs mapped per role with Tier support
  const [incentiveMap, setIncentiveMap] = useState<{
    [key in UserRole]?: {
      type: IncentiveType;
      rate: number;
      description: string;
      hasTierRule?: boolean;
      tierThresholdPackages?: number;
      tierRate?: number;
    }
  }>({
    host: { type: 'per_pcs_sold', rate: 1000, description: 'Insentif per pcs terjual', hasTierRule: false, tierThresholdPackages: 50, tierRate: 1500 },
    admin_toko: { type: 'per_package_sold', rate: 500, description: 'Insentif per paket', hasTierRule: false, tierThresholdPackages: 80, tierRate: 800 },
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
    tierCalculationMode?: TierCalculationMode
  ) => {
    setIncentiveMap(prev => {
      const cur = prev[role] || { type: 'none', rate: 0, description: '' };
      return {
        ...prev,
        [role]: {
          type,
          rate: rate !== undefined ? rate : cur.rate,
          description: description !== undefined ? description : cur.description,
          hasTierRule: hasTierRule !== undefined ? hasTierRule : cur.hasTierRule,
          tierThresholdPackages: tierThresholdPackages !== undefined ? tierThresholdPackages : (cur.tierThresholdPackages || 15),
          tierRate: tierRate !== undefined ? tierRate : (cur.tierRate || (rate !== undefined ? Math.round(rate * 1.5) : cur.rate)),
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
      host: { type: 'per_pcs_sold', rate: 1000, description: 'Insentif per pcs terjual', hasTierRule: false, tierThresholdPackages: 15, tierRate: 3000, tierCalculationMode: 'excess_only' },
      admin_toko: { type: 'per_package_sold', rate: 500, description: 'Insentif per paket', hasTierRule: false, tierThresholdPackages: 15, tierRate: 1500, tierCalculationMode: 'excess_only' },
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

    setSubTab('input'); // Switch to input form smoothly (Requirement 7)
  };

  const handleCancelEdit = () => {
    resetForm();
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
      formattedIncentiveConfigs[r] = {
        type: cfg.type,
        rate: cfg.type === 'none' ? 0 : cfg.rate,
        description: cfg.description,
        hasTierRule: Boolean(cfg.hasTierRule),
        tierThresholdPackages: cfg.hasTierRule ? (Number(cfg.tierThresholdPackages) || 0) : undefined,
        tierRate: cfg.hasTierRule ? (Number(cfg.tierRate) || 0) : undefined,
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
    setSubTab('output');
  };

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return emp.name.toLowerCase().includes(q) || emp.username.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-role"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Manajemen Pegawai &amp; Role
            </h2>
          </div>
        </div>
      </div>

      {/* Sub Navigation (Requirement 7) */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingId ? '✏️ Sedang Mengedit Pegawai' : 'Input Pegawai Baru'}
        outputTitle="Daftar Pegawai &amp; Akses"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="max-w-4xl mx-auto bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <Users className="w-5 h-5 text-[#25F4EE]" />}
              <span>{editingId ? 'Edit Data Pegawai & Role' : 'Form Registrasi Pegawai Baru'}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer transition"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
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
                  className={`w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border text-white focus:border-[#25F4EE] ${
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
                  <p className="text-[#FE2C55] text-[10px] font-bold mt-1">
                    already exist please use another name
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Password <span className="text-[#FE2C55]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-mono focus:border-[#25F4EE]"
                />
              </div>
            </div>

            {/* Pilihan Multi-Role */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Pilih Hak Akses Role (Bisa Rangkap Jabatan) <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {ALL_ROLES.map(role => {
                  const isChecked = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        isChecked
                          ? 'bg-[#25F4EE] text-black border-[#25F4EE] shadow-md shadow-[#25F4EE]/20'
                          : 'bg-[#0b0c10] text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="capitalize">{roleLabels[role]}</span>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pengaturan Gaji Pokok */}
            <div className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-[#25F4EE]">
                Pengaturan Gaji Pokok
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
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#25F4EE]" />
                  <span>Pengaturan Insentif Per Role Terpilih</span>
                </h4>
              </div>

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
                          Tipe Insentif Dasar
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
                            <option value="per_ball_pcs">Per Pcs Ball Dikerjakan</option>
                          )}
                          <option value="fixed_amount">Nominal Tetap (Flat)</option>
                        </select>
                      </div>

                      {config.type !== 'none' && (
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                            Tarif Insentif Dasar (Rp)
                          </label>
                          <CommaNumberInput
                            value={config.rate}
                            onChange={val => handleIncentiveChange(role, config.type, val)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Req 1: Skema Insentif Berjenjang / Tier Rule */}
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
                          <div className="p-4 rounded-xl bg-[#161823] border border-[#25F4EE]/30 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                                  Target Minimal Penjualan (Paket)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={config.tierThresholdPackages || 15}
                                  onChange={e => handleIncentiveChange(role, config.type, undefined, undefined, true, Number(e.target.value))}
                                  placeholder="Contoh: 15"
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                                />
                                <span className="text-[10px] text-zinc-400 mt-1 block">
                                  Batas ambang minimal tercapainya bonus target penjualan (misal 15 paket).
                                </span>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                                  Tarif Insentif Berjenjang / Naik (Rp)
                                </label>
                                <CommaNumberInput
                                  value={config.tierRate || Math.round((config.rate || 1000) * 2)}
                                  onChange={val => handleIncentiveChange(role, config.type, undefined, undefined, true, undefined, val)}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-[#25F4EE] font-bold focus:border-[#25F4EE]"
                                />
                                <span className="text-[10px] text-zinc-400 mt-1 block">
                                  Tarif insentif berjenjang (misal Rp 3.000) per unit.
                                </span>
                              </div>
                            </div>

                            {/* Opsi Metode Perhitungan Skema Berjenjang */}
                            <div className="pt-3 border-t border-white/10 space-y-2.5">
                              <label className="block text-xs font-bold text-white">
                                Metode Perhitungan Insentif Saat Capai Target:
                              </label>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {/* Opsi 1: Excess Only (Progresif / Selisih Saja) */}
                                <div 
                                  onClick={() => handleIncentiveChange(role, config.type, undefined, undefined, true, undefined, undefined, 'excess_only')}
                                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                                    (config.tierCalculationMode || 'excess_only') === 'excess_only'
                                      ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white shadow-sm'
                                      : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:border-white/20'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="radio"
                                      name={`tier-mode-${role}`}
                                      checked={(config.tierCalculationMode || 'excess_only') === 'excess_only'}
                                      onChange={() => handleIncentiveChange(role, config.type, undefined, undefined, true, undefined, undefined, 'excess_only')}
                                      className="mt-0.5 accent-[#25F4EE]"
                                    />
                                    <div>
                                      <div className="text-xs font-bold text-white flex items-center gap-1">
                                        <span>Hanya Selisih Paket di Atas Target</span>
                                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">Rekomendasi</span>
                                      </div>
                                      <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                                        Paket sampai batas target tetap pakai <b className="text-white">tarif dasar</b>, dan hanya paket kelebihannya yang dihitung <b className="text-[#25F4EE]">tarif berjenjang</b>.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Opsi 2: All Units (Flat Tier) */}
                                <div 
                                  onClick={() => handleIncentiveChange(role, config.type, undefined, undefined, true, undefined, undefined, 'all_units')}
                                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                                    config.tierCalculationMode === 'all_units'
                                      ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white shadow-sm'
                                      : 'bg-[#0b0c10] border-white/10 text-zinc-400 hover:border-white/20'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="radio"
                                      name={`tier-mode-${role}`}
                                      checked={config.tierCalculationMode === 'all_units'}
                                      onChange={() => handleIncentiveChange(role, config.type, undefined, undefined, true, undefined, undefined, 'all_units')}
                                      className="mt-0.5 accent-[#25F4EE]"
                                    />
                                    <div>
                                      <div className="text-xs font-bold text-white">
                                        Seluruh Paket Dihitung Tarif Baru
                                      </div>
                                      <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                                        Begitu penjualan tembus target, <b className="text-white">seluruh paket</b> otomatis langsung dikalikan dengan tarif berjenjang yang lebih tinggi.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Live Simulation Box */}
                            <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/10 text-xs space-y-1.5">
                              <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                                <span>💡 Simulasi Perhitungan ({config.tierThresholdPackages || 15} Batas Target vs Penjualan 17 Paket):</span>
                              </div>
                              {(config.tierCalculationMode || 'excess_only') === 'excess_only' ? (
                                <div className="text-zinc-300 text-[11px] space-y-1">
                                  <p>
                                    • <b>{config.tierThresholdPackages || 15} paket</b> pertama @ {formatRupiah(config.rate || 0)} = <span className="text-white font-semibold">{formatRupiah((config.tierThresholdPackages || 15) * (config.rate || 0))}</span>
                                  </p>
                                  <p>
                                    • <b>{Math.max(0, 17 - (config.tierThresholdPackages || 15))} paket</b> selisih @ {formatRupiah(config.tierRate || 0)} = <span className="text-[#25F4EE] font-semibold">{formatRupiah(Math.max(0, 17 - (config.tierThresholdPackages || 15)) * (config.tierRate || 0))}</span>
                                  </p>
                                  <div className="pt-1 border-t border-white/5 font-bold text-emerald-400 flex justify-between">
                                    <span>Total Insentif:</span>
                                    <span>{formatRupiah(((config.tierThresholdPackages || 15) * (config.rate || 0)) + (Math.max(0, 17 - (config.tierThresholdPackages || 15)) * (config.tierRate || 0)))}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-zinc-300 text-[11px] space-y-1">
                                  <p>
                                    • <b>17 paket</b> seluruhnya dikalikan {formatRupiah(config.tierRate || 0)}:
                                  </p>
                                  <div className="pt-1 border-t border-white/5 font-bold text-emerald-400 flex justify-between">
                                    <span>Total Insentif:</span>
                                    <span>{formatRupiah(17 * (config.tierRate || 0))}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Req 2: Pengaturan Bonus Rangkap Role Penjualan Paket */}
            {selectedRoles.length > 1 && (
              <div className="p-5 rounded-2xl bg-[#0b0c10] border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/40">
                      Multi-Role Rule
                    </span>
                    <h4 className="text-xs font-black text-white">
                      Bonus Rangkap Role Penjualan Paket
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={multiRoleActive}
                      onChange={e => setMultiRoleActive(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-400"
                    />
                    <span className="text-xs font-bold text-purple-300">
                      {multiRoleActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </label>
                </div>

                <p className="text-[11px] text-zinc-400">
                  Pegawai ini merangkap {selectedRoles.length} role ({selectedRoles.map(r => roleLabels[r]).join(', ')}). Atur kompensasi tambahan jika total paket penjualan toko/sesi menembus target.
                </p>

                {multiRoleActive && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Target Penjualan Paket
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={multiRoleThreshold}
                          onChange={e => setMultiRoleThreshold(Number(e.target.value))}
                          placeholder="Contoh: 100"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold focus:border-purple-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Bentuk Tambahan Benefit
                        </label>
                        <select
                          value={multiRoleBenefitType}
                          onChange={e => setMultiRoleBenefitType(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-semibold focus:border-purple-400"
                        >
                          <option value="bonus_per_package">Tambahan Bonus Per Paket</option>
                          <option value="bonus_per_pcs">Tambahan Bonus Per Pcs</option>
                          <option value="hourly_rate_override">Kenaikan Gaji Pokok (Per Jam/Shift)</option>
                          <option value="fixed_amount">Bonus Pasti Nominal Tetap (Flat)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Nominal Benefit (Rp)
                        </label>
                        <CommaNumberInput
                          value={multiRoleBenefitValue}
                          onChange={setMultiRoleBenefitValue}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-purple-300 font-bold focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Keterangan Aturan Rangkap Role
                      </label>
                      <input
                        type="text"
                        value={multiRoleDesc}
                        onChange={e => setMultiRoleDesc(e.target.value)}
                        placeholder="Contoh: Bonus rangkap host & admin toko saat tembus 100 paket"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Req 4: Pengaturan Target Omzet & Bonus Bulanan Toko */}
            <div className="p-5 rounded-2xl bg-[#0b0c10] border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                    Monthly Target
                  </span>
                  <h4 className="text-xs font-black text-white">
                    Bonus Bulanan Pencapaian Target Omzet Toko
                  </h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={monthlyBonusActive}
                    onChange={e => setMonthlyBonusActive(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-400"
                  />
                  <span className="text-xs font-bold text-amber-300">
                    {monthlyBonusActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </label>
              </div>

              <p className="text-[11px] text-zinc-400">
                Berikan apresiasi bonus akhir bulan kepada pegawai jika omzet kotor toko dalam bulan berjalan mencapai atau melampaui target tertentu.
              </p>

              {monthlyBonusActive && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Target Omzet Toko (Rp)
                      </label>
                      <CommaNumberInput
                        value={monthlyTargetOmzet}
                        onChange={setMonthlyTargetOmzet}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-amber-300 font-bold focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Tipe Perhitungan Bonus
                      </label>
                      <select
                        value={monthlyBonusType}
                        onChange={e => setMonthlyBonusType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-semibold focus:border-amber-400"
                      >
                        <option value="percentage">Persentase Omzet Kotor Toko (%)</option>
                        <option value="percentage_laba_bersih">Persentase Laba Bersih Toko (%)</option>
                        <option value="fixed">Nominal Pasti Tetap (Rp)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        {monthlyBonusType === 'percentage' 
                          ? 'Besar Bonus Omzet (%)' 
                          : monthlyBonusType === 'percentage_laba_bersih'
                          ? 'Besar Bonus Laba Bersih (%)'
                          : 'Besar Bonus Flat (Rp)'}
                      </label>
                      {monthlyBonusType === 'percentage' || monthlyBonusType === 'percentage_laba_bersih' ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="100"
                          value={monthlyBonusValue}
                          onChange={e => setMonthlyBonusValue(parseFloat(e.target.value) || 0)}
                          placeholder="Contoh: 5"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-amber-300 font-bold focus:border-amber-400"
                        />
                      ) : (
                        <CommaNumberInput
                          value={monthlyBonusValue}
                          onChange={setMonthlyBonusValue}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-amber-300 font-bold focus:border-amber-400"
                        />
                      )}
                    </div>
                  </div>

                  {monthlyBonusType === 'percentage_laba_bersih' && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                      💡 <strong>Skema Laba Bersih:</strong> Jika omzet kotor bulan ini tembus target (≥ Rp {monthlyTargetOmzet.toLocaleString('id-ID')}), pegawai akan menerima bonus sebesar <strong>{monthlyBonusValue}% dari total Laba Bersih Akhir toko</strong> (setelah dikurangi HPP final, biaya admin/iklan/koin, dan biaya operasional).
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Keterangan Bonus Bulanan
                    </label>
                    <input
                      type="text"
                      value={monthlyBonusDesc}
                      onChange={e => setMonthlyBonusDesc(e.target.value)}
                      placeholder="Contoh: Bonus target omzet bulanan toko tembus 100jt"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              id="btn-submit-employee"
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{editingId ? 'Simpan Perubahan Pegawai' : 'Daftarkan Pegawai Baru'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: OUTPUT & DAFTAR PEGAWAI */}
      {subTab === 'output' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari pegawai..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
              />
            </div>
            <button
              onClick={() => {
                resetForm();
                setSubTab('input');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md cursor-pointer"
            >
              + Tambah Pegawai
            </button>
          </div>

          <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-white">
                        {emp.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        @{emp.username}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {emp.roles.map(r => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30"
                        >
                          {roleLabels[r]}
                        </span>
                      ))}

                      {/* Tier badge if exists */}
                      {Object.values(emp.incentiveConfigs || {}).some(c => Boolean((c as IncentiveConfig)?.hasTierRule)) && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/40">
                          ✨ Tier Insentif Aktif
                        </span>
                      )}

                      {/* Multi-role badge */}
                      {emp.multiRoleSalesRule?.active && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          🎁 Bonus Rangkap Role
                        </span>
                      )}

                      {/* Monthly target badge */}
                      {emp.monthlyOmzetBonusRule?.active && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          🏆 Bonus Target Omzet
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Gaji Pokok: <strong className="text-zinc-200">{formatRupiah(emp.salaryRate)}</strong> / {emp.salaryType === 'hourly' ? 'Jam' : 'Hari'}</span>
                      {emp.multiRoleSalesRule?.active && (
                        <span>• Target Rangkap: $\ge$ {emp.multiRoleSalesRule.thresholdPackages} paket</span>
                      )}
                      {emp.monthlyOmzetBonusRule?.active && (
                        <span>• Target Omzet: {formatRupiah(emp.monthlyOmzetBonusRule.targetOmzet)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="p-2 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                      title="Edit Pegawai"
                    >
                      <Edit3 className="w-4 h-4" />
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
          </div>
        </div>
      )}
    </div>
  );
};
