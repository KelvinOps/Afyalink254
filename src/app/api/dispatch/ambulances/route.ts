// app/api/dispatch/ambulances/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { Prisma, AmbulanceStatus, AmbulanceType, EquipmentLevel } from '@prisma/client'

interface WhereClause {
  status?: AmbulanceStatus
  type?: AmbulanceType
  hospitalId?: string | { in: string[] }
  countyId?: string
}

interface CreateAmbulanceBody {
  ambulanceType?: 'HOSPITAL' | 'COUNTY'
  registrationNumber: string
  type: AmbulanceType
  equipmentLevel: EquipmentLevel
  status?: AmbulanceStatus
  hospitalId?: string
  countyId?: string
  hasGPS?: boolean
  hasRadio?: boolean
  hasOxygen?: boolean
  hasDefibrillator?: boolean
  hasVentilator?: boolean
  hasMonitor?: boolean
  driverName?: string
  driverPhone?: string
  driverLicense?: string
  paramedicName?: string
  paramedicLicense?: string
  crewSize?: number
  lastServiceDate?: string
  nextServiceDate?: string
  mileage?: number
  fuelLevel?: number
  odometerReading?: number
  isOperational?: boolean
  currentLocation?: Prisma.JsonValue
  lastKnownLocation?: Prisma.JsonValue
  baseStation?: string
  baseCoordinates?: Prisma.JsonValue
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const typeParam = searchParams.get('type')
    const includeCounty = searchParams.get('includeCounty') === 'true'
    const hospitalId = searchParams.get('hospitalId')
    const countyId = searchParams.get('countyId')

    // Validate and convert status
    const validStatuses = Object.values(AmbulanceStatus)
    const status = statusParam && validStatuses.includes(statusParam as AmbulanceStatus) 
      ? (statusParam as AmbulanceStatus) 
      : null

    // Validate and convert type
    const validTypes = Object.values(AmbulanceType)
    const type = typeParam && validTypes.includes(typeParam as AmbulanceType) 
      ? (typeParam as AmbulanceType) 
      : null

    // Build query filters
    const whereHospitalAmbulance: WhereClause = {}
    const whereCountyAmbulance: WhereClause = {}
    
    // Apply filters if provided
    if (status) {
      whereHospitalAmbulance.status = status
      whereCountyAmbulance.status = status
    }
    if (type) {
      whereHospitalAmbulance.type = type
      whereCountyAmbulance.type = type
    }

    // Build hospital ambulance query based on user permissions
    if (user.facilityId && user.facilityType === 'HOSPITAL') {
      whereHospitalAmbulance.hospitalId = user.facilityId
    } else if (user.hospitalId) {
      whereHospitalAmbulance.hospitalId = user.hospitalId
    } else if (hospitalId && ['ADMIN', 'COUNTY_HEALTH_OFFICER'].includes(user.role)) {
      whereHospitalAmbulance.hospitalId = hospitalId
    } else if (countyId && ['ADMIN', 'COUNTY_HEALTH_OFFICER'].includes(user.role)) {
      // Get all hospitals in county, then their ambulances
      const hospitals = await prisma.hospital.findMany({
        where: { countyId },
        select: { id: true }
      })
      whereHospitalAmbulance.hospitalId = { in: hospitals.map(h => h.id) }
    }

    // Build county ambulance query based on user permissions
    if (user.countyId) {
      whereCountyAmbulance.countyId = user.countyId
    } else if (countyId && ['ADMIN', 'COUNTY_HEALTH_OFFICER'].includes(user.role)) {
      whereCountyAmbulance.countyId = countyId
    }

