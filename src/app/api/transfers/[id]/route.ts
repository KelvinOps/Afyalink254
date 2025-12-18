import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';
import { auditLog, AuditAction } from '@/app/lib/audit';

const updateTransferSchema = z.object({
  reason: z.string().optional(),
  urgency: z.enum(['IMMEDIATE', 'URGENT', 'SCHEDULED', 'ROUTINE']).optional(),
  diagnosis: z.string().optional(),
  icd10Codes: z.array(z.string()).optional(),
  vitalSigns: z.record(z.any()).optional(),
  transportMode: z.enum(['AMBULANCE', 'AIR_AMBULANCE', 'PRIVATE_VEHICLE', 'INTER_FACILITY_TRANSPORT', 'PUBLIC_TRANSPORT']).optional(),
  requiredResources: z.array(z.string()).optional(),
  specialNeeds: z.string().optional(),
  estimatedCost: z.number().optional(),
  ambulanceId: z.string().optional(),
  departureTime: z.string().datetime().optional(),
  arrivalTime: z.string().datetime().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            bloodType: true,
            allergies: true,
            chronicConditions: true,
            phone: true,
          },
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            address: true,
            coordinates: true,
          },
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            address: true,
            coordinates: true,
          },
        },
        ambulance: {
          select: {
            id: true,
            registrationNumber: true,
            type: true,
            driverName: true,
            driverPhone: true,
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        triageEntry: {
          select: {
            id: true,
            triageNumber: true,
            triageLevel: true,
            vitalSigns: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Authorization check using your auth system
    const { hasPermission } = await import('@/app/lib/auth');
    if (session.user.role !== 'SUPER_ADMIN') {
      const isOriginHospital = transfer.originHospitalId === session.user.facilityId;
      const isDestinationHospital = transfer.destinationHospitalId === session.user.facilityId;
      
      if (!isOriginHospital && !isDestinationHospital && !hasPermission(session.user, 'transfers.read')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(transfer);
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await import('@/app/lib/auth');
    if (!hasPermission(session.user, 'transfers.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Only allow updates for pending or approved transfers
    if (!['REQUESTED', 'APPROVED'].includes(transfer.status)) {
      return NextResponse.json(
        { error: 'Cannot update transfer in current status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateTransferSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const oldData = { ...transfer };

    const updatedTransfer = await prisma.transfer.update({
      where: { id: params.id },
      data: {
        ...data,
        departureTime: data.departureTime ? new Date(data.departureTime) : undefined,
        arrivalTime: data.arrivalTime ? new Date(data.arrivalTime) : undefined,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create audit log using your audit system
    await auditLog({
      action: AuditAction.UPDATE,
      entityType: 'TRANSFER',
      entityId: transfer.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Updated transfer ${transfer.transferNumber}`,
      changes: {
        old: oldData,
        new: updatedTransfer,
      },
      facilityId: session.user.facilityId,
    });

    return NextResponse.json(updatedTransfer);
  } catch (error) {
    console.error('Error updating transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await import('@/app/lib/auth');
    if (!hasPermission(session.user, 'transfers.write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Only allow cancellation of pending transfers
    if (transfer.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Only pending transfers can be cancelled' },
        { status: 400 }
      );
    }

    const deletedTransfer = await prisma.transfer.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by user',
      },
    });

    // Create audit log using your audit system
    await auditLog({
      action: AuditAction.CANCEL,
      entityType: 'TRANSFER',
      entityId: transfer.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Cancelled transfer ${transfer.transferNumber}`,
      facilityId: session.user.facilityId,
    });

    return NextResponse.json({ message: 'Transfer cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}