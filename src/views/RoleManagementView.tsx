import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Employee, UserRole, SalaryType, IncentiveType, CurrentUser, IncentiveConfig } from '../types';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['host']);
  const [salaryType, setSalaryType] = useState<SalaryType>('hourly');
  const [salaryRate, setSalaryRate] = useState<number>(30000);

  // Incentive configs mapped per role
  const [incentiveMap, setIncentiveMap] = useState<{
    [key in UserRole]?: {
      type: IncentiveType;
      rate: number;
      description: string;
    }
  }>({
    host: { type: 'per_pcs_sold', rate: 1000, description: 'Insentif per pcs terjual' },
    admin_toko: { type: 'per_package_sold', rate: 500, description: 'Insentif per paket' },
    sortir: { type: 'per_ball_pcs', rate: 150, description: 'Insentif per pcs sortir' },
    steam: { type: 'per_ball_pcs', rate: 200, description: 'Insentif per pcs steam' },
    owner: { type: 'none', rate: 0, description: 'Tanpa insentif tambahan' },
  });

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
    description?: string
  ) => {
    setIncentiveMap(prev => ({
      ...prev,
      [role]: {
        type,
        rate: rate !== undefined ? rate : (prev[role]?.rate || 0),
        description: description !== undefined ? description : (prev[role]?.description || ''),
      }
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setUsername('');
    setPassword('');
    setSelectedRoles(['host']);
    setSalaryType('hourly');
    setSalaryRate(30000);
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
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

    const formattedIncentiveConfigs: { [key in UserRole]?: IncentiveConfig } = {};
    selectedRoles.forEach(r => {
      const cfg = incentiveMap[r] || { type: 'none', rate: 0, description: '' };
      formattedIncentiveConfigs[r] = {
        type: cfg.type,
        rate: cfg.type === 'none' ? 0 : cfg.rate,
        description: cfg.description,
      };
    });

    const empData: Employee = {
      id: editingId || 'emp-' + Date.now(),
      storeId: currentUser.storeId,
      name,
      username: username.toLowerCase().replace(/\s+/g, ''),
      password: password || '123',
      roles: selectedRoles,
      salaryType,
      salaryRate,
      isActive: true,
      incentiveConfigs: formattedIncentiveConfigs,
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
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                />
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
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-300">
                Pengaturan Insentif Per Role Terpilih
              </h4>

              {selectedRoles.map(role => {
                const config = incentiveMap[role] || { type: 'none', rate: 0, description: '' };
                return (
                  <div key={role} className="p-4 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Insentif Role: <span className="text-[#25F4EE]">{roleLabels[role]}</span>
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
                            <option value="per_ball_pcs">Per Pcs Ball Dikerjakan</option>
                          )}
                          <option value="fixed_amount">Nominal Tetap (Flat)</option>
                        </select>
                      </div>

                      {config.type !== 'none' && (
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                            Nominal Insentif (Rp)
                          </label>
                          <CommaNumberInput
                            value={config.rate}
                            onChange={val => handleIncentiveChange(role, config.type, val)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-[#161823] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                    </div>

                    <div className="text-xs text-zinc-400">
                      Gaji Pokok: <strong className="text-zinc-200">{formatRupiah(emp.salaryRate)}</strong> / {emp.salaryType === 'hourly' ? 'Jam' : 'Hari'}
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
