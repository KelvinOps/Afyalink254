import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';
import { auditLog, AuditAction } from '@/app/lib/audit'; // Fixed import
import { hasPermission, canAccessModule } from '@/app/lib/auth'; // Added canAccessModule

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

// GET /api/emergencies/[id] - Get specific emergency
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
            },
            hospital: {
              select: {
                id: true,
                name: true,
                level: true
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

    // Log the view action for sensitive emergency data
    await auditLog({
      action: AuditAction.READ,
      entityType: 'EMERGENCY',
      entityId: emergency.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Viewed emergency ${emergency.emergencyNumber}`,
      facilityId: session.user.facilityId,
      success: true
    });

    return NextResponse.json(emergency);
  } catch (error) {
    console.error('Error fetching emergency:', error);
    
    // Log failed access attempt
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await auditLog({
        action: AuditAction.READ,
        entityType: 'EMERGENCY',
        entityId: params.id,
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name,
        description: `Failed to view emergency ${params.id}`,
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

// PATCH /api/emergencies/[id] - Update emergency
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only users with emergencies.write can update emergencies
    if (!hasPermission(session.user, 'emergencies.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateEmergencySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if emergency exists and user has access
    const existingEmergency = await prisma.emergency.findUnique({
      where: { id: params.id }
    });

    if (!existingEmergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    // Verify access permissions based on role and county
    if (session.user.role === 'COUNTY_ADMIN' && existingEmergency.countyId !== session.user.countyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (session.user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findUnique({
        where: { id: session.user.facilityId }
      });
      if (hospital?.countyId !== existingEmergency.countyId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const updateData: any = { ...data };
    
    // Handle coordinate updates
    if (data.coordinates) {
      updateData.coordinates = JSON.stringify(data.coordinates);
    }
    
    if (data.commandCenterCoordinates) {
      updateData.commandCenterCoordinates = JSON.stringify(data.commandCenterCoordinates);
    }

    // Handle status transitions
    if (data.status === 'RESOLVED' && !data.resolvedAt) {
      updateData.resolvedAt = new Date().toISOString();
    }

    const emergency = await prisma.emergency.update({
      where: { id: params.id },
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

    // Log the action with detailed changes
    await auditLog({
      action: AuditAction.UPDATE,
      entityType: 'EMERGENCY',
      entityId: emergency.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Updated emergency ${emergency.emergencyNumber}`,
      changes: {
        previous: {
          status: existingEmergency.status,
          severity: existingEmergency.severity,
          location: existingEmergency.location
        },
        current: {
          status: emergency.status,
          severity: emergency.severity,
          location: emergency.location
        },
        updatedFields: Object.keys(data)
      },
      facilityId: session.user.facilityId,
      success: true
    });

    return NextResponse.json(emergency);
  } catch (error) {
    console.error('Error updating emergency:', error);
    
    // Log failed update attempt
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await auditLog({
        action: AuditAction.UPDATE,
        entityType: 'EMERGENCY',
        entityId: params.id,
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name,
        description: `Failed to update emergency ${params.id}`,
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

// DELETE /api/emergencies/[id] - Delete emergency (archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN can delete emergencies
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const emergency = await prisma.emergency.findUnique({
      where: { id: params.id }
    });

    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }

    // Instead of deleting, archive the emergency
    const archivedEmergency = await prisma.emergency.update({
      where: { id: params.id },
      data: {
        status: 'ARCHIVED',
        resolvedAt: new Date()
      }
    });

    // Log the action
    await auditLog({
      action: AuditAction.DELETE,
      entityType: 'EMERGENCY',
      entityId: archivedEmergency.id,
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      description: `Archived emergency ${archivedEmergency.emergencyNumber}`,
      changes: {
        previousStatus: emergency.status,
        newStatus: 'ARCHIVED',
        archivedAt: new Date().toISOString()
      },
      facilityId: session.user.facilityId,
      success: true
    });

    return NextResponse.json({ message: 'Emergency archived successfully' });
  } catch (error) {
    console.error('Error archiving emergency:', error);
    
    // Log failed archive attempt
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await auditLog({
        action: AuditAction.DELETE,
        entityType: 'EMERGENCY',
        entityId: params.id,
        userId: session.user.id,
        userRole: session.user.role,
        userName: session.user.name,
        description: `Failed to archive emergency ${params.id}`,
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