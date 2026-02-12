import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth-options';
import { auditLog } from '@/app/lib/audit';
import { createUserObject, hasPermission } from '@/app/lib/auth';
import { Prisma } from '@prisma/client';

// Updated validation schema with all required fields from Prisma schema
const createTransferSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  originHospitalId: z.string().min(1, 'Origin hospital is required'),
  destinationHospitalId: z.string().min(1, 'Destination hospital is required'),
  reason: z.string().min(1, 'Reason is required'),
  urgency: z.enum(['IMMEDIATE', 'URGENT', 'SCHEDULED', 'ROUTINE']),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  icd10Codes: z.array(z.string()).optional().default([]),
  vitalSigns: z.record(z.any()).optional().default({}),
  consciousness: z.string().default('AVPU'),
  originDepartment: z.string().default('EMERGENCY'),
  destinationDepartment: z.string().default('EMERGENCY'),
  allergies: z.array(z.string()).optional().default([]),
  transportMode: z.enum(['AMBULANCE', 'AIR_AMBULANCE', 'PRIVATE_VEHICLE', 'INTER_FACILITY_TRANSPORT', 'PUBLIC_TRANSPORT']),
  requiredResources: z.array(z.string()).optional().default([]),
  specialNeeds: z.string().optional().default(''),
  estimatedCost: z.number().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create user object with proper permissions
    const user = createUserObject(session.user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const direction = searchParams.get('direction');

    const skip = (page - 1) * limit;

    // Build where clause based on user role and filters - Fixed: changed to const and proper typing
    const where: Prisma.TransferWhereInput = {};

    if (status && status !== 'all') {
      where.status = status as Prisma.TransferWhereInput['status'];
    }

    if (patientId) {
      where.patientId = patientId;
    }

    // Hospital admins can only see transfers from their hospital
    if (user.role === 'HOSPITAL_ADMIN' && user.facilityId) {
      if (direction === 'incoming') {
        where.destinationHospitalId = user.facilityId;
      } else if (direction === 'outgoing') {
        where.originHospitalId = user.facilityId;
      } else {
        where.OR = [
          { originHospitalId: user.facilityId },
          { destinationHospitalId: user.facilityId }
        ];
      }
    }

    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              gender: true,
              dateOfBirth: true,
            },
          },
          originHospital: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          destinationHospital: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          ambulance: {
            select: {
              id: true,
              registrationNumber: true,
            },
          },
          initiatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transfer.count({ where }),
    ]);

    return NextResponse.json({
      transfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create user object with proper permissions
    const user = createUserObject(session.user);

    // Check permission using your auth system
    if (!hasPermission(user, 'transfers.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createTransferSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify patient exists and is at origin hospital
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
      include: { 
        currentHospital: true,
        triageEntries: {
          orderBy: { arrivalTime: 'desc' },
          take: 1
        }
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    if (patient.currentHospitalId !== data.originHospitalId) {
      return NextResponse.json(
        { error: 'Patient is not at the specified origin hospital' },
        { status: 400 }
      );
    }

    // Verify hospitals exist
    const [originHospital, destinationHospital] = await Promise.all([
      prisma.hospital.findUnique({ 
        where: { id: data.originHospitalId },
        select: { id: true, name: true, code: true }
      }),
      prisma.hospital.findUnique({ 
        where: { id: data.destinationHospitalId },
        select: { id: true, name: true, code: true }
      }),
    ]);

    if (!originHospital || !destinationHospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Generate transfer number
    const transferCount = await prisma.transfer.count({
      where: {
        requestedAt: {
          gte: new Date(new Date().getFullYear(), 0, 1),
          lt: new Date(new Date().getFullYear() + 1, 0, 1),
        },
      },
    });

    const transferNumber = `TRF-${new Date().getFullYear()}-${(transferCount + 1).toString().padStart(6, '0')}`;

    // Create transfer with all required fields
    const transfer = await prisma.transfer.create({
      data: {
        transferNumber,
        patientId: data.patientId,
        // Note: triageEntry relation is managed from TriageEntry side (has transferId field)
        // If you need to link to a triage entry, update the TriageEntry after creating the transfer
        
        // Origin information
        originHospitalId: data.originHospitalId,
        originDepartment: data.originDepartment,
        originContactName: user.name,
        originContactPhone: '',
        
        // Destination information
        destinationHospitalId: data.destinationHospitalId,
        destinationDepartment: data.destinationDepartment,
        acceptedByName: null,
        acceptedByPhone: null,
        bedReserved: false,
        bedNumber: null,
        
        // Medical information
        reason: data.reason,
        diagnosis: data.diagnosis,
        icd10Codes: data.icd10Codes,
        vitalSigns: data.vitalSigns,
        consciousness: data.consciousness,
        oxygenRequired: false,
        oxygenRate: null,
        ivFluids: false,
        medications: [],
        allergies: data.allergies,
        specialNeeds: data.specialNeeds,
        
        // Transfer details
        urgency: data.urgency,
        requiredResources: data.requiredResources,
        requiredSpecialist: '',
        
        // Transport
        transportMode: data.transportMode,
        ambulanceId: null,
        transferDocuments: [],
        
        // Distance & route
        estimatedDistance: null,
        estimatedDuration: null,
        routeConditions: null,
        
        // Financial
        estimatedCost: data.estimatedCost,
        shaCovered: false,
        shaPreAuthorization: null,
        patientPayment: null,
        
        // Status
        status: 'REQUESTED',
        requestedAt: new Date(),
        initiatedById: user.id,
        
        // Timeline (will be set later)
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        departureTime: null,
        arrivalTime: null,
        completedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        
        // Personnel
        approvedById: null,
        
        // Follow-up
        handoverNotes: null,
        receivingStaffName: null,
        patientOutcome: null,
        
        notes: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Update patient's current status
    await prisma.patient.update({
      where: { id: data.patientId },
      data: { 
        currentStatus: 'IN_TRANSFER'
      }
    });

    // Link the triage entry to this transfer if one exists
    if (patient.triageEntries[0]?.id) {
      await prisma.triageEntry.update({
        where: { id: patient.triageEntries[0].id },
        data: { transferId: transfer.id }
      });
    }

    // Create audit log
    await auditLog({
      action: 'CREATE',
      entityType: 'TRANSFER',
      entityId: transfer.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Created transfer request ${transferNumber} for patient ${patient.firstName} ${patient.lastName}`,
      changes: data,
      facilityId: user.facilityId,
      success: true
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}