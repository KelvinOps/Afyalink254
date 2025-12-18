import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HospitalOverview } from '@/app/components/hospitals/HospitalOverview'
import { HospitalTabs } from '@/app/components/hospitals/HospitalTabs'
import { getHospitalById } from '@/app/services/hospital.service'
import { verifyToken, createUserObject } from '@/app/lib/auth'
import { cookies } from 'next/headers'

interface HospitalPageProps {
  params: {
    id: string
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

export async function generateMetadata({ params }: HospitalPageProps): Promise<Metadata> {
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

export default async function HospitalPage({ params }: HospitalPageProps) {
  const user = await getAuthenticatedUser()
  const hospital = await getHospitalById(params.id)

  if (!hospital) {
    notFound()
  }

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
        hospital={hospital} 
        user={user}
      />
    </div>
  )
}