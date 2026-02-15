/* eslint-disable @typescript-eslint/no-explicit-any */
// hospitals/[id]/overview/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HospitalOverview } from '@/app/components/hospitals/HospitalOverview'
import { HospitalTabs } from '@/app/components/hospitals/HospitalTabs'
import { getHospitalById } from '@/app/services/hospital.service'
import { verifyToken, createUserObject, ensureBasicPermissions } from '@/app/lib/auth'
import type { User } from '@/app/lib/auth'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'

// FIXED: Import Prisma and create type alias
type JsonValue = Prisma.JsonValue

// Define params as a Promise for Next.js 15
type PageProps = {
  params: Promise<{
    id: string
  }>
}

// ============== PRISMA-ALIGNED TYPE DEFINITIONS ==============

// Use the actual MetricPeriod enum from Prisma
type MetricPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

interface County {
  id: string;
  code: string;
  name: string;
  coordinates: JsonValue;
  region: string;
  population: number;
  area: number;
  urbanRatio: number;
  governorName: string | null;
  healthCECName: string | null;
  countyHealthDirector: string | null;
  countyHQLocation: string;
  roadNetworkKm: number | null;
  electricityAccess: number | null;
  internetPenetration: number | null;
  doctorPopulationRatio: string | null;
  nursePopulationRatio: string | null;
  maternalMortalityRate: number | null;
  infantMortalityRate: number | null;
  annualHealthBudget: number | null;
  healthBudgetPercentage: number | null;
  isMarginalized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PerformanceMetric {
  id: string;
  countyId: string | null;
  hospitalId: string | null;
  date: Date;
  period: MetricPeriod;
  nationalLevel: boolean;
  totalPatients: number;
  emergencyVisits: number;
  outpatientVisits: number;
  admissions: number;
  discharges: number;
  deaths: number;
  referralsOut: number;
  referralsIn: number;
  triageLevel1: number;
  triageLevel2: number;
  triageLevel3: number;
  triageLevel4: number;
  triageLevel5: number;
  avgWaitTime: number | null;
  medianWaitTime: number | null;
  avgTriageTime: number | null;
  avgTreatmentTime: number | null;
  avgDoctorWaitTime: number | null;
  patientsSeen: number;
  patientsLeftBeforeTreatment: number;
  readmissions30Days: number;
  avgBedOccupancy: number | null;
  avgICUOccupancy: number | null;
  avgEmergencyOccupancy: number | null;
  bedTurnoverRate: number | null;
  transfersRequested: number;
  transfersApproved: number;
  transfersRejected: number;
  avgTransferTime: number | null;
  ambulanceDispatches: number;
  avgResponseTime: number | null;
  avgTransportTime: number | null;
  telemedicineSessions: number;
  telemedicineSuccessRate: number | null;
  claimsSubmitted: number;
  claimsApproved: number;
  claimsRejected: number;
  claimsPending: number;
  totalClaimValue: number;
  totalApprovedValue: number;
  avgClaimProcessingDays: number | null;
  doctorsOnDuty: number | null;
  nursesOnDuty: number | null;
  avgCaseloadPerDoctor: number | null;
  criticalShortages: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

interface Department {
  id: string;
  name: string;
  type: string;
  hospitalId: string;
  hodName: string | null;
  hodPhone: string | null;
  totalBeds: number;
  availableBeds: number;
  occupancyRate: number;
  isActive: boolean;
  isAcceptingPatients: boolean;
  createdAt: Date;
  updatedAt: Date;
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  }[];
}

interface Staff {
  id: string;
  userId: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string | null;
  role: string;
  specialization: string | null;
  licenseNumber: string | null;
  licensingBody: string | null;
  yearsOfExperience: number | null;
  facilityType: string;
  hospitalId: string | null;
  healthCenterId: string | null;
  dispensaryId: string | null;
  departmentId: string | null;
  employmentType: string;
  contractType: string;
  hireDate: Date;
  monthlySalary: number | null;
  lastPaidDate: Date | null;
  pendingSalaryMonths: number;
  isActive: boolean;
  isOnDuty: boolean;
  shiftStart: Date | null;
  shiftEnd: Date | null;
  currentCaseload: number;
  maxCaseload: number;
  passwordHash: string | null;
  lastLoginAt: Date | null;
  telemedicineEnabled: boolean;
  canGiveRemoteConsultations: boolean;
  createdAt: Date;
  updatedAt: Date;
  department?: {
    name: string;
    type: string;
  } | null;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  category: string;
  hospitalId: string;
  departmentId: string | null;
  totalCapacity: number;
  availableCapacity: number;
  reservedCapacity: number;
  inUseCapacity: number;
  unit: string;
  minimumLevel: number | null;
  criticalLevel: number | null;
  reorderLevel: number | null;
  maxCapacity: number | null;
  status: string;
  isOperational: boolean;
  isCritical: boolean;
  isShared: boolean;
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
  maintenanceSchedule: string | null;
  maintenanceNotes: string | null;
  supplier: string | null;
  supplierContact: string | null;
  lastRestock: Date | null;
  lastRestockQuantity: number | null;
  expiryDate: Date | null;
  batchNumber: string | null;
  unitCost: number | null;
  totalValue: number | null;
  specifications: JsonValue;
  notes: string | null;
  usageHistory: JsonValue[];
  createdAt: Date;
  updatedAt: Date;
  department?: {
    name: string;
  } | null;
}

interface Transfer {
  id: string;
  transferNumber: string;
  patientId: string;
  originHospitalId: string;
  destinationHospitalId: string;
  status: string;
  priority: string | null;
  reason: string;
  requestedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  departureTime: Date | null;
  arrivalTime: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Hospital {
  id: string;
  name: string;
  code: string | null;
  mflCode: string | null;
  type: string | null;
  level: string | null;
  ownership: string | null;
  countyId: string | null;
  county: County | null;
  subCounty: string | null;
  ward: string | null;
  constituency: string | null;
  address: string;
  coordinates: JsonValue;
  what3words: string | null;
  elevation: number | null;
  accessibilityScore: number;
  distanceToNearestTarmac: number | null;
  reachableInRainySeason: boolean;
  phone: string;
  emergencyPhone: string;
  ambulancePhone: string | null;
  email: string;
  website: string | null;
  totalBeds: number;
  functionalBeds: number;
  icuBeds: number;
  hdUnitBeds: number;
  maternityBeds: number;
  pediatricBeds: number;
  emergencyBeds: number;
  isolationBeds: number;
  availableBeds: number;
  availableIcuBeds: number;
  availableEmergencyBeds: number;
  lastBedUpdate: Date;
  powerStatus: string;
  backupPower: boolean;
  waterStatus: string;
  oxygenStatus: string;
  internetStatus: string;
  shaContracted: boolean;
  shaFacilityCode: string | null;
  shaActivationDate: Date | null;
  kephLevel: string | null;
  services: string[];
  specializations: string[];
  has24HourService: boolean;
  hasAmbulance: boolean;
  hasBloodBank: boolean;
  hasLaboratory: boolean;
  hasRadiology: boolean;
  hasCTScan: boolean;
  hasMRI: boolean;
  hasDialysis: boolean;
  hasPharmacy: boolean;
  hasOxygenPlant: boolean;
  hasMortuary: boolean;
  telemedicineEnabled: boolean;
  canReceiveReferrals: boolean;
  canGiveConsultations: boolean;
  isActive: boolean;
  operationalStatus: string;
  acceptingPatients: boolean;
  emergencyOnlyMode: boolean;
  managedByCounty: boolean;
  autonomyLevel: string;
  hospitalBoard: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  performanceMetrics?: PerformanceMetric[];
  departments?: Department[];
  staff?: Staff[];
  resources?: Resource[];
  originTransfers?: Transfer[];
  destinationTransfers?: Transfer[];
}

// ============== TRANSFORMATION FUNCTION ==============

// FIXED: SerializedHospital should match Hospital structure exactly, just with serialized dates
type SerializedHospital = Omit<Hospital, 
  | 'createdAt' 
  | 'updatedAt' 
  | 'lastBedUpdate' 
  | 'shaActivationDate'
  | 'county'
  | 'performanceMetrics'
  | 'departments'
  | 'staff'
  | 'resources'
  | 'originTransfers'
  | 'destinationTransfers'
> & {
  createdAt: string;
  updatedAt: string;
  lastBedUpdate: string;
  shaActivationDate: string | null;
  
  // Nested relations with serialized dates
  county: (Omit<County, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  }) | null;
  
