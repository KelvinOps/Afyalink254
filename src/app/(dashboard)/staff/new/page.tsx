import { StaffForm } from '@/app/components/staff/StaffForm'
import { verifyToken, hasPermission, createUserObject } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'


const hospitalSelect = Prisma.validator<Prisma.HospitalSelect>()({
  id: true, name: true, code: true
})

const departmentSelect = Prisma.validator<Prisma.DepartmentSelect>()({
  id: true, name: true, type: true
})

const healthCenterSelect = Prisma.validator<Prisma.HealthCenterSelect>()({
  id: true, name: true, code: true
})

const dispensarySelect = Prisma.validator<Prisma.DispensarySelect>()({
  id: true, name: true, code: true
})

type HospitalItem     = Prisma.HospitalGetPayload<{ select: typeof hospitalSelect }>
type DepartmentItem   = Prisma.DepartmentGetPayload<{ select: typeof departmentSelect }>
type HealthCenterItem = Prisma.HealthCenterGetPayload<{ select: typeof healthCenterSelect }>
type DispensaryItem   = Prisma.DispensaryGetPayload<{ select: typeof dispensarySelect }>

// ─────────────────────────────────────────────────────────────────────────────

async function getSession() {
  const cookieStore = await cookies()
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
  let hospitals:     HospitalItem[]     = []
  let departments:   DepartmentItem[]   = []
  let healthCenters: HealthCenterItem[] = []
  let dispensaries:  DispensaryItem[]   = []

  try {
    if (session.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can assign to any facility
      ;[hospitals, departments, healthCenters, dispensaries] = await Promise.all([
        prisma.hospital.findMany({
          where: { isActive: true },
          select: hospitalSelect
        }),
        prisma.department.findMany({
          where: { isActive: true },
          select: departmentSelect
        }),
        prisma.healthCenter.findMany({
          where: { isActive: true },
          select: healthCenterSelect
        }),
        prisma.dispensary.findMany({
          where: { isActive: true },
          select: dispensarySelect
        })
      ])
    } else if (session.role === 'COUNTY_ADMIN' && session.countyId) {
      // COUNTY_ADMIN can only assign to facilities in their county
      ;[hospitals, departments, healthCenters, dispensaries] = await Promise.all([
        prisma.hospital.findMany({
          where: { isActive: true, countyId: session.countyId },
          select: hospitalSelect
        }),
        prisma.department.findMany({
          where: {
            isActive: true,
            hospital: { countyId: session.countyId }
          },
          select: departmentSelect
        }),
        prisma.healthCenter.findMany({
          where: { isActive: true, countyId: session.countyId },
          select: healthCenterSelect
        }),
        prisma.dispensary.findMany({
          where: { isActive: true, countyId: session.countyId },
          select: dispensarySelect
        })
      ])
    } else if (session.role === 'HOSPITAL_ADMIN' && session.facilityId) {
      // HOSPITAL_ADMIN can only assign to their hospital and its departments
      ;[hospitals, departments] = await Promise.all([
        prisma.hospital.findMany({
          where: { id: session.facilityId, isActive: true },
          select: hospitalSelect
        }),
        prisma.department.findMany({
          where: { hospitalId: session.facilityId, isActive: true },
          select: departmentSelect
        })
      ])

      // healthCenters and dispensaries stay as empty arrays (already initialised above)
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