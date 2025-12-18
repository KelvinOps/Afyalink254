export type TransferStatus = 
  | 'REQUESTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export type TransferUrgency = 
  | 'IMMEDIATE'
  | 'URGENT'
  | 'SCHEDULED'
  | 'ROUTINE';

export type TransportMode = 
  | 'AMBULANCE'
  | 'AIR_AMBULANCE'
  | 'PRIVATE_VEHICLE'
  | 'INTER_FACILITY_TRANSPORT'
  | 'PUBLIC_TRANSPORT';

export interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  phone?: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
  coordinates?: any;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Ambulance {
  id: string;
  registrationNumber: string;
  type: string;
  driverName?: string;
  driverPhone?: string;
}

export interface Transfer {
  id: string;
  transferNumber: string;
  patientId: string;
  patient: Patient;
  originHospitalId: string;
  originHospital: Hospital;
  destinationHospitalId: string;
  destinationHospital: Hospital;
  reason: string;
  urgency: TransferUrgency;
  diagnosis: string;
  icd10Codes: string[];
  vitalSigns?: any;
  transportMode: TransportMode;
  requiredResources: string[];
  specialNeeds?: string;
  estimatedCost?: number;
  ambulanceId?: string;
  ambulance?: Ambulance;
  status: TransferStatus;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  departureTime?: string;
  arrivalTime?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  initiatedById: string;
  initiatedBy: Staff;
  approvedById?: string;
  approvedBy?: Staff;
  bedReserved: boolean;
  bedNumber?: string;
  acceptedByName?: string;
  acceptedByPhone?: string;
  rejectionReason?: string;
  handoverNotes?: string;
  receivingStaffName?: string;
  patientOutcome?: string;
  notes?: string;
  triageEntry?: {
    id: string;
    triageNumber: string;
    triageLevel: string;
    vitalSigns: any;
  };
}