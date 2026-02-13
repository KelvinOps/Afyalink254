// src/app/api/transfers/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { verifyAndGetUser, ROLE_PERMISSIONS } from '@/app/lib/auth';

const rejectTransferSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    // Verify the token and get user
    const user = await verifyAndGetUser(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Await the params
    const { id } = await params;

    // Check if user has permission to reject transfers
    const userPermissions = user.permissions || ROLE_PERMISSIONS[user.role] || [];
    const hasTransferPermission = userPermissions.includes('transfers.write') || 
                                 userPermissions.includes('*') ||
                                 user.role === 'SUPER_ADMIN';
    
    if (!hasTransferPermission) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        destinationHospital: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    // Check if user has permission to reject for destination hospital
    if (user.role !== 'SUPER_ADMIN' && 
        transfer.destinationHospitalId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden - Not authorized for this facility' }, { status: 403 });
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
      where: { id },
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
        userId: user.id,
        userRole: user.role,
        userName: user.name || 'Unknown',
        action: 'REJECT',
        entityType: 'TRANSFER',
        entityId: transfer.id,
        description: `Rejected transfer ${transfer.transferNumber}: ${data.rejectionReason}`,
        facilityId: user.facilityId,
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