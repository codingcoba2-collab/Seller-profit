import { CurrentUser, Employee, UserRole } from '../types';
import { resolveCurrentEmployeeProfile } from './employeeSalary';

export type EmployeeModuleTab = 'kehadiran' | 'penjualan' | 'stok' | 'pengukuran';

export interface EmployeeModulePermissions {
  isOwner: boolean;
  canInputAttendance: boolean;
  canEditAttendance: boolean;
  canOnlySelfAttendance: boolean;
  canInputSales: boolean;
  canEditSales: boolean;
  canInputStock: boolean;
  canEditStock: boolean;
  canInputMeasurement: boolean;
  canEditMeasurement: boolean;
  allowedInputTabs: EmployeeModuleTab[];
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
  const isSortirOrSteam = roles.includes('sortir') || roles.includes('steam');

  const canInputAttendance = true;
  const canEditAttendance = true;
  const canOnlySelfAttendance = !isOwner;

  const canInputSales = isOwner || isManager || isAdmin;
  const canEditSales = canInputSales;

  const canInputStock = isOwner || isManager || isSortirOrSteam;
  const canEditStock = canInputStock;

  const canInputMeasurement = isOwner || isManager || isSortirOrSteam;
  const canEditMeasurement = canInputMeasurement;

  const allowedInputTabs: EmployeeModuleTab[] = ['kehadiran'];
  if (canInputSales) allowedInputTabs.push('penjualan');
  if (canInputStock) allowedInputTabs.push('stok');
  if (canInputMeasurement) allowedInputTabs.push('pengukuran');

  return {
    isOwner,
    canInputAttendance,
    canEditAttendance,
    canOnlySelfAttendance,
    canInputSales,
    canEditSales,
    canInputStock,
    canEditStock,
    canInputMeasurement,
    canEditMeasurement,
    allowedInputTabs,
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
