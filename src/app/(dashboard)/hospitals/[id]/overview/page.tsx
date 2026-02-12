// hospitals/[id]/overview/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HospitalOverview } from '@/app/components/hospitals/HospitalOverview'
import { HospitalTabs } from '@/app/components/hospitals/HospitalTabs'
import { getHospitalById } from '@/app/services/hospital.service'
import { verifyToken, createUserObject, ensureBasicPermissions } from '@/app/lib/auth'
import type { User } from '@/app/lib/auth'
import { cookies } from 'next/headers'
import type { JsonValue } from '@prisma/client'

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
  hospitalId: string;
  date: Date;
  period: MetricPeriod;
  
  // Bed metrics
  bedOccupancyRate: number | null;
  totalBeds: number | null;
  availableBeds: number | null;
  occupiedBeds: number | null;
  icuBeds: number | null;
  availableIcuBeds: number | null;
  hduBeds: number | null;
  availableHduBeds: number | null;
  highCareBeds: number | null;
  availableHighCareBeds: number | null;
  
  // Wait times
  avgWaitTime: number | null;
  maxWaitTime: number | null;
  triageWaitTime: number | null;
  registrationWaitTime: number | null;
  consultationWaitTime: number | null;
  pharmacyWaitTime: number | null;
  labWaitTime: number | null;
  radiologyWaitTime: number | null;
  admissionWaitTime: number | null;
  
  // Patient volume
  patientVolume: number | null;
  newPatients: number | null;
  revisitPatients: number | null;
  emergencyVisits: number | null;
  outpatientVisits: number | null;
  inpatientAdmissions: number | null;
  inpatientDischarges: number | null;
  
  // Outcomes
  patientSatisfaction: number | null;
  mortalityRate: number | null;
  readmissionRate: number | null;
  infectionRate: number | null;
  
  // Emergency metrics
  emergencyResponseTime: number | null;
  sceneResponseTime: number | null;
  hospitalResponseTime: number | null;
  totalEmergencies: number | null;
  massCasualtyIncidents: number | null;
  
  // Telemedicine
  telemedicineSessions: number | null;
  virtualConsultations: number | null;
  
  // Staff metrics
  totalStaff: number | null;
  doctorCount: number | null;
  nurseCount: number | null;
  clinicalOfficerCount: number | null;
  specialistCount: number | null;
  supportStaffCount: number | null;
  staffAttritionRate: number | null;
  staffSatisfaction: number | null;
  
  // Resource metrics
  totalResources: number | null;
  criticalResources: number | null;
  resourceUtilization: number | null;
  ambulanceUtilization: number | null;
  bloodSupplyDays: number | null;
  medicineStockoutDays: number | null;
  
  // Financial metrics
  operationalCost: number | null;
  revenue: number | null;
  shaClaimsSubmitted: number | null;
  shaClaimsApproved: number | null;
  shaClaimsValue: number | null;
  shaReimbursementRate: number | null;
  
  // Additional fields
  criticalShortages: JsonValue;
  
  createdAt: Date;
  updatedAt: Date;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  hospitalId: string;
  description: string | null;
  headOfDepartment: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  totalBeds: number | null;
  availableBeds: number | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Staff {
  id: string;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  title: string | null;
  department: string | null;
  specialization: string | null;
  phoneNumber: string | null;
  email: string | null;
  hireDate: Date | null;
  lastPaidDate: Date | null;
  shiftStart: Date | null;
  shiftEnd: Date | null;
  isActive: boolean | null;
  hospitalId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  status: string | null;
  location: string | null;
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
  lastRestock: Date | null;
  expiryDate: Date | null;
  hospitalId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Transfer {
  id: string;
  transferNumber: string | null;
  patientId: string;
  originHospitalId: string;
  destinationHospitalId: string;
  status: string;
  priority: string | null;
  reason: string | null;
  requestedAt: Date | null;
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
  registrationNumber: string | null;
  type: string | null;
  level: string | null;
  ownership: string | null;
  countyId: string | null;
  county: County | null;
  location: string | null;
  address: string | null;
  phoneNumber: string | null;
  alternativePhone: string | null;
  email: string | null;
  website: string | null;
  totalBeds: number | null;
  availableBeds: number | null;
  occupiedBeds: number | null;
  icuBeds: number | null;
  availableIcuBeds: number | null;
  hduBeds: number | null;
  availableHduBeds: number | null;
  highCareBeds: number | null;
  availableHighCareBeds: number | null;
  ambulanceCount: number | null;
  availableAmbulances: number | null;
  lastBedUpdate: Date | null;
  isShaEnabled: boolean | null;
  shaActivationDate: Date | null;
  isActive: boolean | null;
  status: string | null;
  accreditationStatus: string | null;
  accreditationExpiry: Date | null;
  latitude: number | null;
  longitude: number | null;
  operatingHours: string | null;
  emergencyServices: boolean | null;
  hasPharmacy: boolean | null;
  hasLaboratory: boolean | null;
  hasRadiology: boolean | null;
  hasBloodBank: boolean | null;
  hasMorgue: boolean | null;
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

interface SerializedHospital extends Omit<Hospital, 
  | 'createdAt' 
  | 'updatedAt' 
  | 'lastBedUpdate' 
  | 'shaActivationDate' 
  | 'accreditationExpiry'
  | 'county'
  | 'performanceMetrics'
  | 'departments'
  | 'staff'
  | 'resources'
  | 'originTransfers'
  | 'destinationTransfers'
> {
  createdAt: string | null;
  updatedAt: string | null;
  lastBedUpdate: string | null;
  shaActivationDate: string | null;
  accreditationExpiry: string | null;
  
  // Nested relations with serialized dates
  county: (Omit<County, 'createdAt' | 'updatedAt'> & {
    createdAt: string | null;
    updatedAt: string | null;
  }) | null;
  
  performanceMetrics: (Omit<PerformanceMetric, 'date' | 'createdAt' | 'updatedAt'> & {
    date: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  })[];
  
  departments: (Omit<Department, 'createdAt' | 'updatedAt'> & {
    createdAt: string | null;
    updatedAt: string | null;
  })[];
  
  staff: (Omit<Staff, 'hireDate' | 'lastPaidDate' | 'shiftStart' | 'shiftEnd' | 'createdAt' | 'updatedAt'> & {
    hireDate: string | null;
    lastPaidDate: string | null;
    shiftStart: string | null;
    shiftEnd: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  })[];
  
  resources: (Omit<Resource, 'lastMaintenance' | 'nextMaintenance' | 'lastRestock' | 'expiryDate' | 'createdAt' | 'updatedAt'> & {
    lastMaintenance: string | null;
    nextMaintenance: string | null;
    lastRestock: string | null;
    expiryDate: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  })[];
  
  originTransfers: (Omit<Transfer, 'requestedAt' | 'approvedAt' | 'rejectedAt' | 'departureTime' | 'arrivalTime' | 'completedAt' | 'cancelledAt' | 'createdAt' | 'updatedAt'> & {
    requestedAt: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  })[];
  
  destinationTransfers: (Omit<Transfer, 'requestedAt' | 'approvedAt' | 'rejectedAt' | 'departureTime' | 'arrivalTime' | 'completedAt' | 'cancelledAt' | 'createdAt' | 'updatedAt'> & {
    requestedAt: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    departureTime: string | null;
    arrivalTime: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  })[];
}

function transformHospitalDates(hospital: Hospital): SerializedHospital;
function transformHospitalDates(hospital: Hospital | null): SerializedHospital | null;
function transformHospitalDates(hospital: Hospital | null): SerializedHospital | null {
  if (!hospital) return null

  return {
    ...hospital,
    // Transform main hospital date fields
    lastBedUpdate: hospital.lastBedUpdate?.toISOString() || null,
    shaActivationDate: hospital.shaActivationDate?.toISOString() || null,
    accreditationExpiry: hospital.accreditationExpiry?.toISOString() || null,
    createdAt: hospital.createdAt?.toISOString() || null,
    updatedAt: hospital.updatedAt?.toISOString() || null,
    
    // Transform nested relations
    performanceMetrics: hospital.performanceMetrics?.map((metric) => ({
      ...metric,
      date: metric.date?.toISOString() || null,
      createdAt: metric.createdAt?.toISOString() || null,
      updatedAt: metric.updatedAt?.toISOString() || null,
    })) || [],
    
    departments: hospital.departments?.map((dept) => ({
      ...dept,
      createdAt: dept.createdAt?.toISOString() || null,
      updatedAt: dept.updatedAt?.toISOString() || null,
    })) || [],
    
    staff: hospital.staff?.map((staffMember) => ({
      ...staffMember,
      hireDate: staffMember.hireDate?.toISOString() || null,
      lastPaidDate: staffMember.lastPaidDate?.toISOString() || null,
      shiftStart: staffMember.shiftStart?.toISOString() || null,
      shiftEnd: staffMember.shiftEnd?.toISOString() || null,
      createdAt: staffMember.createdAt?.toISOString() || null,
      updatedAt: staffMember.updatedAt?.toISOString() || null,
    })) || [],
    
    resources: hospital.resources?.map((resource) => ({
      ...resource,
      lastMaintenance: resource.lastMaintenance?.toISOString() || null,
      nextMaintenance: resource.nextMaintenance?.toISOString() || null,
      lastRestock: resource.lastRestock?.toISOString() || null,
      expiryDate: resource.expiryDate?.toISOString() || null,
      createdAt: resource.createdAt?.toISOString() || null,
      updatedAt: resource.updatedAt?.toISOString() || null,
    })) || [],
    
    county: hospital.county ? {
      ...hospital.county,
      createdAt: hospital.county.createdAt?.toISOString() || null,
      updatedAt: hospital.county.updatedAt?.toISOString() || null,
    } : null,
    
    originTransfers: hospital.originTransfers?.map((transfer) => ({
      ...transfer,
      requestedAt: transfer.requestedAt?.toISOString() || null,
      approvedAt: transfer.approvedAt?.toISOString() || null,
      rejectedAt: transfer.rejectedAt?.toISOString() || null,
      departureTime: transfer.departureTime?.toISOString() || null,
      arrivalTime: transfer.arrivalTime?.toISOString() || null,
      completedAt: transfer.completedAt?.toISOString() || null,
      cancelledAt: transfer.cancelledAt?.toISOString() || null,
      createdAt: transfer.createdAt?.toISOString() || null,
      updatedAt: transfer.updatedAt?.toISOString() || null,
    })) || [],
    
    destinationTransfers: hospital.destinationTransfers?.map((transfer) => ({
      ...transfer,
      requestedAt: transfer.requestedAt?.toISOString() || null,
      approvedAt: transfer.approvedAt?.toISOString() || null,
      rejectedAt: transfer.rejectedAt?.toISOString() || null,
      departureTime: transfer.departureTime?.toISOString() || null,
      arrivalTime: transfer.arrivalTime?.toISOString() || null,
      completedAt: transfer.completedAt?.toISOString() || null,
      cancelledAt: transfer.cancelledAt?.toISOString() || null,
      createdAt: transfer.createdAt?.toISOString() || null,
      updatedAt: transfer.updatedAt?.toISOString() || null,
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
        hospital={transformedHospital} 
        user={user}
        showDetailedView={true}
      />
    </div>
  )
}