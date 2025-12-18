import { prisma } from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CreateTelemedicineSessionData {
  patientId: string
  specialistId: string
  providerHospitalId: string
  requestingFacilityType: 'HOSPITAL' | 'HEALTH_CENTER' | 'DISPENSARY'
  requestingHospitalId?: string
  requestingHealthCenterId?: string
  requestingDispensaryId?: string
  consultationType: 'EMERGENCY' | 'SPECIALIST' | 'SECOND_OPINION' | 'FOLLOW_UP' | 'DIAGNOSTIC_REVIEW'
  chiefComplaint: string
  presentingHistory?: string
  scheduledTime?: string
  vitalSigns?: Record<string, any>
  createdBy: string
}

export interface UpdateTelemedicineSessionData {
  diagnosis?: string
  recommendations?: string
  prescriptions?: any[]
  requiresInPersonVisit?: boolean
  requiresReferral?: boolean
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'TECHNICAL_FAILURE'
  startTime?: string
  endTime?: string
  duration?: number
  connectionQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'FAILED'
  audioQuality?: number
  videoQuality?: number
  imagesShared?: string[]
  documentsShared?: string[]
}

export async function getTelemedicineSessions(options: {
  status?: string
  page?: number
  limit?: number
  search?: string
  userId?: string
} = {}) {
  const { status, page = 1, limit = 50, search, userId } = options
  const skip = (page - 1) * limit

  const where: Prisma.TelemedicineSessionWhereInput = {}

  if (status && status !== 'all') {
    where.status = status as any
  }

  if (search) {
    where.OR = [
      { sessionNumber: { contains: search, mode: 'insensitive' } },
      { chiefComplaint: { contains: search, mode: 'insensitive' } },
      { patient: { 
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      }},
      { specialist: { 
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      }}
    ]
  }

  if (userId) {
    where.OR = [
      { specialistId: userId },
      { patientId: userId }
    ]
  }

  const [sessions, total] = await Promise.all([
    prisma.telemedicineSession.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
            dateOfBirth: true,
            gender: true
          }
        },
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            specialization: true
          }
        },
        providerHospital: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        requestingHospital: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        requestingHealthCenter: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        requestingDispensary: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.telemedicineSession.count({ where })
  ])

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

export async function getTelemedicineSession(id: string) {
  return prisma.telemedicineSession.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientNumber: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          bloodType: true,
          allergies: true,
          chronicConditions: true
        }
      },
      specialist: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          specialization: true,
          email: true,
          phone: true
        }
      },
      providerHospital: {
        select: {
          id: true,
          name: true,
          code: true,
          phone: true,
          address: true
        }
      },
      requestingHospital: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      requestingHealthCenter: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      requestingDispensary: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      telemedicineHub: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  })
}

export async function createTelemedicineSession(data: CreateTelemedicineSessionData) {
  // Generate session number
  const sessionCount = await prisma.telemedicineSession.count()
  const sessionNumber = `TM${String(sessionCount + 1).padStart(6, '0')}`

  // Create the session with all required fields and defaults
  return prisma.telemedicineSession.create({
    data: {
      // Required fields from your schema
      sessionNumber,
      patientId: data.patientId,
      specialistId: data.specialistId,
      providerHospitalId: data.providerHospitalId,
      consultationType: data.consultationType,
      chiefComplaint: data.chiefComplaint,
      status: 'SCHEDULED', // Default status
      
      // Optional fields with defaults
      presentingHistory: data.presentingHistory || null,
      scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
      vitalSigns: data.vitalSigns || null,
      
      // Facility type fields
      requestingFacilityType: data.requestingFacilityType,
      requestingHospitalId: data.requestingHospitalId || null,
      requestingHealthCenterId: data.requestingHealthCenterId || null,
      requestingDispensaryId: data.requestingDispensaryId || null,
      
      // Fields that might be required in your schema
      diagnosis: null,
      recommendations: null,
      requiresInPersonVisit: false,
      requiresReferral: false,
      shaReimbursable: true,
      consultationFee: 0,
      
      // Technical fields
      connectionQuality: null,
      audioQuality: null,
      videoQuality: null,
      imagesShared: [],
      documentsShared: [],
      prescriptions: [],
      
      // Audit fields
      createdBy: data.createdBy,
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientNumber: true
        }
      },
      specialist: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      },
      providerHospital: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  })
}

export async function updateTelemedicineSession(id: string, data: UpdateTelemedicineSessionData) {
  return prisma.telemedicineSession.update({
    where: { id },
    data: {
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      prescriptions: data.prescriptions || undefined
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientNumber: true
        }
      },
      specialist: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      },
      providerHospital: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  })
}

export async function deleteTelemedicineSession(id: string) {
  return prisma.telemedicineSession.delete({
    where: { id }
  })
}