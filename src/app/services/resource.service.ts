// src/services/resource.service.ts
import { 
  Resource, 
  ResourceType, 
  ResourceStatus,
  SupplyRequest,
  RequestPriority,
  SupplyRequestStatus,
  BedAvailability,
  CriticalShortage,
  ResourceStats,
  PaginatedResponse
} from '@/app/types/resources.types'

interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export class ResourceService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
  }

  // Helper method for API calls with auth headers
  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get auth token (you might need to adjust this based on your auth implementation)
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('auth_token') 
        : null

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers,
        credentials: 'include', // Important for cookies/sessions
        ...options,
      })

      if (response.status === 401) {
        // Handle unauthorized - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Unauthorized - Please login again')
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }))
        throw new Error(error.error || error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // ==================== RESOURCE MANAGEMENT ====================

  /**
   * Get all resources with optional filtering
   */
  async getResources(filters?: {
    type?: ResourceType | ResourceType[]
    status?: ResourceStatus | ResourceStatus[]
    category?: string
    departmentId?: string
    critical?: boolean
    search?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Resource>> {
    const params = new URLSearchParams()

    if (filters?.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type]
      params.append('type', types.join(','))
    }

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      params.append('status', statuses.join(','))
    }

    if (filters?.category) params.append('category', filters.category)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.critical !== undefined) params.append('critical', filters.critical.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const query = params.toString()
    const endpoint = `/resources${query ? `?${query}` : ''}`

    const response = await this.fetchApi<PaginatedResponse<Resource>>(endpoint)
    return response.data
  }

  /**
   * Get a single resource by ID
   */
  async getResourceById(id: string): Promise<Resource> {
    const response = await this.fetchApi<Resource>(`/resources/${id}`)
    return response.data
  }

  /**
   * Create a new resource
   */
  async createResource(data: {
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
    specifications?: any
    notes?: string
  }): Promise<Resource> {
    const response = await this.fetchApi<Resource>('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data
  }

  /**
   * Update an existing resource
   */
  async updateResource(
    id: string,
    data: Partial<{
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
      specifications?: any
      notes?: string
    }>
  ): Promise<Resource> {
    const response = await this.fetchApi<Resource>(`/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return response.data
  }

  /**
   * Delete a resource
   */
  async deleteResource(id: string): Promise<void> {
    await this.fetchApi(`/resources/${id}`, {
      method: 'DELETE',
    })
  }

  // ==================== BED MANAGEMENT ====================

  /**
   * Get bed availability across departments
   */
  async getBedAvailability(filters?: {
    departmentId?: string
    type?: ('BED' | 'ICU_BED')[]
  }): Promise<{
    departments: BedAvailability[]
    overall: {
      totalBeds: number
      availableBeds: number
      inUseBeds: number
      reservedBeds: number
      utilization: number
    }
    lastUpdated: string
  }> {
    const params = new URLSearchParams()
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.type) params.append('type', filters.type.join(','))

    const query = params.toString()
    const endpoint = `/resources/beds/availability${query ? `?${query}` : ''}`

    const response = await this.fetchApi<{
      departments: BedAvailability[]
      overall: {
        totalBeds: number
        availableBeds: number
        inUseBeds: number
        reservedBeds: number
        utilization: number
      }
      lastUpdated: string
    }>(endpoint)
    return response.data
  }

  /**
   * Update bed availability
   */
  async updateBedAvailability(
    resourceId: string,
    data: {
      availableCapacity?: number
      inUseCapacity?: number
      reservedCapacity?: number
      status?: ResourceStatus
    }
  ): Promise<Resource> {
    const response = await this.fetchApi<Resource>('/resources/beds/availability', {
      method: 'POST',
      body: JSON.stringify({ resourceId, ...data }),
    })
    return response.data
  }

  // ==================== CRITICAL SHORTAGES ====================

  /**
   * Get critical resource shortages
   */
  async getCriticalShortages(filters?: {
    type?: ResourceType | ResourceType[]
    severity?: ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')[]
  }): Promise<{
    shortages: CriticalShortage[]
    statistics: {
      total: number
      critical: number
      high: number
      medium: number
      byType: Record<string, number>
    }
    lastUpdated: string
  }> {
    const params = new URLSearchParams()

    if (filters?.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type]
      params.append('type', types.join(','))
    }

    if (filters?.severity) {
      const severities = Array.isArray(filters.severity) ? filters.severity : [filters.severity]
      params.append('severity', severities.join(','))
    }

    const query = params.toString()
    const endpoint = `/resources/critical-shortages${query ? `?${query}` : ''}`

    const response = await this.fetchApi<{
      shortages: CriticalShortage[]
      statistics: {
        total: number
        critical: number
        high: number
        medium: number
        byType: Record<string, number>
      }
      lastUpdated: string
    }>(endpoint)
    return response.data
  }

  /**
   * Acknowledge a critical shortage
   */
  async acknowledgeShortage(
    resourceId: string,
    action: string,
    notes?: string
  ): Promise<{ message: string; alert: any }> {
    const response = await this.fetchApi<{ message: string; alert: any }>(
      '/resources/critical-shortages',
      {
        method: 'POST',
        body: JSON.stringify({ resourceId, action, notes }),
      }
    )
    return response.data
  }

  // ==================== SUPPLY REQUESTS ====================

  /**
   * Get supply requests
   */
  async getSupplyRequests(filters?: {
    status?: SupplyRequestStatus | SupplyRequestStatus[]
    priority?: RequestPriority | RequestPriority[]
    search?: string
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResponse<SupplyRequest>> {
    const params = new URLSearchParams()

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      params.append('status', statuses.join(','))
    }

    if (filters?.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
      params.append('priority', priorities.join(','))
    }

    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)

    const query = params.toString()
    const endpoint = `/resources/requests${query ? `?${query}` : ''}`

    const response = await this.fetchApi<PaginatedResponse<SupplyRequest>>(endpoint)
    return response.data
  }

  /**
   * Get a single supply request by ID
   */
  async getSupplyRequestById(id: string): Promise<SupplyRequest> {
    const response = await this.fetchApi<SupplyRequest>(`/resources/requests/${id}`)
    return response.data
  }

  /**
   * Create a new supply request
   */
  async createSupplyRequest(data: {
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
  }): Promise<SupplyRequest> {
    const response = await this.fetchApi<SupplyRequest>('/resources/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data
  }

  /**
   * Update supply request status
   */
  async updateSupplyRequestStatus(
    id: string,
    status: SupplyRequestStatus,
    reason?: string
  ): Promise<SupplyRequest> {
    const response = await this.fetchApi<SupplyRequest>(
      `/resources/requests/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }
    )
    return response.data
  }

  /**
   * Approve/reject supply request
   */
  async approveSupplyRequest(
    id: string,
    approved: boolean,
    approverType: 'HOD' | 'ADMIN' | 'COUNTY',
    notes?: string
  ): Promise<SupplyRequest> {
    const response = await this.fetchApi<SupplyRequest>(
      `/resources/requests/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ approved, approverType, notes }),
      }
    )
    return response.data
  }

  // ==================== STATISTICS & ANALYTICS ====================

  /**
   * Get resource statistics
   */
  async getResourceStats(filters?: {
    timeframe?: '24h' | '7d' | '30d' | '90d'
    departmentId?: string
    type?: ResourceType
  }): Promise<ResourceStats> {
    const params = new URLSearchParams()
    if (filters?.timeframe) params.append('timeframe', filters.timeframe)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.type) params.append('type', filters.type)

    const query = params.toString()
    const endpoint = `/resources/stats${query ? `?${query}` : ''}`

    const response = await this.fetchApi<ResourceStats>(endpoint)
    return response.data
  }

  /**
   * Get resource utilization trends
   */
  async getUtilizationTrends(filters: {
    type: ResourceType
    timeframe: '7d' | '30d' | '90d'
    interval: 'day' | 'week' | 'month'
  }): Promise<Array<{ date: string; utilization: number; available: number; inUse: number }>> {
    const params = new URLSearchParams()
    params.append('type', filters.type)
    params.append('timeframe', filters.timeframe)
    params.append('interval', filters.interval)

    const endpoint = `/resources/analytics/utilization?${params.toString()}`
    const response = await this.fetchApi<Array<{ date: string; utilization: number; available: number; inUse: number }>>(endpoint)
    return response.data
  }

  // ==================== EXPORT & REPORTS ====================

  /**
   * Export resources data
   */
  async exportResources(format: 'csv' | 'excel' | 'pdf' = 'csv', filters?: {
    type?: ResourceType[]
    status?: ResourceStatus[]
    departmentId?: string
    startDate?: string
    endDate?: string
  }): Promise<Blob> {
    const params = new URLSearchParams()
    params.append('format', format)

    if (filters?.type) params.append('type', filters.type.join(','))
    if (filters?.status) params.append('status', filters.status.join(','))
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)

    const endpoint = `/resources/export?${params.toString()}`
    
    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('auth_token') 
        : null

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      return await response.blob()
    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }

  /**
   * Generate resource report
   */
  async generateReport(filters: {
    reportType: 'INVENTORY' | 'UTILIZATION' | 'MAINTENANCE' | 'SHORTAGES'
    timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    departmentId?: string
    format?: 'pdf' | 'excel'
  }): Promise<Blob> {
    const params = new URLSearchParams()
    params.append('reportType', filters.reportType)
    params.append('timeframe', filters.timeframe)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.format) params.append('format', filters.format)

    const endpoint = `/resources/reports/generate?${params.toString()}`
    
    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('auth_token') 
        : null

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.statusText}`)
      }
      return await response.blob()
    } catch (error) {
      console.error('Report generation error:', error)
      throw error
    }
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Update multiple resources in batch
   */
  async batchUpdateResources(updates: Array<{
    id: string
    data: Partial<{
      availableCapacity: number
      inUseCapacity: number
      reservedCapacity: number
      status: ResourceStatus
    }>
  }>): Promise<Array<Resource>> {
    const response = await this.fetchApi<Resource[]>('/resources/batch', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    })
    return response.data
  }

  /**
   * Create multiple resources in batch
   */
  async batchCreateResources(resources: Array<{
    name: string
    type: ResourceType
    category: string
    totalCapacity: number
    unit: string
    departmentId?: string
  }>): Promise<Array<Resource>> {
    const response = await this.fetchApi<Resource[]>('/resources/batch', {
      method: 'POST',
      body: JSON.stringify({ resources }),
    })
    return response.data
  }

  // ==================== NOTIFICATIONS & ALERTS ====================

  /**
   * Subscribe to resource alerts
   */
  async subscribeToAlerts(preferences: {
    email: boolean
    push: boolean
    types: ResourceType[]
    severity: ('CRITICAL' | 'HIGH' | 'MEDIUM')[]
  }): Promise<void> {
    await this.fetchApi('/resources/alerts/subscribe', {
      method: 'POST',
      body: JSON.stringify(preferences),
    })
  }

  /**
   * Get unread resource alerts
   */
  async getUnreadAlerts(): Promise<Array<{
    id: string
    type: string
    title: string
    message: string
    severity: string
    resourceId?: string
    createdAt: string
  }>> {
    const response = await this.fetchApi<Array<{
      id: string
      type: string
      title: string
      message: string
      severity: string
      resourceId?: string
      createdAt: string
    }>>('/resources/alerts/unread')
    return response.data
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    await this.fetchApi(`/resources/alerts/${alertId}/read`, {
      method: 'POST',
    })
  }
}

// Export singleton instance
export const resourceService = new ResourceService()

// Export types for convenience
export type {
  Resource,
  ResourceType,
  ResourceStatus,
  SupplyRequest,
  RequestPriority,
  SupplyRequestStatus,
  BedAvailability,
  CriticalShortage,
  ResourceStats,
}