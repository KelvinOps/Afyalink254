// Resource Types
export type ResourceType = 
  | 'BED'
  | 'ICU_BED'
  | 'VENTILATOR'
  | 'MONITOR'
  | 'DEFIBRILLATOR'
  | 'DIALYSIS_MACHINE'
  | 'OXYGEN_SUPPLY'
  | 'OXYGEN_CONCENTRATOR'
  | 'MEDICATION'
  | 'BLOOD_PRODUCT'
  | 'PPE'
  | 'SURGICAL_EQUIPMENT'
  | 'IMAGING_EQUIPMENT'
  | 'LABORATORY_REAGENT'
  | 'MEDICAL_SUPPLY'
  | 'OTHER'

export type ResourceStatus = 
  | 'AVAILABLE'
  | 'IN_USE'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'OUT_OF_ORDER'
  | 'DEPLETED'
  | 'EXPIRED'

export interface Resource {
  id: string
  name: string
  type: ResourceType
  category: string
  departmentId?: string
  department?: {
    id: string
    name: string
    type: string
  }
  hospital?: {
    id: string
    name: string
    code: string
  }
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
  usageHistory?: Array<{
    date: string
    quantityUsed: number
    purpose: string
    userId: string
  }>
  createdAt: string
  updatedAt: string
}

// Supply Request Types
export type RequestPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type SupplyRequestStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED'
  | 'DELIVERED'
  | 'CANCELLED'

export interface SupplyRequestItem {
  name: string
  type: string
  quantity: number
  unit: string
  urgency: RequestPriority
  estimatedCost: number
  actualCost?: number
}

export interface SupplyRequest {
  id: string
  requestNumber: string
  items: SupplyRequestItem[]
  totalEstimatedCost: number
  justification: string
  priority: RequestPriority
  status: SupplyRequestStatus
  requestedBy: string
  requestedByRole: string
  approvedByHOD: boolean
  approvedByAdmin: boolean
  approvedByCounty: boolean
  countyApproverName?: string
  countyApprovalNotes?: string
  requestedAt: string
  approvedAt?: string
  rejectedAt?: string
  orderedAt?: string
  deliveredAt?: string
  supplierSelected?: string
  purchaseOrderNumber?: string
  actualCost?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

// Bed Availability Types
export interface BedAvailabilityResource {
  id: string
  name: string
  type: 'BED' | 'ICU_BED'
  totalCapacity: number
  availableCapacity: number
  inUseCapacity: number
  reservedCapacity: number
  status: ResourceStatus
  isCritical: boolean
}

export interface BedAvailability {
  department: string
  departmentType: string
  totalBeds: number
  availableBeds: number
  inUseBeds: number
  reservedBeds: number
  utilization: number
  resources: BedAvailabilityResource[]
}

// Critical Shortage Types
export interface CriticalShortage {
  id: string
  name: string
  type: ResourceType
  category: string
  department: string
  availableCapacity: number
  totalCapacity: number
  unit: string
  criticalLevel?: number
  reorderLevel?: number
  shortageType: 
    | 'STOCK_CRITICAL'
    | 'STOCK_LOW'
    | 'EQUIPMENT_DOWN'
    | 'MAINTENANCE_OVERDUE'
    | 'EXPIRING_SOON'
    | 'OTHER'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  isOperational: boolean
  nextMaintenance?: string
  expiryDate?: string
  lastUpdated: string
}

// Statistics Types
export interface ResourceStats {
  totalResources: number
  availableResources: number
  criticalResources: number
  byType: Record<ResourceType, number>
  byStatus: Record<ResourceStatus, number>
  byDepartment: Record<string, number>
  utilizationRate: number
  maintenanceDueCount: number
  expiringSoonCount: number
  lowStockCount: number
  lastUpdated: string
}

// Pagination Types
export interface PaginationParams {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationParams
}

// Filter Types
export interface ResourceFilters {
  type?: ResourceType | ResourceType[]
  status?: ResourceStatus | ResourceStatus[]
  category?: string
  departmentId?: string
  critical?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface SupplyRequestFilters {
  status?: SupplyRequestStatus | SupplyRequestStatus[]
  priority?: RequestPriority | RequestPriority[]
  search?: string
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}