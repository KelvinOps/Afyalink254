// types/ambulance.ts 
export type AmbulanceType = 'BLS' | 'ALS' | 'CRITICAL_CARE' | 'AIR_AMBULANCE' | 'PATIENT_TRANSPORT' | 'MOBILE_CLINIC'
export type EquipmentLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'CRITICAL_CARE'
export type AmbulanceStatus = 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'TRANSPORTING' | 'AT_HOSPITAL' | 'RETURNING' | 'UNAVAILABLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: string;
}

export interface BaseStation {
  name: string;
  address?: string;
  coordinates: Coordinates;
  contactPerson?: string;
  contactPhone?: string;
  is24Hours?: boolean;
  facilities?: string[];
  notes?: string;
}

export interface Ambulance {
  id: string
  registrationNumber: string
  hospitalId: string
  type: AmbulanceType
  equipmentLevel: EquipmentLevel
  
  // Equipment
  hasGPS: boolean
  hasRadio: boolean
  hasOxygen: boolean
  hasDefibrillator: boolean
  hasVentilator: boolean
  hasMonitor: boolean
  
  // Crew
  driverName?: string
  driverPhone?: string
  driverLicense?: string
  paramedicName?: string
  paramedicLicense?: string
  crewSize: number
  
  // Status & Location
  status: AmbulanceStatus
  currentLocation?: Coordinates
  lastKnownLocation?: Coordinates
  
  // Tracking
  lastServiceDate?: string
  nextServiceDate?: string
  mileage?: number
  fuelLevel?: number
  odometerReading?: number
  
  isOperational: boolean
  
  // Relations
  hospital?: {
    name: string
    county?: {
      name: string
    }
  }
  
  createdAt: string
  updatedAt: string
}

export interface CountyAmbulance {
  id: string
  registrationNumber: string
  countyId: string
  baseStation: string
  baseCoordinates?: Coordinates
  
  type: AmbulanceType
  equipmentLevel: EquipmentLevel
  
  // Crew
  driverName?: string
  driverPhone?: string
  driverLicense?: string
  
  // Equipment
  hasGPS: boolean
  hasRadio: boolean
  hasOxygen: boolean
  hasDefibrillator: boolean
  
  // Status
  status: AmbulanceStatus
  currentLocation?: Coordinates
  lastKnownLocation?: Coordinates
  
  // Maintenance
  lastServiceDate?: string
  nextServiceDate?: string
  mileage?: number
  fuelLevel?: number
  
  isOperational: boolean
  
  // Relations
  county?: {
    name: string
  }
}