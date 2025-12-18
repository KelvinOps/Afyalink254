import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';
import { auditLog, AuditAction } from '@/app/lib/audit';

const rejectTransferSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
  notes: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Create audit log using your audit system
    await auditLog({
      action: AuditAction.REJECT,
      entityType: 'TRANSFER',
      entityId: transfer.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Rejected transfer ${transfer.transferNumber}: ${data.rejectionReason}`,
      facilityId: session.user.facilityId,
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