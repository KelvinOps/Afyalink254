// src/app/types/patient.types.ts

// ============================================
// BASE TYPES
// ============================================

export interface VitalSigns {
  heartRate: number
  bloodPressure: string
  respiratoryRate: number
  temperature: number
  oxygenSaturation: number
  painLevel: number
  bloodSugar?: number
  weight?: number
  height?: number
  bmi?: number
}

// ============================================
// RELATED ENTITY TYPES
// ============================================

export interface Hospital {
  id: string
  name: string
  code: string
  mflCode?: string | null
  phone?: string | null
  address?: string | null
  county?: string | null
  type?: string | null
}

export interface Department {
  id: string
  name: string
  type: string
  code?: string | null
  hospitalId?: string | null
  capacity?: number | null
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  phone?: string | null
  hospitalId?: string | null
  departmentId?: string | null
  isActive?: boolean
  avatarUrl?: string | null
}

export interface TriageEntryMinimal {
  id: string
  triageLevel: string
  status: string
  arrivalTime: string
  chiefComplaint?: string
}

// ============================================
// CORE PATIENT TYPES
// ============================================

export interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  otherNames?: string | null
  dateOfBirth: string
  gender: string
  phone: string
  alternatePhone?: string | null
  email?: string | null
  nationalId: string
  passportNumber?: string | null
  birthCertNumber?: string | null
  shaNumber: string
  shaStatus: string
  contributionStatus: string
  bloodType?: string | null
  allergies: string[]
  chronicConditions: string[]
  disabilities?: string[]
  countyOfResidence: string
  subCounty: string
  ward?: string | null
  village?: string | null
  landmark?: string | null
  what3words?: string | null
  nextOfKinName?: string | null
  nextOfKinPhone?: string | null
  nextOfKinRelation?: string | null
  currentStatus: PatientStatus
  currentHospitalId?: string | null
  currentHospital?: Hospital
  createdAt: string
  updatedAt: string
  // Optional relations (for detailed views)
  triageEntries?: TriageEntry[]
  transfers?: PatientTransfer[]
  referrals?: PatientReferral[]
  shaClaims?: SHAClaim[]
  emergencies?: Emergency[]
}

export interface PatientMinimal {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone: string
  currentStatus: PatientStatus
  currentHospital?: {
    id: string
    name: string
    code: string
  }
  latestTriage?: TriageEntryMinimal
}

// ============================================
// TRIAGE ENTRY TYPES
// ============================================

export interface TriageEntry {
  id: string
  patientId: string
  arrivalTime: string
  triageLevel: TriageLevel
  chiefComplaint: string
  vitalSigns: VitalSigns
  status: string
  notes?: string | null
  disposition?: string | null
  medications?: string[]
  followUpRequired?: boolean
  followUpDate?: string | null
  departmentId?: string | null
  hospitalId?: string | null
  assessedById?: string | null
  createdAt: string
  updatedAt: string
  // Relations
  department?: Department
  hospital?: Hospital
  assessedBy?: User
  patient?: PatientMinimal
}

export interface TriageEntryCreateInput {
  patientId: string
  arrivalTime: string
  triageLevel: TriageLevel
  chiefComplaint: string
  vitalSigns: VitalSigns
  status: string
  notes?: string
  disposition?: string
  medications?: string[]
  departmentId?: string
  hospitalId?: string
  assessedById?: string
}

export interface TriageEntryUpdateInput {
  triageLevel?: TriageLevel
  status?: string
  vitalSigns?: Partial<VitalSigns>
  notes?: string | null
  disposition?: string | null
  medications?: string[]
  followUpRequired?: boolean
  followUpDate?: string | null
}

// ============================================
// PATIENT HISTORY & PAGINATION
// ============================================

export interface PatientHistoryResponse {
  triageEntries: TriageEntry[]
  pagination: PaginationInfo
  patient?: PatientMinimal
}

export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PatientListResponse {
  patients: PatientMinimal[]
  pagination: PaginationInfo
  filters?: {
    search?: string
    status?: string
    hospitalId?: string
    startDate?: string
    endDate?: string
  }
}

// ============================================
// OTHER MEDICAL RECORD TYPES
// ============================================

export interface PatientTransfer {
  id: string
  patientId: string
  originHospitalId: string
  destinationHospitalId: string
  ambulanceId?: string | null
  transferReason: string
  priority: string
  status: TransferStatus
  requestedAt: string
  completedAt?: string | null
  notes?: string | null
  // Relations
  patient?: PatientMinimal
  originHospital?: Hospital
  destinationHospital?: Hospital
  ambulance?: {
    id: string
    registrationNumber: string
    type: string
    status: string
  }
}

export interface PatientReferral {
  id: string
  patientId: string
  originHospitalId: string
  destinationHospitalId: string
  referralReason: string
  priority: string
  status: ReferralStatus
  referredAt: string
  acceptedAt?: string | null
  completedAt?: string | null
  notes?: string | null
  // Relations
  patient?: PatientMinimal
  originHospital?: Hospital
  destinationHospital?: Hospital
}

export interface SHAClaim {
  id: string
  patientId: string
  hospitalId: string
  serviceDate: string
  serviceType: string
  diagnosisCode?: string | null
  procedureCode?: string | null
  amount: number
  status: SHAClaimStatus
  claimNumber: string
  submittedAt: string
  approvedAt?: string | null
  paidAt?: string | null
  notes?: string | null
  // Relations
  patient?: PatientMinimal
  hospital?: Hospital
}

