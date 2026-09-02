import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AttendanceRecord, CurrentUser, Employee, UserRole, SalaryType } from '../types';
import { formatNumber, formatDateIndo, getTodayString, roleLabels, roleBadgeColors } from '../utils/formatters';
import { ViewSubNav, SubTabType } from '../components/ViewSubNav';
import { 
  CalendarCheck, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  User, 
  UserCheck, 
  Edit3, 
  ArrowLeft, 
  Filter, 
  Search 
} from 'lucide-react';

interface KehadiranViewProps {
  currentUser: CurrentUser;
  onBackToDashboard: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const KehadiranView: React.FC<KehadiranViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('output');
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'range' | 'weekly' | 'monthly'>('all');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [date, setDate] = useState(getTodayString());
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('host');
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
      setSelectedRole(matched.roles[0] || 'host');
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
      setSelectedRole(emp.roles[0] || 'host');
      setHoursWorked(emp.salaryType === 'hourly' ? 4 : 1);
    }
  };

  const handleStartEdit = (att: AttendanceRecord) => {
    setEditingId(att.id);
    setDate(att.date);
    setSelectedEmpId(att.employeeId);
    setSelectedRole(att.role);
    setHoursWorked(att.hoursWorked);
    setNotes(att.notes || '');
    setSubTab('input'); // Switch to input form smoothly (Requirement 7)
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDate(getTodayString());
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) {
      onNotify('Pilih pegawai terlebih dahulu!', 'error');
      return;
    }

    const record: AttendanceRecord = {
      id: editingId || 'att-' + Date.now(),
      storeId: currentUser.storeId,
      date,
      employeeId: currentEmp.id,
      employeeName: currentEmp.name,
      role: selectedRole,
      salaryType: currentEmp.salaryType,
      hoursWorked: currentEmp.salaryType === 'hourly' ? hoursWorked : 1,
      notes,
      createdAt: new Date().toISOString(),
    };

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
    setEditingId(null);
    setNotes('');
    setSubTab('output');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus data kehadiran ini?')) {
      StorageService.deleteAttendance(id);
      loadData();
      onNotify('Data kehadiran berhasil dihapus.', 'info');
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  // Filter & sort list by date desc (Requirement 9)
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans">
      {/* Header without stage labels (Requirement 5 & 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-dashboard-kehadiran"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#161823] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Presensi Kehadiran &amp; Jam Kerja
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Catatan kehadiran shift atau jam kerja per pegawai sebagai dasar perhitungan slip gaji
            </p>
          </div>
        </div>
      </div>

      {/* Sub Navigation (Requirement 7) */}
      <ViewSubNav
        currentSubTab={subTab}
        onChangeSubTab={setSubTab}
        inputTitle={editingId ? '✏️ Sedang Mengedit Presensi' : 'Input Absensi'}
        outputTitle="Riwayat Presensi &amp; Jam Kerja"
      />

      {/* TAB 1: FORM INPUT / EDIT */}
      {subTab === 'input' && (
        <div className="max-w-3xl mx-auto bg-[#161823] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-[#FE2C55]" /> : <CalendarCheck className="w-5 h-5 text-[#25F4EE]" />}
              <span>{editingId ? 'Edit Presensi Kehadiran' : 'Input Presensi Kehadiran Pegawai'}</span>
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  required
                  value={selectedEmpId}
                  onChange={e => handleEmpChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.roles.join(', ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {currentEmp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Role yang Dijalankan
                  </label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-semibold focus:border-[#25F4EE]"
                  >
                    {currentEmp.roles.map(r => (
                      <option key={r} value={r}>
                        {roleLabels[r]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {currentEmp.salaryType === 'hourly' ? 'Lama Kerja (Jam)' : 'Status Kehadiran'}
                  </label>
                  {currentEmp.salaryType === 'hourly' ? (
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      required
                      value={hoursWorked}
                      onChange={e => setHoursWorked(Number(e.target.value))}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white font-bold focus:border-[#25F4EE]"
                    />
                  ) : (
                    <div className="px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-[#25F4EE] font-bold">
                      1 Shift Harian Masuk
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Catatan / Keterangan Tambahan
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Sesi live siang 13:00 - 17:00"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:border-[#25F4EE]"
              />
            </div>

            <button
              id="btn-submit-attendance"
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs font-black text-white bg-[#FE2C55] hover:bg-[#FE2C55]/90 border border-[#FE2C55]/50 shadow-lg shadow-[#FE2C55]/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{editingId ? 'Simpan Perubahan Kehadiran' : 'Catat Presensi Kehadiran'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: OUTPUT & LAPORAN */}
      {subTab === 'output' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-[#161823] rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-60">
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
                <option value="weekly">7 Hari</option>
                <option value="monthly">Bulan Ini</option>
              </select>
            </div>

            <button
              onClick={() => {
                handleCancelEdit();
                setSubTab('input');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md cursor-pointer"
            >
              + Catat Kehadiran
            </button>
          </div>

          {/* List of Attendance (Sorted by date desc) */}
          <div className="bg-[#161823] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 bg-[#0b0c10] border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Riwayat Presensi ({filteredList.length})
              </h3>
            </div>

            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Belum ada data kehadiran pada filter ini.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredList.map(item => (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {item.employeeName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0b0c10] text-[#25F4EE] border border-[#25F4EE]/30">
                          {roleLabels[item.role]}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {formatDateIndo(item.date)}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400">
                        {item.salaryType === 'hourly' ? `${item.hoursWorked} Jam Kerja` : '1 Shift Harian'}
                        {item.notes && <span className="text-zinc-500 italic ml-2">"{item.notes}"</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-2 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] hover:bg-[#25F4EE]/20 transition cursor-pointer"
                        title="Edit Presensi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                        title="Hapus Presensi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
