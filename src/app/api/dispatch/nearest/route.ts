//api/dispatch/nearest/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { EquipmentLevel, Prisma } from '@prisma/client'

// Define types for the ambulance objects
interface HospitalAmbulance {
  type: 'HOSPITAL'
  hospital: {
    name: string
  }
  id: string
  registrationNumber: string
  equipmentLevel: EquipmentLevel
  driverName: string | null
  driverPhone: string | null
  currentLocation: Prisma.JsonValue
  fuelLevel: number | null
}

interface CountyAmbulance {
  type: 'COUNTY'
  county: {
    name: string
  }
  id: string
  registrationNumber: string
  equipmentLevel: EquipmentLevel
  driverName: string | null
  driverPhone: string | null
  currentLocation: Prisma.JsonValue
  fuelLevel: number | null
}

type CombinedAmbulance = HospitalAmbulance | CountyAmbulance

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Helper function to parse coordinates from JSON value
function parseCoordinates(coordinates: Prisma.JsonValue): { lat: number; lng: number } | null {
  if (coordinates && typeof coordinates === 'object' && coordinates !== null) {
    const coords = coordinates as Record<string, unknown>
    if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      return { lat: coords.lat, lng: coords.lng }
    }
  }
  return null
}

// Helper function to check equipment based on emergency type
function hasRequiredEquipment(
  ambulance: CombinedAmbulance,
  emergencyType: string
): boolean {
  // Access equipmentLevel from the ambulance object
  const equipmentLevel = ambulance.equipmentLevel
  
  switch (emergencyType) {
    case 'CARDIAC':
      // Check if ambulance has defibrillator - you may need to adjust this logic
      // Based on your database schema, you might need to query additional fields
      // For now, we'll assume ADVANCED and CRITICAL_CARE have defibrillators
      return equipmentLevel === 'ADVANCED' || equipmentLevel === 'CRITICAL_CARE'
    case 'RESPIRATORY':
      // Check if ambulance has oxygen and ventilator
      // Adjust this based on your actual database fields
      // For now, we'll assume ADVANCED and CRITICAL_CARE have these
      return equipmentLevel === 'ADVANCED' || equipmentLevel === 'CRITICAL_CARE'
    case 'TRAUMA':
      return equipmentLevel === 'ADVANCED' || equipmentLevel === 'CRITICAL_CARE'
    default:
      return true
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { latitude, longitude, emergencyType, severity, requiredEquipment } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Coordinates are required' },
        { status: 400 }
      )
    }

    // Get all available ambulances
    const ambulances = await prisma.ambulance.findMany({
      where: {
        status: 'AVAILABLE',
        isOperational: true
      },
      select: {
        id: true,
        registrationNumber: true,
        type: true,
        equipmentLevel: true,
        currentLocation: true,
        driverName: true,
        driverPhone: true,
        fuelLevel: true,
        hospital: {
          select: {
            name: true
          }
        }
      }
    })

    // Get all available county ambulances
    const countyAmbulances = await prisma.countyAmbulance.findMany({
      where: {
        status: 'AVAILABLE',
        isOperational: true
      },
      select: {
        id: true,
        registrationNumber: true,
        type: true,
        equipmentLevel: true,
        currentLocation: true,
        driverName: true,
        driverPhone: true,
        fuelLevel: true,
        county: {
          select: {
            name: true
          }
        }
      }
    })

    // Combine all ambulances with proper typing
    const allAmbulances: CombinedAmbulance[] = [
      ...ambulances.map(a => ({ ...a, type: 'HOSPITAL' as const })),
      ...countyAmbulances.map(a => ({ ...a, type: 'COUNTY' as const }))
    ]

    // Filter by required equipment if specified
    let filteredAmbulances = allAmbulances

    if (requiredEquipment && emergencyType) {
      filteredAmbulances = filteredAmbulances.filter(ambulance => 
        hasRequiredEquipment(ambulance, emergencyType)
      )
    }

    // Filter by severity
    if (severity === 'CRITICAL') {
      filteredAmbulances = filteredAmbulances.filter(a => 
        a.equipmentLevel === 'ADVANCED' || a.equipmentLevel === 'CRITICAL_CARE'
      )
    }

    // Calculate distances and sort
    const ambulancesWithDistance = filteredAmbulances
      .map(ambulance => {
        const coordinates = parseCoordinates(ambulance.currentLocation)
        if (!coordinates) {
          return { ...ambulance, distance: Infinity }
        }

        const distance = calculateDistance(
          latitude,
          longitude,
          coordinates.lat,
          coordinates.lng
        )

        return { ...ambulance, distance }
      })
      .filter(ambulance => ambulance.distance !== Infinity && (ambulance.fuelLevel ?? 0) > 20) // Filter out low fuel
      .sort((a, b) => a.distance - b.distance)

    // Get nearest hospitals
    const hospitals = await prisma.hospital.findMany({
      where: {
        isActive: true,
        acceptingPatients: true,
        services: {
          has: 'EMERGENCY'
        }
      },
      select: {
        id: true,
        name: true,
        coordinates: true,
        availableEmergencyBeds: true,
        availableIcuBeds: true,
        services: true,
        specializations: true
      }
    })

    const hospitalsWithDistance = hospitals
      .map(hospital => {
        const coordinates = parseCoordinates(hospital.coordinates)
        if (!coordinates) {
          return { ...hospital, distance: Infinity }
        }

        const distance = calculateDistance(
          latitude,
          longitude,
          coordinates.lat,
          coordinates.lng
        )

        return { ...hospital, distance }
      })
      .filter(hospital => hospital.distance !== Infinity)
      .sort((a, b) => a.distance - b.distance)

    return NextResponse.json({
      nearestAmbulances: ambulancesWithDistance.slice(0, 5), // Top 5 nearest
      nearestHospitals: hospitalsWithDistance.slice(0, 3), // Top 3 nearest
      recommendedAmbulance: ambulancesWithDistance[0] || null,
      recommendedHospital: hospitalsWithDistance[0] || null
    })
  } catch (error) {
    console.error('Error finding nearest ambulances:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Coordinates are required' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    // Get nearest 10 ambulances
    const ambulances = await prisma.ambulance.findMany({
      where: {
        status: 'AVAILABLE',
        isOperational: true
      },
      select: {
        id: true,
        registrationNumber: true,
        type: true,
        equipmentLevel: true,
        currentLocation: true,
        driverName: true,
        driverPhone: true,
        fuelLevel: true,
        hospital: {
          select: {
            name: true,
            address: true
          }
        }
      },
      take: 10
    })

    const ambulancesWithDistance = ambulances
      .map(ambulance => {
        const coordinates = parseCoordinates(ambulance.currentLocation)
        if (!coordinates) {
          return { ...ambulance, distance: Infinity }
        }

        const distance = calculateDistance(
          latitude,
          longitude,
          coordinates.lat,
          coordinates.lng
        )

        return { ...ambulance, distance }
      })
      .filter(ambulance => ambulance.distance !== Infinity && (ambulance.fuelLevel ?? 0) > 20)
      .sort((a, b) => a.distance - b.distance)

    return NextResponse.json({
      ambulances: ambulancesWithDistance,
      count: ambulancesWithDistance.length,
      coordinates: { latitude, longitude }
    })
  } catch (error) {
    console.error('Error in nearest ambulances GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}