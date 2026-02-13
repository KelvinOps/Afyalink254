import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth-options';
import { auditLog } from '@/app/lib/audit';
import { createUserObject, hasPermission, canAccessModule } from '@/app/lib/auth';
import { Prisma } from '@prisma/client';

const createEmergencySchema = z.object({
  type: z.enum(['MEDICAL', 'TRAUMA', 'OBSTETRIC', 'PEDIATRIC', 'CARDIAC', 'STROKE', 'RESPIRATORY', 'MASS_CASUALTY', 'NATURAL_DISASTER', 'TRAFFIC_ACCIDENT', 'FIRE', 'DROWNING', 'POISONING', 'ASSAULT', 'OTHER']),
  severity: z.enum(['MINOR', 'MODERATE', 'SEVERE', 'MAJOR', 'CATASTROPHIC']),
  countyId: z.string().cuid(),
  location: z.string().min(1),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  description: z.string().min(1),
  cause: z.string().optional(),
  estimatedCasualties: z.number().int().positive().optional(),
  reportedBy: z.string().optional(),
  reporterPhone: z.string().optional()
});

const updateEmergencySchema = z.object({
  type: z.enum(['MEDICAL', 'TRAUMA', 'OBSTETRIC', 'PEDIATRIC', 'CARDIAC', 'STROKE', 'RESPIRATORY', 'MASS_CASUALTY', 'NATURAL_DISASTER', 'TRAFFIC_ACCIDENT', 'FIRE', 'DROWNING', 'POISONING', 'ASSAULT', 'OTHER']).optional(),
  severity: z.enum(['MINOR', 'MODERATE', 'SEVERE', 'MAJOR', 'CATASTROPHIC']).optional(),
  countyId: z.string().cuid().optional(),
  location: z.string().min(1).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  description: z.string().min(1).optional(),
  cause: z.string().optional(),
  estimatedCasualties: z.number().int().positive().optional(),
  reportedBy: z.string().optional(),
  reporterPhone: z.string().optional(),
  status: z.enum(['REPORTED', 'CONFIRMED', 'RESPONDING', 'ON_SCENE', 'UNDER_CONTROL', 'RESOLVED', 'ARCHIVED']).optional()
});

// Type for emergency with included relations (used in notifications)
interface EmergencyWithCounty {
  id: string
  emergencyNumber: string
  type: string
  severity: string
  location: string
  countyId: string
  county: {
    name: string
    governorName: string | null
    healthCECName: string | null
  }
}

