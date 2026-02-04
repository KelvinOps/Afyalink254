// /app/lib/permissions.ts
export function hasPermission(user: any, permission: string): boolean {
  if (!user || !user.permissions) return false
  
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return true
  }
  
  const hasPerm = user.permissions?.includes(permission) || user.permissions?.includes('*')
  return hasPerm
}

export function canAccessModule(user: any, module: string): boolean {
  const modulePermissions: Record<string, string[]> = {
    dashboard: ['dashboard.read', '*'],
    triage: ['triage.read', 'triage.write', '*'],
    patients: ['patients.read', 'patients.write', '*'],
    transfers: ['transfers.read', 'transfers.write', '*'],
    dispatch: ['dispatch.read', 'dispatch.write', '*'],
    ambulances: ['ambulances.read', 'ambulances.write', '*'],
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