    // Fetch hospital ambulances
    const hospitalAmbulances = await prisma.ambulance.findMany({
      where: whereHospitalAmbulance,
      select: {
        id: true,
        registrationNumber: true,
        type: true,
        equipmentLevel: true,
        status: true,
        currentLocation: true,
        lastKnownLocation: true,
        driverName: true,
        driverPhone: true,
        paramedicName: true,
        crewSize: true,
        hasGPS: true,
        hasRadio: true,
        hasOxygen: true,
        hasDefibrillator: true,
        hasVentilator: true,
        hasMonitor: true,
        lastServiceDate: true,
        nextServiceDate: true,
        mileage: true,
        fuelLevel: true,
        odometerReading: true,
        isOperational: true,
        hospital: {
          select: {
            name: true,
            county: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { registrationNumber: 'asc' }
    })

    // Fetch county ambulances if requested and user has permission
    const countyAmbulances = includeCounty && (user.countyId || user.role === 'ADMIN' || user.role === 'COUNTY_HEALTH_OFFICER')
      ? await prisma.countyAmbulance.findMany({
          where: whereCountyAmbulance,
          select: {
            id: true,
            registrationNumber: true,
            type: true,
            equipmentLevel: true,
            status: true,
            currentLocation: true,
            lastKnownLocation: true,
            driverName: true,
            driverPhone: true,
            hasGPS: true,
            hasRadio: true,
            hasOxygen: true,
            hasDefibrillator: true,
            lastServiceDate: true,
            nextServiceDate: true,
            mileage: true,
            fuelLevel: true,
            isOperational: true,
            county: {
              select: {
                name: true
              }
            }
          },
          orderBy: { registrationNumber: 'asc' }
        })
      : []

    // Combine and format the results
    const formattedHospitalAmbulances = hospitalAmbulances.map(ambulance => ({
      ...ambulance,
      ambulanceType: 'HOSPITAL' as const,
      lastServiceDate: ambulance.lastServiceDate?.toISOString(),
      nextServiceDate: ambulance.nextServiceDate?.toISOString()
    }))

    const formattedCountyAmbulances = countyAmbulances.map(ambulance => ({
      ...ambulance,
      ambulanceType: 'COUNTY' as const,
      lastServiceDate: ambulance.lastServiceDate?.toISOString(),
      nextServiceDate: ambulance.nextServiceDate?.toISOString()
    }))

    const allAmbulances = [...formattedHospitalAmbulances, ...formattedCountyAmbulances]

    return NextResponse.json({ 
      ambulances: allAmbulances,
      stats: {
        total: allAmbulances.length,
        hospital: formattedHospitalAmbulances.length,
        county: formattedCountyAmbulances.length,
        available: allAmbulances.filter(a => a.status === 'AVAILABLE').length,
        dispatched: allAmbulances.filter(a => a.status === 'DISPATCHED').length,
        onDuty: allAmbulances.filter(a => ['DISPATCHED', 'ON_SCENE', 'TRANSPORTING'].includes(a.status)).length,
        maintenance: allAmbulances.filter(a => a.status === 'MAINTENANCE').length
      }
    })
  } catch (error) {
    console.error('Error fetching ambulances:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized - No Bearer token provided' 
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid or expired token' 
      }, { status: 401 })
    }

    console.log('Ambulance creation request from user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      countyId: user.countyId,
      facilityId: user.facilityId
    })

