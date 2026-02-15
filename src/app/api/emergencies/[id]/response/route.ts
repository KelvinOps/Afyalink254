// src/app/api/emergencies/[id]/responses/route.ts
// This handles listing and creating responses

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { verifyAndGetUser, hasPermission, canAccessModule} from '@/app/lib/auth';
import { queueAuditLog, AuditAction } from '@/app/lib/audit';

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

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/emergencies/[id]/responses - Get emergency responses
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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

    if (!canAccessModule(user, 'emergencies')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Await the params
    const { id } = await params;

    // First fetch the emergency to check permissions
    const emergency = await prisma.emergency.findUnique({
      where: { id },
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
        where: { id: user.facilityId || '' }
      });
      if (hospital?.countyId !== emergency.countyId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Fetch responses
    const responses = await prisma.emergencyResponse.findMany({
      where: { emergencyId: id },
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
      },
      orderBy: {
        dispatchedAt: 'desc'
      }
    });

    // Fetch hospital data separately
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

    queueAuditLog({
      action: AuditAction.READ,
      entityType: 'EMERGENCY_RESPONSE',
      entityId: id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Viewed emergency responses for ${emergency.emergencyNumber}`,
      facilityId: user.facilityId
    });

    return NextResponse.json(responsesWithHospitalData);
  } catch (error) {
    console.error('Error fetching emergency responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/emergencies/[id]/responses - Create emergency response
export async function POST(
  request: NextRequest,
  { params }: RouteParams
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
    const { id } = await params;

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
      where: { id },
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
        emergencyId: id,
        hospitalId: data.hospitalId,
        ambulanceId: data.ambulanceId,
        staffDeployed: {
          connect: data.staffDeployed.map(staffId => ({ id: staffId }))
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
      }
    });

    if (data.ambulanceId) {
      await prisma.ambulance.update({
        where: { id: data.ambulanceId },
        data: { status: 'DISPATCHED' }
      });
    }

    queueAuditLog({
      action: AuditAction.CREATE,
      entityType: 'EMERGENCY_RESPONSE',
      entityId: response.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Created emergency response for ${emergency.emergencyNumber} - Hospital: ${hospital.name}, Staff: ${data.staffDeployed.length}, Equipment: ${data.equipmentDeployed?.length || 0}`,
      facilityId: user.facilityId
    });

    const responseWithHospital = {
      ...response,
      hospital: {
        id: hospital.id,
        name: hospital.name,
        level: hospital.level
      }
    };

    return NextResponse.json(responseWithHospital, { status: 201 });
  } catch (error) {
    console.error('Error creating emergency response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}