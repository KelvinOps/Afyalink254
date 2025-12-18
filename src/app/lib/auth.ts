// src/app/lib/auth.ts

import { jwtVerify, SignJWT } from 'jose'

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

export async function signToken(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export function hasPermission(user: User, permission: string): boolean {
  console.log('🔐 hasPermission check:', {
    userRole: user.role,
    requiredPermission: permission,
    userPermissions: user.permissions
  })
  
  // SUPER_ADMIN always has all permissions
  if (user.role === 'SUPER_ADMIN') {
    console.log('✅ SUPER_ADMIN has all permissions')
    return true
  }
  
  const hasPerm = user.permissions?.includes(permission) || user.permissions?.includes('*')
  console.log(`📋 Permission result: ${hasPerm}`)
  return hasPerm
}

export function canAccessModule(user: User, module: string): boolean {
  console.log('🚪 canAccessModule check:', {
    userRole: user.role,
    module,
    userPermissions: user.permissions
  })
  
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
    monitoring: ['*'] // Only SUPER_ADMIN
  }

  const modulePerms = modulePermissions[module] || []
  const hasAccess = modulePerms.some(perm => hasPermission(user, perm))
  
  console.log(`📋 Module ${module} access: ${hasAccess} (required perms: ${modulePerms.join(', ')})`)
  return hasAccess
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

// Enhanced role normalization function
export function normalizeRole(role: string): UserRole {
  console.log('🔄 Normalizing role:', role)
  
  const roleMap: Record<string, UserRole> = {
    // Handle case variations and database-specific values
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
  console.log('🎯 Final normalized role:', normalized)
  return normalized
}

// Enhanced helper function to get permissions for a role
export function getPermissionsForRole(role: string): string[] {
  console.log('🔍 Getting permissions for role:', role)
  
  const normalizedRole = normalizeRole(role)
  console.log('📋 Available roles in ROLE_PERMISSIONS:', Object.keys(ROLE_PERMISSIONS))
  
  const permissions = ROLE_PERMISSIONS[normalizedRole] || []
  console.log('✅ Permissions found:', permissions)
  
  return permissions
}

// Enhanced user object creation
export function createUserObject(userData: any): User {
  console.log('👤 Creating user object from:', userData)
  
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

  console.log('✅ Final user object:', userObj)
  return userObj
}

// Enhanced fallback function to ensure we always have at least basic permissions
export function ensureBasicPermissions(user: any): User {
  console.log('🛡️ Ensuring basic permissions for user:', user)
  
  // If user doesn't have permissions array, create one
  if (!user.permissions || !Array.isArray(user.permissions)) {
    console.log('⚠️ No permissions found, generating from role')
    const permissions = getPermissionsForRole(user.role)
    return {
      ...user,
      permissions: permissions.length > 0 ? permissions : ['dashboard.read']
    }
  }
  
  // If permissions array is empty, add basic permissions
  if (user.permissions.length === 0) {
    console.log('⚠️ Empty permissions array, adding basic dashboard permissions')
    return {
      ...user,
      permissions: ['dashboard.read']
    }
  }
  
  return user as User
}