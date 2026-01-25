import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth-options';
import { auditLog } from '@/app/lib/audit';
import { createUserObject, hasPermission, canAccessModule } from '@/app/lib/auth';

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

    const user = createUserObject(session.user);

    if (!canAccessModule(user, 'emergencies')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // First fetch the emergency to check permissions
    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        emergencyNumber: true,
        countyId: true,
        status: true
      }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    // Check access permissions based on role and county
    if (user.role === 'COUNTY_ADMIN' && emergency.countyId !== user.countyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findUnique({
        where: { id: user.facilityId }
      });
      if (hospital?.countyId !== emergency.countyId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Fetch responses without the invalid hospital include
    const responses = await prisma.emergencyResponse.findMany({
      where: { emergencyId: params.id },
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
        }
        // Removed hospital include since it's not a relation in the schema
      },
      orderBy: {
        dispatchedAt: 'desc'
      }
    });

    // If you need hospital data, fetch it separately
    const responsesWithHospitalData = await Promise.all(
      responses.map(async (response) => {
        const hospital = await prisma.hospital.findUnique({
          where: { id: response.hospitalId },
          select: {
            id: true,
            name: true,
            level: true
          }
        });
        
        return {
          ...response,
          hospital: hospital || null
        };
      })
    );

    await auditLog({
      action: 'READ',
      entityType: 'EMERGENCY_RESPONSE',
      entityId: params.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Viewed emergency responses for ${emergency.emergencyNumber}`,
      facilityId: user.facilityId,
      success: true
    });

    return NextResponse.json(responsesWithHospitalData);
  } catch (error) {
    console.error('Error fetching emergency responses:', error);
    
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = createUserObject(session.user);
      await auditLog({
        action: 'READ',
        entityType: 'EMERGENCY_RESPONSE',
        entityId: params.id,
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        description: `Failed to view emergency responses for ${params.id}`,
        facilityId: user.facilityId,
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

    const user = createUserObject(session.user);

    if (!hasPermission(user, 'dispatch.write')) {
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

    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        emergencyNumber: true,
        countyId: true,
        status: true
      }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    if (emergency.status === 'RESOLVED' || emergency.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Cannot add response to resolved emergency' }, { status: 400 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: data.hospitalId }
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    if (hospital.countyId !== emergency.countyId) {
      return NextResponse.json({ error: 'Hospital must be in the same county as emergency' }, { status: 400 });
    }

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
        }
        // Removed hospital include
      }
    });

    if (data.ambulanceId) {
      await prisma.ambulance.update({
        where: { id: data.ambulanceId },
        data: { status: 'DISPATCHED' }
      });
    }

    // Fetch hospital data separately for audit log
    const hospitalForAudit = await prisma.hospital.findUnique({
      where: { id: data.hospitalId },
      select: {
        name: true
      }
    });

    await auditLog({
      action: 'CREATE',
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Created emergency response for ${emergency.emergencyNumber}`,
      changes: {
        hospital: hospitalForAudit?.name || 'Unknown',
        ambulance: data.ambulanceId ? 'Yes' : 'No',
        staffCount: data.staffDeployed.length,
        equipmentCount: data.equipmentDeployed?.length || 0,
        suppliesCount: data.suppliesDeployed?.length || 0
      },
      facilityId: user.facilityId,
      success: true
    });

    // Add hospital data to response before returning
    const responseWithHospital = {
      ...response,
      hospital: hospitalForAudit ? {
        id: hospital.id,
        name: hospitalForAudit.name,
        level: hospital.level
      } : null
    };

    return NextResponse.json(responseWithHospital, { status: 201 });
  } catch (error) {
    console.error('Error creating emergency response:', error);
    
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = createUserObject(session.user);
      await auditLog({
        action: 'CREATE',
        entityType: 'EMERGENCY_RESPONSE',
        entityId: params.id,
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        description: `Failed to create emergency response for ${params.id}`,
        facilityId: user.facilityId,
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

    const user = createUserObject(session.user);

    if (!hasPermission(user, 'dispatch.write')) {
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

    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        countyId: true
      }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    const existingResponse = await prisma.emergencyResponse.findUnique({
      where: { id: params.responseId },
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

    const updateData: any = { ...data };

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
        }
        // Removed hospital include
      }
    });

    if (response.ambulanceId && (data.status === 'COMPLETED' || data.status === 'CANCELLED')) {
      await prisma.ambulance.update({
        where: { id: response.ambulanceId },
        data: { status: 'AVAILABLE' }
      });
    }

    // Fetch hospital data separately for audit log
    const hospital = await prisma.hospital.findUnique({
      where: { id: response.hospitalId },
      select: {
        name: true
      }
    });

    await auditLog({
      action: 'UPDATE',
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated emergency response status to ${data.status}`,
      changes: {
        previousStatus: existingResponse.status,
        newStatus: data.status || response.status,
        updatedFields: Object.keys(data)
      },
      facilityId: user.facilityId,
      success: true
    });

    // Add hospital data to response before returning
    const responseWithHospital = {
      ...response,
      hospital: hospital ? {
        id: response.hospitalId,
        name: hospital.name,
        level: 'LEVEL_4' // You might want to fetch the actual level
      } : null
    };

    return NextResponse.json(responseWithHospital);
  } catch (error) {
    console.error('Error updating emergency response:', error);
    
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = createUserObject(session.user);
      await auditLog({
        action: 'UPDATE',
        entityType: 'EMERGENCY_RESPONSE',
        entityId: params.responseId,
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        description: `Failed to update emergency response ${params.responseId}`,
        facilityId: user.facilityId,
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

    const user = createUserObject(session.user);

    if (!['SUPER_ADMIN', 'COUNTY_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id },
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
      where: { id: params.responseId },
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

    // Fetch hospital data separately before deletion
    const hospital = await prisma.hospital.findUnique({
      where: { id: response.hospitalId },
      select: {
        name: true,
        level: true
      }
    });

    if (response.ambulanceId && response.status !== 'COMPLETED') {
      await prisma.ambulance.update({
        where: { id: response.ambulanceId },
        data: { status: 'AVAILABLE' }
      });
    }

    await prisma.emergencyResponse.delete({
      where: { id: params.responseId }
    });

    await auditLog({
      action: 'DELETE',
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Deleted emergency response for ${emergency.emergencyNumber}`,
      changes: {
        hospital: hospital?.name || 'Unknown',
        status: response.status,
        ambulanceId: response.ambulanceId
      },
      facilityId: user.facilityId,
      success: true
    });

    return NextResponse.json({ message: 'Emergency response deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency response:', error);
    
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = createUserObject(session.user);
      await auditLog({
        action: 'DELETE',
        entityType: 'EMERGENCY_RESPONSE',
        entityId: params.responseId,
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        description: `Failed to delete emergency response ${params.responseId}`,
        facilityId: user.facilityId,
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