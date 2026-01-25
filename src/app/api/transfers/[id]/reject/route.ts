// src/app/api/transfers/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma'; // Fixed: named import, not default
import { authOptions } from '@/app/lib/auth';

const rejectTransferSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import auth utilities
    const { ROLE_PERMISSIONS } = await import('@/app/lib/auth');
    
    // Check if user has permission to reject transfers
    const userPermissions = ROLE_PERMISSIONS[session.user.role] || [];
    const hasTransferPermission = userPermissions.includes('transfers.write') || 
                                 userPermissions.includes('*') ||
                                 session.user.role === 'SUPER_ADMIN';
    
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

    // Check if user has permission to reject for destination hospital
    if (session.user.role !== 'SUPER_ADMIN' && 
        transfer.destinationHospitalId !== session.user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (transfer.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Transfer cannot be rejected in current status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = rejectTransferSchema.safeParse(body);

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
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: data.rejectionReason,
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

    // Create audit log using prisma directly
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name || 'Unknown',
        action: 'REJECT',
        entityType: 'TRANSFER',
        entityId: transfer.id,
        description: `Rejected transfer ${transfer.transferNumber}: ${data.rejectionReason}`,
        facilityId: session.user.facilityId,
      }
    });

    return NextResponse.json(updatedTransfer);
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}