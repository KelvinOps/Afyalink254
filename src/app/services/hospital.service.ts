

import { prisma } from '@/app/lib/prisma'
import { auditLog, AuditAction } from '@/app/lib/audit'
import { User } from '@/app/lib/auth'

// Define Prisma Json type properly
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export interface HospitalFilters {
  county?: string
  level?: string
  type?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

export interface HospitalCreateData {
  name: string
  code: string
  mflCode?: string | null
  type: 'PUBLIC' | 'PRIVATE' | 'FAITH_BASED' | 'MISSION' | 'MILITARY' | 'SPECIALIZED' | 'NGO'
  level: 'LEVEL_4' | 'LEVEL_5' | 'LEVEL_6'
  ownership: 'COUNTY_GOVERNMENT' | 'NATIONAL_GOVERNMENT' | 'PRIVATE' | 'FAITH_BASED' | 'NGO' | 'COMMUNITY'
  countyId: string
  subCounty?: string | null
  ward?: string | null
  address: string
  coordinates: JsonValue
  phone: string
  emergencyPhone?: string | null
  email?: string | null
  totalBeds: number
  functionalBeds: number
  icuBeds: number
  hdUnitBeds: number
  maternityBeds: number
  pediatricBeds: number
  emergencyBeds: number
  isolationBeds: number
}

export async function getHospitals(filters: HospitalFilters = {}) {
  const {
    county,
    level,
    type,
    status,
    search,
    page = 1,
    limit = 20,
  } = filters

  const skip = (page - 1) * limit

  const where: any = {
    isActive: status !== 'INACTIVE',
  }

  if (county) {
    where.countyId = county
  }

  if (level) {
    where.level = level
  }

  if (type) {
    where.type = type
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { mflCode: { contains: search, mode: 'insensitive' } },
      { subCounty: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [hospitals, total] = await Promise.all([
    prisma.hospital.findMany({
      where,
      include: {
        county: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            type: true,
            availableBeds: true,
            totalBeds: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    }),
    prisma.hospital.count({ where }),
  ])

  return {
    data: hospitals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

export async function getHospitalById(id: string) {
  return prisma.hospital.findUnique({
    where: { id },
    include: {
      county: true,
      departments: {
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      },
      staff: {
        include: {
          department: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      },
      resources: {
        include: {
          department: {
            select: {
              name: true,
            },
          },
        },
      },
      performanceMetrics: {
        orderBy: {
          date: 'desc',
        },
        take: 30,
      },
    },
  })
}

export async function createHospital(data: HospitalCreateData, user: User) {
  // Prepare the data with proper type handling
  const hospitalData: any = {
    // Required fields
    name: data.name,
    code: data.code,
    type: data.type,
    level: data.level,
    ownership: data.ownership,
    countyId: data.countyId,
    address: data.address,
    phone: data.phone,
    totalBeds: data.totalBeds,
    functionalBeds: data.functionalBeds,
    icuBeds: data.icuBeds,
    hdUnitBeds: data.hdUnitBeds,
    maternityBeds: data.maternityBeds,
    pediatricBeds: data.pediatricBeds,
    emergencyBeds: data.emergencyBeds,
    isolationBeds: data.isolationBeds,
    
    // Optional fields with explicit null handling
    mflCode: data.mflCode ?? null,
    subCounty: data.subCounty ?? null,
    ward: data.ward ?? null,
    
    // Set default values for available beds
    availableBeds: data.functionalBeds,
    availableIcuBeds: data.icuBeds,
    availableEmergencyBeds: data.emergencyBeds,
    lastBedUpdate: new Date(),
    
    // Set default values for other required fields
    accessibilityScore: 50,
    reachableInRainySeason: true,
    has24HourService: false,
    hasAmbulance: false,
    hasBloodBank: false,
    hasLaboratory: false,
    hasRadiology: false,
    hasCTScan: false,
    hasMRI: false,
    hasDialysis: false,
    hasPharmacy: false,
    hasOxygenPlant: false,
    hasMortuary: false,
    telemedicineEnabled: false,
    canReceiveReferrals: true,
    canGiveConsultations: false,
    shaContracted: false,
    isActive: true,
    operationalStatus: 'OPERATIONAL',
    acceptingPatients: true,
    emergencyOnlyMode: false,
    managedByCounty: true,
    autonomyLevel: 'SEMI_AUTONOMOUS',
    powerStatus: 'GRID',
    backupPower: false,
    waterStatus: 'AVAILABLE',
    oxygenStatus: 'AVAILABLE',
    internetStatus: 'AVAILABLE',
  }

  // Handle JSON fields properly - coordinates
  if (data.coordinates) {
    hospitalData.coordinates = data.coordinates
  }

  // Handle optional string fields that might be causing type issues
  if (data.emergencyPhone !== undefined && data.emergencyPhone !== null) {
    hospitalData.emergencyPhone = data.emergencyPhone
  } else {
    hospitalData.emergencyPhone = null
  }

  if (data.email !== undefined && data.email !== null) {
    hospitalData.email = data.email
  } else {
    hospitalData.email = null
  }

  const hospital = await prisma.hospital.create({
    data: hospitalData,
    include: {
      county: true,
    },
  })

  // Audit log
  await auditLog({
    action: AuditAction.CREATE,
    entityType: 'HOSPITAL',
    entityId: hospital.id,
    userId: user.id,
    userRole: user.role,
    userName: user.name,
    description: `Created new hospital: ${hospital.name}`,
    facilityId: hospital.id,
  })

  return hospital
}

export async function updateHospital(id: string, data: any, user: User) {
  const hospital = await prisma.hospital.update({
    where: { id },
    data,
    include: {
      county: true,
    },
  })

  // Audit log
  await auditLog({
    action: AuditAction.UPDATE,
    entityType: 'HOSPITAL',
    entityId: hospital.id,
    userId: user.id,
    userRole: user.role,
    userName: user.name,
    description: `Updated hospital: ${hospital.name}`,
    facilityId: hospital.id,
  })

  return hospital
}

export async function deleteHospital(id: string, user: User) {
  const hospital = await prisma.hospital.delete({
    where: { id },
  })

  // Audit log
  await auditLog({
    action: AuditAction.DELETE,
    entityType: 'HOSPITAL',
    entityId: hospital.id,
    userId: user.id,
    userRole: user.role,
    userName: user.name,
    description: `Deleted hospital: ${hospital.name}`,
    facilityId: hospital.id,
  })

  return hospital
}

export async function updateHospitalStatus(id: string, data: any, user: User) {
  const hospital = await prisma.hospital.update({
    where: { id },
    data: {
      ...data,
      lastBedUpdate: new Date(),
    },
  })

  // Audit log
  await auditLog({
    action: AuditAction.UPDATE,
    entityType: 'HOSPITAL',
    entityId: hospital.id,
    userId: user.id,
    userRole: user.role,
    userName: user.name,
    description: `Updated hospital status: ${hospital.name}`,
    facilityId: hospital.id,
  })

  return hospital
}

export async function getHospitalStatus(id: string) {
  return prisma.hospital.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      operationalStatus: true,
      acceptingPatients: true,
      emergencyOnlyMode: true,
      availableBeds: true,
      availableIcuBeds: true,
      availableEmergencyBeds: true,
      powerStatus: true,
      waterStatus: true,
      oxygenStatus: true,
      internetStatus: true,
      lastBedUpdate: true,
    },
  })
}

export async function updateHospitalCapacity(id: string, data: any, user: User) {
  const hospital = await prisma.hospital.update({
    where: { id },
    data: {
      ...data,
      lastBedUpdate: new Date(),
    },
  })

  // Audit log
  await auditLog({
    action: AuditAction.UPDATE,
    entityType: 'HOSPITAL',
    entityId: hospital.id,
    userId: user.id,
    userRole: user.role,
    userName: user.name,
    description: `Updated hospital capacity: ${hospital.name}`,
    facilityId: hospital.id,
  })

  return hospital
}

export async function getHospitalCapacity(id: string) {
  return prisma.hospital.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      totalBeds: true,
      functionalBeds: true,
      availableBeds: true,
      icuBeds: true,
      availableIcuBeds: true,
      emergencyBeds: true,
      availableEmergencyBeds: true,
      maternityBeds: true,
      pediatricBeds: true,
      hdUnitBeds: true,
      isolationBeds: true,
      lastBedUpdate: true,
    },
  })
}

// Get hospitals by county for dropdowns
export async function getHospitalsByCounty(countyId: string) {
  return prisma.hospital.findMany({
    where: {
      countyId,
      isActive: true,
      operationalStatus: 'OPERATIONAL',
    },
    select: {
      id: true,
      name: true,
      level: true,
      type: true,
      availableBeds: true,
      availableIcuBeds: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
}

// Get hospital statistics for dashboard
export async function getHospitalStats() {
  const [
    totalHospitals,
    operationalHospitals,
    totalBeds,
    availableBeds,
    hospitalsByLevel,
    hospitalsByCounty,
  ] = await Promise.all([
    prisma.hospital.count({
      where: { isActive: true },
    }),
    prisma.hospital.count({
      where: {
        isActive: true,
        operationalStatus: 'OPERATIONAL',
      },
    }),
    prisma.hospital.aggregate({
      where: { isActive: true },
      _sum: {
        totalBeds: true,
        functionalBeds: true,
      },
    }),
    prisma.hospital.aggregate({
      where: { isActive: true },
      _sum: {
        availableBeds: true,
        availableIcuBeds: true,
      },
    }),
    prisma.hospital.groupBy({
      by: ['level'],
      where: { isActive: true },
      _count: {
        id: true,
      },
    }),
    prisma.hospital.groupBy({
      by: ['countyId'],
      where: { isActive: true },
      _count: {
        id: true,
      },
    }),
  ])

  return {
    totalHospitals,
    operationalHospitals,
    totalBeds: totalBeds._sum.totalBeds || 0,
    functionalBeds: totalBeds._sum.functionalBeds || 0,
    availableBeds: availableBeds._sum.availableBeds || 0,
    availableIcuBeds: availableBeds._sum.availableIcuBeds || 0,
    hospitalsByLevel,
    hospitalsByCounty,
  }
}