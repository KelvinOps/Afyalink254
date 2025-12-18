import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HospitalOverview } from '@/app/components/hospitals/HospitalOverview'
import { HospitalTabs } from '@/app/components/hospitals/HospitalTabs'
import { getHospitalById } from '@/app/services/hospital.service'
import { verifyToken, createUserObject, ensureBasicPermissions } from '@/app/lib/auth'
import type { User } from '@/app/lib/auth'
import { cookies } from 'next/headers'

interface HospitalOverviewPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: HospitalOverviewPageProps): Promise<Metadata> {
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

export default async function HospitalOverviewPage({ params }: HospitalOverviewPageProps) {
  const user = await getAuthenticatedUser()
  const hospital = await getHospitalById(params.id)

  if (!hospital) {
    notFound()
  }

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
        hospital={hospital} 
        user={user}
        showDetailedView={true}
      />
    </div>
  )
}