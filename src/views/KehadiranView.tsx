import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { registerSubViewBackHandler } from '../services/navigation';
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
  PlusCircle,
  ChevronRight,
  Users,
  Calendar,
  ChevronDown,
  X
} from 'lucide-react';
import { ConfirmModal, ConfirmActionType } from '../components/ConfirmModal';
import { MarqueeText } from '../components/MarqueeText';
import { ThemedSelect } from '../components/ThemedSelect';
import { FuturisticEmployeeCard } from '../components/FuturisticEmployeeCard';
import { NeonCorners } from '../components/NeonCorners';

function formatScreenshotDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthName = months[monthIdx] || parts[1];
      return `${day} ${monthName} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

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
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'specific' | 'range'>('all');
  const [specificDate, setSpecificDate] = useState(getTodayString());
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailAtt, setSelectedDetailAtt] = useState<AttendanceRecord | null>(null);

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
    if (viewMode !== 'menu') {
      registerSubViewBackHandler(() => {
        setEditingId(null);
        setInputStep(1);
        setViewMode('menu');
        return true;
      });
    } else {
      registerSubViewBackHandler(null);
    }
    return () => registerSubViewBackHandler(null);
  }, [viewMode]);

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
      try {
        if (editingId) {
          StorageService.updateAttendance(record);
          onNotify('Perubahan data kehadiran berhasil disimpan!', 'success');
        } else {
          StorageService.addAttendance(record);
          onNotify('Presensi kehadiran berhasil dicatat!', 'success');
        }

        loadData();
        handleCancelEdit();
        setViewMode('output');
      } catch (err: any) {
        console.error('Error saving attendance:', err);
        onNotify('Gagal menyimpan presensi kehadiran: ' + (err?.message || 'Terjadi kesalahan sistem.'), 'error');
      }
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
      // Role filter
      if (roleFilter !== 'all') {
        const lowerRole = (a.role || '').toLowerCase();
        if (!lowerRole.includes(roleFilter.toLowerCase())) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!a.employeeName.toLowerCase().includes(q) && !(a.notes || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (periodFilter === 'today') return a.date === getTodayString();
      if (periodFilter === 'specific') return a.date === specificDate;
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
  return (
    <>
      {viewMode === 'menu' && (
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
          {/* Header Bar */}
          <div className="spatial-card relative overflow-hidden flex items-center justify-between p-3.5 rounded-2xl bg-[#161823] border border-white/10 shadow-lg">
            <NeonCorners variant="side-left" color="cyan" size="sm" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE] shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-white">Presensi &amp; Kehadiran</span>
            </div>

            <div className="text-right text-xs text-zinc-400 relative z-10">
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
                className="spatial-card relative overflow-hidden group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/60 hover:shadow-[0_0_20px_rgba(37,244,238,0.22)] transition cursor-pointer flex items-center justify-between gap-2.5 shadow-md active:scale-98"
              >
                <NeonCorners variant="side-left" color="cyan" size="sm" />
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE] shrink-0 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors leading-tight truncate">
                    Form Presensi Kehadiran
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#25F4EE] group-hover:translate-x-0.5 transition-all shrink-0 relative z-10" />
              </div>

              {/* Card 2: Laporan & Riwayat */}
              <div
                id="menu-card-output-kehadiran"
                onClick={() => setViewMode('output')}
                className="spatial-card relative overflow-hidden group p-3.5 sm:p-4 rounded-2xl bg-[#161823] hover:bg-[#1c1f2e] border border-white/10 hover:border-[#FE2C55]/60 hover:shadow-[0_0_20px_rgba(254,44,85,0.22)] transition cursor-pointer flex items-center justify-between gap-2.5 shadow-md active:scale-98"
              >
                <NeonCorners variant="side-left" color="magenta" size="sm" />
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#0b0c10] border border-[#FE2C55]/30 flex items-center justify-center text-[#FE2C55] shrink-0 group-hover:scale-105 transition-transform">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-[#FE2C55] transition-colors leading-tight truncate">
                    Riwayat Presensi Tim
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#FE2C55] group-hover:translate-x-0.5 transition-all shrink-0 relative z-10" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. INPUT FORM STATE (Wizard 2 Tahap, Tanpa Tab) ================= */}
      {viewMode === 'input' && (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 text-white font-sans">
          {/* Compact Form Header */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              id="btn-back-menu-kehadiran"
              type="button"
              onClick={() => {
                handleCancelEdit();
                setViewMode('menu');
              }}
              className="text-xs text-zinc-400 hover:text-[#FE2C55] transition flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Batal / Kembali ke Menu</span>
            </button>

            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20">
              Tahap {inputStep} dari 2
            </span>
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
              <span className="hidden sm:inline">Tanggal &amp; Pegawai</span>
              <span className="sm:hidden">Pegawai</span>
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
              <span className="hidden sm:inline">Role &amp; Jam Shift</span>
              <span className="sm:hidden">Jam Shift</span>
            </button>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="spatial-card relative overflow-hidden bg-[#161823] p-5 sm:p-6 rounded-3xl border border-white/15 shadow-2xl space-y-5">
            <NeonCorners variant="side-left" color="cyan" size="md" />
            <NeonCorners variant="side-right" color="magenta" size="sm" />
            <div className="relative z-10 space-y-5">
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

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tanggal Presensi <span className="text-[#FE2C55]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full sm:w-1/2 px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#25F4EE]" />
                      <span>Pilih Kartu Pegawai Bertugas <span className="text-[#FE2C55]">*</span></span>
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      {selectedEmpId ? '✓ Pegawai Terpilih' : 'Pilih kartu di bawah'}
                    </span>
                  </div>

                  {/* Grid Card Kecil Nama Pegawai: 2 ke samping, sisanya ke bawah */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    {employees.map(emp => {
                      const isSelected = selectedEmpId === emp.id;
                      return (
                        <FuturisticEmployeeCard
                          key={emp.id}
                          id={`card-kehadiran-emp-${emp.id}`}
                          name={emp.name}
                          username={emp.username}
                          roleLabel={emp.roles.map(r => roleLabels[r] || r).join(', ')}
                          isSelected={isSelected}
                          color="cyan"
                          variant="selectable"
                          onClick={() => handleEmpChange(emp.id)}
                        />
                      );
                    })}
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
            </div>
          </form>
        </div>
      )}

      {/* ================= 3. OUTPUT & LAPORAN STATE (STANDARDIZED SEPERTI CATATAN KAS) ================= */}
      {viewMode === 'output' && (() => {
        const periodLabelMap: Record<string, string> = {
          all: 'Semua Periode',
          today: 'Hari Ini',
          weekly: '7 Hari Terakhir',
          monthly: 'Bulan Ini',
          specific: 'Pilih Tanggal',
          range: 'Rentang Tanggal',
        };

        const totalHours = filteredList.reduce((acc, curr) => acc + (curr.hoursWorked || 0), 0);
        const uniqueEmployees = new Set(filteredList.map(a => a.employeeId || a.employeeName)).size;

        return (
          <div className="w-full min-h-screen bg-[#060b14] text-white">
            <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-4">
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#142239]">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    id="btn-back-menu-from-output-kehadiran"
                    type="button"
                    onClick={() => setViewMode('menu')}
                    className="p-1.5 sm:p-2 rounded-xl bg-[#0c1527] border border-[#162544] hover:bg-[#142239] text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                    title="Kembali ke Menu Presensi"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <div className="min-w-0">
                    <h1 className="text-sm xs:text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                      Riwayat Presensi Pegawai
                    </h1>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-slate-400 truncate">
                      Histori absensi kehadiran, shift kerja, dan jam kerja pegawai
                    </p>
                  </div>
                </div>

                <button
                  id="btn-open-form-from-output-kehadiran"
                  type="button"
                  onClick={() => {
                    handleCancelEdit();
                    setInputStep(1);
                    setViewMode('input');
                  }}
                  className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#00f2fe] hover:bg-[#19e6f1] active:scale-95 text-[#050811] font-extrabold text-[10px] sm:text-xs md:text-sm flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] transition cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#050811] stroke-[2.5]" />
                  <span>+ Presensi Baru</span>
                </button>
              </div>

              {/* =========================================================================
                  TOP SUMMARY CARDS (SELALU 3 KOLOM SESUAI GAMBAR)
                  ========================================================================= */}
              <div className="bg-[#0a1220] border border-[#142239] rounded-2xl p-1.5 xs:p-2 sm:p-4 shadow-xl">
                <div className="grid grid-cols-3 divide-x divide-[#142239]">
                  {/* 1. Total Shift Hadir */}
                  <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00e676]/10 border border-[#00e676] text-[#00e676] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                      </div>
                      <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                        Total Hadir
                      </span>
                    </div>
                    <div className="text-[#00e676] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                      {filteredList.length} Shift
                    </div>
                  </div>

                  {/* 2. Total Jam Kerja */}
                  <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe] text-[#00f2fe] flex items-center justify-center shrink-0">
                        <Clock className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-2.5 sm:h-2.5 stroke-[2.5]" />
                      </div>
                      <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                        Total Jam
                      </span>
                    </div>
                    <div className="text-[#00f2fe] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                      {totalHours} Jam
                    </div>
                  </div>

                  {/* 3. Pegawai Aktif */}
                  <div className="flex flex-col justify-center px-0.5 xs:px-1 sm:px-3 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4.5 sm:h-4.5 text-[#00d2ff] flex items-center justify-center shrink-0">
                        <Users className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                      </div>
                      <span className="text-[7px] xs:text-[7.5px] sm:text-[10px] md:text-xs font-semibold text-slate-200 whitespace-nowrap truncate">
                        Pegawai Aktif
                      </span>
                    </div>
                    <div className="text-[#00d2ff] font-black text-[8px] xs:text-[9px] sm:text-sm md:text-lg tracking-tight mt-0.5 whitespace-nowrap tabular-nums truncate">
                      {uniqueEmployees} Orang
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'host', label: 'Host Live' },
                  { key: 'sortir', label: 'Sortir' },
                  { key: 'steam', label: 'Steam' },
                  { key: 'admin', label: 'Admin Toko' },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setRoleFilter(f.key)}
                    className={`px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                      roleFilter === f.key
                        ? 'bg-[#00f2fe] text-black shadow-lg shadow-cyan-500/25'
                        : 'bg-[#0c1527] border border-[#162544] text-[#94a3b8] hover:text-white hover:bg-[#122038]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Second Row: Periode Dropdown & Search Input (Sebaris pas layar) */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Periode Picker Dropdown Pill */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                    className="bg-[#0a1322] border border-[#162544] hover:border-cyan-500/40 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between gap-1.5 sm:gap-2.5 cursor-pointer transition text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00e5ff] shrink-0" />
                      <div>
                        <span className="text-[7.5px] sm:text-[8.5px] text-slate-400 font-medium block leading-none">Periode</span>
                        <span className="text-[9px] sm:text-[11px] text-white font-semibold block leading-tight mt-0.5 whitespace-nowrap">
                          {periodLabelMap[periodFilter] || 'Semua Periode'}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>

                  {isPeriodDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-52 sm:w-56 rounded-2xl bg-[#0d1627] border border-[#1b2b48] shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95">
                      {[
                        { key: 'all', label: 'Semua Periode' },
                        { key: 'today', label: 'Hari Ini' },
                        { key: 'weekly', label: '7 Hari Terakhir' },
                        { key: 'monthly', label: 'Bulan Ini' },
                        { key: 'specific', label: '📅 Pilih Tanggal' },
                        { key: 'range', label: '📅 Rentang Tanggal' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setPeriodFilter(opt.key as any);
                            setIsPeriodDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                            periodFilter === opt.key
                              ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {periodFilter === opt.key && <CheckCircle2 className="w-3.5 h-3.5 text-[#00f2fe]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specific Date input if selected */}
                {periodFilter === 'specific' && (
                  <input
                    type="date"
                    value={specificDate}
                    onChange={e => setSpecificDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded-xl bg-[#0a1322] border border-[#162544] text-white outline-none focus:border-cyan-400"
                  />
                )}

                {/* Date Range inputs if selected */}
                {periodFilter === 'range' && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="px-1.5 py-1 text-[10px] rounded-lg bg-[#0a1322] border border-[#162544] text-white outline-none"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="px-1.5 py-1 text-[10px] rounded-lg bg-[#0a1322] border border-[#162544] text-white outline-none"
                    />
                  </div>
                )}

                {/* Search Box */}
                <div className="bg-[#0a1322] border border-[#162544] hover:border-cyan-500/40 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 flex-1 min-w-0 transition">
                  <Search className="w-3 h-3 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari nama pegawai / shift..."
                    className="w-full bg-transparent text-white placeholder-slate-500 text-[10px] sm:text-xs focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table Container (LEBAR PAS KE LAYAR 100% PERSIS SEPERTI GAMBAR) */}
              <div className="bg-[#09111e]/95 border border-[#14233c] rounded-2xl overflow-hidden shadow-2xl w-full">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-[#14233c] text-slate-300 font-semibold text-[6.5px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs bg-[#0a1220]">
                      <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[15%] whitespace-nowrap">Tanggal</th>
                      <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[35%] whitespace-nowrap">Keterangan</th>
                      <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Jam Shift</th>
                      <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-left w-[16.5%] whitespace-nowrap">Tipe Gaji</th>
                      <th className="py-1.5 sm:py-2.5 px-0.5 xs:px-1 sm:px-2 text-right w-[17%] whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132038]">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          Belum ada catatan presensi pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map(att => {
                        const iconBg = 'bg-[#062c2f] border border-[#0d6e6f] text-[#00f2fe]';
                        const firstChar = (att.employeeName || 'P').charAt(0).toUpperCase();

                        return (
                          <tr
                            key={att.id}
                            onClick={() => setSelectedDetailAtt(att)}
                            className="border-b border-[#132038] last:border-b-0 hover:bg-[#0e1c36] transition cursor-pointer group"
                            title="Klik untuk melihat detail presensi pegawai"
                          >
                            {/* Tanggal */}
                            <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs font-medium text-slate-300 whitespace-nowrap">
                              <span>{formatScreenshotDate(att.date)}</span>
                            </td>

                            {/* Keterangan: Icon + Employee Name + Role Badge */}
                            <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2">
                              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0">
                                <div className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm font-bold text-[7px] xs:text-[8px] sm:text-xs ${iconBg}`}>
                                  {firstChar}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[7px] xs:text-[7.5px] sm:text-[9.5px] md:text-xs font-bold text-white block leading-tight truncate group-hover:text-cyan-300 transition">
                                    {att.employeeName}
                                  </span>
                                  <span className="inline-block mt-0.5 text-[5.5px] xs:text-[6px] sm:text-[7px] font-semibold px-0.5 xs:px-1 py-[0.5px] rounded border bg-[#0d213b] text-[#38bdf8] border-[#1a4275] leading-none whitespace-nowrap">
                                    {att.role ? att.role.split(',').map(r => roleLabels[r as UserRole] || r).join(', ') : 'Host Live'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Jam Shift */}
                            <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                              <span className="text-[#00f2fe] font-bold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                                {att.hoursWorked} Jam
                              </span>
                            </td>

                            {/* Tipe Gaji */}
                            <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-left">
                              <span className="text-slate-300 text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs block truncate">
                                {att.salaryType === 'hourly' ? 'Per Jam' : 'Bulanan'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-1 xs:py-1.5 sm:py-2 px-0.5 xs:px-1 sm:px-2 text-right">
                              <span className="text-[#00e676] font-extrabold text-[6.5px] xs:text-[7px] sm:text-[8.5px] md:text-xs whitespace-nowrap tabular-nums block">
                                Hadir
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail Modal */}
            {selectedDetailAtt && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
                <div className="bg-[#0a1220] border border-[#1b2b48] rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4">
                  {/* Header Modal */}
                  <div className="flex items-center justify-between border-b border-[#14233c] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#00e676]/10 border border-[#00e676] flex items-center justify-center text-[#00e676]">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-white">Detail Presensi Shift</h3>
                        <p className="text-[10px] text-slate-400">{formatDateIndo(selectedDetailAtt.date)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDetailAtt(null)}
                      className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Jam Kerja Card */}
                  <div className="p-3 rounded-2xl bg-[#060b14] border border-[#142239] text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Durasi Shift</span>
                    <div className="text-xl sm:text-2xl font-black text-[#00f2fe] tabular-nums">
                      {selectedDetailAtt.hoursWorked} Jam Kerja
                    </div>
                  </div>

                  {/* Metadata Rows */}
                  <div className="space-y-2 text-xs divide-y divide-[#14233c]">
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400">Nama Pegawai:</span>
                      <span className="font-bold text-white">{selectedDetailAtt.employeeName}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400">Role Pekerjaan:</span>
                      <span className="font-semibold text-cyan-300">
                        {selectedDetailAtt.role ? selectedDetailAtt.role.split(',').map(r => roleLabels[r as UserRole] || r).join(', ') : 'Host Live'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400">Skema Penggajian:</span>
                      <span className="font-semibold text-white">
                        {selectedDetailAtt.salaryType === 'hourly' ? 'Hitungan Per Jam' : 'Gaji Pokok Bulanan/Harian'}
                      </span>
                    </div>

                    {selectedDetailAtt.notes && (
                      <div className="pt-2">
                        <span className="text-slate-400 block mb-1">Catatan Shift:</span>
                        <p className="text-white bg-[#060b14] p-2.5 rounded-xl border border-[#142239] text-[11px] leading-relaxed">
                          {selectedDetailAtt.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#14233c]">
                    <button
                      type="button"
                      onClick={() => {
                        const item = selectedDetailAtt;
                        handleDelete(item.id, `${item.employeeName} (${formatDateIndo(item.date)})`);
                        setSelectedDetailAtt(null);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[#ff3366] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const item = selectedDetailAtt;
                        setSelectedDetailAtt(null);
                        handleStartEdit(item);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-[#00f2fe] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDetailAtt(null)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
