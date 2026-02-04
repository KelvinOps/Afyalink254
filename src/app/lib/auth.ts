// app/lib/auth.ts 
import { jwtVerify, SignJWT } from 'jose'

export interface UserToken {
  id: string
  email: string
  name: string
  role: string
  hospitalId?: string
  countyId?: string
  facilityId?: string
  facilityType?: string
  firstName?: string
  lastName?: string
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
  | 'ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'FACILITY_MANAGER'
  | 'COUNTY_HEALTH_OFFICER'
  | 'EMERGENCY_MANAGER'
  | 'MEDICAL_SUPERINTENDENT'
  | 'HOSPITAL_DIRECTOR'

// Use a consistent secret across all files
export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-123456'
)

// For backward compatibility
export interface User extends UserToken {}

export async function verifyToken(token: string): Promise<UserToken | null> {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '')
    
    const { payload } = await jwtVerify(cleanToken, JWT_SECRET)
    
    // Transform the payload to match UserToken interface
    const userToken: UserToken = {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string || '',
      role: payload.role as string,
      hospitalId: payload.hospitalId as string || payload.facilityId as string,
      countyId: payload.countyId as string,
      facilityId: payload.facilityId as string,
      facilityType: payload.facilityType as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : getPermissionsForRole(payload.role as string)
    }
    
    return userToken
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function createToken(user: UserToken): Promise<string> {
  try {
    const jwt = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
      countyId: user.countyId,
      facilityId: user.facilityId,
      facilityType: user.facilityType,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions: user.permissions
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)
    
    return jwt
  } catch (error) {
    console.error('Error creating token:', error)
    throw new Error('Failed to create token')
  }
}

// Client-safe utility functions - EXPORT hasPermission
export function hasPermission(user: UserToken, permission: string): boolean {
  if (!user || !user.permissions) return false
  
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return true
  }
  
  const hasPerm = user.permissions?.includes(permission) || user.permissions?.includes('*')
  return hasPerm
}

