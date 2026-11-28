import { CurrentUser, Employee, UserRole } from '../types';
import { resolveCurrentEmployeeProfile } from './employeeSalary';

export type EmployeeModuleTab =
  | 'kehadiran'
  | 'penjualan'
  | 'stok'
  | 'steam'
  | 'bongkar_ball'
  | 'sortir'
  | 'pengukuran';

export interface EmployeeModulePermissions {
  isOwner: boolean;
  isAdmin: boolean;
  isHost: boolean;
  canViewAllData: boolean;
  canViewSalesData: boolean;
  canInputAttendance: boolean;
  canEditAttendance: boolean;
  canOnlySelfAttendance: boolean;
  canInputSales: boolean;
  canEditSales: boolean;
  canInputStock: boolean;
  canEditStock: boolean;
  canInputSteam: boolean;
  canEditSteam: boolean;
  canInputBongkarBall: boolean;
  canEditBongkarBall: boolean;
  canInputSortir: boolean;
  canEditSortir: boolean;
  canInputMeasurement: boolean;
  canEditMeasurement: boolean;
  allowedInputTabs: EmployeeModuleTab[];
  allowedDataTabs: EmployeeModuleTab[];
}

export function getEmployeePermissions(currentUser: CurrentUser): EmployeeModulePermissions {
  const empProfile = resolveCurrentEmployeeProfile(currentUser);
  const roles: UserRole[] =
    currentUser.roles && currentUser.roles.length > 0
      ? currentUser.roles
      : empProfile.roles || [];

  const isOwner = Boolean(currentUser.isOwner || roles.includes('owner'));
  const isManager = roles.includes('manager');
  const isAdmin = roles.includes('admin_toko');
  const isHost = roles.includes('host');
  const isProductionOrTraining =
    roles.includes('sortir') ||
    roles.includes('steam') ||
    roles.includes('bongkar_ball') ||
    roles.includes('training');

  // Aturan akses data:
  // - Owner: bisa akses semua data
  // - Admin & Host: bisa akses data penjualan (+ data yang diinputkan sendiri)
  // - Selain itu: hanya dapat melihat data yang diinputkan sendiri
  const canViewAllData = isOwner;
  const canViewSalesData = isOwner || isAdmin || isHost;

  const canInputAttendance = true;
  const canEditAttendance = true;
  const canOnlySelfAttendance = !isOwner;

  const canInputSales = isOwner || isManager || isAdmin;
  const canEditSales = canInputSales;

  const canInputStock = isOwner || isManager || isProductionOrTraining;
  const canEditStock = canInputStock;

  const canInputSteam = isOwner || isManager || isProductionOrTraining;
  const canEditSteam = canInputSteam;

  const canInputBongkarBall = isOwner || isManager || isProductionOrTraining;
  const canEditBongkarBall = canInputBongkarBall;

  const canInputSortir = isOwner || isManager || isProductionOrTraining;
  const canEditSortir = canInputSortir;

  const canInputMeasurement = isOwner || isManager || isProductionOrTraining;
  const canEditMeasurement = canInputMeasurement;

  const allowedInputTabs: EmployeeModuleTab[] = ['kehadiran'];
  if (canInputSales) allowedInputTabs.push('penjualan');
  if (canInputStock) allowedInputTabs.push('stok');
  if (canInputSteam) allowedInputTabs.push('steam');
  if (canInputBongkarBall) allowedInputTabs.push('bongkar_ball');
  if (canInputSortir) allowedInputTabs.push('sortir');
  if (canInputMeasurement) allowedInputTabs.push('pengukuran');

  const allowedDataTabs: EmployeeModuleTab[] = ['kehadiran'];
  if (canViewSalesData) allowedDataTabs.push('penjualan');
  if (isOwner || isProductionOrTraining) {
    allowedDataTabs.push('stok', 'steam', 'bongkar_ball', 'sortir', 'pengukuran');
  }

  return {
    isOwner,
    isAdmin,
    isHost,
    canViewAllData,
    canViewSalesData,
    canInputAttendance,
    canEditAttendance,
    canOnlySelfAttendance,
    canInputSales,
    canEditSales,
    canInputStock,
    canEditStock,
    canInputSteam,
    canEditSteam,
    canInputBongkarBall,
    canEditBongkarBall,
    canInputSortir,
    canEditSortir,
    canInputMeasurement,
    canEditMeasurement,
    allowedInputTabs,
    allowedDataTabs,
  };
}

export function isOwnEmployeeRecord(
  currentUser: CurrentUser,
  myEmp: Employee,
  recordEmployeeId?: string,
  recordEmployeeName?: string
): boolean {
  if (recordEmployeeId && (recordEmployeeId === currentUser.id || recordEmployeeId === myEmp.id)) {
    return true;
  }
  const normalizedTarget = (recordEmployeeName || '').trim().toLowerCase();
  if (!normalizedTarget) return false;
  return (
    normalizedTarget === (currentUser.name || '').trim().toLowerCase() ||
    normalizedTarget === (myEmp.name || '').trim().toLowerCase()
  );
}

export function isRecordInputtedByUser(
  currentUser: CurrentUser,
  myEmp: Employee,
  record: {
    recordedById?: string;
    recordedBy?: string;
    employeeId?: string;
    employeeName?: string;
  },
  allowOwnEmployeeFallback = false
): boolean {
  if (
    allowOwnEmployeeFallback &&
    isOwnEmployeeRecord(currentUser, myEmp, record.employeeId, record.employeeName)
  ) {
    return true;
  }

  if (record.recordedById) {
    return record.recordedById === currentUser.id || record.recordedById === myEmp.id;
  }

  const candidateNames = [
    currentUser.name,
    currentUser.username,
    myEmp.name,
    myEmp.username,
  ]
    .filter(Boolean)
    .map((n) => n.trim().toLowerCase());

  if (record.recordedBy && record.recordedBy.trim()) {
    const recName = record.recordedBy.trim().toLowerCase();
    return candidateNames.includes(recName);
  }

  return false;
}
