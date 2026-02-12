// src/app/lib/types.ts

// Define a proper interface for coordinates
export interface Coordinates {
  lat: number
  lng: number
  accuracy?: number
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  hospitalId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Hospital {
  id: string
  name: string
  code: string
  mflCode?: string | null
  type: string
  level: string
  ownership: string
  countyId: string
  county?: {
    id: string
    name: string
    code: string
  }
  subCounty?: string | null
  ward?: string | null
  address: string
  coordinates: Coordinates
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
  availableBeds: number
  availableIcuBeds: number
  availableEmergencyBeds: number
  operationalStatus: string
  acceptingPatients: boolean
  emergencyOnlyMode: boolean
  powerStatus: string
  waterStatus: string
  oxygenStatus: string
  internetStatus: string
  has24HourService: boolean
  hasAmbulance: boolean
  hasBloodBank: boolean
  hasLaboratory: boolean
  hasRadiology: boolean
  hasCTScan: boolean
  hasMRI: boolean
  hasDialysis: boolean
  hasPharmacy: boolean
  hasOxygenPlant: boolean
  hasMortuary: boolean
  telemedicineEnabled: boolean
  shaContracted: boolean
  backupPower: boolean
  lastBedUpdate: string // Make sure this is string, not Date
  isActive: boolean
  createdAt: string
  updatedAt: string
}