  performanceMetrics: (Omit<PerformanceMetric, 'date' | 'createdAt' | 'updatedAt'> & {
    date: string;
    createdAt: string;
    updatedAt: string;
  })[];
  
  departments: (Omit<Department, 'createdAt' | 'updatedAt' | 'staff'> & {
    createdAt: string;
    updatedAt: string;
    staff: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
    }[];
  })[];
  
  staff: (Omit<Staff, 'hireDate' | 'lastPaidDate' | 'shiftStart' | 'shiftEnd' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'department'> & {
    hireDate: string;
    lastPaidDate: string | null;
    shiftStart: string | null;
    shiftEnd: string | null;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    department: {
      name: string;
      type: string;
    } | null;
  })[];
  
  resources: (Omit<Resource, 'lastMaintenance' | 'nextMaintenance' | 'lastRestock' | 'expiryDate' | 'createdAt' | 'updatedAt' | 'department'> & {
    lastMaintenance: string | null;
    nextMaintenance: string | null;
    lastRestock: string | null;
    expiryDate: string | null;
    createdAt: string;
    updatedAt: string;
    department: {
      name: string;
    } | null;
  })[];
  
  originTransfers: (Omit<Transfer, 'requestedAt' | 'approvedAt' | 'rejectedAt' | 'departureTime' | 'arrivalTime' | 'completedAt' | 'cancelledAt' | 'createdAt' | 'updatedAt'> & {
    requestedAt: string;
    approvedAt: string | null;
    rejectedAt: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
  })[];
  
