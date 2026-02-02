import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// Import the enum type from Prisma if needed
// import { DepartmentType } from '@prisma/client'

// Global department definitions with proper enum types
const GLOBAL_EMERGENCY_DEPTS = [
  { 
    id: 'global-emergency', 
    name: 'Emergency Department', 
    type: 'ACCIDENT_EMERGENCY' as const, // Cast to const literal
    defaultBeds: 50 
  },
  { 
    id: 'global-icu', 
    name: 'Intensive Care Unit (ICU)', 
    type: 'ICU' as const, 
    defaultBeds: 10 
  },
  { 
    id: 'general-ward', 
    name: 'General Ward', 
    type: 'GENERAL_WARD' as const, 
    defaultBeds: 100 
  },
  { 
    id: 'maternity', 
    name: 'Maternity Ward', 
    type: 'MATERNITY' as const, 
    defaultBeds: 30 
  },
  { 
    id: 'pediatrics', 
    name: 'Pediatric Ward', 
    type: 'PEDIATRICS' as const, 
    defaultBeds: 40 
  },
  { 
    id: 'surgery', 
    name: 'Surgical Ward', 
    type: 'SURGERY' as const, 
    defaultBeds: 60 
  },
  { 
    id: 'orthopedics', 
    name: 'Orthopedic Ward', 
    type: 'ORTHOPEDICS' as const, 
    defaultBeds: 40 
  },
  { 
    id: 'outpatient', 
    name: 'Outpatient Department', 
    type: 'OUTPATIENT' as const, 
    defaultBeds: 0 
  },
  { 
    id: 'radiology', 
    name: 'Radiology Department', 
    type: 'RADIOLOGY' as const, 
    defaultBeds: 0 
  },
  { 
    id: 'laboratory', 
    name: 'Laboratory', 
    type: 'LABORATORY' as const, 
    defaultBeds: 0 
  },
  { 
    id: 'pharmacy', 
    name: 'Pharmacy', 
    type: 'PHARMACY' as const, 
    defaultBeds: 0 
  }
]

// Helper function to validate department type
function isValidDepartmentType(type: string): type is DepartmentType {
  const validTypes: string[] = [
    'ACCIDENT_EMERGENCY', 'ICU', 'HDU', 'GENERAL_WARD', 'MATERNITY', 
    'PEDIATRICS', 'SURGERY', 'TRAUMA', 'CARDIOLOGY', 'NEUROLOGY', 
    'ONCOLOGY', 'ORTHOPEDICS', 'RADIOLOGY', 'LABORATORY', 'PHARMACY', 
    'MORTUARY', 'OUTPATIENT', 'DIALYSIS', 'OTHER'
  ]
  return validTypes.includes(type)
}

// Type guard for DepartmentType
type DepartmentType = 
  | 'ACCIDENT_EMERGENCY' | 'ICU' | 'HDU' | 'GENERAL_WARD' | 'MATERNITY'
  | 'PEDIATRICS' | 'SURGERY' | 'TRAUMA' | 'CARDIOLOGY' | 'NEUROLOGY'
  | 'ONCOLOGY' | 'ORTHOPEDICS' | 'RADIOLOGY' | 'LABORATORY' | 'PHARMACY'
  | 'MORTUARY' | 'OUTPATIENT' | 'DIALYSIS' | 'OTHER'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')

    if (!hospitalId) {
      return NextResponse.json(
        { error: 'Hospital ID is required' },
        { status: 400 }
      )
    }

    // Check if hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    // First, get existing departments
    let departments = await prisma.department.findMany({
      where: {
        hospitalId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        availableBeds: true,
        totalBeds: true,
        isAcceptingPatients: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // If no departments exist, create default ones
    if (departments.length === 0) {
      console.log(`Creating default departments for hospital: ${hospital.name}`)
      
      // Create all departments one by one to handle errors gracefully
      for (const dept of GLOBAL_EMERGENCY_DEPTS) {
        try {
          await prisma.department.create({
            data: {
              name: dept.name,
              type: dept.type, // This is now properly typed
              hospitalId,
              totalBeds: dept.defaultBeds,
              availableBeds: dept.defaultBeds,
              occupancyRate: 0,
              isActive: true,
              isAcceptingPatients: dept.type !== 'RADIOLOGY' && dept.type !== 'LABORATORY' && dept.type !== 'PHARMACY'
            }
          })
        } catch (error) {
          console.error(`Failed to create department ${dept.name}:`, error)
          // Continue with other departments
        }
      }

      // Fetch the newly created departments
      departments = await prisma.department.findMany({
        where: { hospitalId },
        select: {
          id: true,
          name: true,
          type: true,
          availableBeds: true,
          totalBeds: true,
          isAcceptingPatients: true
        },
        orderBy: { name: 'asc' }
      })
    }

    // Always ensure at least emergency department exists
    const hasEmergencyDept = departments.some(dept => dept.type === 'ACCIDENT_EMERGENCY')
    
    if (!hasEmergencyDept) {
      console.log(`Creating missing emergency department for hospital: ${hospital.name}`)
      
      try {
        const emergencyDept = await prisma.department.create({
          data: {
            name: 'Emergency Department',
            type: 'ACCIDENT_EMERGENCY', // Proper enum value
            hospitalId,
            totalBeds: 50,
            availableBeds: 45,
            occupancyRate: 10,
            isActive: true,
            isAcceptingPatients: true
          }
        })

        departments.push({
          id: emergencyDept.id,
          name: emergencyDept.name,
          type: emergencyDept.type,
          availableBeds: emergencyDept.availableBeds,
          totalBeds: emergencyDept.totalBeds,
          isAcceptingPatients: emergencyDept.isAcceptingPatients
        })

        departments.sort((a, b) => a.name.localeCompare(b.name))
      } catch (error) {
        console.error('Failed to create emergency department:', error)
      }
    }

    return NextResponse.json({
      success: true,
      hospital: {
        id: hospital.id,
        name: hospital.name,
        code: hospital.code
      },
      departments
    })

  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to create a new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hospitalId, name, type, totalBeds, availableBeds, isAcceptingPatients } = body

    // Validate required fields
    if (!hospitalId || !name || !type) {
      return NextResponse.json(
        { error: 'Hospital ID, name, and type are required' },
        { status: 400 }
      )
    }

    // Validate department type
    if (!isValidDepartmentType(type)) {
      return NextResponse.json(
        { error: 'Invalid department type' },
        { status: 400 }
      )
    }

    // Validate hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    // Check if department already exists
    const existingDept = await prisma.department.findFirst({
      where: {
        hospitalId,
        name,
        type: type as DepartmentType // Cast to DepartmentType
      }
    })

    if (existingDept) {
      return NextResponse.json(
        { error: 'Department with this name and type already exists in this hospital' },
        { status: 409 }
      )
    }

    const department = await prisma.department.create({
      data: {
        hospitalId,
        name,
        type: type as DepartmentType, // Cast to DepartmentType
        totalBeds: totalBeds || 20,
        availableBeds: availableBeds || totalBeds || 20,
        occupancyRate: 0,
        isActive: true,
        isAcceptingPatients: isAcceptingPatients !== undefined ? isAcceptingPatients : true
      },
      select: {
        id: true,
        name: true,
        type: true,
        totalBeds: true,
        availableBeds: true,
        isAcceptingPatients: true
      }
    })

    return NextResponse.json({
      success: true,
      department,
      message: 'Department created successfully'
    })

  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Alternative: If you want to use Prisma's actual enum type, you can do:
// First, update your imports at the top:
// import { PrismaClient, DepartmentType } from '@prisma/client'
// Then use the imported enum type directly