// app/staff/[id]/page.tsx
import { notFound } from 'next/navigation'
import { StaffService } from '@/app/services/staff.service'
import { StaffProfile } from '@/app/components/staff/StaffProfile'
import { verifyToken, createUserObject } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// Define params as a Promise for Next.js 15
type PageProps = {
  params: Promise<{
    id: string
  }>
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

export default async function StaffDetailPage(props: PageProps) {
  // Await the params promise
  const params = await props.params
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Import hasPermission dynamically
  const { hasPermission } = await import('@/app/lib/auth')
  
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