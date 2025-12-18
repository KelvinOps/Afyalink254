import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HospitalDepartments } from '@/app/components/hospitals/HospitalDepartments'
import { HospitalTabs } from '@/app/components/hospitals/HospitalTabs'
import { getHospitalById } from '@/app/services/hospital.service'
import { verifyToken, createUserObject } from '@/app/lib/auth'
import { cookies } from 'next/headers'

interface HospitalDepartmentsPageProps {
  params: {
    id: string
  }
}

// Helper function to get authenticated user (similar to your route file)
async function getAuthenticatedUser() {
  const cookieStore = await cookies() // Added await here
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

export async function generateMetadata({ params }: HospitalDepartmentsPageProps): Promise<Metadata> {
  const hospital = await getHospitalById(params.id)
  
  if (!hospital) {
    return {
      title: 'Hospital Not Found - AfyaLink 254'
    }
  }

  return {
    title: `Departments - ${hospital.name} - AfyaLink 254`,
  }
}

export default async function HospitalDepartmentsPage({ params }: HospitalDepartmentsPageProps) {
  const user = await getAuthenticatedUser()
  const hospital = await getHospitalById(params.id)

  if (!hospital) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage departments at {hospital.name}
          </p>
        </div>
      </div>

      <HospitalTabs hospitalId={hospital.id} activeTab="departments" />
      
      <HospitalDepartments 
        hospital={hospital} 
        user={user}
      />
    </div>
  )
}