    // Check permissions - expanded role list for testing
    const allowedRoles = [
      'ADMIN', 
      'HOSPITAL_ADMIN', 
      'FACILITY_MANAGER', 
      'COUNTY_HEALTH_OFFICER',
      'DISPATCHER',
      'EMERGENCY_MANAGER',
      'MEDICAL_SUPERINTENDENT',
      'HOSPITAL_DIRECTOR'
    ]
    
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: {
          userRole: user.role,
          allowedRoles,
          message: 'You need appropriate permissions to create ambulances'
        }
      }, { status: 403 })
    }

    const body = await request.json() as CreateAmbulanceBody
    const { ambulanceType = 'HOSPITAL' } = body
    
    console.log('Creating ambulance with type:', ambulanceType, 'Data:', {
      registrationNumber: body.registrationNumber,
      type: body.type,
      equipmentLevel: body.equipmentLevel
    })
    
    // Validate required fields based on ambulance type
    const requiredFields = ['registrationNumber', 'type', 'equipmentLevel']
    const missingFields = requiredFields.filter(field => !body[field as keyof CreateAmbulanceBody])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      )
    }

    // Validate ambulance type values
    const validTypes = Object.values(AmbulanceType)
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid ambulance type',
          validTypes,
          provided: body.type
        },
        { status: 400 }
      )
    }

    // Validate equipment level
    const validEquipmentLevels = Object.values(EquipmentLevel)
    if (!validEquipmentLevels.includes(body.equipmentLevel)) {
      return NextResponse.json(
        { 
          error: 'Invalid equipment level',
          validEquipmentLevels,
          provided: body.equipmentLevel
        },
        { status: 400 }
      )
    }

    if (ambulanceType === 'HOSPITAL') {
      // Check for duplicate registration number
      const existing = await prisma.ambulance.findUnique({
        where: { registrationNumber: body.registrationNumber }
      })
      
      if (existing) {
        return NextResponse.json(
          { 
            error: 'Ambulance with this registration number already exists',
            existingId: existing.id
          },
          { status: 409 }
        )
      }

      // Determine hospital ID - try multiple sources
      let hospitalId = body.hospitalId || user.hospitalId || user.facilityId
      
      // For ADMIN users without hospitalId, try to get it from the request or use a default
      if (!hospitalId && user.role === 'ADMIN') {
        if (body.hospitalId) {
          hospitalId = body.hospitalId
        } else {
          // If admin doesn't specify, use first available hospital
          const firstHospital = await prisma.hospital.findFirst({
            select: { id: true }
          })
          if (firstHospital) {
            hospitalId = firstHospital.id
          }
        }
      }
      
      if (!hospitalId) {
        return NextResponse.json(
          { 
            error: 'Hospital ID required for creating hospital ambulance',
            details: {
              userHospitalId: user.hospitalId,
              userFacilityId: user.facilityId,
              bodyHospitalId: body.hospitalId,
              userRole: user.role,
              message: 'Please provide a hospitalId in the request or ensure your user account has a hospitalId'
            }
          },
          { status: 400 }
        )
      }

      // Verify hospital exists
      const hospitalExists = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { id: true, name: true }
      })

      if (!hospitalExists) {
        return NextResponse.json(
          { 
            error: 'Hospital not found',
            hospitalId
          },
          { status: 404 }
        )
      }

      // Validate and convert status
      const validStatuses = Object.values(AmbulanceStatus)
      const status = body.status && validStatuses.includes(body.status) 
        ? body.status 
        : AmbulanceStatus.AVAILABLE

      const ambulanceData: Prisma.AmbulanceUncheckedCreateInput = {
        registrationNumber: body.registrationNumber,
        type: body.type,
        equipmentLevel: body.equipmentLevel,
        status: status,
        hospitalId: hospitalId,
        hasGPS: body.hasGPS ?? false,
        hasRadio: body.hasRadio ?? true,
        hasOxygen: body.hasOxygen ?? true,
        hasDefibrillator: body.hasDefibrillator ?? false,
        hasVentilator: body.hasVentilator ?? false,
        hasMonitor: body.hasMonitor ?? false,
        driverName: body.driverName || null,
        driverPhone: body.driverPhone || null,
        driverLicense: body.driverLicense || null,
        paramedicName: body.paramedicName || null,
        paramedicLicense: body.paramedicLicense || null,
        crewSize: body.crewSize ?? 2,
        lastServiceDate: body.lastServiceDate ? new Date(body.lastServiceDate) : null,
        nextServiceDate: body.nextServiceDate ? new Date(body.nextServiceDate) : null,
        mileage: body.mileage || 0,
        fuelLevel: body.fuelLevel ?? 100,
        odometerReading: body.odometerReading || 0,
        isOperational: body.isOperational ?? true,
        currentLocation: body.currentLocation ?? undefined,
        lastKnownLocation: body.lastKnownLocation ?? undefined
      }

      console.log('Creating hospital ambulance with data:', {
        registrationNumber: ambulanceData.registrationNumber,
        hospitalId: ambulanceData.hospitalId,
        hospitalName: hospitalExists.name
      })

      const ambulance = await prisma.ambulance.create({
        data: ambulanceData,
        include: {
          hospital: {
            select: {
              name: true,
              county: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json({ 
        success: true,
        message: 'Hospital ambulance created successfully',
        ambulance: {
          ...ambulance,
          lastServiceDate: ambulance.lastServiceDate?.toISOString(),
          nextServiceDate: ambulance.nextServiceDate?.toISOString(),
          createdAt: ambulance.createdAt.toISOString(),
          updatedAt: ambulance.updatedAt.toISOString()
        },
        ambulanceType: 'HOSPITAL'
      }, { status: 201 })
    } else if (ambulanceType === 'COUNTY') {
      // Check for duplicate registration number
      const existing = await prisma.countyAmbulance.findUnique({
        where: { registrationNumber: body.registrationNumber }
      })
      
      if (existing) {
        return NextResponse.json(
          { 
            error: 'County ambulance with this registration number already exists',
            existingId: existing.id
          },
          { status: 409 }
        )
      }

      // Determine county ID
      let countyId = body.countyId || user.countyId
      
      // For ADMIN users without countyId, try to get it from the request or use a default
      if (!countyId && user.role === 'ADMIN') {
        if (body.countyId) {
          countyId = body.countyId
        } else {
          // If admin doesn't specify, use first available county
          const firstCounty = await prisma.county.findFirst({
            select: { id: true }
          })
          if (firstCounty) {
            countyId = firstCounty.id
          }
        }
      }
      
      if (!countyId) {
        return NextResponse.json(
          { 
            error: 'County ID required for creating county ambulance',
            details: {
              userCountyId: user.countyId,
              bodyCountyId: body.countyId,
              userRole: user.role,
              message: 'Please provide a countyId in the request or ensure your user account has a countyId'
            }
          },
          { status: 400 }
        )
      }

      // Verify county exists
      const countyExists = await prisma.county.findUnique({
        where: { id: countyId },
        select: { id: true, name: true }
      })

      if (!countyExists) {
        return NextResponse.json(
          { 
            error: 'County not found',
            countyId
          },
          { status: 404 }
        )
      }

      // Validate and convert status
      const validStatuses = Object.values(AmbulanceStatus)
      const status = body.status && validStatuses.includes(body.status) 
        ? body.status 
        : AmbulanceStatus.AVAILABLE

      const countyAmbulanceData: Prisma.CountyAmbulanceUncheckedCreateInput = {
        registrationNumber: body.registrationNumber,
        type: body.type,
        equipmentLevel: body.equipmentLevel,
        status: status,
        countyId: countyId,
        baseStation: body.baseStation || 'Main Station',
        baseCoordinates: body.baseCoordinates ?? undefined,
        hasGPS: body.hasGPS ?? false,
        hasRadio: body.hasRadio ?? true,
        hasOxygen: body.hasOxygen ?? true,
        hasDefibrillator: body.hasDefibrillator ?? false,
        driverName: body.driverName || null,
        driverPhone: body.driverPhone || null,
        driverLicense: body.driverLicense || null,
        lastServiceDate: body.lastServiceDate ? new Date(body.lastServiceDate) : null,
        nextServiceDate: body.nextServiceDate ? new Date(body.nextServiceDate) : null,
        mileage: body.mileage || 0,
        fuelLevel: body.fuelLevel ?? 100,
        isOperational: body.isOperational ?? true,
        currentLocation: body.currentLocation ?? undefined,
        lastKnownLocation: body.lastKnownLocation ?? undefined
      }

      console.log('Creating county ambulance with data:', {
        registrationNumber: countyAmbulanceData.registrationNumber,
        countyId: countyAmbulanceData.countyId,
        countyName: countyExists.name
      })

      const countyAmbulance = await prisma.countyAmbulance.create({
        data: countyAmbulanceData,
        include: {
          county: {
            select: {
              name: true
            }
          }
        }
      })

      return NextResponse.json({ 
        success: true,
        message: 'County ambulance created successfully',
        ambulance: {
          ...countyAmbulance,
          lastServiceDate: countyAmbulance.lastServiceDate?.toISOString(),
          nextServiceDate: countyAmbulance.nextServiceDate?.toISOString(),
          createdAt: countyAmbulance.createdAt.toISOString(),
          updatedAt: countyAmbulance.updatedAt.toISOString()
        },
        ambulanceType: 'COUNTY'
      }, { status: 201 })
    } else {
      return NextResponse.json(
        { 
          error: 'Invalid ambulance type',
          validTypes: ['HOSPITAL', 'COUNTY'],
          provided: ambulanceType
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating ambulance:', error)
    
    // Handle Prisma errors specifically
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { 
            error: 'Duplicate registration number',
            details: prismaError.meta
          },
          { status: 409 }
        )
      }
      
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { 
            error: 'Foreign key constraint failed',
            details: prismaError.meta
          },
          { status: 400 }
        )
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          stack: errorStack
        })
      },
      { status: 500 }
    )
  }
}