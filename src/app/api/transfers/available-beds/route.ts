import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth-options';
import { createUserObject } from '@/app/lib/auth';
import { ResourceType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create user object with proper permissions
    const user = createUserObject(session.user);

    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId');
    const department = searchParams.get('department');
    const resourceTypeParam = searchParams.get('resourceType') || 'BED';
    
    // Validate that the resource type is valid
    const validResourceTypes = Object.values(ResourceType);
    const resourceType = validResourceTypes.includes(resourceTypeParam as ResourceType) 
      ? (resourceTypeParam as ResourceType) 
      : ResourceType.BED;

    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital ID is required' }, { status: 400 });
    }

    // Check if user has access to this hospital
    if (user.role === 'HOSPITAL_ADMIN' && user.facilityId !== hospitalId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get available beds and resources
    const [beds, resources] = await Promise.all([
      // Get hospital bed capacity
      prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: {
          id: true,
          name: true,
          availableBeds: true,
          availableIcuBeds: true,
          availableEmergencyBeds: true,
          totalBeds: true,
          icuBeds: true,
          emergencyBeds: true,
        },
      }),

      // Get specific resources
      prisma.resource.findMany({
        where: {
          hospitalId,
          type: resourceType,
          status: 'AVAILABLE',
          ...(department && { departmentId: department }),
        },
        select: {
          id: true,
          name: true,
          type: true,
          availableCapacity: true,
          totalCapacity: true,
          department: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
    ]);

    if (!beds) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json({
      hospital: {
        id: beds.id,
        name: beds.name,
        bedAvailability: {
          general: {
            available: beds.availableBeds,
            total: beds.totalBeds,
            occupancy: beds.totalBeds > 0 ? ((beds.totalBeds - beds.availableBeds) / beds.totalBeds) * 100 : 0,
          },
          icu: {
            available: beds.availableIcuBeds,
            total: beds.icuBeds,
            occupancy: beds.icuBeds > 0 ? ((beds.icuBeds - beds.availableIcuBeds) / beds.icuBeds) * 100 : 0,
          },
          emergency: {
            available: beds.availableEmergencyBeds,
            total: beds.emergencyBeds,
            occupancy: beds.emergencyBeds > 0 ? ((beds.emergencyBeds - beds.availableEmergencyBeds) / beds.emergencyBeds) * 100 : 0,
          },
        },
      },
      resources,
    });
  } catch (error) {
    console.error('Error fetching available beds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}