export interface Emergency {
  id: string
  patientId: string
  countyId: string
  emergencyType: string
  severity: string
  location: string
  coordinates?: string | null
  status: EmergencyStatus
  reportedAt: string
  resolvedAt?: string | null
  responseTime?: number | null
  notes?: string | null
  // Relations
  patient?: PatientMinimal
  county?: {
    id: string
    name: string
    code: string
  }
}

// ============================================
// ENUM TYPES
// ============================================

export enum PatientStatus {
  REGISTERED = 'REGISTERED',
  IN_TRIAGE = 'IN_TRIAGE',
  IN_TREATMENT = 'IN_TREATMENT',
  IN_SURGERY = 'IN_SURGERY',
  ADMITTED = 'ADMITTED',
  IN_ICU = 'IN_ICU',
  IN_TRANSFER = 'IN_TRANSFER',
  DISCHARGED = 'DISCHARGED',
  DECEASED = 'DECEASED',
  ABSCONDED = 'ABSCONDED',
  REFERRED = 'REFERRED'
}

export enum TriageLevel {
  IMMEDIATE = 'IMMEDIATE',
  EMERGENT = 'EMERGENT',
  URGENT = 'URGENT',
  LESS_URGENT = 'LESS_URGENT',
  NON_URGENT = 'NON_URGENT',
  RESUSCITATION = 'RESUSCITATION',
  DECEASED = 'DECEASED'
}

export enum TransferStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum SHAClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  APPEALED = 'APPEALED'
}

export enum EmergencyStatus {
  REPORTED = 'REPORTED',
  RESPONDING = 'RESPONDING',
  ON_SITE = 'ON_SITE',
  TRANSPORTING = 'TRANSPORTING',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED'
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export interface PatientCreateInput {
  firstName: string
  lastName: string
  otherNames?: string
  dateOfBirth: string
  gender: string
  phone: string
  alternatePhone?: string
  email?: string
  nationalId: string
  passportNumber?: string
  birthCertNumber?: string
  shaNumber?: string
  shaStatus?: string
  contributionStatus?: string
  bloodType?: string
  allergies?: string[]
  chronicConditions?: string[]
  disabilities?: string[]
  countyOfResidence: string
  subCounty: string
  ward?: string
  village?: string
  landmark?: string
  what3words?: string
  nextOfKinName?: string
  nextOfKinPhone?: string
  nextOfKinRelation?: string
  currentHospitalId?: string
}

export interface PatientUpdateInput {
  firstName?: string
  lastName?: string
  otherNames?: string | null
  dateOfBirth?: string
  gender?: string
  phone?: string
  alternatePhone?: string | null
  email?: string | null
  nationalId?: string
  passportNumber?: string | null
  birthCertNumber?: string | null
  shaNumber?: string | null
  shaStatus?: string
  contributionStatus?: string
  bloodType?: string | null
  allergies?: string[]
  chronicConditions?: string[]
  disabilities?: string[]
  countyOfResidence?: string
  subCounty?: string
  ward?: string | null
  village?: string | null
  landmark?: string | null
  what3words?: string | null
  nextOfKinName?: string | null
  nextOfKinPhone?: string | null
  nextOfKinRelation?: string | null
  currentHospitalId?: string | null
  currentStatus?: PatientStatus
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface PatientFilters {
  search?: string
  status?: PatientStatus | string
  hospitalId?: string
  departmentId?: string
  triageLevel?: TriageLevel | string
  startDate?: string
  endDate?: string
  county?: string
  ageRange?: {
    min?: number
    max?: number
  }
  gender?: string
  bloodType?: string
  shaStatus?: string
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf'
  filters?: PatientFilters
  includeFields?: string[]
  excludeFields?: string[]
}

// ============================================
// RESPONSE & ERROR TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: PaginationInfo
  timestamp: string
}

export interface ApiError {
  error: string
  message?: string
  details?: any
  statusCode: number
  timestamp: string
}

// ============================================
// UTILITY TYPES
// ============================================

export type WithPagination<T> = {
  data: T[]
  pagination: PaginationInfo
}

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Nullable<T> = T | null | undefined

// ============================================
// EXPORT DATA TYPES
// ============================================

export interface PatientExportData {
  'Patient ID': string
  'Patient Number': string
  'First Name': string
  'Last Name': string
  'Full Name': string
  'Date of Birth': string
  'Age': number | string
  'Gender': string
  'Phone': string
  'Email': string
  'National ID': string
  'SHA Number': string
  'SHA Status': string
  'Contribution Status': string
  'Current Status': string
  'Current Hospital': string
  'Hospital Code': string
  'Triage Level': string
  'Last Arrival Time': string
  'Blood Type': string
  'Allergies': string
  'Chronic Conditions': string
  'County of Residence': string
  'Sub County': string
  'Created At': string
  'Updated At': string
}

export interface TriageExportData {
  'Entry ID': string
  'Patient Number': string
  'Patient Name': string
  'Arrival Time': string
  'Triage Level': string
  'Chief Complaint': string
  'Heart Rate': number
  'Blood Pressure': string
  'Respiratory Rate': number
  'Temperature': number
  'Oxygen Saturation': number
  'Pain Level': number
  'Status': string
  'Hospital': string
  'Department': string
  'Assessed By': string
  'Notes': string
  'Medications': string
  'Disposition': string
  'Created At': string
}