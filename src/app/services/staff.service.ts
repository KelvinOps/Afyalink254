import { prisma } from '@/app/lib/prisma'
import { StaffFormData, StaffSearchParams, StaffStats } from '@/app/types/staff.types'
import { Prisma, StaffRole, FacilityType } from '@prisma/client'

export class StaffService {
  static async getStaff(params: StaffSearchParams) {
    const { page = 1, limit = 50, search, role, facilityType, hospitalId, departmentId, isActive, isOnDuty } = params
    const skip = (page - 1) * limit

    const where: Prisma.StaffWhereInput = this.buildWhereClause({ search, role, facilityType, hospitalId, departmentId, isActive, isOnDuty })

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: this.getStaffRelations(),
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

  static async getStaffById(id: string) {
    return prisma.staff.findUnique({
      where: { id },
      include: this.getStaffRelations()
    })
  }

  static async createStaff(data: StaffFormData) {
    const staffNumber = await this.generateStaffNumber()
    
    return prisma.staff.create({
      data: {
        ...data,
        staffNumber,
        userId: data.email,
        hireDate: new Date(data.hireDate),
        currentCaseload: 0,
        pendingSalaryMonths: 0,
        isOnDuty: false,
        shiftStart: null,
        shiftEnd: null
      },
      include: this.getStaffRelations()
    })
  }

  static async updateStaff(id: string, data: Partial<StaffFormData>) {
    return prisma.staff.update({
      where: { id },
      data: {
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        updatedAt: new Date()
      },
      include: this.getStaffRelations()
    })
  }

  static async deleteStaff(id: string) {
    return prisma.staff.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })
  }

  static async getStaffStats(hospitalId?: string): Promise<StaffStats> {
    const where: Prisma.StaffWhereInput = { isActive: true }
    if (hospitalId) where.hospitalId = hospitalId

    const [totalStaff, onDutyStaff, byRole, byDepartment, caseloadStats] = await Promise.all([
      prisma.staff.count({ where }),
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

    const departmentNames = await this.getDepartmentNames(byDepartment)
    const highCaseloadCount = await this.getHighCaseloadCount(where)

    return {
      totalStaff,
      activeStaff: totalStaff,
      onDutyStaff,
      byRole: byRole.map(r => ({
        role: r.role,
        count: r._count.role
      })),
      byDepartment: byDepartment.map(d => ({
        department: d.departmentId ? departmentNames.get(d.departmentId) || 'Unknown' : 'No Department',
        count: d._count.departmentId
      })),
      averageCaseload: caseloadStats._avg.currentCaseload || 0,
      staffWithHighCaseload: highCaseloadCount
    }
  }

  static async assignShift() {
    throw new Error('Staff schedule functionality requires StaffSchedule model in Prisma schema.')
  }

  static async getStaffSchedule() {
    throw new Error('Staff schedule functionality requires StaffSchedule model in Prisma schema.')
  }

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

  static async searchStaff(query: string, limit = 10) {
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
        department: { select: { id: true, name: true } },
        hospital: { select: { id: true, name: true, countyId: true } },
        healthCenter: { select: { id: true, name: true, countyId: true } },
        dispensary: { select: { id: true, name: true, countyId: true } }
      },
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    })
  }

  static async getStaffByCounty(countyId: string, params: StaffSearchParams = {}) {
    const where: Prisma.StaffWhereInput = {
      isActive: true,
      OR: [
        { hospital: { countyId } },
        { healthCenter: { countyId } },
        { dispensary: { countyId } }
      ]
    }

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } }
      ]
    }

    return prisma.staff.findMany({
      where,
      include: this.getStaffRelations(),
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })
  }

  private static buildWhereClause(filters: {
    search?: string
    role?: string
    facilityType?: string
    hospitalId?: string
    departmentId?: string
    isActive?: boolean
    isOnDuty?: boolean
  }): Prisma.StaffWhereInput {
    const where: Prisma.StaffWhereInput = {}

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { staffNumber: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    if (filters.role) {
      where.role = { equals: filters.role as StaffRole }
    }
    
    if (filters.facilityType) {
      where.facilityType = { equals: filters.facilityType as FacilityType }
    }
    
    if (filters.hospitalId) where.hospitalId = filters.hospitalId
    if (filters.departmentId) where.departmentId = filters.departmentId
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.isOnDuty !== undefined) where.isOnDuty = filters.isOnDuty

    return where
  }

  private static getStaffRelations() {
    return {
      hospital: { select: { id: true, name: true, code: true, countyId: true } },
      healthCenter: { select: { id: true, name: true, code: true, countyId: true } },
      dispensary: { select: { id: true, name: true, code: true, countyId: true } },
      department: { select: { id: true, name: true, type: true } }
    }
  }

  private static async generateStaffNumber(): Promise<string> {
    const staffCount = await prisma.staff.count()
    return `STAFF-${String(staffCount + 1).padStart(6, '0')}`
  }

  private static async getDepartmentNames(byDepartment: { departmentId: string | null, _count: { departmentId: number } }[]): Promise<Map<string, string>> {
    const departmentIds = byDepartment.map(d => d.departmentId).filter(Boolean) as string[]
    
    if (departmentIds.length === 0) {
      return new Map()
    }

    const departments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true }
    })

    return new Map(departments.map(d => [d.id, d.name]))
  }

  private static async getHighCaseloadCount(where: Prisma.StaffWhereInput): Promise<number> {
    return prisma.staff.count({
      where: {
        ...where,
        currentCaseload: { gt: 8 }
      }
    })
  }
}