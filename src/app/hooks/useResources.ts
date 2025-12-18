import { useState, useEffect, useCallback } from 'react'
import { Resource, SupplyRequest, BedAvailability, CriticalShortage } from '@/app/types/resources.types'
import { resourceService } from '@/app/services/resource.service'

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResources = useCallback(async (filters?: {
    type?: string
    status?: string
    department?: string
    critical?: boolean
    page?: number
    limit?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const data = await resourceService.getResources(filters)
      setResources(data.resources)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resources')
    } finally {
      setLoading(false)
    }
  }, [])

  const createResource = async (data: Partial<Resource>) => {
    try {
      const result = await resourceService.createResource(data)
      setResources(prev => [result.resource, ...prev])
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource')
      throw err
    }
  }

  const updateResource = async (id: string, data: Partial<Resource>) => {
    try {
      const result = await resourceService.updateResource(id, data)
      setResources(prev => prev.map(r => r.id === id ? result.resource : r))
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
    overall: any
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailability = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await resourceService.getBedAvailability(departmentId)
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
      status?: string
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

export function useCriticalShortages(type?: string, severity?: string) {
  const [shortages, setShortages] = useState<CriticalShortage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShortages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await resourceService.getCriticalShortages(type, severity)
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

export function useSupplyRequests(status?: string) {
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await resourceService.getSupplyRequests(status)
      setRequests(data.requests)
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
      urgency: string
      estimatedCost: number
    }>
    totalEstimatedCost: number
    justification: string
    priority: string
  }) => {
    try {
      const result = await resourceService.createSupplyRequest(data)
      setRequests(prev => [result.request, ...prev])
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supply request')
      throw err
    }
  }

  const approveRequest = async (requestId: string, approved: boolean, reason?: string) => {
    try {
      const result = await resourceService.approveSupplyRequest(requestId, approved, reason)
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: approved ? 'APPROVED' : 'REJECTED' } : req
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