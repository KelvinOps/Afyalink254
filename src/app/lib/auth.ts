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

// Define interface for user data from database/form
export interface UserData {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  role: string
  hospitalId?: string
  countyId?: string
  facilityId?: string
  facilityType?: string
  permissions?: string[]
}

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'COUNTY_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'TRIAGE_OFFICER'
  | 'DISPATCHER'
  | 'DISPATCH_COORDINATOR'
  | 'AMBULANCE_DRIVER'
  | 'AMBULANCE_CREW'
  | 'FINANCE_OFFICER'
  | 'LAB_TECHNICIAN'
  | 'PHARMACIST'
  | 'ADMIN'
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
export function hasPermission(user: UserToken | null, permission: string): boolean {
  if (!user || !user.permissions) {
    console.log('❌ hasPermission: No user or no permissions array')
    return false
  }
  
  // Normalize role for admin checks
  const normalizedRole = normalizeRole(user.role)
  
  // SUPER_ADMIN and ADMIN have all permissions
  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'ADMIN') {
    console.log('✅ hasPermission: Admin role, granting all permissions')
    return true
  }
  
  // Check for wildcard permission
  if (user.permissions.includes('*')) {
    console.log('✅ hasPermission: User has wildcard permission')
    return true
  }
  
  const hasPerm = user.permissions.includes(permission)
  
  if (!hasPerm) {
    console.log(`❌ hasPermission: User lacks "${permission}". Has:`, user.permissions.slice(0, 5))
  } else {
    console.log(`✅ hasPermission: User has "${permission}"`)
  }
  
  return hasPerm
}

export function canAccessModule(user: UserToken, module: string): boolean {
  const modulePermissions: Record<string, string[]> = {
    dashboard: ['dashboard.read', '*'],
    triage: ['triage.read', 'triage.write', '*'],
    patients: ['patients.read', 'patients.write', '*'],
    transfers: ['transfers.read', 'transfers.write', '*'],
    dispatch: ['dispatch.read', 'dispatch.write', '*'],
    ambulances: ['ambulances.read', 'ambulances.write', '*'],
    emergencies: ['emergencies.read', 'emergencies.write', '*'],
    referrals: ['referrals.read', 'referrals.write', '*'],
    resources: ['resources.read', 'resources.write', '*'],
    procurement: ['procurement.read', 'procurement.write', '*'],
    'sha-claims': ['claims.read', 'claims.write', '*'],
    telemedicine: ['telemedicine.read', 'telemedicine.write', '*'],
    analytics: ['analytics.read', '*'],
    staff: ['staff.read', 'staff.write', '*'],
    hospitals: ['hospitals.read', '*'],
    settings: ['settings.read', '*'],
    monitoring: ['*']
  }

  const modulePerms = modulePermissions[module] || []
  return modulePerms.some(perm => hasPermission(user, perm))
}

// ALL PERMISSIONS - Complete list for admins
const ALL_PERMISSIONS = [
  // Dashboard
  'dashboard.read',
  
  // Triage
  'triage.read',
  'triage.write',
  
  // Patients
  'patients.read',
  'patients.write',
  
  // Transfers
  'transfers.read',
  'transfers.write',
  
  // Dispatch
  'dispatch.read',
  'dispatch.write',
  
  // Ambulances
  'ambulances.read',
  'ambulances.write',
  
  // Emergencies
  'emergencies.read',
  'emergencies.write',
  
  // Referrals
  'referrals.read',
  'referrals.write',
  
  // Resources
  'resources.read',
  'resources.write',
  
  // Procurement
  'procurement.read',
  'procurement.write',
  
  // Claims
  'claims.read',
  'claims.write',
  
  // Telemedicine
  'telemedicine.read',
  'telemedicine.write',
  
  // Analytics
  'analytics.read',
  
  // Staff
  'staff.read',
  'staff.write',
  
  // Hospitals
  'hospitals.read',
  'hospitals.write',
  
  // Settings
  'settings.read',
  'settings.write',
  
  // Monitoring
  'monitoring.read',
  'monitoring.write',
  
  // Audit
  'audit.read',
  
  // System
  'system.read',
  'system.write',
  
  // Wildcard for future permissions
  '*'
]

