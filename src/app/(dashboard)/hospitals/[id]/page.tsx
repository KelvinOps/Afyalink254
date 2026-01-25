// hospitals/[id]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HospitalOverview } from '@/app/components/hospitals/HospitalOverview'
import { HospitalTabs } from '@/app/components/hospitals/HospitalTabs'
import { getHospitalById } from '@/app/services/hospital.service'
import { verifyToken, createUserObject } from '@/app/lib/auth'
import { cookies } from 'next/headers'

// Define params as a Promise for Next.js 15
type PageProps = {
  params: Promise<{
    id: string
  }>
}

// Helper function to transform Date objects to ISO strings
function transformHospitalDates(hospital: any) {
  if (!hospital) return hospital

  return {
    ...hospital,
    // Transform main hospital date fields
    lastBedUpdate: hospital.lastBedUpdate?.toISOString() || null,
    shaActivationDate: hospital.shaActivationDate?.toISOString() || null,
    createdAt: hospital.createdAt?.toISOString() || null,
    updatedAt: hospital.updatedAt?.toISOString() || null,
    
    // Transform nested relations
    performanceMetrics: hospital.performanceMetrics?.map((metric: any) => ({
      ...metric,
      date: metric.date?.toISOString() || null,
      createdAt: metric.createdAt?.toISOString() || null,
      updatedAt: metric.updatedAt?.toISOString() || null,
    })) || [],
    
    departments: hospital.departments?.map((dept: any) => ({
      ...dept,
      createdAt: dept.createdAt?.toISOString() || null,
      updatedAt: dept.updatedAt?.toISOString() || null,
    })) || [],
    
    staff: hospital.staff?.map((staffMember: any) => ({
      ...staffMember,
      hireDate: staffMember.hireDate?.toISOString() || null,
      lastPaidDate: staffMember.lastPaidDate?.toISOString() || null,
      shiftStart: staffMember.shiftStart?.toISOString() || null,
      shiftEnd: staffMember.shiftEnd?.toISOString() || null,
      createdAt: staffMember.createdAt?.toISOString() || null,
      updatedAt: staffMember.updatedAt?.toISOString() || null,
    })) || [],
    
    resources: hospital.resources?.map((resource: any) => ({
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
  }
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return null
  }

  return createUserObject({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    facilityId: payload.facilityId,
    countyId: payload.countyId
  })
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  // Await the params promise
  const params = await props.params
  const hospital = await getHospitalById(params.id)
  
  if (!hospital) {
    return {
      title: 'Hospital Not Found - AfyaLink 254'
    }
  }

  return {
    title: `${hospital.name} - AfyaLink 254`,
    description: `${hospital.level} hospital in ${hospital.county?.name}, Kenya`
  }
}

export default async function HospitalPage(props: PageProps) {
  // Await the params promise
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
          <h1 className="text-3xl font-bold tracking-tight">{hospital.name}</h1>
          <p className="text-muted-foreground">
            {hospital.level.replace('_', ' ')} • {hospital.county?.name} County • {hospital.type.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      <HospitalTabs hospitalId={hospital.id} activeTab="overview" />
      
      <HospitalOverview 
        hospital={transformedHospital} 
        user={user}
      />
    </div>
  )
}