// /app/lib/permissions.ts
import { UserToken } from '@/app/lib/auth'

// Export the function properly
export function hasPermission(user: UserToken | null, permission: string): boolean {
  if (!user || !user.permissions) {
    return false
  }
  
  // SUPER_ADMIN and ADMIN have all permissions
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return true
  }
  
  const hasPerm = user.permissions?.includes(permission) || user.permissions?.includes('*')
  return hasPerm
}

export function canAccessModule(user: UserToken | null, module: string): boolean {
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