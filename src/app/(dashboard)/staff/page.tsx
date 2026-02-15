import { StaffList } from '@/app/components/staff/StaffList'
import { StaffService } from '@/app/services/staff.service'
import { verifyToken, hasPermission, createUserObject } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Staff } from '@/app/types/staff.types'

async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  return payload ? createUserObject(payload) : null
}

export default async function StaffPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Check permission
  if (!hasPermission(session, 'staff.read')) {
    redirect('/dashboard')
  }

  let initialStaff: Staff[] = []
  let initialPagination: { page: number; limit: number; total: number; pages: number } | undefined = undefined

  try {
    // For hospital admins, only show staff from their hospital
    const hospitalId = session.role === 'HOSPITAL_ADMIN' ? session.facilityId : undefined
    
    const result = await StaffService.getStaff({
      page: 1,
      limit: 50,
      hospitalId
    })
    
    // No type assertion needed - the Staff type now matches what the service returns
    initialStaff = result.staff || []
    initialPagination = result.pagination
  } catch (error) {
    console.error('Error fetching initial staff data:', error)
    initialStaff = []
  }

  return (
    <div className="container mx-auto py-6">
      <StaffList 
        initialStaff={initialStaff}
        initialPagination={initialPagination}
        hospitalId={session.facilityId}
      />
    </div>
  )
}