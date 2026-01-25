// src/app/lib/types/telemedicine.ts

import { TelemedicineSession as PrismaTelemedicineSession, Patient as PrismaPatient, Staff as PrismaStaff, Hospital as PrismaHospital } from '@prisma/client'

// Adapter types that match what your components expect
export interface AdaptedTelemedicineSession {
  id: string
  sessionNumber: string
  patient: AdaptedPatient
  telemedicineHub: { name: string; id: string; code: string } | null
  specialist: AdaptedStaff
  specialistId: string
  providerHospital: AdaptedHospital
  requestingFacilityType: string
  // Add other fields from your component usage...
  status: string
  scheduledTime: Date | null
  startTime: Date | null
  endTime: Date | null
  duration: number | null
  connectionQuality: string | null
  audioQuality: number | null
  videoQuality: number | null
  imagesShared: string[]
  documentsShared: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AdaptedPatient {
  id: string
  phone: string | undefined  // Changed from null to undefined
  firstName: string
  lastName: string
  patientNumber: string
  dateOfBirth: Date
  gender: string
  bloodType: string | null
  allergies: string[]
  chronicConditions: string[]
}

export interface AdaptedStaff {
  id: string
  firstName: string
  lastName: string
  specialization: string | null
}

export interface AdaptedHospital {
  id: string
  name: string
  code: string
}

// Adapter function
export function adaptTelemedicineSession(
  session: PrismaTelemedicineSession & {
    patient: PrismaPatient
    specialist: PrismaStaff
    providerHospital: PrismaHospital
    telemedicineHub?: { name: string; id: string; code: string } | null
  }
): AdaptedTelemedicineSession {
  return {
    ...session,
    patient: {
      ...session.patient,
      phone: session.patient.phone || undefined  // Convert null to undefined
    },
    specialist: {
      id: session.specialist.id,
      firstName: session.specialist.firstName,
      lastName: session.specialist.lastName,
      specialization: session.specialist.specialization || null
    },
    providerHospital: {
      id: session.providerHospital.id,
      name: session.providerHospital.name,
      code: session.providerHospital.code
    },
    telemedicineHub: session.telemedicineHub || null,
    // Ensure arrays are properly typed
    imagesShared: session.imagesShared as string[] || [],
    documentsShared: session.documentsShared as string[] || []
  }
}