  destinationTransfers: (Omit<Transfer, 'requestedAt' | 'approvedAt' | 'rejectedAt' | 'departureTime' | 'arrivalTime' | 'completedAt' | 'cancelledAt' | 'createdAt' | 'updatedAt'> & {
    requestedAt: string;
    approvedAt: string | null;
    rejectedAt: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
  })[];
}

function transformHospitalDates(hospital: Hospital): SerializedHospital;
function transformHospitalDates(hospital: Hospital | null): SerializedHospital | null;
function transformHospitalDates(hospital: Hospital | null): SerializedHospital | null {
  if (!hospital) return null

  return {
    ...hospital,
    // Transform main hospital date fields
    lastBedUpdate: hospital.lastBedUpdate.toISOString(),
    shaActivationDate: hospital.shaActivationDate?.toISOString() || null,
    createdAt: hospital.createdAt.toISOString(),
    updatedAt: hospital.updatedAt.toISOString(),
    
    // Transform nested relations
    performanceMetrics: hospital.performanceMetrics?.map((metric) => ({
      ...metric,
      date: metric.date.toISOString(),
      createdAt: metric.createdAt.toISOString(),
      updatedAt: metric.updatedAt.toISOString(),
    })) || [],
    
    departments: hospital.departments?.map((dept) => ({
      ...dept,
      createdAt: dept.createdAt.toISOString(),
      updatedAt: dept.updatedAt.toISOString(),
      staff: dept.staff || [],
    })) || [],
    
    staff: hospital.staff?.map((staffMember) => ({
      ...staffMember,
      hireDate: staffMember.hireDate.toISOString(),
      lastPaidDate: staffMember.lastPaidDate?.toISOString() || null,
      shiftStart: staffMember.shiftStart?.toISOString() || null,
      shiftEnd: staffMember.shiftEnd?.toISOString() || null,
      lastLoginAt: staffMember.lastLoginAt?.toISOString() || null,
      createdAt: staffMember.createdAt.toISOString(),
      updatedAt: staffMember.updatedAt.toISOString(),
      department: staffMember.department ?? null,
    })) || [],
    
    resources: hospital.resources?.map((resource) => ({
      ...resource,
      lastMaintenance: resource.lastMaintenance?.toISOString() || null,
      nextMaintenance: resource.nextMaintenance?.toISOString() || null,
      lastRestock: resource.lastRestock?.toISOString() || null,
      expiryDate: resource.expiryDate?.toISOString() || null,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
      department: resource.department ?? null,
    })) || [],
    
    county: hospital.county ? {
      ...hospital.county,
      createdAt: hospital.county.createdAt.toISOString(),
      updatedAt: hospital.county.updatedAt.toISOString(),
    } : null,
    
    originTransfers: hospital.originTransfers?.map((transfer) => ({
      ...transfer,
      requestedAt: transfer.requestedAt.toISOString(),
      approvedAt: transfer.approvedAt?.toISOString() || null,
      rejectedAt: transfer.rejectedAt?.toISOString() || null,
      departureTime: transfer.departureTime?.toISOString() || null,
      arrivalTime: transfer.arrivalTime?.toISOString() || null,
      completedAt: transfer.completedAt?.toISOString() || null,
      cancelledAt: transfer.cancelledAt?.toISOString() || null,
      createdAt: transfer.createdAt.toISOString(),
      updatedAt: transfer.updatedAt.toISOString(),
    })) || [],
    
    destinationTransfers: hospital.destinationTransfers?.map((transfer) => ({
      ...transfer,
      requestedAt: transfer.requestedAt.toISOString(),
      approvedAt: transfer.approvedAt?.toISOString() || null,
      rejectedAt: transfer.rejectedAt?.toISOString() || null,
      departureTime: transfer.departureTime?.toISOString() || null,
      arrivalTime: transfer.arrivalTime?.toISOString() || null,
      completedAt: transfer.completedAt?.toISOString() || null,
      cancelledAt: transfer.cancelledAt?.toISOString() || null,
      createdAt: transfer.createdAt.toISOString(),
      updatedAt: transfer.updatedAt.toISOString(),
    })) || [],
  }
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const hospital = await getHospitalById(params.id)
  
  if (!hospital) {
    return {
      title: 'Hospital Not Found - AfyaLink 254'
    }
  }

  return {
    title: `Overview - ${hospital.name} - AfyaLink 254`,
  }
}

// Helper function to get authenticated user
async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return null
    }

    const user = createUserObject(payload)
    return ensureBasicPermissions(user)
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export default async function HospitalOverviewPage(props: PageProps) {
  const params = await props.params
  const user = await getAuthenticatedUser()
  const hospital = await getHospitalById(params.id)

  if (!hospital) {
    notFound()
  }

  // Transform Date objects to strings for the component
  const transformedHospital = transformHospitalDates(hospital)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of {hospital.name}
          </p>
        </div>
      </div>

      <HospitalTabs hospitalId={hospital.id} activeTab="overview" />
      
      <HospitalOverview 
        hospital={transformedHospital as any}
        user={user}
        showDetailedView={true}
      />
    </div>
  )
}