// COMPLETE permissions for all roles
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // SUPER_ADMIN gets ALL explicit permissions
  SUPER_ADMIN: ALL_PERMISSIONS,
  
  // ADMIN gets ALL explicit permissions
  ADMIN: ALL_PERMISSIONS,
  
  COUNTY_ADMIN: [
    'dashboard.read', 
    'triage.read', 
    'patients.read', 
    'transfers.read', 
    'transfers.write',
    'dispatch.read', 
    'dispatch.write',
    'ambulances.read',
    'ambulances.write',
    'emergencies.read',
    'emergencies.write',
    'referrals.read', 
    'referrals.write',
    'resources.read',
    'resources.write', 
    'procurement.read', 
    'procurement.write',
    'claims.read',
    'claims.write', 
    'telemedicine.read', 
    'analytics.read', 
    'staff.read', 
    'staff.write',
    'hospitals.read',
    'hospitals.write', 
    'settings.read',
    'monitoring.read',
    'audit.read'
  ],
  
  COUNTY_HEALTH_OFFICER: [
    'dashboard.read', 
    'triage.read', 
    'patients.read', 
    'transfers.read', 
    'transfers.write',
    'dispatch.read', 
    'dispatch.write',
    'ambulances.read',
    'emergencies.read',
    'emergencies.write',
    'referrals.read', 
    'referrals.write',
    'resources.read', 
    'procurement.read', 
    'procurement.write',
    'claims.read', 
    'telemedicine.read', 
    'analytics.read', 
    'staff.read', 
    'hospitals.read', 
    'settings.read',
    'monitoring.read'
  ],
  
  HOSPITAL_ADMIN: [
    'dashboard.read', 
    'triage.read', 
    'triage.write', 
    'patients.read', 
    'patients.write',
    'transfers.read', 
    'transfers.write', 
    'dispatch.read', 
    'dispatch.write',
    'ambulances.read',
    'ambulances.write',
    'emergencies.read',
    'emergencies.write',
    'referrals.read', 
    'referrals.write',
    'resources.read', 
    'resources.write', 
    'procurement.read', 
    'procurement.write',
    'claims.read', 
    'claims.write', 
    'telemedicine.read', 
    'telemedicine.write',
    'analytics.read', 
    'staff.read', 
    'staff.write',
    'hospitals.read', 
    'settings.read',
    'monitoring.read'
  ],
  
  FACILITY_MANAGER: [
    'dashboard.read', 
    'triage.read', 
    'triage.write', 
    'patients.read', 
    'patients.write',
    'transfers.read', 
    'transfers.write', 
    'dispatch.read', 
    'dispatch.write',
    'ambulances.read',
    'emergencies.read',
    'emergencies.write',
    'referrals.read', 
    'referrals.write',
    'resources.read', 
    'resources.write', 
    'procurement.read', 
    'procurement.write',
    'claims.read', 
    'claims.write', 
    'telemedicine.read', 
    'telemedicine.write',
    'analytics.read', 
    'staff.read', 
    'staff.write',
    'hospitals.read', 
    'settings.read'
  ],
  
  DOCTOR: [
    'dashboard.read', 
    'triage.read', 
    'patients.read', 
    'patients.write', 
    'transfers.read',
    'transfers.write',
    'referrals.read', 
    'referrals.write', 
    'telemedicine.read', 
    'telemedicine.write',
    'emergencies.read',
    'settings.read'
  ],
  
  NURSE: [
    'dashboard.read', 
    'triage.read', 
    'triage.write', 
    'patients.read', 
    'patients.write',
    'referrals.read',
    'settings.read'
  ],
  
  TRIAGE_OFFICER: [
    'dashboard.read', 
    'triage.read', 
    'triage.write', 
    'patients.read', 
    'patients.write',
    'settings.read'
  ],
  
  DISPATCHER: [
    'dashboard.read', 
    'dispatch.read', 
    'dispatch.write', 
    'ambulances.read', 
    'ambulances.write',
    'emergencies.read', 
    'emergencies.write',
    'transfers.read',
    'referrals.read',
    'settings.read'
  ],
  
  DISPATCH_COORDINATOR: [
    'dashboard.read', 
    'dispatch.read', 
    'dispatch.write', 
    'ambulances.read', 
    'ambulances.write',
    'emergencies.read', 
    'emergencies.write',
    'transfers.read',
    'referrals.read',
    'settings.read'
  ],
  
  AMBULANCE_DRIVER: [
    'dashboard.read', 
    'dispatch.read', 
    'ambulances.read',
    'emergencies.read',
    'transfers.read',
    'referrals.read',
    'settings.read'
  ],
  
  AMBULANCE_CREW: [
    'dashboard.read', 
    'dispatch.read', 
    'ambulances.read',
    'emergencies.read',
    'transfers.read',
    'referrals.read',
    'settings.read'
  ],
  
  EMERGENCY_MANAGER: [
    'dashboard.read', 
    'dispatch.read', 
    'dispatch.write', 
    'ambulances.read', 
    'ambulances.write',
    'emergencies.read', 
    'emergencies.write',
    'transfers.read',
    'referrals.read',
    'analytics.read',
    'settings.read'
  ],
  
  FINANCE_OFFICER: [
    'dashboard.read', 
    'claims.read', 
    'claims.write', 
    'analytics.read',
    'settings.read'
  ],
  
  LAB_TECHNICIAN: [
    'dashboard.read', 
    'patients.read',
    'settings.read'
  ],
  
  PHARMACIST: [
    'dashboard.read', 
    'patients.read', 
    'resources.read',
    'settings.read'
  ],
  
  MEDICAL_SUPERINTENDENT: [
    'dashboard.read', 
    'triage.read', 
    'triage.write', 
    'patients.read', 
    'patients.write',
    'transfers.read', 
    'transfers.write', 
    'dispatch.read', 
    'dispatch.write',
    'ambulances.read',
    'emergencies.read',
    'emergencies.write',
    'referrals.read', 
    'referrals.write',
    'resources.read', 
    'resources.write', 
    'procurement.read', 
    'procurement.write',
    'claims.read', 
    'claims.write', 
    'telemedicine.read', 
    'telemedicine.write',
    'analytics.read', 
    'staff.read', 
    'staff.write',
    'hospitals.read', 
    'settings.read'
  ],
  
  HOSPITAL_DIRECTOR: [
    'dashboard.read', 
    'triage.read', 
    'triage.write', 
    'patients.read', 
    'patients.write',
    'transfers.read', 
    'transfers.write', 
    'dispatch.read', 
    'dispatch.write',
    'ambulances.read',
    'emergencies.read',
    'emergencies.write',
    'referrals.read', 
    'referrals.write',
    'resources.read', 
    'resources.write', 
    'procurement.read', 
    'procurement.write',
    'claims.read', 
    'claims.write', 
    'telemedicine.read', 
    'telemedicine.write',
    'analytics.read', 
    'staff.read', 
    'staff.write',
    'hospitals.read', 
    'settings.read'
  ]
}

