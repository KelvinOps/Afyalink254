import { useState, useEffect, useCallback } from 'react'
import { 
  Resource, 
  SupplyRequest, 
  BedAvailability, 
  CriticalShortage,
  ResourceType,
  ResourceStatus,
  SupplyRequestStatus,
  RequestPriority
} from '@/app/types/resources.types'
import { resourceService } from '@/app/services/resource.service'

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResources = useCallback(async (filters?: {
    type?: ResourceType | ResourceType[]
    status?: ResourceStatus | ResourceStatus[]
    category?: string
    departmentId?: string
    critical?: boolean
    search?: string
    page?: number
    limit?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const data = await resourceService.getResources(filters)
      setResources(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resources')
    } finally {
      setLoading(false)
    }
  }, [])

  const createResource = async (data: {
    name: string
    type: ResourceType
    category: string
    departmentId?: string
    totalCapacity: number
    availableCapacity?: number
    unit: string
    minimumLevel?: number
    criticalLevel?: number
    reorderLevel?: number
    maxCapacity?: number
    status?: ResourceStatus
    isOperational?: boolean
    isCritical?: boolean
    isShared?: boolean
    lastMaintenance?: string
    nextMaintenance?: string
    maintenanceSchedule?: string
    maintenanceNotes?: string
    supplier?: string
    supplierContact?: string
    lastRestock?: string
    lastRestockQuantity?: number
    expiryDate?: string
    batchNumber?: string
    unitCost?: number
    totalValue?: number
    specifications?: Record<string, string | number | boolean | null>
    notes?: string
  }) => {
    try {
      const result = await resourceService.createResource(data)
      setResources(prev => [result, ...prev])
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource')
      throw err
    }
  }

  const updateResource = async (id: string, data: Partial<{
    name: string
    type: ResourceType
    category: string
    departmentId?: string
    totalCapacity: number
    availableCapacity: number
    reservedCapacity: number
    inUseCapacity: number
    unit: string
    minimumLevel?: number
    criticalLevel?: number
    reorderLevel?: number
    maxCapacity?: number
    status: ResourceStatus
    isOperational: boolean
    isCritical: boolean
    isShared: boolean
    lastMaintenance?: string
    nextMaintenance?: string
    maintenanceSchedule?: string
    maintenanceNotes?: string
    supplier?: string
    supplierContact?: string
    lastRestock?: string
    lastRestockQuantity?: number
    expiryDate?: string
    batchNumber?: string
    unitCost?: number
    totalValue?: number
    specifications?: Record<string, string | number | boolean | null>
    notes?: string
  }>) => {
    try {
      const result = await resourceService.updateResource(id, data)
      setResources(prev => prev.map(r => r.id === id ? result : r))
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource')
      throw err
    }
  }

  const deleteResource = async (id: string) => {
    try {
      await resourceService.deleteResource(id)
      setResources(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource')
      throw err
    }
  }

  return {
    resources,
    loading,
    error,
    fetchResources,
    createResource,
    updateResource,
    deleteResource,
    refetch: fetchResources
  }
}

export function useBedAvailability(departmentId?: string) {
  const [availability, setAvailability] = useState<{
    departments: BedAvailability[]
    overall: {
      totalBeds: number
      availableBeds: number
      inUseBeds: number
      reservedBeds: number
      utilization: number
    }
    lastUpdated: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailability = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await resourceService.getBedAvailability(
        departmentId ? { departmentId } : undefined
      )
      setAvailability(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bed availability')
    } finally {
      setLoading(false)
    }
  }, [departmentId])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  const updateAvailability = async (
    resourceId: string,
    data: {
      availableCapacity?: number
      inUseCapacity?: number
      reservedCapacity?: number
      status?: ResourceStatus
    }
  ) => {
    try {
      const result = await resourceService.updateBedAvailability(resourceId, data)
      await fetchAvailability() // Refresh data
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bed availability')
      throw err
    }
  }

  return {
    availability,
    loading,
    error,
    updateAvailability,
    refetch: fetchAvailability
  }
}

export function useCriticalShortages(type?: ResourceType, severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') {
  const [shortages, setShortages] = useState<CriticalShortage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShortages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters: {
        type?: ResourceType | ResourceType[]
        severity?: ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')[]
      } = {}
      
      if (type) filters.type = type
      if (severity) filters.severity = [severity]
      
      const data = await resourceService.getCriticalShortages(
        Object.keys(filters).length > 0 ? filters : undefined
      )
      setShortages(data.shortages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch critical shortages')
    } finally {
      setLoading(false)
    }
  }, [type, severity])

  useEffect(() => {
    fetchShortages()
  }, [fetchShortages])

  const acknowledgeShortage = async (
    resourceId: string,
    action: string,
    notes?: string
  ) => {
    try {
      const result = await resourceService.acknowledgeShortage(resourceId, action, notes)
      await fetchShortages() // Refresh data
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge shortage')
      throw err
    }
  }

  return {
    shortages,
    loading,
    error,
    acknowledgeShortage,
    refetch: fetchShortages
  }
}

export function useSupplyRequests(status?: SupplyRequestStatus) {
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await resourceService.getSupplyRequests(
        status ? { status } : undefined
      )
      setRequests(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch supply requests')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const createRequest = async (data: {
    items: Array<{
      name: string
      type: string
      quantity: number
      urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      estimatedCost: number
    }>
    totalEstimatedCost: number
    justification: string
    priority: RequestPriority
    notes?: string
  }) => {
    try {
      const result = await resourceService.createSupplyRequest(data)
      setRequests(prev => [result, ...prev])
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supply request')
      throw err
    }
  }

  const approveRequest = async (
    requestId: string, 
    approved: boolean, 
    approverType: 'HOD' | 'ADMIN' | 'COUNTY' = 'HOD',
    notes?: string
  ) => {
    try {
      const result = await resourceService.approveSupplyRequest(requestId, approved, approverType, notes)
      setRequests(prev => prev.map(req => 
        req.id === requestId ? result : req
      ))
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve/reject request')
      throw err
    }
  }

  return {
    requests,
    loading,
    error,
    createRequest,
    approveRequest,
    refetch: fetchRequests
  }
}