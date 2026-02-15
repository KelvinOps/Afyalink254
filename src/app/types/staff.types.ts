import { StaffRole, EmploymentType, ContractType, FacilityType, Gender } from '@prisma/client'

export interface StaffFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  nationalId?: string
  gender?: Gender
  role: StaffRole
  specialization?: string
  licenseNumber?: string
  licensingBody?: string
  yearsOfExperience?: number
  employmentType: EmploymentType
  contractType: ContractType
  monthlySalary?: number
  facilityType: FacilityType
  hospitalId?: string
  healthCenterId?: string
  dispensaryId?: string
  departmentId?: string
  hireDate: Date
  isActive: boolean
  telemedicineEnabled: boolean
  canGiveRemoteConsultations: boolean
}

// FIXED: Make Staff type match what the service actually returns
export interface Staff {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  nationalId: string | null
  staffNumber: string
  role: StaffRole
  facilityType: FacilityType
  employmentType: EmploymentType
  contractType: ContractType
  specialization: string | null
  licenseNumber: string | null
  licensingBody: string | null
  yearsOfExperience: number | null
  monthlySalary: number | null
  hireDate: Date
  isActive: boolean
  telemedicineEnabled: boolean
  canGiveRemoteConsultations: boolean
  userId: string
  isOnDuty: boolean
  shiftStart: Date | null
  shiftEnd: Date | null
  currentCaseload: number
  maxCaseload: number
  lastPaidDate: Date | null
  pendingSalaryMonths: number
  passwordHash: string | null
  lastLoginAt: Date | null
  hospitalId: string | null
  healthCenterId: string | null
  dispensaryId: string | null
  departmentId: string | null
  createdAt: Date
  updatedAt: Date
  // Related entities (from includes)
  hospital?: {
    id: string
    name: string
    code: string
    countyId: string
  } | null
  healthCenter?: {
    id: string
    name: string
    code: string
    countyId: string
  } | null
  dispensary?: {
    id: string
    name: string
    code: string
    countyId: string
  } | null
  department?: {
    id: string
    name: string
    type: string
  } | null
}

export interface StaffSearchParams {
  page?: number
  limit?: number
  search?: string
  role?: StaffRole
  facilityType?: FacilityType
  hospitalId?: string
  departmentId?: string
  isActive?: boolean
  isOnDuty?: boolean
}

export interface StaffSchedule {
  id: string
  staffId: string
  staff: Staff
  startTime: Date
  endTime: Date
  shiftType: 'MORNING' | 'EVENING' | 'NIGHT' | 'CUSTOM'
  departmentId?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ShiftAssignment {
  staffId: string
  startTime: Date
  endTime: Date
  shiftType: string
  departmentId?: string
  notes?: string
}

export interface StaffStats {
  totalStaff: number
  activeStaff: number
  onDutyStaff: number
  byRole: { role: StaffRole; count: number }[]
  byDepartment: { department: string; count: number }[]
  averageCaseload: number
  staffWithHighCaseload: number
}