// GET /api/emergencies - List emergencies with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserObject(session.user);

    if (!canAccessModule(user, 'emergencies')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const countyId = searchParams.get('countyId');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');

    const skip = (page - 1) * limit;

    const where: Prisma.EmergencyWhereInput = {};

    if (status) where.status = status as Prisma.EmergencyWhereInput['status'];
    if (countyId) where.countyId = countyId;
    if (type) where.type = type as Prisma.EmergencyWhereInput['type'];
    if (severity) where.severity = severity as Prisma.EmergencyWhereInput['severity'];

    if (user.role === 'COUNTY_ADMIN') {
      where.countyId = user.countyId;
    } else if (user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findUnique({
        where: { id: user.facilityId }
      });
      if (hospital?.countyId) {
        where.countyId = hospital.countyId;
      } else {
        return NextResponse.json({ error: 'Hospital not found or not assigned to county' }, { status: 403 });
      }
    }

    const [emergencies, total] = await Promise.all([
      prisma.emergency.findMany({
        where,
        include: {
          county: {
            select: {
              name: true,
              code: true
            }
          },
          responses: {
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
          },
          _count: {
            select: {
              patients: true,
              responses: true
            }
          }
        },
        orderBy: {
          reportedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.emergency.count({ where })
    ]);

    await auditLog({
      action: 'READ',
      entityType: 'EMERGENCY',
      entityId: 'LIST',
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Viewed emergencies list with filters`,
      facilityId: user.facilityId,
      success: true
    });

    return NextResponse.json({
      emergencies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = createUserObject(session.user);
      await auditLog({
        action: 'READ',
        entityType: 'EMERGENCY',
        entityId: 'LIST',
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        description: `Failed to view emergencies list`,
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

// POST /api/emergencies - Create new emergency
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserObject(session.user);

    if (!hasPermission(user, 'emergencies.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Received emergency creation request:', body);

    const validation = createEmergencySchema.safeParse(body);

    if (!validation.success) {
      console.error('Validation error:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const county = await prisma.county.findUnique({
      where: { id: data.countyId }
    });

    if (!county) {
      return NextResponse.json({ error: 'County not found' }, { status: 404 });
    }

    if (user.role === 'COUNTY_ADMIN' && data.countyId !== user.countyId) {
      return NextResponse.json({ error: 'Access denied - can only create emergencies in your county' }, { status: 403 });
    }

    if (user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findUnique({
        where: { id: user.facilityId }
      });
      if (hospital?.countyId !== data.countyId) {
        return NextResponse.json({ error: 'Access denied - can only create emergencies in your hospital county' }, { status: 403 });
      }
    }

    const emergencyNumber = `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();

    // Create coordinates data properly
    const coordinatesData = data.coordinates ? data.coordinates : Prisma.JsonNull;

    console.log('Creating emergency with data:', {
      emergencyNumber,
      ...data,
      coordinates: data.coordinates || null,
      status: 'REPORTED',
      reportedAt: new Date()
    });

    const emergency = await prisma.emergency.create({
      data: {
        emergencyNumber,
        type: data.type,
        severity: data.severity,
        countyId: data.countyId,
        location: data.location,
        coordinates: coordinatesData,
        description: data.description,
        cause: data.cause || null,
        estimatedCasualties: data.estimatedCasualties || null,
        reportedBy: data.reportedBy || null,
        reporterPhone: data.reporterPhone || null,
        status: 'REPORTED',
        reportedAt: new Date()
      },
      include: {
        county: {
          select: {
            name: true,
            governorName: true,
            healthCECName: true
          }
        }
      }
    });

    console.log('Emergency created successfully:', emergency);

    await auditLog({
      action: 'CREATE',
      entityType: 'EMERGENCY',
      entityId: emergency.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Created emergency ${emergencyNumber}`,
      changes: {
        type: emergency.type,
        severity: emergency.severity,
        location: emergency.location,
        county: county.name
      },
      facilityId: user.facilityId,
      success: true
    });

    await triggerEmergencyNotifications(emergency as EmergencyWithCounty);

    return NextResponse.json(emergency, { status: 201 });
  } catch (error) {
    console.error('Error creating emergency:', error);
    
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = createUserObject(session.user);
      await auditLog({
        action: 'CREATE',
        entityType: 'EMERGENCY',
        entityId: 'NEW',
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        description: `Failed to create emergency`,
        facilityId: user.facilityId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/emergencies - Bulk update emergencies
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserObject(session.user);

    if (!hasPermission(user, 'emergencies.write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validation = z.object({
      ids: z.array(z.string().cuid()),
      data: updateEmergencySchema
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { ids, data } = validation.data;

    const emergencies = await prisma.emergency.findMany({
      where: { id: { in: ids } }
    });

    if (emergencies.length !== ids.length) {
      return NextResponse.json({ error: 'One or more emergencies not found' }, { status: 404 });
    }

    if (user.role === 'COUNTY_ADMIN') {
      const unauthorized = emergencies.some(emergency => emergency.countyId !== user.countyId);
      if (unauthorized) {
        return NextResponse.json({ error: 'Access denied to one or more emergencies' }, { status: 403 });
      }
    }

    if (user.role === 'HOSPITAL_ADMIN') {
      const hospital = await prisma.hospital.findUnique({
        where: { id: user.facilityId }
      });
      const unauthorized = emergencies.some(emergency => emergency.countyId !== hospital?.countyId);
      if (unauthorized) {
        return NextResponse.json({ error: 'Access denied to one or more emergencies' }, { status: 403 });
      }
    }

    // Build update data properly
    const updateData: Prisma.EmergencyUpdateInput = {};
    
    // Handle optional fields
    if (data.type !== undefined) updateData.type = data.type;
    if (data.severity !== undefined) updateData.severity = data.severity;
    
    // Fix: Use relation update for countyId
    if (data.countyId !== undefined) {
      updateData.county = {
        connect: { id: data.countyId }
      };
    }
    
    if (data.location !== undefined) updateData.location = data.location;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.cause !== undefined) updateData.cause = data.cause;
    if (data.estimatedCasualties !== undefined) updateData.estimatedCasualties = data.estimatedCasualties;
    if (data.reportedBy !== undefined) updateData.reportedBy = data.reportedBy;
    if (data.reporterPhone !== undefined) updateData.reporterPhone = data.reporterPhone;
    
    // Handle coordinates separately
    if (data.coordinates !== undefined) {
      updateData.coordinates = data.coordinates ? data.coordinates : Prisma.JsonNull;
    }

    // Handle status separately
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
    }

    const updatedEmergencies = await prisma.emergency.updateMany({
      where: { id: { in: ids } },
      data: updateData
    });

    await auditLog({
      action: 'UPDATE',
      entityType: 'EMERGENCY',
      entityId: 'BULK',
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Bulk updated ${updatedEmergencies.count} emergencies`,
      changes: {
        updatedFields: Object.keys(data),
        affectedCount: updatedEmergencies.count
      },
      facilityId: user.facilityId,
      success: true
    });

    return NextResponse.json({ 
      message: `Successfully updated ${updatedEmergencies.count} emergencies`,
      count: updatedEmergencies.count 
    });
  } catch (error) {
    console.error('Error bulk updating emergencies:', error);
    
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = createUserObject(session.user);
      await auditLog({
        action: 'UPDATE',
        entityType: 'EMERGENCY',
        entityId: 'BULK',
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        description: `Failed to bulk update emergencies`,
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

async function triggerEmergencyNotifications(emergency: EmergencyWithCounty) {
  try {
    console.log(`Emergency ${emergency.emergencyNumber} created - triggering notifications`);
    
    const hospitals = await prisma.hospital.findMany({
      where: { 
        countyId: emergency.countyId,
        isActive: true,
        acceptingPatients: true
      },
      select: {
        id: true,
        name: true,
        level: true
      }
    });

    for (const hospital of hospitals) {
      await prisma.systemAlert.create({
        data: {
          alertNumber: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          alertType: 'EMERGENCY_DECLARED',
          severity: 'CRITICAL',
          title: `New Emergency: ${emergency.type}`,
          message: `Emergency ${emergency.emergencyNumber} reported in ${emergency.location}. Severity: ${emergency.severity}.`,
          sourceType: 'EMERGENCY',
          sourceId: emergency.id,
          hospitalId: hospital.id,
          audienceType: 'SPECIFIC_HOSPITAL',
          targetRoles: ['HOSPITAL_ADMIN', 'DISPATCHER', 'DOCTOR'],
          requiresAction: true,
          priority: 1
        }
      });
    }

    const dispatchCenters = await prisma.dispatchCenter.findMany({
      where: { 
        countyId: emergency.countyId,
        isActive: true
      }
    });

    for (let i = 0; i < dispatchCenters.length; i++) {
      await prisma.systemAlert.create({
        data: {
          alertNumber: `DISPATCH-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          alertType: 'EMERGENCY_DECLARED',
          severity: 'CRITICAL',
          title: `Emergency Dispatch Required`,
          message: `Emergency ${emergency.emergencyNumber} requires ambulance dispatch. Location: ${emergency.location}`,
          sourceType: 'EMERGENCY',
          sourceId: emergency.id,
          audienceType: 'ALL_DISPATCHERS',
          targetRoles: ['DISPATCHER'],
          requiresAction: true,
          priority: 1
        }
      });
    }

    console.log(`Notifications triggered for ${hospitals.length} hospitals and ${dispatchCenters.length} dispatch centers`);
  } catch (error) {
    console.error('Error triggering emergency notifications:', error);
  }
}