export function normalizeRole(role: string): string {
  if (!role) return 'UNKNOWN'
  
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
    'dispatch_coordinator': 'DISPATCH_COORDINATOR',
    'DISPATCH_COORDINATOR': 'DISPATCH_COORDINATOR',
    'dispatchcoordinator': 'DISPATCH_COORDINATOR',
    
    'ambulance_driver': 'AMBULANCE_DRIVER',
    'ambulancedriver': 'AMBULANCE_DRIVER',
    'AMBULANCE_DRIVER': 'AMBULANCE_DRIVER',
    'AMBULANCEDRIVER': 'AMBULANCE_DRIVER',
    'ambulance_crew': 'AMBULANCE_CREW',
    'AMBULANCE_CREW': 'AMBULANCE_CREW',
    'ambulancecrew': 'AMBULANCE_CREW',
    
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
  console.log(`🔄 Role normalization: "${role}" → "${normalized}"`)
  return normalized
}

export function getPermissionsForRole(role: string): string[] {
  const normalizedRole = normalizeRole(role)
  const permissions = ROLE_PERMISSIONS[normalizedRole] || []
  
  console.log(`📋 Getting permissions for role "${role}" (normalized: "${normalizedRole}"):`, permissions.length, 'permissions')
  
  if (permissions.length === 0) {
    console.warn(`⚠️ No permissions found for role: ${normalizedRole}`)
  }
  
  return permissions
}

