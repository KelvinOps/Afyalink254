import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';
import { auditLog, AuditAction } from '@/app/lib/audit';

// Validation schemas
const createTransferSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  originHospitalId: z.string().min(1, 'Origin hospital is required'),
  destinationHospitalId: z.string().min(1, 'Destination hospital is required'),
  reason: z.string().min(1, 'Reason is required'),
  urgency: z.enum(['IMMEDIATE', 'URGENT', 'SCHEDULED', 'ROUTINE']),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  icd10Codes: z.array(z.string()).optional().default([]),
  vitalSigns: z.record(z.any()),
  transportMode: z.enum(['AMBULANCE', 'AIR_AMBULANCE', 'PRIVATE_VEHICLE', 'INTER_FACILITY_TRANSPORT', 'PUBLIC_TRANSPORT']),
  requiredResources: z.array(z.string()).optional().default([]),
  specialNeeds: z.string().optional(),
  estimatedCost: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const hospitalId = searchParams.get('hospitalId');
    const patientId = searchParams.get('patientId');
    const direction = searchParams.get('direction');

    const skip = (page - 1) * limit;

    // Build where clause based on user role and filters
    let where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    // Hospital admins can only see transfers from their hospital
    if (session.user.role === 'HOSPITAL_ADMIN' && session.user.facilityId) {
      if (direction === 'incoming') {
        where.destinationHospitalId = session.user.facilityId;
      } else if (direction === 'outgoing') {
        where.originHospitalId = session.user.facilityId;
      } else {
        where.OR = [
          { originHospitalId: session.user.facilityId },
          { destinationHospitalId: session.user.facilityId }
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

    // Check permission using your auth system
    const { hasPermission } = await import('@/app/lib/auth');
    if (!hasPermission(session.user, 'transfers.write')) {
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
      include: { currentHospital: true },
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
      prisma.hospital.findUnique({ where: { id: data.originHospitalId } }),
      prisma.hospital.findUnique({ where: { id: data.destinationHospitalId } }),
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

    const transfer = await prisma.transfer.create({
      data: {
        ...data,
        transferNumber,
        initiatedById: session.user.id,
        status: 'REQUESTED',
        requestedAt: new Date(),
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

    // Create audit log using your audit system
    await auditLog({
      action: AuditAction.CREATE,
      entityType: 'TRANSFER',
      entityId: transfer.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Created transfer request ${transferNumber} for patient ${transfer.patient.firstName} ${transfer.patient.lastName}`,
      changes: data,
      facilityId: session.user.facilityId,
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