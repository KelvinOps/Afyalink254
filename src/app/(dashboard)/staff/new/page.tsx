import { StaffForm } from '@/app/components/staff/StaffForm'
import { verifyToken, hasPermission, createUserObject } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'

async function getSession() {
  const cookieStore = await cookies() // Added await here
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  return payload ? createUserObject(payload) : null
}

export default async function NewStaffPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Check permission
  if (!hasPermission(session, 'staff.write')) {
    redirect('/staff')
  }

  // Fetch related data based on user's role and access level
  let hospitals: any[] = []
  let departments: any[] = []
  let healthCenters: any[] = []
  let dispensaries: any[] = []

  try {
    if (session.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can assign to any facility
      [hospitals, departments, healthCenters, dispensaries] = await Promise.all([
        prisma.hospital.findMany({
          where: { isActive: true },
          select: { id: true, name: true, code: true }
        }),
        prisma.department.findMany({
          where: { isActive: true },
          select: { id: true, name: true, type: true }
        }),
        prisma.healthCenter.findMany({
          where: { isActive: true },
          select: { id: true, name: true, code: true }
        }),
        prisma.dispensary.findMany({
          where: { isActive: true },
          select: { id: true, name: true, code: true }
        })
      ])
    } else if (session.role === 'COUNTY_ADMIN' && session.countyId) {
      // COUNTY_ADMIN can only assign to facilities in their county
      [hospitals, departments, healthCenters, dispensaries] = await Promise.all([
        prisma.hospital.findMany({
          where: { 
            isActive: true,
            countyId: session.countyId
          },
          select: { id: true, name: true, code: true }
        }),
        prisma.department.findMany({
          where: { 
            isActive: true,
            hospital: {
              countyId: session.countyId
            }
          },
          select: { id: true, name: true, type: true }
        }),
        prisma.healthCenter.findMany({
          where: { 
            isActive: true,
            countyId: session.countyId
          },
          select: { id: true, name: true, code: true }
        }),
        prisma.dispensary.findMany({
          where: { 
            isActive: true,
            countyId: session.countyId
          },
          select: { id: true, name: true, code: true }
        })
      ])
    } else if (session.role === 'HOSPITAL_ADMIN' && session.facilityId) {
      // HOSPITAL_ADMIN can only assign to their hospital and its departments
      [hospitals, departments] = await Promise.all([
        prisma.hospital.findMany({
          where: { 
            id: session.facilityId,
            isActive: true
          },
          select: { id: true, name: true, code: true }
        }),
        prisma.department.findMany({
          where: { 
            hospitalId: session.facilityId,
            isActive: true
          },
          select: { id: true, name: true, type: true }
        })
      ])
      
      // Initialize empty arrays for health centers and dispensaries
      healthCenters = []
      dispensaries = []
    }
  } catch (error) {
    console.error('Error fetching facility data:', error)
  }

  return (
    <div className="container mx-auto py-6">
      <StaffForm 
        hospitals={hospitals}
        departments={departments}
        healthCenters={healthCenters}
        dispensaries={dispensaries}
      />
    </div>
  )
}