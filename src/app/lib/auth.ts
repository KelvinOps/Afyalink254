// src/app/lib/auth.ts
import { jwtVerify } from 'jose'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  facilityId?: string
  countyId?: string
  permissions: string[]
}

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'COUNTY_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'TRIAGE_OFFICER'
  | 'DISPATCHER'
  | 'AMBULANCE_DRIVER'
  | 'FINANCE_OFFICER'
  | 'LAB_TECHNICIAN'
  | 'PHARMACIST'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production')

// Import and re-export authOptions from auth-options.ts
// We need to dynamically import to avoid circular dependencies
let _authOptions: any = null

export async function getAuthOptions() {
  if (!_authOptions) {
    const { authOptions } = await import('./auth-options')
    _authOptions = authOptions
  }
  return _authOptions
}

// For direct import (used in API routes)
export { authOptions } from './auth-options'

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

// Client-safe utility functions
export function hasPermission(user: User, permission: string): boolean {
  if (user.role === 'SUPER_ADMIN') {
    return true
  }
  
  const hasPerm = user.permissions?.includes(permission) || user.permissions?.includes('*')
  return hasPerm
}

export function canAccessModule(user: User, module: string): boolean {
  const modulePermissions: Record<string, string[]> = {
    dashboard: ['dashboard.read', '*'],
    triage: ['triage.read', 'triage.write', '*'],
    patients: ['patients.read', 'patients.write', '*'],
    transfers: ['transfers.read', 'transfers.write', '*'],
    dispatch: ['dispatch.read', 'dispatch.write', '*'],
    referrals: ['referrals.read', 'referrals.write', '*'],
    resources: ['resources.read', 'resources.write', '*'],
    procurement: ['procurement.read', 'procurement.write', '*'],
    'sha-claims': ['claims.read', 'claims.write', '*'],
    telemedicine: ['telemedicine.read', 'telemedicine.write', '*'],
    emergencies: ['emergencies.read', 'emergencies.write', '*'],
    analytics: ['analytics.read', '*'],
    staff: ['staff.read', 'staff.write', '*'],
    hospitals: ['hospitals.read', '*'],
    settings: ['settings.read', '*'],
    monitoring: ['*']
  }

  const modulePerms = modulePermissions[module] || []
  return modulePerms.some(perm => hasPermission(user, perm))
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  COUNTY_ADMIN: [
    'dashboard.read', 'triage.read', 'patients.read', 'transfers.read', 'transfers.write',
    'dispatch.read', 'referrals.read', 'resources.read', 'procurement.read', 'procurement.write',
    'claims.read', 'telemedicine.read', 'emergencies.read', 'emergencies.write',
    'analytics.read', 'staff.read', 'hospitals.read', 'settings.read'
  ],
  HOSPITAL_ADMIN: [
    'dashboard.read', 'triage.read', 'triage.write', 'patients.read', 'patients.write',
    'transfers.read', 'transfers.write', 'dispatch.read', 'referrals.read', 'referrals.write',
    'resources.read', 'resources.write', 'procurement.read', 'procurement.write',
    'claims.read', 'claims.write', 'telemedicine.read', 'telemedicine.write',
    'emergencies.read', 'emergencies.write', 'analytics.read', 'staff.read', 'staff.write',
    'hospitals.read', 'settings.read'
  ],
  DOCTOR: [
    'dashboard.read', 'triage.read', 'patients.read', 'patients.write', 'transfers.read',
    'referrals.read', 'referrals.write', 'telemedicine.read', 'telemedicine.write',
    'emergencies.read'
  ],
  NURSE: [
    'dashboard.read', 'triage.read', 'triage.write', 'patients.read', 'patients.write',
    'referrals.read'
  ],
  TRIAGE_OFFICER: [
    'dashboard.read', 'triage.read', 'triage.write', 'patients.read', 'patients.write'
  ],
  DISPATCHER: [
    'dashboard.read', 'dispatch.read', 'dispatch.write', 'ambulances.read', 'ambulances.write',
    'emergencies.read', 'emergencies.write'
  ],
  AMBULANCE_DRIVER: [
    'dashboard.read', 'dispatch.read', 'ambulances.read'
  ],
  FINANCE_OFFICER: [
    'dashboard.read', 'claims.read', 'claims.write', 'analytics.read'
  ],
  LAB_TECHNICIAN: [
    'dashboard.read', 'patients.read'
  ],
  PHARMACIST: [
    'dashboard.read', 'patients.read', 'resources.read'
  ]
}

