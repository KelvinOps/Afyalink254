export interface Patient {
  id: string
  patientNumber: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  phone?: string
  shaNumber?: string
  currentStatus: 'REGISTERED' | 'IN_TRIAGE' | 'IN_TREATMENT' | 'ADMITTED' | 'DISCHARGED'
  createdAt: Date
  updatedAt: Date
}

export interface TriageEntry {
  id: string
  triageNumber: string
  patientId: string
  hospitalId: string
  chiefComplaint: string
  vitalSigns: {
    bp: string
    pulse: number
    temp: number
    respRate: number
    o2Sat: number
    gcs: number
  }
  triageLevel: 'IMMEDIATE' | 'URGENT' | 'LESS_URGENT' | 'NON_URGENT'
  esiLevel: number
  status: 'WAITING' | 'IN_ASSESSMENT' | 'IN_TREATMENT'
  arrivalTime: Date
}

export interface Hospital {
  id: string
  name: string
  code: string
  countyId: string
  level: 'LEVEL_4' | 'LEVEL_5' | 'LEVEL_6'
  totalBeds: number
  availableBeds: number
  operationalStatus: 'OPERATIONAL' | 'OVERWHELMED' | 'CLOSED'
}