export function canAccessModule(user: UserToken, module: string): boolean {
  const modulePermissions: Record<string, string[]> = {
    dashboard: ['dashboard.read', '*'],
    triage: ['triage.read', 'triage.write', '*'],
    patients: ['patients.read', 'patients.write', '*'],
    transfers: ['transfers.read', 'transfers.write', '*'],
    dispatch: ['dispatch.read', 'dispatch.write', '*'],
    ambulances: ['dispatch.read', 'dispatch.write', 'ambulances.read', 'ambulances.write', '*'],
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
  ADMIN: ['*'],
  COUNTY_ADMIN: [
    'dashboard.read', 'triage.read', 'patients.read', 'transfers.read', 'transfers.write',
    'dispatch.read', 'referrals.read', 'resources.read', 'procurement.read', 'procurement.write',
    'claims.read', 'telemedicine.read', 'emergencies.read', 'emergencies.write',
    'analytics.read', 'staff.read', 'hospitals.read', 'settings.read'
  ],
  COUNTY_HEALTH_OFFICER: [
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
  FACILITY_MANAGER: [
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
  EMERGENCY_MANAGER: [
    'dashboard.read', 'dispatch.read', 'dispatch.write', 'ambulances.read', 'ambulances.write',
    'emergencies.read', 'emergencies.write'
  ],
  FINANCE_OFFICER: [
    'dashboard.read', 'claims.read', 'claims.write', 'analytics.read'
  ],
  LAB_TECHNICIAN: [
    'dashboard.read', 'patients.read'
  ],
  PHARMACIST: [
    'dashboard.read', 'patients.read', 'resources.read'
  ],
  MEDICAL_SUPERINTENDENT: [
    'dashboard.read', 'triage.read', 'triage.write', 'patients.read', 'patients.write',
    'transfers.read', 'transfers.write', 'dispatch.read', 'referrals.read', 'referrals.write',
    'resources.read', 'resources.write', 'procurement.read', 'procurement.write',
    'claims.read', 'claims.write', 'telemedicine.read', 'telemedicine.write',
    'emergencies.read', 'emergencies.write', 'analytics.read', 'staff.read', 'staff.write',
    'hospitals.read', 'settings.read'
  ],
  HOSPITAL_DIRECTOR: [
    'dashboard.read', 'triage.read', 'triage.write', 'patients.read', 'patients.write',
    'transfers.read', 'transfers.write', 'dispatch.read', 'referrals.read', 'referrals.write',
    'resources.read', 'resources.write', 'procurement.read', 'procurement.write',
    'claims.read', 'claims.write', 'telemedicine.read', 'telemedicine.write',
    'emergencies.read', 'emergencies.write', 'analytics.read', 'staff.read', 'staff.write',
    'hospitals.read', 'settings.read'
  ]
}

export function normalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    'super_admin': 'SUPER_ADMIN',
    'superadmin': 'SUPER_ADMIN',
    'SUPERADMIN': 'SUPER_ADMIN',
    'administrator': 'ADMIN',
    'ADMINISTRATOR': 'ADMIN',
    'admin': 'ADMIN',
    
    'county_admin': 'COUNTY_ADMIN',
    'countyadmin': 'COUNTY_ADMIN',
    'COUNTYADMIN': 'COUNTY_ADMIN',
    'county_health_officer': 'COUNTY_HEALTH_OFFICER',
    'COUNTY_HEALTH_OFFICER': 'COUNTY_HEALTH_OFFICER',
    
    'hospital_admin': 'HOSPITAL_ADMIN',
    'hospitaladmin': 'HOSPITAL_ADMIN',
    'HOSPITALADMIN': 'HOSPITAL_ADMIN',
    
    'facility_manager': 'FACILITY_MANAGER',
    'facilitymanager': 'FACILITY_MANAGER',
    'FACILITY_MANAGER': 'FACILITY_MANAGER',
    
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
    
    'emergency_manager': 'EMERGENCY_MANAGER',
    'emergencymanager': 'EMERGENCY_MANAGER',
    'EMERGENCY_MANAGER': 'EMERGENCY_MANAGER',
    
    'finance_officer': 'FINANCE_OFFICER',
    'financeofficer': 'FINANCE_OFFICER',
    'FINANCE_OFFICER': 'FINANCE_OFFICER',
    'FINANCEOFFICER': 'FINANCE_OFFICER',
    
    'lab_technician': 'LAB_TECHNICIAN',
    'labtechnician': 'LAB_TECHNICIAN',
    'LAB_TECHNICIAN': 'LAB_TECHNICIAN',
    'LABTECHNICIAN': 'LAB_TECHNICIAN',
    
    'pharmacist': 'PHARMACIST',
    'PHARMACIST': 'PHARMACIST',
    
    'medical_superintendent': 'MEDICAL_SUPERINTENDENT',
    'medicalsuperintendent': 'MEDICAL_SUPERINTENDENT',
    'MEDICAL_SUPERINTENDENT': 'MEDICAL_SUPERINTENDENT',
    
    'hospital_director': 'HOSPITAL_DIRECTOR',
    'hospitaldirector': 'HOSPITAL_DIRECTOR',
    'HOSPITAL_DIRECTOR': 'HOSPITAL_DIRECTOR'
  }

  const normalized = roleMap[role.toLowerCase()] || role.toUpperCase()
  return normalized
}

export function getPermissionsForRole(role: string): string[] {
  const normalizedRole = normalizeRole(role)
  const permissions = ROLE_PERMISSIONS[normalizedRole] || []
  return permissions
}

export function createUserToken(userData: any): UserToken {
  const normalizedRole = normalizeRole(userData.role)
  const permissions = getPermissionsForRole(normalizedRole)
  
  const userToken: UserToken = {
    id: userData.id,
    email: userData.email,
    name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
    role: normalizedRole,
    hospitalId: userData.hospitalId,
    countyId: userData.countyId,
    facilityId: userData.facilityId,
    facilityType: userData.facilityType,
    firstName: userData.firstName,
    lastName: userData.lastName,
    permissions: permissions
  }

  return userToken
}

// Legacy function for backward compatibility
export function createUserObject(userData: any): User {
  return createUserToken(userData) as User
}

export function ensureBasicPermissions(user: any): UserToken {
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
  
  return user as UserToken
}

export function getMockUser(): UserToken {
  return {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    hospitalId: 'hospital-1',
    countyId: 'county-1',
    permissions: getPermissionsForRole('ADMIN')
  }
}

// Legacy function for backward compatibility
export async function signToken(payload: any): Promise<string> {
  return createToken(payload)
}

// Helper function for API routes to verify and get user
export async function verifyAndGetUser(token: string): Promise<UserToken | null> {
  return verifyToken(token)
}

