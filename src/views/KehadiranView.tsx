import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AttendanceRecord, CurrentUser, Employee, UserRole } from '../types';
import { formatDateIndo, getTodayString, roleLabels, roleBadgeColors, formatAttendanceRole } from '../utils/formatters';
import { 
  CalendarCheck, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Edit3, 
  ArrowLeft, 
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  ClipboardList,
  PlusCircle
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';

interface KehadiranViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type KehadiranViewMode = 'menu' | 'input' | 'output';

export const KehadiranView: React.FC<KehadiranViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<KehadiranViewMode>('menu');
  const [inputStep, setInputStep] = useState<number>(1);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: ConfirmActionType;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'save',
    onConfirm: () => {},
  });

  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [date, setDate] = useState(getTodayString());
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('host');
  const [selectedRolesList, setSelectedRolesList] = useState<UserRole[]>([]);
  const [hoursWorked, setHoursWorked] = useState<number>(4);
  const [notes, setNotes] = useState('');

  const loadData = () => {
    const attList = StorageService.getAttendance(currentUser.storeId);
    setAttendanceList(attList);

    const empList = StorageService.getEmployees(currentUser.storeId);
    setEmployees(empList);

    if (empList.length > 0 && !selectedEmpId) {
      const matched = empList.find(e => e.id === currentUser.id) || empList[0];
      setSelectedEmpId(matched.id);
      setSelectedRole(matched.roles.join(','));
      setSelectedRolesList(matched.roles);
      setHoursWorked(matched.salaryType === 'hourly' ? 4 : 1);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.storeId]);

  const currentEmp = employees.find(e => e.id === selectedEmpId);

  const handleEmpChange = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setSelectedRole(emp.roles.join(','));
      setSelectedRolesList(emp.roles);
      setHoursWorked(emp.salaryType === 'hourly' ? 4 : 1);
    }
  };

  const handleToggleRoleCheckbox = (role: UserRole) => {
    let nextRoles: UserRole[];
    if (selectedRolesList.includes(role)) {
      if (selectedRolesList.length === 1) {
        onNotify('Minimal satu role harus dipilih!', 'info');
        return;
      }
      nextRoles = selectedRolesList.filter(r => r !== role);
    } else {
      nextRoles = [...selectedRolesList, role];
    }
    setSelectedRolesList(nextRoles);
    setSelectedRole(nextRoles.join(','));
  };

  const handleStartEdit = (att: AttendanceRecord) => {
    setEditingId(att.id);
    setDate(att.date);
    setSelectedEmpId(att.employeeId);
    setSelectedRole(att.role);
    const splitRoles = (att.role || '').split(',').map(r => r.trim()).filter(Boolean) as UserRole[];
    setSelectedRolesList(splitRoles.length > 0 ? splitRoles : ['host']);
    setHoursWorked(att.hoursWorked || (att.salaryType === 'hourly' ? 4 : 1));
    setNotes(att.notes || '');
    setInputStep(1);
    setViewMode('input');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDate(getTodayString());
    setNotes('');
    setInputStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) {
      onNotify('Pilih pegawai terlebih dahulu!', 'error');
      return;
    }

    const finalRoleStr = selectedRolesList.length > 0 ? selectedRolesList.join(',') : selectedRole;

    const record: AttendanceRecord = {
      id: editingId || 'att-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      employeeId: currentEmp.id,
      employeeName: currentEmp.name,
      role: finalRoleStr,
      rolesExecuted: selectedRolesList,
      salaryType: currentEmp.salaryType,
      hoursWorked: currentEmp.salaryType === 'hourly' ? (hoursWorked || 0) : 1,
      notes,
      createdAt: new Date().toISOString(),
    };

    const executeSave = () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      if (editingId) {
        const all = StorageService.getAttendance(currentUser.storeId);
        const updated = all.map(a => a.id === editingId ? record : a);
        localStorage.setItem('shopee_lr_attendance', JSON.stringify(updated));
        onNotify('Perubahan data kehadiran berhasil disimpan!', 'success');
      } else {
        StorageService.addAttendance(record);
        onNotify('Presensi kehadiran berhasil dicatat!', 'success');
      }

      loadData();
      handleCancelEdit();
      setViewMode('output');
    };

    setConfirmModal({
      isOpen: true,
      title: editingId ? 'Konfirmasi Simpan Perubahan Presensi' : 'Konfirmasi Simpan Presensi',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan presensi untuk ${currentEmp.name}?`
        : `Apakah Anda yakin ingin mencatat presensi untuk ${currentEmp.name} pada tanggal ${date}?`,
      type: editingId ? 'edit' : 'create',
      confirmText: editingId ? 'Ya, Simpan Perubahan' : 'Ya, Catat Presensi',
      onConfirm: executeSave,
    });
  };

  const handleDelete = (id: string, empName?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Hapus Presensi',
      message: `Apakah Anda yakin ingin menghapus data presensi ${empName ? `"${empName}"` : 'ini'}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus Data',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        StorageService.deleteAttendance(id);
        loadData();
        onNotify('Data kehadiran berhasil dihapus.', 'info');
        if (editingId === id) {
          handleCancelEdit();
        }
      },
    });
  };

  // Filter & sort list by date desc
  const filteredList = attendanceList
    .filter(a => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!a.employeeName.toLowerCase().includes(q) && !(a.notes || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (periodFilter === 'today') return a.date === getTodayString();
      if (periodFilter === 'range') return a.date >= startDate && a.date <= endDate;
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return a.date >= weekAgo && a.date <= getTodayString();
      }
      if (periodFilter === 'monthly') return a.date.startsWith(getTodayString().slice(0, 7));

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const todayCount = attendanceList.filter(a => a.date === getTodayString()).length;

  // ================= 1. MENU HUB STATE (2 Pilihan Grid) =================
  if (viewMode === 'menu') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-to-dashboard-kehadiran"
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
              <span>Kembali</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#25F4EE]" />
                <span>Presensi &amp; Kehadiran Shift</span>
              </h2>
            </div>
          </div>

          <div className="text-right text-xs text-zinc-400">
            Shift Hari Ini: <strong className="text-[#25F4EE]">{todayCount} Pegawai</strong>
          </div>
        </div>

        {/* Ringkasan Ringkas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Presensi Tercatat</div>
            <div className="text-sm sm:text-base font-black text-white">{attendanceList.length} shift</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10">
            <div className="text-[10px] text-zinc-400 font-semibold">Presensi Hari Ini</div>
            <div className="text-sm sm:text-base font-black text-[#25F4EE]">{todayCount} shift</div>
          </div>
          <div className="p-3 rounded-xl bg-[#161823] border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-zinc-400 font-semibold">Total Anggota Tim</div>
            <div className="text-sm sm:text-base font-black text-amber-300">{employees.length} orang</div>
          </div>
        </div>

        {/* Grid Kecil 2 Kesamping: Input vs Output */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-wider">
            Pilih Aksi:
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Card 1: Form Input Presensi */}
            <div
              id="menu-card-input-kehadiran"
              onClick={() => {
                handleCancelEdit();
                setInputStep(1);
                setViewMode('input');
              }}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#25F4EE] shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Form Presensi Kehadiran"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Catat kehadiran shift bertahap"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>Input data baru</span>
                <span className="text-[#25F4EE] font-bold">Buka Form</span>
              </div>
            </div>

            {/* Card 2: Laporan & Riwayat */}
            <div
              id="menu-card-output-kehadiran"
              onClick={() => setViewMode('output')}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#FE2C55]/40 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center text-[#FE2C55] shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <MarqueeText
                    text="Riwayat Presensi Tim"
                    as="h3"
                    className="text-xs sm:text-sm font-black text-white group-hover:text-[#FE2C55] transition-colors leading-tight"
                  />
                  <MarqueeText
                    text="Lihat rekap log kehadiran shift"
                    as="p"
                    speed={12}
                    className="text-[10px] sm:text-[11px] text-zinc-400 leading-snug"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                <span>{filteredList.length} Data Tersedia</span>
                <span className="text-[#FE2C55] font-bold">Buka Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. INPUT FORM STATE (Wizard 2 Tahap, Tanpa Tab) =================
  if (viewMode === 'input') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
          <button
            id="btn-back-menu-kehadiran"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setViewMode('menu');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Kembali ke Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white">
              {editingId ? '✏️ Edit Presensi' : 'Form Presensi Kehadiran'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
              Tahap {inputStep} dari 2
            </span>
          </div>
        </div>

        {/* Stepper Header Pills */}
        <div className="grid grid-cols-2 gap-2 bg-[#161823] p-2.5 rounded-2xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setInputStep(1)}
            className={`p-2 rounded-xl text-center font-bold transition flex items-center justify-center gap-2 ${
              inputStep === 1
                ? 'bg-[#25F4EE]/10 border border-[#25F4EE] text-[#25F4EE]'
                : 'bg-[#0b0c10] border border-white/5 text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
            <span>Tanggal &amp; Pegawai</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentEmp) setInputStep(2);
            }}
            className={`p-2 rounded-xl text-center font-bold transition flex items-center justify-center gap-2 ${
              inputStep === 2
                ? 'bg-[#25F4EE]/10 border border-[#25F4EE] text-[#25F4EE]'
                : 'bg-[#0b0c10] border border-white/5 text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
            <span>Role &amp; Jam Shift</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          {/* TAHAP 1: Tanggal & Pegawai */}
          {inputStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#25F4EE]" />
                  <span>Tahap 1: Pilih Tanggal &amp; Anggota Tim</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Tentukan tanggal shift dan pegawai yang bertugas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Presensi <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Pilih Pegawai <span className="text-[#FE2C55]">*</span>
                  </label>
                  <select
                    value={selectedEmpId}
                    onChange={e => handleEmpChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.roles.map(r => roleLabels[r] || r).join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentEmp && (
                <div className="p-3 rounded-xl bg-[#0b0c10] border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-400">Tipe Gaji: </span>
                    <strong className="text-white uppercase">{currentEmp.salaryType === 'hourly' ? 'Per Jam (Shift)' : 'Bulanan'}</strong>
                  </div>
                  <div className="text-zinc-400">
                    Peran Terdaftar: <strong className="text-[#25F4EE]">{currentEmp.roles.map(r => roleLabels[r] || r).join(', ')}</strong>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!currentEmp) {
                      onNotify('Pilih pegawai terlebih dahulu!', 'error');
                      return;
                    }
                    setInputStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
                >
                  <span>Tahap Selanjutnya: Role &amp; Jam Kerja</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAHAP 2: Role Penugasan & Jam Shift */}
          {inputStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#25F4EE]" />
                  <span>Tahap 2: Role Penugasan &amp; Jam Shift</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Pilih peran yang dijalankan hari ini dan durasi jam kerja.</p>
              </div>

              {currentEmp && (
                <div className="p-3.5 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#25F4EE]" />
                      <span>Role yang Dijalankan Hari Ini:</span>
                    </label>
                    {currentEmp.roles.length > 1 && (
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                        ✨ Rangkap Role ({currentEmp.roles.length})
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['host', 'admin', 'operator', 'packing', 'steam', 'sortir', 'kasir'] as UserRole[]).map(roleKey => {
                      const isRegistered = currentEmp.roles.includes(roleKey);
                      const isChecked = selectedRolesList.includes(roleKey);
                      return (
                        <label
                          key={roleKey}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-[#25F4EE]/10 border-[#25F4EE] text-white font-bold'
                              : 'bg-[#161823] border-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRoleCheckbox(roleKey)}
                            className="rounded accent-[#25F4EE] cursor-pointer"
                          />
                          <span className="truncate">{roleLabels[roleKey] || roleKey}</span>
                          {isRegistered && <span className="text-[9px] text-[#25F4EE] ml-auto">★</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Durasi Kerja (Jam)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={hoursWorked}
                      onChange={e => setHoursWorked(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">jam</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Catatan Shift / Pekerjaan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Misal: Live siang 13:00 - 17:00 & sortir"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setInputStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tahap Sebelumnya</span>
                </button>

                <button
                  id="btn-submit-attendance"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#FE2C55] text-white text-xs font-black shadow-lg shadow-[#FE2C55]/30 hover:bg-[#FE2C55]/90 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Simpan Presensi'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    );
  }

  // ================= 3. OUTPUT & LAPORAN STATE (Tanpa Tab) =================
  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
        <button
          id="btn-back-menu-from-output-kehadiran"
          type="button"
          onClick={() => setViewMode('menu')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Kembali ke Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-form-from-output-kehadiran"
            type="button"
            onClick={() => {
              handleCancelEdit();
              setInputStep(1);
              setViewMode('input');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Catat Presensi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama pegawai..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE]"
            />
          </div>

          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold"
          >
            <option value="all">Semua Periode</option>
            <option value="today">Hari Ini</option>
            <option value="weekly">7 Hari Terakhir</option>
            <option value="monthly">Bulan Ini</option>
          </select>
        </div>

        <div className="text-xs text-zinc-400 font-semibold">
          Total: <strong className="text-white">{filteredList.length}</strong> catatan
        </div>
      </div>

      {/* List of Attendance */}
      <div className="bg-[#161823] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-3.5 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#25F4EE]" />
            <span>Rekap Kehadiran Shift Tim</span>
          </h3>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Belum ada catatan presensi shift pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0c10]/60 text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="p-3 font-semibold">Tanggal</th>
                  <th className="p-3 font-semibold">Pegawai</th>
                  <th className="p-3 font-semibold">Role Shift</th>
                  <th className="p-3 font-semibold text-center">Durasi</th>
                  <th className="p-3 font-semibold">Catatan</th>
                  <th className="p-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map(att => (
                  <tr key={att.id} className="hover:bg-white/5 transition">
                    <td className="p-3 whitespace-nowrap font-medium text-zinc-300">
                      {formatDateIndo(att.date)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-bold text-white">
                      {att.employeeName}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        {formatAttendanceRole(att.role || 'host')}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-center font-bold text-[#25F4EE]">
                      {att.hoursWorked} jam
                    </td>
                    <td className="p-3 text-zinc-400 max-w-xs truncate">
                      {att.notes || '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(att)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25F4EE] transition cursor-pointer"
                        title="Edit Presensi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(att.id, `${att.employeeName} (${formatDateIndo(att.date)})`)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition cursor-pointer"
                        title="Hapus Presensi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
