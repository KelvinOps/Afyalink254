import { prisma } from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'

// Define types for vital signs
export interface VitalSigns {
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  glucoseLevel?: number;
  painScore?: number;
  consciousnessLevel?: string;
  bmi?: number;
  weight?: number;
  height?: number;
  recordedAt?: string;
  recordedBy?: string;
}

// Define types for prescriptions - add index signature for Prisma compatibility
export interface TelemedicinePrescription {
  id?: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
  quantity?: number;
  refills?: number;
  startDate?: string;
  endDate?: string;
  prescribedBy?: string;
  prescribedAt?: string;
  [key: string]: string | number | boolean | undefined; // Index signature for Prisma compatibility
}

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
  vitalSigns?: VitalSigns
}

export interface UpdateTelemedicineSessionData {
  diagnosis?: string
  recommendations?: string
  prescriptions?: TelemedicinePrescription[]
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
    where.status = status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'TECHNICAL_FAILURE'
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

  // Prepare the data object for Prisma
  const sessionData: Prisma.TelemedicineSessionCreateInput = {
    sessionNumber,
    patient: { connect: { id: data.patientId } },
    specialist: { connect: { id: data.specialistId } },
    providerHospital: { connect: { id: data.providerHospitalId } },
    consultationType: data.consultationType,
    chiefComplaint: data.chiefComplaint,
    status: 'SCHEDULED',
    // Use empty string for optional fields instead of undefined
    presentingHistory: data.presentingHistory || '',
    scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : undefined,
    vitalSigns: data.vitalSigns ? (data.vitalSigns as Prisma.InputJsonValue) : Prisma.JsonNull,
    requestingFacilityType: data.requestingFacilityType,
    // Use empty strings for optional text fields
    diagnosis: '',
    recommendations: '',
    requiresInPersonVisit: false,
    requiresReferral: false,
    shaReimbursable: true,
    consultationFee: 0,
    connectionQuality: undefined,
    audioQuality: undefined,
    videoQuality: undefined,
    imagesShared: [],
    documentsShared: [],
    prescriptions: [],
  }

  // Add facility connections based on type
  if (data.requestingFacilityType === 'HOSPITAL' && data.requestingHospitalId) {
    sessionData.requestingHospital = { connect: { id: data.requestingHospitalId } }
  } else if (data.requestingFacilityType === 'HEALTH_CENTER' && data.requestingHealthCenterId) {
    sessionData.requestingHealthCenter = { connect: { id: data.requestingHealthCenterId } }
  } else if (data.requestingFacilityType === 'DISPENSARY' && data.requestingDispensaryId) {
    sessionData.requestingDispensary = { connect: { id: data.requestingDispensaryId } }
  }

  // Create the session
  return prisma.telemedicineSession.create({
    data: sessionData,
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
  // Prepare the data object for Prisma - handle each field explicitly
  const updateData: Prisma.TelemedicineSessionUpdateInput = {}
  
  // Add fields only if they are provided
  if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis
  if (data.recommendations !== undefined) updateData.recommendations = data.recommendations
  if (data.requiresInPersonVisit !== undefined) updateData.requiresInPersonVisit = data.requiresInPersonVisit
  if (data.requiresReferral !== undefined) updateData.requiresReferral = data.requiresReferral
  if (data.status !== undefined) updateData.status = data.status
  if (data.startTime !== undefined) updateData.startTime = data.startTime ? new Date(data.startTime) : undefined
  if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : undefined
  if (data.duration !== undefined) updateData.duration = data.duration
  if (data.connectionQuality !== undefined) updateData.connectionQuality = data.connectionQuality
  if (data.audioQuality !== undefined) updateData.audioQuality = data.audioQuality
  if (data.videoQuality !== undefined) updateData.videoQuality = data.videoQuality
  if (data.imagesShared !== undefined) updateData.imagesShared = data.imagesShared
  if (data.documentsShared !== undefined) updateData.documentsShared = data.documentsShared
  
  // Handle prescriptions with proper JSON conversion
  if (data.prescriptions !== undefined) {
    // Convert to Prisma-compatible JSON format
    const prescriptionsJson = data.prescriptions.map(prescription => ({
      ...prescription,
      // Ensure all fields are present
      id: prescription.id || undefined,
      instructions: prescription.instructions || '',
      quantity: prescription.quantity || 0,
      refills: prescription.refills || 0,
      startDate: prescription.startDate || '',
      endDate: prescription.endDate || '',
      prescribedBy: prescription.prescribedBy || '',
      prescribedAt: prescription.prescribedAt || new Date().toISOString()
    }))
    updateData.prescriptions = prescriptionsJson as Prisma.InputJsonValue[]
  }

  return prisma.telemedicineSession.update({
    where: { id },
    data: updateData,
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