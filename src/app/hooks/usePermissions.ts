// /app/hooks/usePermissions.ts
'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { useCallback } from 'react'
import { hasPermission as checkPermission } from '@/app/lib/permissions'

export function usePermissions() {
  const { user } = useAuth()
  
  const hasPermission = useCallback((permission: string): boolean => {
    return checkPermission(user, permission)
  }, [user])
  
  const canAccessModule = useCallback((module: string): boolean => {
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
    return modulePerms.some(perm => hasPermission(perm))
  }, [hasPermission])
  
  return { 
    hasPermission, 
    canAccessModule, 
    user,
    isLoading: !user,
    permissions: user?.permissions || []
  }
}