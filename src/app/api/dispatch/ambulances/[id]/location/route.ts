// api/dispatch/ambulances/[id]/location/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, accuracy, timestamp } = body

    const ambulance = await prisma.ambulance.findUnique({
      where: { id: params.id }
    })

    if (!ambulance) {
      return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
    }

    const updatedAmbulance = await prisma.ambulance.update({
      where: { id: params.id },
      data: {
        currentLocation: {
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: new Date(timestamp)
        },
        lastKnownLocation: {
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: new Date(timestamp)
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      location: updatedAmbulance.currentLocation
    })
  } catch (error) {
    console.error('Error updating ambulance location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ambulance = await prisma.ambulance.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        registrationNumber: true,
        currentLocation: true,
        lastKnownLocation: true,
        status: true
      }
    })

    if (!ambulance) {
      return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
    }

    return NextResponse.json({ location: ambulance.currentLocation })
  } catch (error) {
    console.error('Error fetching ambulance location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}