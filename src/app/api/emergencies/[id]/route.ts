import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { verifyAndGetUser, hasPermission, canAccessModule } from '@/app/lib/auth';
import { queueAuditLog, AuditAction } from '@/app/lib/audit';
import { Prisma } from '@prisma/client';

const updateEmergencySchema = z.object({
  type: z.enum(['MEDICAL', 'TRAUMA', 'OBSTETRIC', 'PEDIATRIC', 'CARDIAC', 'STROKE', 'RESPIRATORY', 'MASS_CASUALTY', 'NATURAL_DISASTER', 'TRAFFIC_ACCIDENT', 'FIRE', 'DROWNING', 'POISONING', 'ASSAULT', 'OTHER']).optional(),
  severity: z.enum(['MINOR', 'MODERATE', 'SEVERE', 'MAJOR', 'CATASTROPHIC']).optional(),
  location: z.string().min(1).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  description: z.string().min(1).optional(),
  cause: z.string().optional(),
  estimatedCasualties: z.number().int().positive().optional(),
  confirmedCasualties: z.number().int().positive().optional(),
  injuredCount: z.number().int().positive().optional(),
  criticalCount: z.number().int().positive().optional(),
  deaths: z.number().int().positive().optional(),
  minorInjuries: z.number().int().positive().optional(),
  status: z.enum(['REPORTED', 'CONFIRMED', 'RESPONDING', 'ON_SCENE', 'UNDER_CONTROL', 'RESOLVED', 'ARCHIVED']).optional(),
  incidentCommander: z.string().optional(),
  incidentCommanderPhone: z.string().optional(),
  commandCenterLocation: z.string().optional(),
  commandCenterCoordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  policeNotified: z.boolean().optional(),
  fireServiceNotified: z.boolean().optional(),
  redCrossNotified: z.boolean().optional(),
  militaryInvolved: z.boolean().optional(),
  mediaAlertIssued: z.boolean().optional(),
  publicAnnouncement: z.string().optional(),
  resolvedAt: z.string().datetime().optional()
});

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/emergencies/[id] - Get specific emergency
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

    // Fetch emergency
    const emergency = await prisma.emergency.findUnique({
      where: { id },
      include: {
        county: {
          select: {
            id: true,
            name: true,
            code: true,
            governorName: true,
            healthCECName: true,
            countyHealthDirector: true
          }
        },
        responses: {
          include: {
            ambulance: {
              select: {
                id: true,
                registrationNumber: true,
                type: true,
                equipmentLevel: true
              }
            },
            staffDeployed: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                specialization: true
              }
            }
          }
        },
        patients: {
          include: {
            triageEntries: {
              orderBy: {
                arrivalTime: 'desc'
              },
              take: 1
            }
          }
        },
        affectedHospitals: {
          select: {
            id: true,
            name: true,
            level: true,
            availableBeds: true,
            availableIcuBeds: true
          }
        }
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

    // Fetch hospital data for responses separately
    const responsesWithHospitalData = await Promise.all(
      emergency.responses.map(async (response) => {
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

    const emergencyWithHospitalData = {
      ...emergency,
      responses: responsesWithHospitalData
    };

    queueAuditLog({
      action: AuditAction.READ,
      entityType: 'EMERGENCY',
      entityId: emergency.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Viewed emergency ${emergency.emergencyNumber}`,
      facilityId: user.facilityId
    });

    return NextResponse.json(emergencyWithHospitalData);
  } catch (error) {
    console.error('Error fetching emergency:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/emergencies/[id] - Update emergency
export async function PATCH(
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

    if (!hasPermission(user, 'emergencies.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Await the params
    const { id } = await params;

    const body = await request.json();
    const validation = updateEmergencySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingEmergency = await prisma.emergency.findUnique({
      where: { id }
    });

    if (!existingEmergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    // Verify access permissions based on role and county
    if (user.role === 'COUNTY_ADMIN' && existingEmergency.countyId !== user.countyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findUnique({
        where: { id: user.facilityId || '' }
      });
      if (hospital?.countyId !== existingEmergency.countyId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Build update data with proper typing
    const updateData: Prisma.EmergencyUpdateInput = {};
    const changedFields: string[] = [];
    
    if (data.type !== undefined) { 
      updateData.type = data.type; 
      changedFields.push('type');
    }
    if (data.severity !== undefined) { 
      updateData.severity = data.severity; 
      changedFields.push('severity');
    }
    if (data.location !== undefined) { 
      updateData.location = data.location; 
      changedFields.push('location');
    }
    if (data.description !== undefined) { 
      updateData.description = data.description; 
      changedFields.push('description');
    }
    if (data.cause !== undefined) { 
      updateData.cause = data.cause; 
      changedFields.push('cause');
    }
    if (data.estimatedCasualties !== undefined) { 
      updateData.estimatedCasualties = data.estimatedCasualties; 
      changedFields.push('estimatedCasualties');
    }
    if (data.confirmedCasualties !== undefined) { 
      updateData.confirmedCasualties = data.confirmedCasualties; 
      changedFields.push('confirmedCasualties');
    }
    if (data.injuredCount !== undefined) { 
      updateData.injuredCount = data.injuredCount; 
      changedFields.push('injuredCount');
    }
    if (data.criticalCount !== undefined) { 
      updateData.criticalCount = data.criticalCount; 
      changedFields.push('criticalCount');
    }
    if (data.deaths !== undefined) { 
      updateData.deaths = data.deaths; 
      changedFields.push('deaths');
    }
    if (data.minorInjuries !== undefined) { 
      updateData.minorInjuries = data.minorInjuries; 
      changedFields.push('minorInjuries');
    }
    if (data.incidentCommander !== undefined) { 
      updateData.incidentCommander = data.incidentCommander; 
      changedFields.push('incidentCommander');
    }
    if (data.incidentCommanderPhone !== undefined) { 
      updateData.incidentCommanderPhone = data.incidentCommanderPhone; 
      changedFields.push('incidentCommanderPhone');
    }
    if (data.commandCenterLocation !== undefined) { 
      updateData.commandCenterLocation = data.commandCenterLocation; 
      changedFields.push('commandCenterLocation');
    }
    if (data.policeNotified !== undefined) { 
      updateData.policeNotified = data.policeNotified; 
      changedFields.push('policeNotified');
    }
    if (data.fireServiceNotified !== undefined) { 
      updateData.fireServiceNotified = data.fireServiceNotified; 
      changedFields.push('fireServiceNotified');
    }
    if (data.redCrossNotified !== undefined) { 
      updateData.redCrossNotified = data.redCrossNotified; 
      changedFields.push('redCrossNotified');
    }
    if (data.militaryInvolved !== undefined) { 
      updateData.militaryInvolved = data.militaryInvolved; 
      changedFields.push('militaryInvolved');
    }
    if (data.mediaAlertIssued !== undefined) { 
      updateData.mediaAlertIssued = data.mediaAlertIssued; 
      changedFields.push('mediaAlertIssued');
    }
    if (data.publicAnnouncement !== undefined) { 
      updateData.publicAnnouncement = data.publicAnnouncement; 
      changedFields.push('publicAnnouncement');
    }
    
    if (data.coordinates !== undefined) {
      updateData.coordinates = data.coordinates ? data.coordinates : Prisma.JsonNull;
      changedFields.push('coordinates');
    }
    
    if (data.commandCenterCoordinates !== undefined) {
      updateData.commandCenterCoordinates = data.commandCenterCoordinates ? data.commandCenterCoordinates : Prisma.JsonNull;
      changedFields.push('commandCenterCoordinates');
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
      changedFields.push('status');
      
      if (data.status === 'RESOLVED' && !data.resolvedAt) {
        updateData.resolvedAt = new Date();
        changedFields.push('resolvedAt');
      } else if (data.resolvedAt !== undefined) {
        updateData.resolvedAt = new Date(data.resolvedAt);
        changedFields.push('resolvedAt');
      }
    }

    const emergency = await prisma.emergency.update({
      where: { id },
      data: updateData,
      include: {
        county: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    queueAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'EMERGENCY',
      entityId: emergency.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Updated emergency ${emergency.emergencyNumber} - Status: ${existingEmergency.status} → ${emergency.status}, Updated fields: ${changedFields.join(', ')}`,
      facilityId: user.facilityId
    });

    return NextResponse.json(emergency);
  } catch (error) {
    console.error('Error updating emergency:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/emergencies/[id] - Delete emergency (archive)
export async function DELETE(
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

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Await the params
    const { id } = await params;

    const emergency = await prisma.emergency.findUnique({
      where: { id }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    const archivedEmergency = await prisma.emergency.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        resolvedAt: new Date()
      }
    });

    queueAuditLog({
      action: AuditAction.DELETE,
      entityType: 'EMERGENCY',
      entityId: archivedEmergency.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Archived emergency ${archivedEmergency.emergencyNumber} - Previous status: ${emergency.status}`,
      facilityId: user.facilityId
    });

    return NextResponse.json({ message: 'Emergency archived successfully' });
  } catch (error) {
    console.error('Error archiving emergency:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}