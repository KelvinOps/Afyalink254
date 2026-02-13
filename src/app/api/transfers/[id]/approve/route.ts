// src/app/api/transfers/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { verifyToken, ROLE_PERMISSIONS } from '@/app/lib/auth';

const approveTransferSchema = z.object({
  bedReserved: z.boolean().optional().default(false),
  bedNumber: z.string().optional(),
  acceptedByName: z.string().optional(),
  acceptedByPhone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if user has permission to approve transfers
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasTransferPermission = userPermissions.includes('transfers.write') || 
                                 userPermissions.includes('*') ||
                                 user.role === 'SUPER_ADMIN' ||
                                 user.role === 'ADMIN';
    
    if (!hasTransferPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id: params.id },
      include: {
        destinationHospital: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Check if user has permission to approve for destination hospital
    if (user.role !== 'SUPER_ADMIN' && 
        user.role !== 'ADMIN' &&
        transfer.destinationHospitalId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (transfer.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Transfer cannot be approved in current status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = approveTransferSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const updatedTransfer = await prisma.transfer.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: user.id,
        bedReserved: data.bedReserved,
        bedNumber: data.bedNumber,
        acceptedByName: data.acceptedByName || user.name,
        acceptedByPhone: data.acceptedByPhone,
        notes: data.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        originHospital: {
          select: {
            name: true,
          },
        },
        destinationHospital: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: user.role,
        userName: user.name || 'Unknown',
        action: 'APPROVE',
        entityType: 'TRANSFER',
        entityId: transfer.id,
        description: `Approved transfer ${transfer.transferNumber} from ${updatedTransfer.originHospital?.name || 'Unknown'} to ${updatedTransfer.destinationHospital?.name || 'Unknown'}`,
        facilityId: user.facilityId,
      }
    });

    // Also update patient's current hospital if they're being transferred
    if (transfer.patientId) {
      await prisma.patient.update({
        where: { id: transfer.patientId },
        data: {
          currentHospitalId: transfer.destinationHospitalId,
          currentStatus: 'IN_TRANSFER',
        }
      });
    }

    return NextResponse.json(updatedTransfer);
  } catch (error) {
    console.error('Error approving transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}