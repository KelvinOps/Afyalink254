// src/app/api/emergencies/[id]/response/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';
import { auditLog, AuditAction } from '@/app/lib/audit';
import { hasPermission, canAccessModule } from '@/app/lib/auth';

const createResponseSchema = z.object({
  hospitalId: z.string().cuid(),
  ambulanceId: z.string().cuid().optional(),
  staffDeployed: z.array(z.string().cuid()),
  equipmentDeployed: z.array(z.object({
    type: z.string(),
    quantity: z.number().int().positive(),
    serialNumber: z.string().optional()
  })).optional(),
  suppliesDeployed: z.array(z.object({
    item: z.string(),
    quantity: z.number().int().positive()
  })).optional(),
  dispatchedAt: z.string().datetime().optional()
});

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

// GET /api/emergencies/[id]/response - Get emergency responses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to access emergencies module
    if (!canAccessModule(session.user, 'emergencies')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id },
      include: {
        responses: {
          include: {
            ambulance: true,
            staffDeployed: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                specialization: true
              }
            },
            hospital: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          },
          orderBy: {
            dispatchedAt: 'desc'
          }
        }
      }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    // Check access permissions based on role and county
    if (session.user.role === 'COUNTY_ADMIN' && emergency.countyId !== session.user.countyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (session.user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findUnique({
        where: { id: session.user.facilityId }
      });
      if (hospital?.countyId !== emergency.countyId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Log the view action - using string action since AuditAction might not match Prisma enum
    await auditLog({
      action: 'READ' as any,
      entityType: 'EMERGENCY_RESPONSE',
      entityId: params.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Viewed emergency responses for ${emergency.emergencyNumber}`,
      facilityId: session.user.facilityId,
      success: true
    });

    return NextResponse.json(emergency.responses);
  } catch (error) {
    console.error('Error fetching emergency responses:', error);
    
    // Log failed access attempt
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await auditLog({
        action: 'READ' as any,
        entityType: 'EMERGENCY_RESPONSE',
        entityId: params.id,
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name,
        description: `Failed to view emergency responses for ${params.id}`,
        facilityId: session.user.facilityId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/emergencies/[id]/response - Create emergency response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only users with dispatch.write can create responses
    if (!hasPermission(session.user, 'dispatch.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createResponseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify emergency exists and is active
    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    if (emergency.status === 'RESOLVED' || emergency.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Cannot add response to resolved emergency' }, { status: 400 });
    }

    // Verify hospital exists and is in the same county
    const hospital = await prisma.hospital.findUnique({
      where: { id: data.hospitalId }
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    if (hospital.countyId !== emergency.countyId) {
      return NextResponse.json({ error: 'Hospital must be in the same county as emergency' }, { status: 400 });
    }

    // Verify ambulance if provided
    if (data.ambulanceId) {
      const ambulance = await prisma.ambulance.findUnique({
        where: { id: data.ambulanceId }
      });

      if (!ambulance) {
        return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 });
      }

      if (ambulance.hospitalId !== data.hospitalId) {
        return NextResponse.json({ error: 'Ambulance must belong to the responding hospital' }, { status: 400 });
      }
    }

    // Verify staff members
    const staffMembers = await prisma.staff.findMany({
      where: {
        id: { in: data.staffDeployed },
        hospitalId: data.hospitalId,
        isActive: true
      }
    });

    if (staffMembers.length !== data.staffDeployed.length) {
      return NextResponse.json({ error: 'One or more staff members not found or inactive' }, { status: 400 });
    }

    const response = await prisma.emergencyResponse.create({
      data: {
        emergencyId: params.id,
        hospitalId: data.hospitalId,
        ambulanceId: data.ambulanceId,
        staffDeployed: {
          connect: data.staffDeployed.map(id => ({ id }))
        },
        equipmentDeployed: data.equipmentDeployed,
        suppliesDeployed: data.suppliesDeployed,
        status: 'DISPATCHED',
        dispatchedAt: data.dispatchedAt ? new Date(data.dispatchedAt) : new Date()
      },
      include: {
        ambulance: true,
        staffDeployed: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        hospital: {
          select: {
            name: true,
            level: true
          }
        }
      }
    });

    // Update ambulance status if used
    if (data.ambulanceId) {
      await prisma.ambulance.update({
        where: { id: data.ambulanceId },
        data: { status: 'DISPATCHED' }
      });
    }

    // Log the action with detailed information - using string action
    await auditLog({
      action: 'CREATE' as any,
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Created emergency response for ${emergency.emergencyNumber}`,
      changes: {
        hospital: hospital.name,
        ambulance: data.ambulanceId ? 'Yes' : 'No',
        staffCount: data.staffDeployed.length,
        equipmentCount: data.equipmentDeployed?.length || 0,
        suppliesCount: data.suppliesDeployed?.length || 0
      },
      facilityId: session.user.facilityId,
      success: true
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating emergency response:', error);
    
    // Log failed creation attempt
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await auditLog({
        action: 'CREATE' as any,
        entityType: 'EMERGENCY_RESPONSE',
        entityId: params.id,
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name,
        description: `Failed to create emergency response for ${params.id}`,
        facilityId: session.user.facilityId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/emergencies/[id]/response/[responseId] - Update emergency response
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; responseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only users with dispatch.write can update responses
    if (!hasPermission(session.user, 'dispatch.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateResponseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify emergency and response exist
    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    const existingResponse = await prisma.emergencyResponse.findUnique({
      where: { id: params.responseId },
      include: {
        hospital: true
      }
    });

    if (!existingResponse) {
      return NextResponse.json({ error: 'Emergency response not found' }, { status: 404 });
    }

    // Check access permissions
    if (session.user.role === 'COUNTY_ADMIN' && emergency.countyId !== session.user.countyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (session.user.role === 'HOSPITAL_ADMIN' && existingResponse.hospitalId !== session.user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData: any = { ...data };

    // Handle timestamp updates based on status
    if (data.status === 'ON_SCENE' && !data.arrivedAt) {
      updateData.arrivedAt = new Date();
    }
    if (data.status === 'TRANSPORTING' && !data.departedAt) {
      updateData.departedAt = new Date();
    }
    if (data.status === 'COMPLETED' && !data.completedAt) {
      updateData.completedAt = new Date();
    }

    const response = await prisma.emergencyResponse.update({
      where: { id: params.responseId },
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
        },
        hospital: {
          select: {
            name: true,
            level: true
          }
        }
      }
    });

    // Update ambulance status if response is completed or cancelled
    if (response.ambulanceId && (data.status === 'COMPLETED' || data.status === 'CANCELLED')) {
      await prisma.ambulance.update({
        where: { id: response.ambulanceId },
        data: { status: 'AVAILABLE' }
      });
    }

    // Log the action with detailed changes - using string action
    await auditLog({
      action: 'UPDATE' as any,
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Updated emergency response status to ${data.status}`,
      changes: {
        previousStatus: existingResponse.status,
        newStatus: data.status,
        updatedFields: Object.keys(data)
      },
      facilityId: session.user.facilityId,
      success: true
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating emergency response:', error);
    
    // Log failed update attempt
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await auditLog({
        action: 'UPDATE' as any,
        entityType: 'EMERGENCY_RESPONSE',
        entityId: params.responseId,
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name,
        description: `Failed to update emergency response ${params.responseId}`,
        facilityId: session.user.facilityId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/emergencies/[id]/response/[responseId] - Delete emergency response
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; responseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN and COUNTY_ADMIN can delete responses
    if (!['SUPER_ADMIN', 'COUNTY_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify emergency and response exist
    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    const response = await prisma.emergencyResponse.findUnique({
      where: { id: params.responseId },
      include: {
        hospital: true
      }
    });

    if (!response) {
      return NextResponse.json({ error: 'Emergency response not found' }, { status: 404 });
    }

    // Check access permissions
    if (session.user.role === 'COUNTY_ADMIN' && emergency.countyId !== session.user.countyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update ambulance status back to available if it was dispatched
    if (response.ambulanceId && response.status !== 'COMPLETED') {
      await prisma.ambulance.update({
        where: { id: response.ambulanceId },
        data: { status: 'AVAILABLE' }
      });
    }

    await prisma.emergencyResponse.delete({
      where: { id: params.responseId }
    });

    // Log the action - using string action
    await auditLog({
      action: 'DELETE' as any,
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Deleted emergency response for ${emergency.emergencyNumber}`,
      changes: {
        hospital: response.hospital.name,
        status: response.status,
        ambulanceId: response.ambulanceId
      },
      facilityId: session.user.facilityId,
      success: true
    });

    return NextResponse.json({ message: 'Emergency response deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency response:', error);
    
    // Log failed deletion attempt
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await auditLog({
        action: 'DELETE' as any,
        entityType: 'EMERGENCY_RESPONSE',
        entityId: params.responseId,
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name,
        description: `Failed to delete emergency response ${params.responseId}`,
        facilityId: session.user.facilityId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}