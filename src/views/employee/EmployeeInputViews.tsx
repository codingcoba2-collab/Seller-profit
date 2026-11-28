import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import {
  AttendanceRecord,
  BallInventory,
  CurrentUser,
  Employee,
  InventoryUnitType,
  SaleFormat,
  SalesChannel,
  SalesRecord,
  SalesType,
  SteamSortirRecord,
  UserRole,
} from '../../types';
import {
  evaluateBallQuality,
  formatDateIndo,
  formatNumber,
  formatRupiah,
  getTodayString,
  inventoryUnitLabels,
  roleLabels,
} from '../../utils/formatters';
import { CommaNumberInput } from '../../components/CommaNumberInput';
import { EmployeeConfirmModal } from './EmployeeConfirmModal';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Package,
  Ruler,
  TrendingUp,
} from 'lucide-react';

export type EmployeeInputSubTab = 'kehadiran' | 'penjualan' | 'stok' | 'pengukuran';

interface EmployeeInputViewsProps {
  activeSubTab: EmployeeInputSubTab;
  onChangeSubTab: (tab: EmployeeInputSubTab) => void;
  currentUser: CurrentUser;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onDoneNavigateToData: (dataTab: EmployeeInputSubTab) => void;
  editingAttendance?: AttendanceRecord | null;
  editingSale?: SalesRecord | null;
  editingInventory?: BallInventory | null;
  editingMeasurement?: SteamSortirRecord | null;
  onClearEditing: () => void;
}

const INPUT_TABS: { key: EmployeeInputSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'kehadiran', label: 'Kehadiran', icon: CalendarCheck },
  { key: 'penjualan', label: 'Penjualan', icon: TrendingUp },
  { key: 'stok', label: 'Stok', icon: Package },
  { key: 'pengukuran', label: 'Pengukuran', icon: Ruler },
];

const ALL_WORK_ROLES: UserRole[] = ['host', 'admin_toko', 'sortir', 'steam'];

