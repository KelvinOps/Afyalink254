// app/hospitals/page.tsx
import { Metadata } from 'next'
import { HospitalList } from '@/app/components/hospitals/HospitalList'
import { HospitalFilters } from '@/app/components/hospitals/HospitalFilters'
import { HospitalStats } from '@/app/components/hospitals/HospitalStats'
import { getHospitals } from '@/app/services/hospital.service'
import { verifyToken, createUserObject } from '@/app/lib/auth'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Hospitals - AfyaLink 254',
  description: 'Manage hospitals across Kenya\'s 47 counties',
}

// Define props for Next.js 15 - searchParams is now a Promise
type PageProps = {
  searchParams: Promise<{
    county?: string
    level?: string
    type?: string
    status?: string
    search?: string
    page?: string
  }>
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

// Helper function to normalize hospital data
function normalizeHospitals(hospitals: unknown[]) {
  return hospitals.map(hospital => {
    const h = hospital as Record<string, unknown>
    return {
      ...h,
      lastBedUpdate: h.lastBedUpdate instanceof Date 
        ? h.lastBedUpdate.toISOString() 
        : typeof h.lastBedUpdate === 'string'
        ? h.lastBedUpdate
        : new Date().toISOString(),
      shaActivationDate: h.shaActivationDate instanceof Date ? h.shaActivationDate.toISOString() : h.shaActivationDate,
      createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
      updatedAt: h.updatedAt instanceof Date ? h.updatedAt.toISOString() : h.updatedAt,
    }
  })
}

// Helper function to transform pagination
function transformPagination(apiPagination: Record<string, unknown> = {}) {
  return {
    currentPage: (apiPagination.page as number) || 1,
    totalPages: (apiPagination.pages as number) || 1,
    totalItems: (apiPagination.total as number) || 0,
    hasNext: ((apiPagination.page as number) || 1) < ((apiPagination.pages as number) || 1),
    hasPrev: ((apiPagination.page as number) || 1) > 1,
  }
}

export default async function HospitalsPage(props: PageProps) {
  // Await the searchParams promise
  const searchParams = await props.searchParams
  const user = await getAuthenticatedUser()
  
  const hospitalsResponse = await getHospitals({
    county: searchParams.county,
    level: searchParams.level,
    type: searchParams.type,
    status: searchParams.status,
    search: searchParams.search,
    page: parseInt(searchParams.page || '1'),
    limit: 20,
  }) as { data?: unknown[]; pagination?: Record<string, unknown> }

  // Transform the data to match component expectations
  const normalizedHospitals = normalizeHospitals(hospitalsResponse.data || [])
  const transformedPagination = transformPagination(hospitalsResponse.pagination || {})

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospitals</h1>
          <p className="text-muted-foreground">
            Manage hospitals across Kenya&apos;s 47 counties
          </p>
        </div>
      </div>

      <HospitalStats />
      
      <HospitalFilters />
      
      <HospitalList 
        hospitals={normalizedHospitals as unknown as Parameters<typeof HospitalList>[0]['hospitals']} 
        pagination={transformedPagination}
        user={user}
      />
    </div>
  )
}