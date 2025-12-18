import { prisma } from '@/app/lib/prisma'
import { StaffFormData, StaffSearchParams, StaffStats, ShiftAssignment } from '@/app/types/staff.types'

export class StaffService {
  // Get staff with pagination and filtering
  static async getStaff(params: StaffSearchParams) {
    const {
      page = 1,
      limit = 50,
      search,
      role,
      facilityType,
      hospitalId,
      departmentId,
      isActive,
      isOnDuty
    } = params

    const skip = (page - 1) * limit

    let where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { staffNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) where.role = role
    if (facilityType) where.facilityType = facilityType
    if (hospitalId) where.hospitalId = hospitalId
    if (departmentId) where.departmentId = departmentId
    if (isActive !== undefined) where.isActive = isActive
    if (isOnDuty !== undefined) where.isOnDuty = isOnDuty

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
              code: true,
              countyId: true
            }
          },
          healthCenter: {
            select: {
              id: true,
              name: true,
              code: true,
              countyId: true
            }
          },
          dispensary: {
            select: {
              id: true,
              name: true,
              code: true,
              countyId: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        skip,
        take: limit,
      }),
      prisma.staff.count({ where })
    ])

    return {
      staff: staff || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Get staff by ID
  static async getStaffById(id: string) {
    return prisma.staff.findUnique({
      where: { id },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        healthCenter: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        dispensary: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })
  }

  // Create new staff
  static async createStaff(data: StaffFormData) {
    const staffCount = await prisma.staff.count()
    const staffNumber = `STAFF-${String(staffCount + 1).padStart(6, '0')}`

    return prisma.staff.create({
      data: {
        ...data,
        staffNumber,
        userId: data.email, // Using email as userId
        hireDate: new Date(data.hireDate),
        currentCaseload: 0,
        pendingSalaryMonths: 0,
        isOnDuty: false,
        shiftStart: null,
        shiftEnd: null
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        healthCenter: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        dispensary: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })
  }

  // Update staff
  static async updateStaff(id: string, data: Partial<StaffFormData>) {
    return prisma.staff.update({
      where: { id },
      data: {
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        updatedAt: new Date()
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        healthCenter: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        dispensary: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })
  }

  // Delete staff (soft delete)
  static async deleteStaff(id: string) {
    return prisma.staff.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })
  }

  // Get staff statistics
  static async getStaffStats(hospitalId?: string): Promise<StaffStats> {
    let where: any = { isActive: true }

    if (hospitalId) {
      where.hospitalId = hospitalId
    }

    const [
      totalStaff,
      activeStaff,
      onDutyStaff,
      byRole,
      byDepartment,
      caseloadStats
    ] = await Promise.all([
      prisma.staff.count({ where: { ...where, isActive: true } }),
      prisma.staff.count({ where: { ...where, isActive: true } }),
      prisma.staff.count({ where: { ...where, isOnDuty: true } }),
      prisma.staff.groupBy({
        by: ['role'],
        where,
        _count: { role: true }
      }),
      prisma.staff.groupBy({
        by: ['departmentId'],
        where,
        _count: { departmentId: true }
      }),
      prisma.staff.aggregate({
        where,
        _avg: { currentCaseload: true },
        _count: { id: true }
      })
    ])

    // Get department names
    const departmentIds = byDepartment.map(d => d.departmentId).filter(Boolean) as string[]
    const departments = departmentIds.length > 0 ? await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true }
    }) : []

    const departmentMap = new Map(departments.map(d => [d.id, d.name]))

    return {
      totalStaff,
      activeStaff,
      onDutyStaff,
      byRole: byRole.map(r => ({
        role: r.role,
        count: r._count.role
      })),
      byDepartment: byDepartment.map(d => ({
        department: d.departmentId ? departmentMap.get(d.departmentId) || 'Unknown' : 'No Department',
        count: d._count.departmentId
      })),
      averageCaseload: caseloadStats._avg.currentCaseload || 0,
      staffWithHighCaseload: await prisma.staff.count({
        where: {
          ...where,
          currentCaseload: { gt: 8 } // Consider >8 as high caseload
        }
      })
    }
  }

  // Assign shift to staff - TEMPORARILY DISABLED until StaffSchedule model is added
  static async assignShift(staffId: string, assignment: ShiftAssignment) {
    throw new Error('Staff schedule functionality is temporarily unavailable. Please add StaffSchedule model to Prisma schema.')
    
    // This code will work once you add the StaffSchedule model to your Prisma schema
    /*
    // Check for conflicts
    const conflictingSchedule = await prisma.staffSchedule.findFirst({
      where: {
        staffId,
        isActive: true,
        OR: [
          {
            startTime: { lt: new Date(assignment.endTime) },
            endTime: { gt: new Date(assignment.startTime) }
          }
        ]
      }
    })

    if (conflictingSchedule) {
      throw new Error('Schedule conflict: Staff already has a shift during this time')
    }

    return prisma.staffSchedule.create({
      data: {
        staffId,
        startTime: new Date(assignment.startTime),
        endTime: new Date(assignment.endTime),
        shiftType: assignment.shiftType,
        departmentId: assignment.departmentId,
        notes: assignment.notes,
        isActive: true
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })
    */
  }

  // Get staff schedule - TEMPORARILY DISABLED until StaffSchedule model is added
  static async getStaffSchedule(staffId: string, startDate?: Date, endDate?: Date) {
    throw new Error('Staff schedule functionality is temporarily unavailable. Please add StaffSchedule model to Prisma schema.')
    
    // This code will work once you add the StaffSchedule model to your Prisma schema
    /*
    let where: any = {
      staffId,
      isActive: true
    }

    if (startDate && endDate) {
      where.OR = [
        {
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          endTime: {
            gte: startDate,
            lte: endDate
          }
        }
      ]
    }

    return prisma.staffSchedule.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    })
    */
  }

  // Update staff duty status
  static async updateDutyStatus(staffId: string, isOnDuty: boolean, shiftStart?: Date, shiftEnd?: Date) {
    return prisma.staff.update({
      where: { id: staffId },
      data: {
        isOnDuty,
        shiftStart: isOnDuty ? (shiftStart || new Date()) : null,
        shiftEnd: isOnDuty ? shiftEnd : null,
        updatedAt: new Date()
      }
    })
  }

  // Search staff by name or staff number
  static async searchStaff(query: string, limit: number = 10) {
    return prisma.staff.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { staffNumber: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffNumber: true,
        email: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            countyId: true
          }
        },
        healthCenter: {
          select: {
            id: true,
            name: true,
            countyId: true
          }
        },
        dispensary: {
          select: {
            id: true,
            name: true,
            countyId: true
          }
        }
      },
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    })
  }

  // Get staff by county for access control
  static async getStaffByCounty(countyId: string, params: StaffSearchParams = {}) {
    const where: any = {
      isActive: true,
      OR: [
        { hospital: { countyId } },
        { healthCenter: { countyId } },
        { dispensary: { countyId } }
      ]
    }

    if (params.search) {
      where.OR = [
        ...where.OR,
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } }
      ]
    }

    const staff = await prisma.staff.findMany({
      where,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        healthCenter: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        dispensary: {
          select: {
            id: true,
            name: true,
            code: true,
            countyId: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return staff
  }
}