export const EmployeeInputViews: React.FC<EmployeeInputViewsProps> = ({
  activeSubTab,
  onChangeSubTab,
  currentUser,
  onNotify,
  onDoneNavigateToData,
  editingAttendance,
  editingSale,
  editingInventory,
  editingMeasurement,
  onClearEditing,
}) => {
  const storeId = currentUser.storeId;
  const [employees, setEmployees] = useState<Employee[]>(() => StorageService.getEmployees(storeId));
  const [inventoryList, setInventoryList] = useState<BallInventory[]>(() => StorageService.getInventory(storeId));

  useEffect(() => {
    const refresh = () => {
      setEmployees(StorageService.getEmployees(storeId));
      setInventoryList(StorageService.getInventory(storeId));
    };
    const unsub = StorageService.subscribe(refresh);
    return () => unsub();
  }, [storeId]);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // =========================================================================
  // 1. KEHADIRAN STATE
  // =========================================================================
  const defaultEmp = employees.find(
    (e) => e.id === currentUser.id || e.username.toLowerCase() === currentUser.username.toLowerCase()
  ) || employees[0];

  const [attDate, setAttDate] = useState(getTodayString());
  const [attEmpId, setAttEmpId] = useState(defaultEmp?.id || currentUser.id);
  const [attRoles, setAttRoles] = useState<UserRole[]>(
    defaultEmp?.roles?.filter((r) => ALL_WORK_ROLES.includes(r)) || ['host']
  );
  const [attHours, setAttHours] = useState<number>(defaultEmp?.salaryType === 'hourly' ? 4 : 1);
  const [attNotes, setAttNotes] = useState('');

  useEffect(() => {
    if (editingAttendance) {
      setAttDate(editingAttendance.date || getTodayString());
      setAttEmpId(editingAttendance.employeeId);
      const parsedRoles = (editingAttendance.role || '')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean) as UserRole[];
      setAttRoles(parsedRoles.length > 0 ? parsedRoles : ['host']);
      setAttHours(editingAttendance.hoursWorked || 4);
      setAttNotes(editingAttendance.notes || '');
    }
  }, [editingAttendance]);

  const selectedAttEmp = employees.find((e) => e.id === attEmpId) || defaultEmp;

  const handleToggleAttRole = (role: UserRole) => {
    if (attRoles.includes(role)) {
      if (attRoles.length <= 1) {
        onNotify('Minimal satu role pekerjaan harus dipilih.', 'info');
        return;
      }
      setAttRoles(attRoles.filter((r) => r !== role));
    } else {
      setAttRoles([...attRoles, role]);
    }
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const empName = selectedAttEmp?.name || currentUser.name;
    const empSalaryType = selectedAttEmp?.salaryType || 'hourly';
    const record: AttendanceRecord = {
      id: editingAttendance ? editingAttendance.id : 'att-' + Date.now(),
      storeId,
      date: attDate,
      employeeId: selectedAttEmp?.id || currentUser.id,
      employeeName: empName,
      role: attRoles.join(','),
      rolesExecuted: attRoles,
      salaryType: empSalaryType,
      hoursWorked: empSalaryType === 'hourly' ? Math.max(0.5, attHours || 1) : 1,
      notes: attNotes.trim(),
      createdAt: editingAttendance ? editingAttendance.createdAt : new Date().toISOString(),
    };

    setConfirmState({
      isOpen: true,
      title: editingAttendance ? 'Simpan Perubahan Kehadiran' : 'Simpan Data Kehadiran',
      message: `${editingAttendance ? 'Perbarui' : 'Catat'} kehadiran untuk ${empName} pada tanggal ${formatDateIndo(attDate)}?`,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        if (editingAttendance) {
          StorageService.updateAttendance(record);
          onNotify('Data kehadiran berhasil diperbarui.', 'success');
        } else {
          StorageService.addAttendance(record);
          onNotify('Kehadiran berhasil dicatat.', 'success');
        }
        onClearEditing();
        setAttNotes('');
        onDoneNavigateToData('kehadiran');
      },
    });
  };

  // =========================================================================
  // 2. PENJUALAN STATE
  // =========================================================================
  const [saleDate, setSaleDate] = useState(getTodayString());
  const [saleType, setSaleType] = useState<SalesType>('live');
  const [saleChannel, setSaleChannel] = useState<SalesChannel>('tiktok');
  const [saleFormat, setSaleFormat] = useState<SaleFormat>('bundling');
  const [saleOmzet, setSaleOmzet] = useState<number>(0);
  const [salePcs, setSalePcs] = useState<number>(0);
  const [salePackages, setSalePackages] = useState<number>(0);
  const [saleHours, setSaleHours] = useState<number>(2);
  const [saleHostIds, setSaleHostIds] = useState<string[]>(
    currentUser.roles?.includes('host') ? [currentUser.id] : []
  );
  const [saleAdminIds, setSaleAdminIds] = useState<string[]>(
    currentUser.roles?.includes('admin_toko') ? [currentUser.id] : []
  );
  const [saleAds, setSaleAds] = useState<number>(0);
  const [saleCoin, setSaleCoin] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');

  useEffect(() => {
    if (editingSale) {
      setSaleDate(editingSale.date || getTodayString());
      setSaleType(editingSale.salesType === 'non_live' ? 'non_live' : 'live');
      setSaleChannel((editingSale.salesChannel as SalesChannel) || 'tiktok');
      setSaleFormat(editingSale.saleFormat || 'bundling');
      setSaleOmzet(editingSale.omzet || 0);
      setSalePcs(editingSale.pcsSold || 0);
      setSalePackages(editingSale.packagesSold || 0);
      setSaleHours(editingSale.hoursWorked || 2);
      setSaleHostIds(editingSale.hostIds || []);
      setSaleAdminIds(editingSale.adminIds || (editingSale.adminId ? [editingSale.adminId] : []));
      setSaleAds(editingSale.adsUsed || 0);
      setSaleCoin(editingSale.coinUsed || 0);
      setSaleNotes(editingSale.notes || '');
    }
  }, [editingSale]);

  const hostEmployees = employees.filter((e) => e.roles?.includes('host'));
  const adminEmployees = employees.filter((e) => e.roles?.includes('admin_toko') || e.roles?.includes('manager'));

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleOmzet <= 0) {
      onNotify('Nominal omzet penjualan harus lebih dari Rp 0.', 'error');
      return;
    }
    if (salePcs <= 0) {
      onNotify('Jumlah pcs terjual harus lebih dari 0.', 'error');
      return;
    }

    const cleanLabel = StorageService.getCleanChannelName(saleChannel);
    const hostNames = saleHostIds
      .map((id) => employees.find((e) => e.id === id)?.name)
      .filter(Boolean) as string[];
    const adminNames = saleAdminIds
      .map((id) => employees.find((e) => e.id === id)?.name)
      .filter(Boolean) as string[];

    const record: SalesRecord = {
      id: editingSale ? editingSale.id : (saleType === 'live' ? 'sale-' : 'sale-nonlive-') + Date.now(),
      storeId,
      date: saleDate,
      salesType: saleType,
      salesChannel: saleChannel,
      channelName: cleanLabel,
      category: editingSale?.category || 'pakaian_jadi',
      saleFormat: saleType === 'live' ? saleFormat : 'satuan',
      hostIds: saleType === 'live' ? saleHostIds : [],
      hostNames: saleType === 'live' ? hostNames : [],
      adminIds: saleAdminIds,
      adminNames,
      adminId: saleAdminIds[0] || '',
      adminName: adminNames[0] || '',
      omzet: saleOmzet,
      pcsSold: salePcs,
      packagesSold: salePackages > 0 ? salePackages : salePcs,
      hoursWorked: saleType === 'live' ? saleHours : undefined,
      adsUsed: saleAds,
      coinUsed: saleType === 'live' ? saleCoin : 0,
      notes: saleNotes.trim(),
      recordedBy: currentUser.name,
      createdAt: editingSale ? editingSale.createdAt : new Date().toISOString(),
    };

    setConfirmState({
      isOpen: true,
      title: editingSale ? 'Simpan Perubahan Penjualan' : 'Simpan Data Penjualan',
      message: `${editingSale ? 'Perbarui' : 'Catat'} penjualan ${cleanLabel} senilai ${formatRupiah(saleOmzet)} (${formatNumber(salePcs)} pcs)?`,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        if (editingSale) {
          StorageService.updateSale(record);
          onNotify('Data penjualan berhasil diperbarui.', 'success');
        } else {
          StorageService.addSale(record);
          onNotify('Data penjualan berhasil disimpan.', 'success');
        }
        onClearEditing();
        setSaleOmzet(0);
        setSalePcs(0);
        setSalePackages(0);
        setSaleAds(0);
        setSaleCoin(0);
        setSaleNotes('');
        onDoneNavigateToData('penjualan');
      },
    });
  };

  // =========================================================================
  // 3. STOK STATE
  // =========================================================================
  const [stokDate, setStokDate] = useState(getTodayString());
  const [stokName, setStokName] = useState('');
  const [stokUnit, setStokUnit] = useState<InventoryUnitType>('ball_karung');
  const [stokPcs, setStokPcs] = useState<number>(0);
  const [stokWeightKg, setStokWeightKg] = useState<number>(45);
  const [stokModalPrice, setStokModalPrice] = useState<number>(0);
  const [stokShipping, setStokShipping] = useState<number>(0);
  const [stokNotes, setStokNotes] = useState('');

  useEffect(() => {
    if (editingInventory) {
      setStokDate(editingInventory.date || getTodayString());
      setStokName(editingInventory.ballType || '');
      setStokUnit(editingInventory.unitType || 'ball_karung');
      setStokPcs(editingInventory.pcsCount || 0);
      setStokWeightKg(editingInventory.weightKg || 45);
      setStokModalPrice(editingInventory.modalPrice || 0);
      setStokShipping(editingInventory.shippingCost || 0);
      setStokNotes(editingInventory.notes || '');
    }
  }, [editingInventory]);

  const handleSaveStok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stokName.trim()) {
      onNotify('Nama barang / kode ball wajib diisi.', 'error');
      return;
    }
    if (stokPcs <= 0) {
      onNotify('Jumlah stok masuk (pcs) harus lebih dari 0.', 'error');
      return;
    }

    const totalCost = (stokModalPrice || 0) + (stokShipping || 0);
    const hpp = stokPcs > 0 ? Math.round(totalCost / stokPcs) : 0;

    const record: BallInventory = {
      id: editingInventory ? editingInventory.id : 'ball-' + Date.now(),
      storeId,
      date: stokDate,
      ballType: stokName.trim(),
      weightKg: stokWeightKg || undefined,
      category: editingInventory?.category || 'pakaian_jadi',
      unitType: stokUnit,
      modalPrice: stokModalPrice || 0,
      pcsCount: stokPcs,
      shippingCost: stokShipping || 0,
      steamCost: editingInventory?.steamCost || 0,
      sortirCost: editingInventory?.sortirCost || 0,
      hppPerPcs: hpp,
      returnMechanism: editingInventory?.returnMechanism || 'detail',
      estimateReturnPercentage: editingInventory?.estimateReturnPercentage || 3,
      notes: stokNotes.trim(),
      createdAt: editingInventory ? editingInventory.createdAt : new Date().toISOString(),
    };

    setConfirmState({
      isOpen: true,
      title: editingInventory ? 'Simpan Perubahan Stok' : 'Simpan Stok Masuk',
      message: `${editingInventory ? 'Perbarui' : 'Catat'} stok "${stokName.trim()}" sebanyak ${formatNumber(stokPcs)} pcs?`,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        if (editingInventory) {
          StorageService.updateInventory(record);
          onNotify('Data stok berhasil diperbarui.', 'success');
        } else {
          StorageService.addInventory(record);
          onNotify('Stok masuk berhasil dicatat.', 'success');
        }
        onClearEditing();
        setStokName('');
        setStokPcs(0);
        setStokModalPrice(0);
        setStokShipping(0);
        setStokNotes('');
        onDoneNavigateToData('stok');
      },
    });
  };

  // =========================================================================
  // 4. PENGUKURAN STATE (Sortir, QC & Ukur Barang)
  // =========================================================================
  const [measDate, setMeasDate] = useState(getTodayString());
  const [measInventoryId, setMeasInventoryId] = useState('');
  const [measBallName, setMeasBallName] = useState('');
  const [measProcess, setMeasProcess] = useState<'sortir' | 'steam' | 'sortir_dan_steam'>('sortir');
  const [measWeightKg, setMeasWeightKg] = useState<number>(45);
  const [measKepala, setMeasKepala] = useState<number>(0);
  const [measBadan, setMeasBadan] = useState<number>(0);
  const [measKaki, setMeasKaki] = useState<number>(0);
  const [measTotal, setMeasTotal] = useState<number>(0);
  const [measReject, setMeasReject] = useState<number>(0);
  const [measEmpIds, setMeasEmpIds] = useState<string[]>([currentUser.id]);
  const [measNotes, setMeasNotes] = useState('');

  useEffect(() => {
    if (editingMeasurement) {
      setMeasDate(editingMeasurement.date || getTodayString());
      setMeasInventoryId(editingMeasurement.ballInventoryId || editingMeasurement.inventoryBallId || '');
      setMeasBallName(editingMeasurement.ballName || '');
      setMeasProcess(editingMeasurement.processType || 'sortir');
      setMeasWeightKg(editingMeasurement.ballWeightKg || 45);
      setMeasKepala(editingMeasurement.pcsKepala || 0);
      setMeasBadan(editingMeasurement.pcsBadan || 0);
      setMeasKaki(editingMeasurement.pcsKaki || 0);
      setMeasTotal(editingMeasurement.pcsTotal || editingMeasurement.totalPcsProcessed || 0);
      setMeasReject(editingMeasurement.pcsReject || 0);
      setMeasEmpIds(
        editingMeasurement.employeeIds && editingMeasurement.employeeIds.length > 0
          ? editingMeasurement.employeeIds
          : [currentUser.id]
      );
      setMeasNotes(editingMeasurement.notes || '');
    }
  }, [editingMeasurement, currentUser.id]);

  const handleSelectMeasInventory = (ballId: string) => {
    setMeasInventoryId(ballId);
    const found = inventoryList.find((b) => b.id === ballId);
    if (found) {
      setMeasBallName(found.ballType);
      if (found.weightKg) setMeasWeightKg(found.weightKg);
      if (found.pcsCount) setMeasTotal(found.pcsCount);
    }
  };

  const handleClassUpdate = (k: number, b: number, f: number) => {
    setMeasKepala(k);
    setMeasBadan(b);
    setMeasKaki(f);
    const sum = k + b + f;
    if (sum > 0) setMeasTotal(sum);
  };

  const measLayakJual = Math.max(0, (measTotal || 0) - (measReject || 0));

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = measBallName.trim();
    if (!finalName) {
      onNotify('Pilih dari stok atau ketik nama barang/ball yang diukur.', 'error');
      return;
    }
    if (measTotal <= 0) {
      onNotify('Total barang yang diukur (pcs) harus lebih dari 0.', 'error');
      return;
    }

    const empNames = measEmpIds
      .map((id) => employees.find((e) => e.id === id)?.name)
      .filter(Boolean) as string[];

    const record: SteamSortirRecord = {
      id: editingMeasurement ? editingMeasurement.id : 'steam-sortir-' + Date.now(),
      storeId,
      date: measDate,
      ballInventoryId: measInventoryId || undefined,
      inventoryBallId: measInventoryId || undefined,
      ballName: finalName,
      ballWeightKg: measWeightKg || 45,
      processType: measProcess,
      employeeIds: measEmpIds.length > 0 ? measEmpIds : [currentUser.id],
      employeeNames: empNames.length > 0 ? empNames : [currentUser.name],
      pcsKepala: measKepala || 0,
      pcsBadan: measBadan || 0,
      pcsKaki: measKaki || 0,
      ballQuality: evaluateBallQuality(measKepala || 0, measTotal),
      pcsTotal: measTotal,
      totalPcsProcessed: measTotal,
      pcsLayakJual: measLayakJual,
      pcsReject: measReject || 0,
      costPerPcs: 0,
      totalCost: 0,
      status: 'selesai',
      notes: measNotes.trim(),
      recordedBy: currentUser.name,
      createdAt: editingMeasurement ? editingMeasurement.createdAt : new Date().toISOString(),
    };

    setConfirmState({
      isOpen: true,
      title: editingMeasurement ? 'Simpan Perubahan Pengukuran' : 'Simpan Data Pengukuran',
      message: `${editingMeasurement ? 'Perbarui' : 'Simpan'} hasil pengukuran "${finalName}" sebanyak ${formatNumber(measTotal)} pcs (${formatNumber(measLayakJual)} layak jual)?`,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        if (editingMeasurement) {
          StorageService.updateSteamSortir(record);
          onNotify('Data pengukuran barang berhasil diperbarui.', 'success');
        } else {
          StorageService.addSteamSortir(record);
          onNotify('Data pengukuran barang berhasil disimpan.', 'success');
        }
        onClearEditing();
        setMeasInventoryId('');
        setMeasBallName('');
        setMeasKepala(0);
        setMeasBadan(0);
        setMeasKaki(0);
        setMeasTotal(0);
        setMeasReject(0);
        setMeasNotes('');
        onDoneNavigateToData('pengukuran');
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl overflow-x-auto">
        {INPUT_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                onClearEditing();
                onChangeSubTab(tab.key);
              }}
              className={`flex-1 min-w-[92px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* FORM 1: INPUT KEHADIRAN */}
      {/* ===================================================================== */}
      {activeSubTab === 'kehadiran' && (
        <form onSubmit={handleSaveAttendance} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingAttendance ? 'Edit Data Kehadiran' : 'Input Kehadiran'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat absensi shift atau jam kerja untuk sinkronisasi perhitungan gaji
              </p>
            </div>
            {editingAttendance && (
              <button
                type="button"
                onClick={onClearEditing}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Kehadiran</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pegawai</label>
              <select
                value={attEmpId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setAttEmpId(nextId);
                  const found = employees.find((x) => x.id === nextId);
                  if (found) {
                    const workRoles = found.roles.filter((r) => ALL_WORK_ROLES.includes(r));
                    if (workRoles.length > 0) setAttRoles(workRoles);
                    setAttHours(found.salaryType === 'hourly' ? 4 : 1);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              >
                {employees.length === 0 ? (
                  <option value={currentUser.id}>{currentUser.name}</option>
                ) : (
                  employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.roles.map((r) => roleLabels[r] || r).join(', ')})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Role Pekerjaan Saat Hadir</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_WORK_ROLES.map((r) => {
                const checked = attRoles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleToggleAttRole(r)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer text-center ${
                      checked
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {roleLabels[r] || r}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {selectedAttEmp?.salaryType === 'daily' ? 'Jumlah Shift (Harian)' : 'Durasi Kerja (Jam)'}
              </label>
              {selectedAttEmp?.salaryType === 'daily' ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700">
                  1 Shift Harian
                </div>
              ) : (
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={attHours}
                  onChange={(e) => setAttHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold font-mono-num"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan (Opsional)</label>
              <input
                type="text"
                value={attNotes}
                onChange={(e) => setAttNotes(e.target.value)}
                placeholder="Misal: Shift pagi, lembur live"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onDoneNavigateToData('kehadiran')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Lihat Data Kehadiran
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingAttendance ? 'Simpan Perubahan' : 'Simpan Kehadiran'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* FORM 2: INPUT PENJUALAN */}
      {/* ===================================================================== */}
      {activeSubTab === 'penjualan' && (
        <form onSubmit={handleSaveSale} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingSale ? 'Edit Data Penjualan' : 'Input Penjualan'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat omzet, pcs terjual, dan channel penjualan secara langsung
              </p>
            </div>
            {editingSale && (
              <button
                type="button"
                onClick={onClearEditing}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipe Penjualan</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSaleType('live')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    saleType === 'live' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Live Streaming
                </button>
                <button
                  type="button"
                  onClick={() => setSaleType('non_live')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    saleType === 'non_live' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Non-Live / Toko
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Channel</label>
              <select
                value={saleChannel}
                onChange={(e) => setSaleChannel(e.target.value as SalesChannel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              >
                <option value="tiktok">TikTok</option>
                <option value="shopee">Shopee</option>
                <option value="tokopedia">Tokopedia</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="offline">Offline</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Omzet (Rp)</label>
              <CommaNumberInput
                value={saleOmzet}
                onChange={setSaleOmzet}
                prefix="Rp"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jumlah Pcs Terjual</label>
              <CommaNumberInput
                value={salePcs}
                onChange={(val) => {
                  setSalePcs(val);
                  if (salePackages === 0) setSalePackages(val);
                }}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jumlah Paket / Order</label>
              <CommaNumberInput
                value={salePackages}
                onChange={setSalePackages}
                suffix="pkt"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
              />
            </div>
          </div>

          {saleType === 'live' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Format Penjualan</label>
                <select
                  value={saleFormat}
                  onChange={(e) => setSaleFormat(e.target.value as SaleFormat)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  <option value="bundling">Bundling (Paket)</option>
                  <option value="satuan">Satuan (Pcs)</option>
                  <option value="campuran">Campuran</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Durasi Live (Jam)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0.5}
                    max={24}
                    step={0.5}
                    value={saleHours}
                    onChange={(e) => setSaleHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold font-mono-num pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                    jam
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Host & Admin chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {saleType === 'live' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Host Live Bertugas</label>
                <div className="flex flex-wrap gap-1.5">
                  {(hostEmployees.length > 0 ? hostEmployees : employees).map((emp) => {
                    const selected = saleHostIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() =>
                          setSaleHostIds((prev) =>
                            prev.includes(emp.id) ? prev.filter((x) => x !== emp.id) : [...prev, emp.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                          selected
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {emp.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Toko / Kasir</label>
              <div className="flex flex-wrap gap-1.5">
                {(adminEmployees.length > 0 ? adminEmployees : employees).map((emp) => {
                  const selected = saleAdminIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() =>
                        setSaleAdminIds((prev) =>
                          prev.includes(emp.id) ? prev.filter((x) => x !== emp.id) : [...prev, emp.id]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        selected
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {emp.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Biaya Iklan (Opsional)</label>
              <CommaNumberInput
                value={saleAds}
                onChange={setSaleAds}
                prefix="Rp"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
              />
            </div>

            {saleType === 'live' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Koin Live (Opsional)</label>
                <CommaNumberInput
                  value={saleCoin}
                  onChange={setSaleCoin}
                  prefix="Rp"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
                />
              </div>
            )}

            <div className={saleType === 'live' ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan (Opsional)</label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Keterangan sesi atau nomor resi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onDoneNavigateToData('penjualan')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Lihat Data Penjualan
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingSale ? 'Simpan Perubahan' : 'Simpan Penjualan'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* FORM 3: INPUT STOK */}
      {/* ===================================================================== */}
      {activeSubTab === 'stok' && (
        <form onSubmit={handleSaveStok} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingInventory ? 'Edit Stok Barang' : 'Input Stok Masuk'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat barang masuk untuk memperbarui jumlah stok tersedia secara otomatis
              </p>
            </div>
            {editingInventory && (
              <button
                type="button"
                onClick={onClearEditing}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Stok Masuk</label>
              <input
                type="date"
                value={stokDate}
                onChange={(e) => setStokDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Barang / Kode Ball</label>
              <input
                type="text"
                value={stokName}
                onChange={(e) => setStokName(e.target.value)}
                placeholder="Misal: Ball Hoodie Korea #12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Satuan Kemasan</label>
              <select
                value={stokUnit}
                onChange={(e) => setStokUnit(e.target.value as InventoryUnitType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              >
                {Object.entries(inventoryUnitLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jumlah Stok Masuk (Pcs)</label>
              <CommaNumberInput
                value={stokPcs}
                onChange={setStokPcs}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Berat (Kg) - Opsional</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={stokWeightKg}
                onChange={(e) => setStokWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Harga Modal (Opsional)</label>
              <CommaNumberInput
                value={stokModalPrice}
                onChange={setStokModalPrice}
                prefix="Rp"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ongkir (Opsional)</label>
              <CommaNumberInput
                value={stokShipping}
                onChange={setStokShipping}
                prefix="Rp"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan (Opsional)</label>
              <input
                type="text"
                value={stokNotes}
                onChange={(e) => setStokNotes(e.target.value)}
                placeholder="Keterangan tambahan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onDoneNavigateToData('stok')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Lihat Data Stok
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingInventory ? 'Simpan Perubahan' : 'Simpan Stok'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* FORM 4: INPUT PENGUKURAN */}
      {/* ===================================================================== */}
      {activeSubTab === 'pengukuran' && (
        <form onSubmit={handleSaveMeasurement} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingMeasurement ? 'Edit Data Pengukuran' : 'Input Pengukuran Barang'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat jumlah barang yang diukur, sortir kualitas, layak jual, dan reject
              </p>
            </div>
            {editingMeasurement && (
              <button
                type="button"
                onClick={onClearEditing}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pengukuran</label>
              <input
                type="date"
                value={measDate}
                onChange={(e) => setMeasDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Proses</label>
              <select
                value={measProcess}
                onChange={(e) => setMeasProcess(e.target.value as 'sortir' | 'steam' | 'sortir_dan_steam')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              >
                <option value="sortir">Sortir &amp; Pengukuran</option>
                <option value="steam">Steam / Finishing</option>
                <option value="sortir_dan_steam">Sortir + Steam Lengkap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Berat Barang / Ball (Kg)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={measWeightKg}
                onChange={(e) => setMeasWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih dari Stok (Opsional)</label>
              <select
                value={measInventoryId}
                onChange={(e) => handleSelectMeasInventory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              >
                <option value="">-- Ketik nama barang secara manual --</option>
                {inventoryList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ballType} ({formatNumber(b.pcsCount)} pcs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Barang / Ball</label>
              <input
                type="text"
                value={measBallName}
                onChange={(e) => setMeasBallName(e.target.value)}
                placeholder="Misal: Ball Kemeja Flanel #04"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Rincian Kelas Hasil Pengukuran */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-semibold text-slate-700">
              Rincian Kelas Barang (Opsional - Otomatis Menjumlah Total Diukur)
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Kepala</label>
                <CommaNumberInput
                  value={measKepala}
                  onChange={(v) => handleClassUpdate(v, measBadan, measKaki)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Badan</label>
                <CommaNumberInput
                  value={measBadan}
                  onChange={(v) => handleClassUpdate(measKepala, v, measKaki)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Kaki</label>
                <CommaNumberInput
                  value={measKaki}
                  onChange={(v) => handleClassUpdate(measKepala, measBadan, v)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Barang Diukur (Pcs)</label>
              <CommaNumberInput
                value={measTotal}
                onChange={setMeasTotal}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Barang Reject / Cacat (Pcs)</label>
              <CommaNumberInput
                value={measReject}
                onChange={setMeasReject}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Layak Jual (Otomatis)</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 font-mono-num">
                {formatNumber(measLayakJual)} pcs
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Petugas Pengukur</label>
              <div className="flex flex-wrap gap-1.5">
                {employees.map((emp) => {
                  const selected = measEmpIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() =>
                        setMeasEmpIds((prev) =>
                          prev.includes(emp.id) ? prev.filter((x) => x !== emp.id) : [...prev, emp.id]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        selected
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {emp.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan (Opsional)</label>
              <input
                type="text"
                value={measNotes}
                onChange={(e) => setMeasNotes(e.target.value)}
                placeholder="Catatan kualitas atau ukuran"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onDoneNavigateToData('pengukuran')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Lihat Data Pengukuran
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingMeasurement ? 'Simpan Perubahan' : 'Simpan Pengukuran'}</span>
            </button>
          </div>
        </form>
      )}

      <EmployeeConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
