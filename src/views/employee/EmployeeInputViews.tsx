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
  ballQualityMeta,
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
import { resolveCurrentEmployeeProfile } from '../../utils/employeeSalary';
import {
  EmployeeModuleTab,
  getEmployeePermissions,
  isOwnEmployeeRecord,
} from '../../utils/employeePermissions';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Flame,
  Package,
  PackageOpen,
  Ruler,
  Scissors,
  TrendingUp,
} from 'lucide-react';

export type EmployeeInputSubTab = EmployeeModuleTab;

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
  { key: 'steam', label: 'Steam', icon: Flame },
  { key: 'bongkar_ball', label: 'Bongkar Ball', icon: PackageOpen },
  { key: 'sortir', label: 'Sortir', icon: Scissors },
  { key: 'pengukuran', label: 'Pengukuran', icon: Ruler },
];

const ALL_WORK_ROLES: UserRole[] = ['host', 'admin_toko', 'sortir', 'steam', 'bongkar_ball', 'training'];

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

  const permissions = getEmployeePermissions(currentUser);
  const myEmployee = resolveCurrentEmployeeProfile(currentUser);
  const myWorkRoles = myEmployee.roles?.filter((r) => ALL_WORK_ROLES.includes(r));
  const allowedWorkRolesForSelf =
    myWorkRoles && myWorkRoles.length > 0 ? myWorkRoles : ['host' as UserRole];

  useEffect(() => {
    if (!permissions.allowedInputTabs.includes(activeSubTab)) {
      onChangeSubTab('kehadiran');
    }
  }, [activeSubTab, permissions.allowedInputTabs, onChangeSubTab]);

  // =========================================================================
  // 1. KEHADIRAN STATE (Aturan: Pegawai selain Owner hanya input diri sendiri)
  // =========================================================================
  const defaultEmp = permissions.canOnlySelfAttendance
    ? myEmployee
    : employees.find(
        (e) => e.id === currentUser.id || e.username.toLowerCase() === currentUser.username.toLowerCase()
      ) || myEmployee;

  const [attDate, setAttDate] = useState(getTodayString());
  const [attEmpId, setAttEmpId] = useState(defaultEmp?.id || currentUser.id);
  const [attRoles, setAttRoles] = useState<UserRole[]>(allowedWorkRolesForSelf);
  const [attHours, setAttHours] = useState<number>(defaultEmp?.salaryType === 'hourly' ? 4 : 1);
  const [attNotes, setAttNotes] = useState('');
  const [attTrainingTraineeName, setAttTrainingTraineeName] = useState(
    defaultEmp?.roles?.includes('training') ? defaultEmp.trainingTraineeName || '' : ''
  );
  const [attTrainingTrainerId, setAttTrainingTrainerId] = useState('');
  const [attTrainingTrainerName, setAttTrainingTrainerName] = useState(
    defaultEmp?.roles?.includes('training') ? defaultEmp.trainingTrainerName || defaultEmp.name || '' : ''
  );

  useEffect(() => {
    if (permissions.canOnlySelfAttendance) {
      setAttEmpId(myEmployee.id);
    }
  }, [permissions.canOnlySelfAttendance, myEmployee.id]);

  useEffect(() => {
    if (editingAttendance) {
      if (
        permissions.canOnlySelfAttendance &&
        !isOwnEmployeeRecord(
          currentUser,
          myEmployee,
          editingAttendance.employeeId,
          editingAttendance.employeeName
        )
      ) {
        onNotify('Anda hanya dapat mengubah data kehadiran milik Anda sendiri.', 'error');
        onClearEditing();
        return;
      }
      setAttDate(editingAttendance.date || getTodayString());
      setAttEmpId(
        permissions.canOnlySelfAttendance ? myEmployee.id : editingAttendance.employeeId
      );
      const parsedRoles = (editingAttendance.role || '')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean) as UserRole[];
      const selfSelectableRoles = Array.from(
        new Set([...allowedWorkRolesForSelf, 'bongkar_ball' as UserRole, 'training' as UserRole])
      );
      const validParsed = permissions.canOnlySelfAttendance
        ? parsedRoles.filter((r) => selfSelectableRoles.includes(r))
        : parsedRoles;
      setAttRoles(validParsed.length > 0 ? validParsed : allowedWorkRolesForSelf);
      setAttHours(editingAttendance.hoursWorked || 4);
      setAttNotes(editingAttendance.notes || '');
      setAttTrainingTraineeName(editingAttendance.trainingTraineeName || '');
      setAttTrainingTrainerId(editingAttendance.trainingTrainerId || '');
      setAttTrainingTrainerName(editingAttendance.trainingTrainerName || '');
    }
  }, [editingAttendance]);

  const selectedAttEmp = permissions.canOnlySelfAttendance
    ? myEmployee
    : employees.find((e) => e.id === attEmpId) || defaultEmp;

  const handleToggleAttRole = (role: UserRole) => {
    const selfSelectableRoles = Array.from(
      new Set([...allowedWorkRolesForSelf, 'bongkar_ball' as UserRole, 'training' as UserRole])
    );
    if (permissions.canOnlySelfAttendance && !selfSelectableRoles.includes(role)) {
      return;
    }
    if (attRoles.includes(role)) {
      if (attRoles.length <= 1) {
        onNotify('Minimal satu role pekerjaan harus dipilih.', 'info');
        return;
      }
      setAttRoles(attRoles.filter((r) => r !== role));
    } else {
      setAttRoles([...attRoles, role]);
      if (role === 'training') {
        if (!attTrainingTraineeName && selectedAttEmp?.trainingTraineeName) {
          setAttTrainingTraineeName(selectedAttEmp.trainingTraineeName);
        }
        if (!attTrainingTrainerName) {
          setAttTrainingTrainerName(selectedAttEmp?.trainingTrainerName || selectedAttEmp?.name || currentUser.name || '');
        }
      }
    }
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      editingAttendance &&
      permissions.canOnlySelfAttendance &&
      !isOwnEmployeeRecord(
        currentUser,
        myEmployee,
        editingAttendance.employeeId,
        editingAttendance.employeeName
      )
    ) {
      onNotify('Kehadiran hanya dapat diubah untuk diri sendiri.', 'error');
      return;
    }

    const isTraining = attRoles.includes('training');
    if (isTraining && !attTrainingTraineeName.trim()) {
      onNotify('Nama calon pegawai yang ditraining wajib diisi.', 'error');
      return;
    }
    if (isTraining && !attTrainingTrainerName.trim()) {
      onNotify('Atas nama trainer yang melatih wajib diisi.', 'error');
      return;
    }

    const targetEmp = permissions.canOnlySelfAttendance ? myEmployee : selectedAttEmp;
    const empName = targetEmp?.name || currentUser.name;
    const empSalaryType = targetEmp?.salaryType || 'hourly';
    const record: AttendanceRecord = {
      id: editingAttendance ? editingAttendance.id : 'att-' + Date.now(),
      storeId,
      date: attDate,
      employeeId: targetEmp?.id || currentUser.id,
      employeeName: empName,
      role: attRoles.join(','),
      rolesExecuted: attRoles,
      salaryType: empSalaryType,
      hoursWorked: empSalaryType === 'hourly' ? Math.max(0.5, attHours || 1) : 1,
      notes: attNotes.trim(),
      recordedById: editingAttendance?.recordedById || currentUser.id,
      recordedBy: editingAttendance?.recordedBy || currentUser.name,
      ...(isTraining
        ? {
            trainingTraineeName: attTrainingTraineeName.trim(),
            trainingTrainerName: attTrainingTrainerName.trim(),
            ...(attTrainingTrainerId ? { trainingTrainerId: attTrainingTrainerId } : {}),
          }
        : {}),
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
        setAttTrainingTraineeName('');
        setAttTrainingTrainerId('');
        setAttTrainingTrainerName('');
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
    if (!permissions.canInputSales) {
      onNotify('Hanya role Admin yang dapat menginput atau mengubah penjualan.', 'error');
      return;
    }
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
      recordedById: editingSale?.recordedById || currentUser.id,
      recordedBy: editingSale?.recordedBy || currentUser.name,
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
    if (!permissions.canInputStock) {
      onNotify('Hanya role Sortir & Ukur yang dapat menginput atau mengubah stok.', 'error');
      return;
    }
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
      recordedById: editingInventory?.recordedById || currentUser.id,
      recordedBy: editingInventory?.recordedBy || currentUser.name,
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
  // 4. STEAM STATE (Input Steam & Finishing)
  // =========================================================================
  const [steamDate, setSteamDate] = useState(getTodayString());
  const [steamInventoryId, setSteamInventoryId] = useState('');
  const [steamBallName, setSteamBallName] = useState('');
  const [steamTotal, setSteamTotal] = useState<number>(0);
  const [steamReject, setSteamReject] = useState<number>(0);
  const [steamEmpIds, setSteamEmpIds] = useState<string[]>([currentUser.id]);
  const [steamNotes, setSteamNotes] = useState('');

  useEffect(() => {
    if (editingMeasurement && editingMeasurement.processType === 'steam') {
      setSteamDate(editingMeasurement.date || getTodayString());
      setSteamInventoryId(editingMeasurement.ballInventoryId || editingMeasurement.inventoryBallId || '');
      setSteamBallName(editingMeasurement.ballName || '');
      setSteamTotal(editingMeasurement.pcsTotal || editingMeasurement.totalPcsProcessed || 0);
      setSteamReject(editingMeasurement.pcsReject || 0);
      setSteamEmpIds(
        editingMeasurement.employeeIds && editingMeasurement.employeeIds.length > 0
          ? editingMeasurement.employeeIds
          : [currentUser.id]
      );
      setSteamNotes(editingMeasurement.notes || '');
    }
  }, [editingMeasurement, currentUser.id]);

  const handleSelectSteamInventory = (ballId: string) => {
    setSteamInventoryId(ballId);
    const found = inventoryList.find((b) => b.id === ballId);
    if (found) {
      setSteamBallName(found.ballType);
      if (found.pcsCount) setSteamTotal(found.pcsCount);
    }
  };

  const steamLayakJual = Math.max(0, (steamTotal || 0) - (steamReject || 0));

  const handleSaveSteam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canInputSteam) {
      onNotify('Anda tidak memiliki izin untuk menginput atau mengubah data steam.', 'error');
      return;
    }
    const finalName = steamBallName.trim();
    if (!finalName) {
      onNotify('Pilih dari stok atau ketik nama barang/ball yang di-steam.', 'error');
      return;
    }
    if (steamTotal <= 0) {
      onNotify('Total pcs yang di-steam harus lebih dari 0.', 'error');
      return;
    }

    const empNames = steamEmpIds
      .map((id) => employees.find((emp) => emp.id === id)?.name)
      .filter(Boolean) as string[];

    const isEditingThis = editingMeasurement?.processType === 'steam';
    const record: SteamSortirRecord = {
      id: isEditingThis && editingMeasurement ? editingMeasurement.id : 'steam-' + Date.now(),
      storeId,
      date: steamDate,
      ballInventoryId: steamInventoryId || undefined,
      inventoryBallId: steamInventoryId || undefined,
      ballName: finalName,
      ballWeightKg: isEditingThis && editingMeasurement?.ballWeightKg ? editingMeasurement.ballWeightKg : 45,
      processType: 'steam',
      employeeIds: steamEmpIds.length > 0 ? steamEmpIds : [currentUser.id],
      employeeNames: empNames.length > 0 ? empNames : [currentUser.name],
      pcsKepala: 0,
      pcsBadan: 0,
      pcsKaki: 0,
      pcsTotal: steamTotal,
      totalPcsProcessed: steamTotal,
      pcsLayakJual: steamLayakJual,
      pcsReject: steamReject || 0,
      costPerPcs: 0,
      totalCost: 0,
      status: 'selesai',
      notes: steamNotes.trim(),
      recordedById: isEditingThis && editingMeasurement?.recordedById ? editingMeasurement.recordedById : currentUser.id,
      recordedBy: isEditingThis && editingMeasurement?.recordedBy ? editingMeasurement.recordedBy : currentUser.name,
      createdAt: isEditingThis && editingMeasurement ? editingMeasurement.createdAt : new Date().toISOString(),
    };

    setConfirmState({
      isOpen: true,
      title: isEditingThis ? 'Simpan Perubahan Steam' : 'Simpan Data Steam',
      message: `${isEditingThis ? 'Perbarui' : 'Simpan'} hasil steam "${finalName}" sebanyak ${formatNumber(steamTotal)} pcs (${formatNumber(steamLayakJual)} layak jual)?`,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        if (isEditingThis) {
          StorageService.updateSteamSortir(record);
          onNotify('Data steam berhasil diperbarui.', 'success');
        } else {
          StorageService.addSteamSortir(record);
          onNotify('Data steam berhasil disimpan.', 'success');
        }
        onClearEditing();
        setSteamInventoryId('');
        setSteamBallName('');
        setSteamTotal(0);
        setSteamReject(0);
        setSteamNotes('');
        onDoneNavigateToData('steam');
      },
    });
  };

  // =========================================================================
  // 5. BONGKAR BALL STATE (Input Bongkar Ball)
  // =========================================================================
  const [bbDate, setBbDate] = useState(getTodayString());
  const [bbInventoryId, setBbInventoryId] = useState('');
  const [bbBallName, setBbBallName] = useState('');
  const [bbWeightKg, setBbWeightKg] = useState<number>(45);
  const [bbKepala, setBbKepala] = useState<number>(0);
  const [bbBadan, setBbBadan] = useState<number>(0);
  const [bbKaki, setBbKaki] = useState<number>(0);
  const [bbTotal, setBbTotal] = useState<number>(0);
  const [bbReject, setBbReject] = useState<number>(0);
  const [bbEmpIds, setBbEmpIds] = useState<string[]>([currentUser.id]);
  const [bbNotes, setBbNotes] = useState('');

  useEffect(() => {
    if (editingMeasurement && editingMeasurement.processType === 'bongkar_ball') {
      setBbDate(editingMeasurement.date || getTodayString());
      setBbInventoryId(editingMeasurement.ballInventoryId || editingMeasurement.inventoryBallId || '');
      setBbBallName(editingMeasurement.ballName || '');
      setBbWeightKg(editingMeasurement.ballWeightKg || 45);
      setBbKepala(editingMeasurement.pcsKepala || 0);
      setBbBadan(editingMeasurement.pcsBadan || 0);
      setBbKaki(editingMeasurement.pcsKaki || 0);
      setBbTotal(editingMeasurement.pcsTotal || editingMeasurement.totalPcsProcessed || 0);
      setBbReject(editingMeasurement.pcsReject || 0);
      setBbEmpIds(
        editingMeasurement.employeeIds && editingMeasurement.employeeIds.length > 0
          ? editingMeasurement.employeeIds
          : [currentUser.id]
      );
      setBbNotes(editingMeasurement.notes || '');
    }
  }, [editingMeasurement, currentUser.id]);

  const handleSelectBbInventory = (ballId: string) => {
    setBbInventoryId(ballId);
    const found = inventoryList.find((b) => b.id === ballId);
    if (found) {
      setBbBallName(found.ballType);
      if (found.weightKg) setBbWeightKg(found.weightKg);
      if (found.pcsCount) setBbTotal(found.pcsCount);
    }
  };

  const handleBbClassUpdate = (k: number, b: number, f: number) => {
    setBbKepala(k);
    setBbBadan(b);
    setBbKaki(f);
    const sum = k + b + f;
    if (sum > 0) setBbTotal(sum);
  };

  const bbLayakJual = Math.max(0, (bbTotal || 0) - (bbReject || 0));

  const handleSaveBongkarBall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canInputBongkarBall) {
      onNotify('Anda tidak memiliki izin untuk menginput atau mengubah data bongkar ball.', 'error');
      return;
    }
    const finalName = bbBallName.trim();
    if (!finalName) {
      onNotify('Pilih dari stok atau ketik nama / kode ball yang dibongkar.', 'error');
      return;
    }
    if (bbTotal <= 0) {
      onNotify('Total isi hasil bongkar ball (pcs) harus lebih dari 0.', 'error');
      return;
    }

    const empNames = bbEmpIds
      .map((id) => employees.find((emp) => emp.id === id)?.name)
      .filter(Boolean) as string[];

    const isEditingThis = editingMeasurement?.processType === 'bongkar_ball';
    const record: SteamSortirRecord = {
      id: isEditingThis && editingMeasurement ? editingMeasurement.id : 'bongkar-ball-' + Date.now(),
      storeId,
      date: bbDate,
      ballInventoryId: bbInventoryId || undefined,
      inventoryBallId: bbInventoryId || undefined,
      ballName: finalName,
      ballWeightKg: bbWeightKg || 45,
      processType: 'bongkar_ball',
      employeeIds: bbEmpIds.length > 0 ? bbEmpIds : [currentUser.id],
      employeeNames: empNames.length > 0 ? empNames : [currentUser.name],
      pcsKepala: bbKepala || 0,
      pcsBadan: bbBadan || 0,
      pcsKaki: bbKaki || 0,
      ballQuality: evaluateBallQuality(bbKepala || 0, bbTotal),
      pcsTotal: bbTotal,
      totalPcsProcessed: bbTotal,
      pcsLayakJual: bbLayakJual,
      pcsReject: bbReject || 0,
      costPerPcs: 0,
      totalCost: 0,
      status: 'selesai',
      notes: bbNotes.trim(),
      recordedById: isEditingThis && editingMeasurement?.recordedById ? editingMeasurement.recordedById : currentUser.id,
      recordedBy: isEditingThis && editingMeasurement?.recordedBy ? editingMeasurement.recordedBy : currentUser.name,
      createdAt: isEditingThis && editingMeasurement ? editingMeasurement.createdAt : new Date().toISOString(),
    };

    setConfirmState({
      isOpen: true,
      title: isEditingThis ? 'Simpan Perubahan Bongkar Ball' : 'Simpan Data Bongkar Ball',
      message: `${isEditingThis ? 'Perbarui' : 'Simpan'} hasil bongkar "${finalName}" (${bbWeightKg || 45} kg) sebanyak ${formatNumber(bbTotal)} pcs?`,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        if (isEditingThis) {
          StorageService.updateSteamSortir(record);
          onNotify('Data bongkar ball berhasil diperbarui.', 'success');
        } else {
          StorageService.addSteamSortir(record);
          onNotify('Data bongkar ball berhasil disimpan.', 'success');
        }
        onClearEditing();
        setBbInventoryId('');
        setBbBallName('');
        setBbKepala(0);
        setBbBadan(0);
        setBbKaki(0);
        setBbTotal(0);
        setBbReject(0);
        setBbNotes('');
        onDoneNavigateToData('bongkar_ball');
      },
    });
  };

  // =========================================================================
  // 6. SORTIR STATE (Input Sortir Kelas & Kualitas)
  // =========================================================================
  const [sortirDate, setSortirDate] = useState(getTodayString());
  const [sortirInventoryId, setSortirInventoryId] = useState('');
  const [sortirBallName, setSortirBallName] = useState('');
  const [sortirWeightKg, setSortirWeightKg] = useState<number>(45);
  const [sortirKepala, setSortirKepala] = useState<number>(0);
  const [sortirBadan, setSortirBadan] = useState<number>(0);
  const [sortirKaki, setSortirKaki] = useState<number>(0);
  const [sortirTotal, setSortirTotal] = useState<number>(0);
  const [sortirReject, setSortirReject] = useState<number>(0);
  const [sortirEmpIds, setSortirEmpIds] = useState<string[]>([currentUser.id]);
  const [sortirNotes, setSortirNotes] = useState('');

  useEffect(() => {
    if (editingMeasurement && editingMeasurement.processType === 'sortir') {
      setSortirDate(editingMeasurement.date || getTodayString());
      setSortirInventoryId(editingMeasurement.ballInventoryId || editingMeasurement.inventoryBallId || '');
      setSortirBallName(editingMeasurement.ballName || '');
      setSortirWeightKg(editingMeasurement.ballWeightKg || 45);
      setSortirKepala(editingMeasurement.pcsKepala || 0);
      setSortirBadan(editingMeasurement.pcsBadan || 0);
      setSortirKaki(editingMeasurement.pcsKaki || 0);
      setSortirTotal(editingMeasurement.pcsTotal || editingMeasurement.totalPcsProcessed || 0);
      setSortirReject(editingMeasurement.pcsReject || 0);
      setSortirEmpIds(
        editingMeasurement.employeeIds && editingMeasurement.employeeIds.length > 0
          ? editingMeasurement.employeeIds
          : [currentUser.id]
      );
      setSortirNotes(editingMeasurement.notes || '');
    }
  }, [editingMeasurement, currentUser.id]);

  const handleSelectSortirInventory = (ballId: string) => {
    setSortirInventoryId(ballId);
    const found = inventoryList.find((b) => b.id === ballId);
    if (found) {
      setSortirBallName(found.ballType);
      if (found.weightKg) setSortirWeightKg(found.weightKg);
      if (found.pcsCount) setSortirTotal(found.pcsCount);
    }
  };

  const handleSortirClassUpdate = (k: number, b: number, f: number) => {
    setSortirKepala(k);
    setSortirBadan(b);
    setSortirKaki(f);
    const sum = k + b + f;
    if (sum > 0) setSortirTotal(sum);
  };

  const sortirLayakJual = Math.max(0, (sortirTotal || 0) - (sortirReject || 0));
  const sortirQualityGrade = evaluateBallQuality(sortirKepala || 0, sortirTotal);
  const sortirQualityInfo = ballQualityMeta[sortirQualityGrade];

  const handleSaveSortir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canInputSortir) {
      onNotify('Anda tidak memiliki izin untuk menginput atau mengubah data sortir.', 'error');
      return;
    }
    const finalName = sortirBallName.trim();
    if (!finalName) {
      onNotify('Pilih dari stok atau ketik nama barang/ball yang disortir.', 'error');
      return;
    }
    if (sortirTotal <= 0) {
      onNotify('Total pcs disortir harus lebih dari 0.', 'error');
      return;
    }

    const empNames = sortirEmpIds
      .map((id) => employees.find((emp) => emp.id === id)?.name)
      .filter(Boolean) as string[];

    const isEditingThis = editingMeasurement?.processType === 'sortir';
    const record: SteamSortirRecord = {
      id: isEditingThis && editingMeasurement ? editingMeasurement.id : 'sortir-' + Date.now(),
      storeId,
      date: sortirDate,
      ballInventoryId: sortirInventoryId || undefined,
      inventoryBallId: sortirInventoryId || undefined,
      ballName: finalName,
      ballWeightKg: sortirWeightKg || 45,
      processType: 'sortir',
      employeeIds: sortirEmpIds.length > 0 ? sortirEmpIds : [currentUser.id],
      employeeNames: empNames.length > 0 ? empNames : [currentUser.name],
      pcsKepala: sortirKepala || 0,
      pcsBadan: sortirBadan || 0,
      pcsKaki: sortirKaki || 0,
      ballQuality: sortirQualityGrade,
      pcsTotal: sortirTotal,
      totalPcsProcessed: sortirTotal,
      pcsLayakJual: sortirLayakJual,
      pcsReject: sortirReject || 0,
      costPerPcs: 0,
      totalCost: 0,
      status: 'selesai',
      notes: sortirNotes.trim(),
      recordedById: isEditingThis && editingMeasurement?.recordedById ? editingMeasurement.recordedById : currentUser.id,
      recordedBy: isEditingThis && editingMeasurement?.recordedBy ? editingMeasurement.recordedBy : currentUser.name,
      createdAt: isEditingThis && editingMeasurement ? editingMeasurement.createdAt : new Date().toISOString(),
    };

    setConfirmState({
      isOpen: true,
      title: isEditingThis ? 'Simpan Perubahan Sortir' : 'Simpan Data Sortir',
      message: `${isEditingThis ? 'Perbarui' : 'Simpan'} hasil sortir "${finalName}" sebanyak ${formatNumber(sortirTotal)} pcs (${formatNumber(sortirLayakJual)} layak jual)?`,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        if (isEditingThis) {
          StorageService.updateSteamSortir(record);
          onNotify('Data sortir berhasil diperbarui.', 'success');
        } else {
          StorageService.addSteamSortir(record);
          onNotify('Data sortir berhasil disimpan.', 'success');
        }
        onClearEditing();
        setSortirInventoryId('');
        setSortirBallName('');
        setSortirKepala(0);
        setSortirBadan(0);
        setSortirKaki(0);
        setSortirTotal(0);
        setSortirReject(0);
        setSortirNotes('');
        onDoneNavigateToData('sortir');
      },
    });
  };

  // =========================================================================
  // 7. PENGUKURAN STATE (Sortir, QC & Ukur Barang)
  // =========================================================================
  const [measDate, setMeasDate] = useState(getTodayString());
  const [measInventoryId, setMeasInventoryId] = useState('');
  const [measBallName, setMeasBallName] = useState('');
  const [measProcess, setMeasProcess] = useState<'sortir' | 'steam' | 'bongkar_ball' | 'sortir_dan_steam'>('sortir');
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
    if (!permissions.canInputMeasurement) {
      onNotify('Hanya role Sortir & Ukur yang dapat menginput atau mengubah pengukuran.', 'error');
      return;
    }
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
      recordedById: editingMeasurement?.recordedById || currentUser.id,
      recordedBy: editingMeasurement?.recordedBy || currentUser.name,
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

  const visibleInputTabs = INPUT_TABS.filter((tab) =>
    permissions.allowedInputTabs.includes(tab.key)
  );
  const availableAttRoles = permissions.canOnlySelfAttendance
    ? Array.from(new Set([...allowedWorkRolesForSelf, 'bongkar_ball' as UserRole, 'training' as UserRole]))
    : ALL_WORK_ROLES;

  return (
    <div className="space-y-5">
      {/* Sub-navigation Segmented Tabs (Sesuai Izin Role) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl overflow-x-auto">
        {visibleInputTabs.map((tab) => {
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
                {permissions.canOnlySelfAttendance
                  ? 'Presensi kehadiran hanya dapat dicatat untuk akun Anda sendiri'
                  : 'Catat absensi shift atau jam kerja untuk sinkronisasi perhitungan gaji'}
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
              {permissions.canOnlySelfAttendance ? (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 flex items-center justify-between gap-2">
                  <span className="truncate">{myEmployee.name || currentUser.name}</span>
                  <span className="text-[11px] font-medium text-blue-600 shrink-0">Diri Sendiri</span>
                </div>
              ) : (
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
                      if (found.roles.includes('training')) {
                        setAttTrainingTraineeName(found.trainingTraineeName || '');
                        setAttTrainingTrainerName(found.trainingTrainerName || found.name || '');
                        setAttTrainingTrainerId('');
                      } else {
                        setAttTrainingTraineeName('');
                        setAttTrainingTrainerName('');
                        setAttTrainingTrainerId('');
                      }
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
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Role Pekerjaan Saat Hadir</label>
            <div className={`grid ${availableAttRoles.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'} gap-2`}>
              {availableAttRoles.map((r) => {
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

            {attRoles.includes('training') && (
              <div className="mt-3 p-4 rounded-xl bg-orange-50/80 border border-orange-200 space-y-3">
                <div className="text-xs font-bold text-orange-800">
                  Data Sesi Training
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Calon Pegawai yang Ditraining <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={attTrainingTraineeName}
                      onChange={(e) => setAttTrainingTraineeName(e.target.value)}
                      placeholder="Contoh: Rina (Calon Host)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Atas Nama Siapa yang Trainingnya (Trainer / Pendamping) <span className="text-rose-600">*</span>
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={
                          attTrainingTrainerId
                            ? attTrainingTrainerId
                            : attTrainingTrainerName === currentUser.name
                              ? '__owner__'
                              : attTrainingTrainerName
                                ? '__manual__'
                                : ''
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '__owner__') {
                            setAttTrainingTrainerId(currentUser.id);
                            setAttTrainingTrainerName(currentUser.name);
                          } else if (v === '__manual__' || v === '') {
                            setAttTrainingTrainerId('');
                            setAttTrainingTrainerName('');
                          } else {
                            const foundTrainer = employees.find((em) => em.id === v);
                            setAttTrainingTrainerId(v);
                            setAttTrainingTrainerName(foundTrainer?.name || '');
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                      >
                        <option value="">-- Pilih Trainer / Ketik Manual --</option>
                        <option value="__owner__">{currentUser.name} (Akun Aktif)</option>
                        {employees.map((em) => (
                          <option key={em.id} value={em.id}>
                            {em.name} ({em.roles.map((r) => roleLabels[r] || r).join(', ')})
                          </option>
                        ))}
                        <option value="__manual__">Ketik Nama Manual...</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={attTrainingTrainerName}
                        onChange={(e) => {
                          setAttTrainingTrainerId('');
                          setAttTrainingTrainerName(e.target.value);
                        }}
                        placeholder="Nama trainer / penanggung jawab training"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
      {/* FORM 4: INPUT STEAM */}
      {/* ===================================================================== */}
      {activeSubTab === 'steam' && (
        <form onSubmit={handleSaveSteam} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingMeasurement?.processType === 'steam' ? 'Edit Data Steam' : 'Input Steam Barang'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat jumlah baju yang selesai di-steam, layak jual, dan reject
              </p>
            </div>
            {editingMeasurement?.processType === 'steam' && (
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Steam</label>
              <input
                type="date"
                value={steamDate}
                onChange={(e) => setSteamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih dari Stok (Opsional)</label>
              <select
                value={steamInventoryId}
                onChange={(e) => handleSelectSteamInventory(e.target.value)}
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
                value={steamBallName}
                onChange={(e) => setSteamBallName(e.target.value)}
                placeholder="Misal: Ball Kemeja Flanel #04"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Pcs Di-Steam</label>
              <CommaNumberInput
                value={steamTotal}
                onChange={setSteamTotal}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Barang Reject / Rusak (Pcs)</label>
              <CommaNumberInput
                value={steamReject}
                onChange={setSteamReject}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Layak Jual (Otomatis)</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 font-mono-num">
                {formatNumber(steamLayakJual)} pcs
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Petugas Steam</label>
              <div className="flex flex-wrap gap-1.5">
                {employees.map((emp) => {
                  const selected = steamEmpIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() =>
                        setSteamEmpIds((prev) =>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Steam (Opsional)</label>
              <input
                type="text"
                value={steamNotes}
                onChange={(e) => setSteamNotes(e.target.value)}
                placeholder="Misal: Steam uap shift siang, rapih siap gantung"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onDoneNavigateToData('steam')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Lihat Data Steam
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingMeasurement?.processType === 'steam' ? 'Simpan Perubahan' : 'Simpan Steam'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* FORM 5: INPUT BONGKAR BALL */}
      {/* ===================================================================== */}
      {activeSubTab === 'bongkar_ball' && (
        <form onSubmit={handleSaveBongkarBall} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingMeasurement?.processType === 'bongkar_ball' ? 'Edit Data Bongkar Ball' : 'Input Bongkar Ball'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat pembongkaran ball karung, berat ball, dan total isi pcs hasil bongkar
              </p>
            </div>
            {editingMeasurement?.processType === 'bongkar_ball' && (
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Bongkar Ball</label>
              <input
                type="date"
                value={bbDate}
                onChange={(e) => setBbDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih dari Stok (Opsional)</label>
              <select
                value={bbInventoryId}
                onChange={(e) => handleSelectBbInventory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              >
                <option value="">-- Ketik nama ball secara manual --</option>
                {inventoryList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ballType} ({formatNumber(b.pcsCount)} pcs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama / Kode Ball</label>
              <input
                type="text"
                value={bbBallName}
                onChange={(e) => setBbBallName(e.target.value)}
                placeholder="Misal: Ball Hoodie Korea #12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Berat Ball (Kg)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={bbWeightKg}
                  onChange={(e) => setBbWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold font-mono-num"
                />
                <div className="flex items-center gap-1 shrink-0">
                  {[40, 45, 50, 100].map((kg) => (
                    <button
                      key={kg}
                      type="button"
                      onClick={() => setBbWeightKg(kg)}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        bbWeightKg === kg
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {kg}kg
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
              Rincian kelas di bawah bersifat opsional saat bongkar karung — isi jika langsung dipisahkan saat buka ball.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-semibold text-slate-700">
              Rincian Kelas Awal Hasil Bongkar (Opsional - Otomatis Menjumlah Total Isi)
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Kepala</label>
                <CommaNumberInput
                  value={bbKepala}
                  onChange={(v) => handleBbClassUpdate(v, bbBadan, bbKaki)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Badan</label>
                <CommaNumberInput
                  value={bbBadan}
                  onChange={(v) => handleBbClassUpdate(bbKepala, v, bbKaki)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Kaki</label>
                <CommaNumberInput
                  value={bbKaki}
                  onChange={(v) => handleBbClassUpdate(bbKepala, bbBadan, v)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Isi Hasil Bongkar (Pcs)</label>
              <CommaNumberInput
                value={bbTotal}
                onChange={setBbTotal}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reject / Rusak (Pcs)</label>
              <CommaNumberInput
                value={bbReject}
                onChange={setBbReject}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Layak Jual (Otomatis)</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 font-mono-num">
                {formatNumber(bbLayakJual)} pcs
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Petugas Bongkar Ball</label>
              <div className="flex flex-wrap gap-1.5">
                {employees.map((emp) => {
                  const selected = bbEmpIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() =>
                        setBbEmpIds((prev) =>
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
                value={bbNotes}
                onChange={(e) => setBbNotes(e.target.value)}
                placeholder="Misal: Ball segel utuh, isi campur jaket & crewneck"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onDoneNavigateToData('bongkar_ball')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Lihat Data Bongkar Ball
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingMeasurement?.processType === 'bongkar_ball' ? 'Simpan Perubahan' : 'Simpan Bongkar Ball'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* FORM 6: INPUT SORTIR */}
      {/* ===================================================================== */}
      {activeSubTab === 'sortir' && (
        <form onSubmit={handleSaveSortir} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingMeasurement?.processType === 'sortir' ? 'Edit Data Sortir' : 'Input Sortir Barang'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat hasil penyortiran per kelas (Kepala, Badan, Kaki), kualitas ball, layak jual &amp; reject
              </p>
            </div>
            {editingMeasurement?.processType === 'sortir' && (
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Sortir</label>
              <input
                type="date"
                value={sortirDate}
                onChange={(e) => setSortirDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih dari Stok (Opsional)</label>
              <select
                value={sortirInventoryId}
                onChange={(e) => handleSelectSortirInventory(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Berat Barang / Ball (Kg)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={sortirWeightKg}
                onChange={(e) => setSortirWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Barang / Ball</label>
            <input
              type="text"
              value={sortirBallName}
              onChange={(e) => setSortirBallName(e.target.value)}
              placeholder="Misal: Ball Blouse Korea #08"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              required
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-700">
                Rincian Kelas Sortir (Otomatis Menjumlah Total Disortir)
              </div>
              {sortirTotal > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700">
                  Kualitas Ball: {sortirQualityInfo.label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Kepala</label>
                <CommaNumberInput
                  value={sortirKepala}
                  onChange={(v) => handleSortirClassUpdate(v, sortirBadan, sortirKaki)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Badan</label>
                <CommaNumberInput
                  value={sortirBadan}
                  onChange={(v) => handleSortirClassUpdate(sortirKepala, v, sortirKaki)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Kelas Kaki</label>
                <CommaNumberInput
                  value={sortirKaki}
                  onChange={(v) => handleSortirClassUpdate(sortirKepala, sortirBadan, v)}
                  suffix="pcs"
                  placeholder="0"
                  className="!bg-white !text-slate-900 !border-slate-300 !text-xs !py-2 font-mono-num"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Pcs Disortir</label>
              <CommaNumberInput
                value={sortirTotal}
                onChange={setSortirTotal}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Barang Reject / Cacat (Pcs)</label>
              <CommaNumberInput
                value={sortirReject}
                onChange={setSortirReject}
                suffix="pcs"
                placeholder="0"
                className="!bg-white !text-slate-900 !border-slate-300 !text-sm !py-2.5 font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Layak Jual (Otomatis)</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 font-mono-num">
                {formatNumber(sortirLayakJual)} pcs
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Petugas Sortir</label>
              <div className="flex flex-wrap gap-1.5">
                {employees.map((emp) => {
                  const selected = sortirEmpIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() =>
                        setSortirEmpIds((prev) =>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan Sortir (Opsional)</label>
              <input
                type="text"
                value={sortirNotes}
                onChange={(e) => setSortirNotes(e.target.value)}
                placeholder="Catatan kualitas, noda, atau pembagian grade"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onDoneNavigateToData('sortir')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Lihat Data Sortir
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingMeasurement?.processType === 'sortir' ? 'Simpan Perubahan' : 'Simpan Sortir'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* FORM 7: INPUT PENGUKURAN */}
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
                onChange={(e) => setMeasProcess(e.target.value as 'sortir' | 'steam' | 'bongkar_ball' | 'sortir_dan_steam')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              >
                <option value="sortir">Sortir &amp; Pengukuran</option>
                <option value="steam">Steam / Finishing</option>
                <option value="bongkar_ball">Bongkar Ball</option>
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
