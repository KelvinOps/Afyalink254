// app/staff/[id]/page.tsx
import { notFound } from 'next/navigation'
import { StaffService } from '@/app/services/staff.service'
import { StaffProfile } from '@/app/components/staff/StaffProfile'
import { verifyToken, hasPermission, createUserObject } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

interface StaffDetailPageProps {
  params: {
    id: string
  }
}

async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  return payload ? createUserObject(payload) : null
}

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Check permission
  if (!hasPermission(session, 'staff.read')) {
    redirect('/staff')
  }

  let staff = null

  try {
    staff = await StaffService.getStaffById(params.id)
    
    if (!staff) {
      notFound()
    }

    // Check access permissions
    if (session.role === 'COUNTY_ADMIN' && session.countyId) {
      const staffCountyId = staff.hospital?.countyId || 
                           staff.healthCenter?.countyId || 
                           staff.dispensary?.countyId
      
      if (!staffCountyId || staffCountyId !== session.countyId) {
        redirect('/staff')
      }
    }

    if (session.role === 'HOSPITAL_ADMIN' && session.facilityId) {
      if (staff.hospitalId !== session.facilityId) {
        redirect('/staff')
      }
    }

  } catch (error) {
    console.error('Error fetching staff details:', error)
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      {/* Type assertion to handle the data structure mismatch */}
      <StaffProfile staff={staff as any} />
    </div>
  )
}