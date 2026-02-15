import { prisma } from '@/app/lib/prisma'
import { queueAuditLog, AuditAction } from '@/app/lib/audit'
import { User } from '@/app/lib/auth'
import { Prisma, HospitalType, HospitalLevel, Ownership, PowerStatus, WaterStatus, OxygenStatus, InternetStatus, OperationalStatus } from '@prisma/client'

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
  type: HospitalType
  level: HospitalLevel
  ownership: Ownership
  countyId: string
  subCounty?: string | null
  ward?: string | null
  address: string
  coordinates: JsonValue
  phone: string
  emergencyPhone?: string | null  // Can be null in interface but will default to empty string
  email?: string | null            // Can be null in interface but will default to empty string
  totalBeds: number
  functionalBeds: number
  icuBeds: number
  hdUnitBeds: number
  maternityBeds: number
  pediatricBeds: number
  emergencyBeds: number
  isolationBeds: number
}

export interface HospitalUpdateData {
  name?: string
  code?: string
  mflCode?: string | null
  type?: HospitalType
  level?: HospitalLevel
  ownership?: Ownership
  subCounty?: string | null
  ward?: string | null
  address?: string
  coordinates?: JsonValue
  phone?: string
  emergencyPhone?: string  // Changed: Remove null since it's required in schema
  email?: string           // Changed: Remove null since it's required in schema
  totalBeds?: number
  functionalBeds?: number
  icuBeds?: number
  hdUnitBeds?: number
  maternityBeds?: number
  pediatricBeds?: number
  emergencyBeds?: number
  isolationBeds?: number
  operationalStatus?: OperationalStatus
  acceptingPatients?: boolean
  emergencyOnlyMode?: boolean
  isActive?: boolean
  powerStatus?: PowerStatus
  waterStatus?: WaterStatus
  oxygenStatus?: OxygenStatus
  internetStatus?: InternetStatus
}

export interface HospitalStatusUpdateData {
  operationalStatus?: OperationalStatus
  acceptingPatients?: boolean
  emergencyOnlyMode?: boolean
  availableBeds?: number
  availableIcuBeds?: number
  availableEmergencyBeds?: number
  powerStatus?: PowerStatus
  waterStatus?: WaterStatus
  oxygenStatus?: OxygenStatus
  internetStatus?: InternetStatus
}

export interface HospitalCapacityUpdateData {
  totalBeds?: number
  functionalBeds?: number
  availableBeds?: number
  icuBeds?: number
  availableIcuBeds?: number
  emergencyBeds?: number
  availableEmergencyBeds?: number
  maternityBeds?: number
  pediatricBeds?: number
  hdUnitBeds?: number
  isolationBeds?: number
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

  const where: Prisma.HospitalWhereInput = {
    isActive: status !== 'INACTIVE',
  }

  if (county) {
    where.countyId = county
  }

  if (level) {
    where.level = level as HospitalLevel
  }

  if (type) {
    where.type = type as HospitalType
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
  const hospitalData: Prisma.HospitalCreateInput = {
    // Required fields
    name: data.name,
    code: data.code,
    type: data.type,
    level: data.level,
    ownership: data.ownership,
    county: {
      connect: { id: data.countyId }
    },
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
    
    // Required string fields - provide empty string as default for null values
    emergencyPhone: data.emergencyPhone || '',
    email: data.email || '',
    
    // Optional nullable fields with explicit null handling
    mflCode: data.mflCode ?? null,
    subCounty: data.subCounty ?? null,
    ward: data.ward ?? null,
    
    // Set default values for available beds
    availableBeds: data.functionalBeds,
    availableIcuBeds: data.icuBeds,
    availableEmergencyBeds: data.emergencyBeds,
    lastBedUpdate: new Date(),
    
    // Handle coordinates (JSON field)
    coordinates: data.coordinates as Prisma.InputJsonValue,
    
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

  const hospital = await prisma.hospital.create({
    data: hospitalData,
    include: {
      county: true,
    },
  })

  // Audit log
  await queueAuditLog({
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

export async function updateHospital(id: string, data: HospitalUpdateData, user: User) {
  // Build Prisma update input with proper typing
  const updateData: Prisma.HospitalUpdateInput = {}

  // Handle required string fields (cannot be null)
  if (data.name !== undefined) updateData.name = data.name
  if (data.code !== undefined) updateData.code = data.code
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.emergencyPhone !== undefined) updateData.emergencyPhone = data.emergencyPhone
  if (data.email !== undefined) updateData.email = data.email
  if (data.address !== undefined) updateData.address = data.address
  
  // Handle optional nullable string fields (can be set to null)
  if (data.mflCode !== undefined) {
    updateData.mflCode = data.mflCode === null ? { set: null } : data.mflCode
  }
  if (data.subCounty !== undefined) {
    updateData.subCounty = data.subCounty === null ? { set: null } : data.subCounty
  }
  if (data.ward !== undefined) {
    updateData.ward = data.ward === null ? { set: null } : data.ward
  }
  
  // Handle enums
  if (data.type !== undefined) updateData.type = data.type
  if (data.level !== undefined) updateData.level = data.level
  if (data.ownership !== undefined) updateData.ownership = data.ownership
  if (data.operationalStatus !== undefined) updateData.operationalStatus = data.operationalStatus
  if (data.powerStatus !== undefined) updateData.powerStatus = data.powerStatus
  if (data.waterStatus !== undefined) updateData.waterStatus = data.waterStatus
  if (data.oxygenStatus !== undefined) updateData.oxygenStatus = data.oxygenStatus
  if (data.internetStatus !== undefined) updateData.internetStatus = data.internetStatus
  
  // Handle JSON field
  if (data.coordinates !== undefined) {
    updateData.coordinates = data.coordinates as Prisma.InputJsonValue
  }
  
  // Handle numbers
  if (data.totalBeds !== undefined) updateData.totalBeds = data.totalBeds
  if (data.functionalBeds !== undefined) updateData.functionalBeds = data.functionalBeds
  if (data.icuBeds !== undefined) updateData.icuBeds = data.icuBeds
  if (data.hdUnitBeds !== undefined) updateData.hdUnitBeds = data.hdUnitBeds
  if (data.maternityBeds !== undefined) updateData.maternityBeds = data.maternityBeds
  if (data.pediatricBeds !== undefined) updateData.pediatricBeds = data.pediatricBeds
  if (data.emergencyBeds !== undefined) updateData.emergencyBeds = data.emergencyBeds
  if (data.isolationBeds !== undefined) updateData.isolationBeds = data.isolationBeds
  
  // Handle booleans
  if (data.acceptingPatients !== undefined) updateData.acceptingPatients = data.acceptingPatients
  if (data.emergencyOnlyMode !== undefined) updateData.emergencyOnlyMode = data.emergencyOnlyMode
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  const hospital = await prisma.hospital.update({
    where: { id },
    data: updateData,
    include: {
      county: true,
    },
  })

  // Audit log
  await queueAuditLog({
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
  await queueAuditLog({
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

export async function updateHospitalStatus(id: string, data: HospitalStatusUpdateData, user: User) {
  const hospital = await prisma.hospital.update({
    where: { id },
    data: {
      ...data,
      lastBedUpdate: new Date(),
    },
  })

  // Audit log
  await queueAuditLog({
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

export async function updateHospitalCapacity(id: string, data: HospitalCapacityUpdateData, user: User) {
  const hospital = await prisma.hospital.update({
    where: { id },
    data: {
      ...data,
      lastBedUpdate: new Date(),
    },
  })

  // Audit log
  await queueAuditLog({
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