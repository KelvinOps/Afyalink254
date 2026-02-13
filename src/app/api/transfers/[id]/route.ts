// src/app/api/transfers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { verifyToken, ROLE_PERMISSIONS } from '@/app/lib/auth';

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    
    if (!user) {
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

    // Authorization check
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const isOriginHospital = transfer.originHospitalId === user.facilityId;
      const isDestinationHospital = transfer.destinationHospitalId === user.facilityId;
      
      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      const hasTransferReadPermission = userPermissions.includes('transfers.read') || 
                                      userPermissions.includes('*');
      
      if (!isOriginHospital && !isDestinationHospital && !hasTransferReadPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // If you need the approvedBy staff data, fetch it separately
    let approvedBy = null;
    if (transfer.approvedById) {
      approvedBy = await prisma.staff.findUnique({
        where: { id: transfer.approvedById },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
    }

    // Combine transfer data with approvedBy data
    const responseData = {
      ...transfer,
      approvedBy,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasTransferWritePermission = userPermissions.includes('transfers.write') || 
                                     userPermissions.includes('*') ||
                                     user.role === 'SUPER_ADMIN' ||
                                     user.role === 'ADMIN';
    
    if (!hasTransferWritePermission) {
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

    // Create audit log using prisma directly
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: user.role,
        userName: user.name || 'Unknown',
        action: 'UPDATE',
        entityType: 'TRANSFER',
        entityId: transfer.id,
        description: `Updated transfer ${transfer.transferNumber}`,
        changes: {
          old: oldData,
          new: updatedTransfer,
        },
        facilityId: user.facilityId,
      }
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasTransferWritePermission = userPermissions.includes('transfers.write') || 
                                     userPermissions.includes('*') ||
                                     user.role === 'SUPER_ADMIN' ||
                                     user.role === 'ADMIN';
    
    if (!hasTransferWritePermission) {
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

    // Update the transfer status to cancelled
    await prisma.transfer.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by user',
      },
    });

    // Create audit log using prisma directly
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: user.role,
        userName: user.name || 'Unknown',
        action: 'CANCEL',
        entityType: 'TRANSFER',
        entityId: transfer.id,
        description: `Cancelled transfer ${transfer.transferNumber}`,
        facilityId: user.facilityId,
      }
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