export function createUserToken(userData: UserData): UserToken {
  const normalizedRole = normalizeRole(userData.role)
  const permissions = getPermissionsForRole(normalizedRole)
  
  console.log(`🔨 Creating user token for ${userData.email} with role ${normalizedRole}`)
  
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
export function createUserObject(userData: UserData): User {
  return createUserToken(userData) as User
}

// CRITICAL FIX: This function was NOT properly assigning permissions
export function ensureBasicPermissions(user: UserToken | UserData): UserToken {
  if (!user) {
    console.error('❌ ensureBasicPermissions: No user provided')
    // Return a safe default instead of undefined
    return {
      id: '',
      email: '',
      name: '',
      role: 'UNKNOWN',
      permissions: ['dashboard.read']
    }
  }
  
  console.log(`🔍 ensureBasicPermissions called for user: ${user.email}, role: ${user.role}`)
  console.log(`📊 Current permissions count: ${user.permissions?.length || 0}`)
  
  // Normalize the role first
  const normalizedRole = normalizeRole(user.role)
  
  // Get permissions for the normalized role
  const rolePermissions = getPermissionsForRole(normalizedRole)
  
  console.log(`📋 Role permissions for ${normalizedRole}:`, rolePermissions.length, 'permissions')
  
  // If user has no permissions or empty array, assign role permissions
  if (!user.permissions || !Array.isArray(user.permissions) || user.permissions.length === 0) {
    console.log(`✅ Assigning ${rolePermissions.length} permissions to user`)
    
    return {
      ...user,
      id: user.id,
      email: user.email,
      name: user.name || `${(user as UserData).firstName || ''} ${(user as UserData).lastName || ''}`.trim(),
      role: normalizedRole, // Use normalized role
      permissions: rolePermissions.length > 0 ? rolePermissions : ['dashboard.read']
    }
  }
  
  // If user has permissions, merge with role permissions (deduplicating)
  const mergedPermissions = Array.from(new Set([...user.permissions, ...rolePermissions]))
  
  console.log(`✅ Merged permissions: ${mergedPermissions.length} total`)
  
  return {
    ...user,
    id: user.id,
    email: user.email,
    name: user.name || `${(user as UserData).firstName || ''} ${(user as UserData).lastName || ''}`.trim(),
    role: normalizedRole, // Use normalized role
    permissions: mergedPermissions
  }
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
export async function signToken(payload: UserToken | UserData): Promise<string> {
  // Convert UserData to UserToken if needed
  if (!('permissions' in payload) || !payload.permissions) {
    const userToken = createUserToken(payload as UserData)
    return createToken(userToken)
  }
  return createToken(payload as UserToken)
}

// Helper function for API routes to verify and get user
export async function verifyAndGetUser(token: string): Promise<UserToken | null> {
  return verifyToken(token)
}