export function normalizeRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'super_admin': 'SUPER_ADMIN',
    'superadmin': 'SUPER_ADMIN',
    'SUPERADMIN': 'SUPER_ADMIN',
    'administrator': 'SUPER_ADMIN',
    'ADMINISTRATOR': 'SUPER_ADMIN',
    
    'county_admin': 'COUNTY_ADMIN',
    'countyadmin': 'COUNTY_ADMIN',
    'COUNTYADMIN': 'COUNTY_ADMIN',
    
    'hospital_admin': 'HOSPITAL_ADMIN',
    'hospitaladmin': 'HOSPITAL_ADMIN',
    'HOSPITALADMIN': 'HOSPITAL_ADMIN',
    
    'doctor': 'DOCTOR',
    'DOCTOR': 'DOCTOR',
    'medical_officer': 'DOCTOR',
    'MEDICAL_OFFICER': 'DOCTOR',
    
    'nurse': 'NURSE',
    'NURSE': 'NURSE',
    
    'triage_officer': 'TRIAGE_OFFICER',
    'triageofficer': 'TRIAGE_OFFICER',
    'TRIAGE_OFFICER': 'TRIAGE_OFFICER',
    'TRIAGEOFFICER': 'TRIAGE_OFFICER',
    'triage_nurse': 'TRIAGE_OFFICER',
    'TRIAGE_NURSE': 'TRIAGE_OFFICER',
    
    'dispatcher': 'DISPATCHER',
    'DISPATCHER': 'DISPATCHER',
    
    'ambulance_driver': 'AMBULANCE_DRIVER',
    'ambulancedriver': 'AMBULANCE_DRIVER',
    'AMBULANCE_DRIVER': 'AMBULANCE_DRIVER',
    'AMBULANCEDRIVER': 'AMBULANCE_DRIVER',
    
    'finance_officer': 'FINANCE_OFFICER',
    'financeofficer': 'FINANCE_OFFICER',
    'FINANCE_OFFICER': 'FINANCE_OFFICER',
    'FINANCEOFFICER': 'FINANCE_OFFICER',
    
    'lab_technician': 'LAB_TECHNICIAN',
    'labtechnician': 'LAB_TECHNICIAN',
    'LAB_TECHNICIAN': 'LAB_TECHNICIAN',
    'LABTECHNICIAN': 'LAB_TECHNICIAN',
    
    'pharmacist': 'PHARMACIST',
    'PHARMACIST': 'PHARMACIST'
  }

  const normalized = roleMap[role.toLowerCase()] || role.toUpperCase() as UserRole
  return normalized
}

export function getPermissionsForRole(role: string): string[] {
  const normalizedRole = normalizeRole(role)
  const permissions = ROLE_PERMISSIONS[normalizedRole] || []
  return permissions
}

export function createUserObject(userData: any): User {
  const normalizedRole = normalizeRole(userData.role)
  const permissions = getPermissionsForRole(normalizedRole)
  
  const userObj = {
    id: userData.id,
    email: userData.email,
    name: userData.name || `${userData.firstName} ${userData.lastName}`,
    role: normalizedRole,
    facilityId: userData.facilityId,
    countyId: userData.countyId,
    permissions: permissions
  }

  return userObj
}

export function ensureBasicPermissions(user: any): User {
  if (!user.permissions || !Array.isArray(user.permissions)) {
    const permissions = getPermissionsForRole(user.role)
    return {
      ...user,
      permissions: permissions.length > 0 ? permissions : ['dashboard.read']
    }
  }
  
  if (user.permissions.length === 0) {
    return {
      ...user,
      permissions: ['dashboard.read']
    }
  }
  
  return user as User
}

export function getMockUser(): User {
  return {
    id: '1',
    email: 'doctor@example.com',
    name: 'Dr. John Smith',
    role: 'DOCTOR',
    facilityId: 'hospital-1',
    countyId: 'county-1',
    permissions: getPermissionsForRole('DOCTOR')
  }
}

export async function signToken(payload: any): Promise<string> {
  return 'mock-token-' + Date.now()
}