// src/app/api/emergencies/[id]/responses/[responseId]/route.ts
// This handles updating and deleting individual responses

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { verifyAndGetUser, hasPermission } from '@/app/lib/auth';
import { queueAuditLog, AuditAction } from '@/app/lib/audit';
import { Prisma } from '@prisma/client';

const updateResponseSchema = z.object({
  status: z.enum(['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TREATING', 'TRANSPORTING', 'COMPLETED', 'CANCELLED']).optional(),
  arrivedAt: z.string().datetime().optional(),
  departedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  patientsTriaged: z.number().int().positive().optional(),
  patientsTransported: z.number().int().positive().optional(),
  patientsByPriority: z.object({
    immediate: z.number().int().default(0),
    urgent: z.number().int().default(0),
    delayed: z.number().int().default(0),
    minor: z.number().int().default(0)
  }).optional(),
  notes: z.string().optional()
});

interface ResponseRouteParams {
  params: Promise<{
    id: string
    responseId: string
  }>
}

// PATCH /api/emergencies/[id]/responses/[responseId] - Update emergency response
export async function PATCH(
  request: NextRequest,
  { params }: ResponseRouteParams
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const user = await verifyAndGetUser(authHeader);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (!hasPermission(user, 'dispatch.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Await the params
    const { id, responseId } = await params;

    const body = await request.json();
    const validation = updateResponseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const emergency = await prisma.emergency.findUnique({
      where: { id },
      select: {
        id: true,
        countyId: true
      }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    const existingResponse = await prisma.emergencyResponse.findUnique({
      where: { id: responseId },
      select: {
        id: true,
        hospitalId: true,
        status: true
      }
    });

    if (!existingResponse) {
      return NextResponse.json({ error: 'Emergency response not found' }, { status: 404 });
    }

    if (user.role === 'COUNTY_ADMIN' && emergency.countyId !== user.countyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (user.role === 'HOSPITAL_ADMIN' && existingResponse.hospitalId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData: Prisma.EmergencyResponseUpdateInput = {}

    if (data.status !== undefined) updateData.status = data.status
    if (data.arrivedAt !== undefined) updateData.arrivedAt = new Date(data.arrivedAt)
    if (data.departedAt !== undefined) updateData.departedAt = new Date(data.departedAt)
    if (data.completedAt !== undefined) updateData.completedAt = new Date(data.completedAt)
    if (data.patientsTriaged !== undefined) updateData.patientsTriaged = data.patientsTriaged
    if (data.patientsTransported !== undefined) updateData.patientsTransported = data.patientsTransported
    if (data.patientsByPriority !== undefined) {
      updateData.patientsByPriority = data.patientsByPriority as Prisma.InputJsonValue
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes || { set: null }
    }

    // Auto-set timestamps based on status
    if (data.status === 'ON_SCENE' && !data.arrivedAt) {
      updateData.arrivedAt = new Date()
    }
    if (data.status === 'TRANSPORTING' && !data.departedAt) {
      updateData.departedAt = new Date()
    }
    if (data.status === 'COMPLETED' && !data.completedAt) {
      updateData.completedAt = new Date()
    }

    const response = await prisma.emergencyResponse.update({
      where: { id: responseId },
      data: updateData,
      include: {
        ambulance: true,
        staffDeployed: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Update ambulance status when response is completed/cancelled
    if (response.ambulanceId && (data.status === 'COMPLETED' || data.status === 'CANCELLED')) {
      await prisma.ambulance.update({
        where: { id: response.ambulanceId },
        data: { status: 'AVAILABLE' }
      });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: response.hospitalId },
      select: {
        id: true,
        name: true,
        level: true
      }
    });

    queueAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated emergency response status from ${existingResponse.status} to ${data.status || response.status}`,
      facilityId: user.facilityId
    });

    const responseWithHospital = {
      ...response,
      hospital: hospital ? {
        id: hospital.id,
        name: hospital.name,
        level: hospital.level
      } : null
    };

    return NextResponse.json(responseWithHospital);
  } catch (error) {
    console.error('Error updating emergency response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/emergencies/[id]/responses/[responseId] - Delete emergency response
export async function DELETE(
  request: NextRequest,
  { params }: ResponseRouteParams
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const user = await verifyAndGetUser(authHeader);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'COUNTY_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Await the params
    const { id, responseId } = await params;

    const emergency = await prisma.emergency.findUnique({
      where: { id },
      select: {
        id: true,
        emergencyNumber: true,
        countyId: true
      }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    const response = await prisma.emergencyResponse.findUnique({
      where: { id: responseId },
      select: {
        id: true,
        hospitalId: true,
        ambulanceId: true,
        status: true
      }
    });

    if (!response) {
      return NextResponse.json({ error: 'Emergency response not found' }, { status: 404 });
    }

    if (user.role === 'COUNTY_ADMIN' && emergency.countyId !== user.countyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: response.hospitalId },
      select: {
        name: true,
        level: true
      }
    });

    // Return ambulance to available if not completed
    if (response.ambulanceId && response.status !== 'COMPLETED') {
      await prisma.ambulance.update({
        where: { id: response.ambulanceId },
        data: { status: 'AVAILABLE' }
      });
    }

    await prisma.emergencyResponse.delete({
      where: { id: responseId }
    });

    queueAuditLog({
      action: AuditAction.DELETE,
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Deleted emergency response for ${emergency.emergencyNumber} - Hospital: ${hospital?.name || 'Unknown'}, Status: ${response.status}`,
      facilityId: user.facilityId
    });

    return NextResponse.json({ message: 'Emergency response deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}