export interface SupplyRequest {
  id: string
  requestNumber: string
  hospitalId: string
  items: SupplyRequestItem[]
  totalEstimatedCost: number
  justification: string
  priority: RequestPriority
  requestedBy: string
  requestedByRole: string
  approvedByHOD: boolean
  approvedByAdmin: boolean
  approvedByCounty: boolean
  countyApproverName?: string
  countyApprovalNotes?: string
  status: SupplyRequestStatus
  requestedAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  rejectionReason?: string
  orderedAt?: Date
  deliveredAt?: Date
  supplierSelected?: string
  purchaseOrderNumber?: string
  deliveryNotes?: string
  actualCost?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface SupplyRequestItem {
  name: string
  type: string
  quantity: number
  unit: string
  urgency: string
  estimatedCost: number
  specifications?: string
}

export interface Procurement {
  id: string
  procurementNumber: string
  hospitalId: string
  procurementType: ProcurementType
  items: ProcurementItem[]
  totalValue: number
  supplierName: string
  supplierContact: string
  contractNumber?: string
  tenderNumber?: string
  approvalAuthority: string
  approvedBy?: string
  approvalDate?: Date
  expectedDeliveryDate?: Date
  actualDeliveryDate?: Date
  deliveryStatus: DeliveryStatus
  paymentStatus: PaymentStatus
  paymentAmount?: number
  paymentDate?: Date
  status: ProcurementStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProcurementItem {
  name: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
  specifications?: string
}

export enum RequestPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum SupplyRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ORDERED = 'ORDERED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum ProcurementType {
  MEDICAL_EQUIPMENT = 'MEDICAL_EQUIPMENT',
  PHARMACEUTICALS = 'PHARMACEUTICALS',
  LABORATORY_SUPPLIES = 'LABORATORY_SUPPLIES',
  SURGICAL_SUPPLIES = 'SURGICAL_SUPPLIES',
  GENERAL_SUPPLIES = 'GENERAL_SUPPLIES',
  SERVICES = 'SERVICES'
}

export enum ProcurementStatus {
  INITIATED = 'INITIATED',
  TENDER_ISSUED = 'TENDER_ISSUED',
  EVALUATION = 'EVALUATION',
  AWARDED = 'AWARDED',
  CONTRACTED = 'CONTRACTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  PARTIAL_DELIVERY = 'PARTIAL_DELIVERY',
  DELAYED = 'DELAYED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  DISPUTED = 'DISPUTED'
}

export interface ApprovalQueueItem {
  id: string
  requestNumber: string
  type: 'SUPPLY_REQUEST' | 'PURCHASE_ORDER'
  title: string
  requestedBy: string
  department: string
  totalAmount: number
  priority: RequestPriority
  currentStage: ApprovalStage
  daysInQueue: number
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  createdAt: Date
}

export enum ApprovalStage {
  HOD_APPROVAL = 'HOD_APPROVAL',
  ADMIN_APPROVAL = 'ADMIN_APPROVAL',
  COUNTY_APPROVAL = 'COUNTY_APPROVAL',
  FINANCE_APPROVAL = 'FINANCE_APPROVAL',
  COMPLETED = 'COMPLETED'
}

export interface ProcurementStats {
  totalRequests: number
  pendingApproval: number
  approvedOrders: number
  urgentRequests: number
  totalValue: number
  monthlySpend: number
  deliveryRate: number
  approvalRate: number
}