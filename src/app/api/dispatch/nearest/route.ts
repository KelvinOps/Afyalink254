import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat')!)
    const lng = parseFloat(searchParams.get('lng')!)
    const emergencyType = searchParams.get('type') || 'MEDICAL'

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Get available ambulances
    const availableAmbulances = await prisma.ambulance.findMany({
      where: {
        status: 'AVAILABLE',
        isOperational: true
      },
      include: {
        hospital: {
          select: {
            name: true,
            coordinates: true
          }
        }
      }
    })

    // Calculate distances and sort by proximity
    const ambulancesWithDistance = availableAmbulances.map(ambulance => {
      let distance = Infinity
      
      if (ambulance.currentLocation) {
        // Use current location if available
        const ambLat = (ambulance.currentLocation as any).lat
        const ambLng = (ambulance.currentLocation as any).lng
        distance = calculateDistance(lat, lng, ambLat, ambLng)
      } else if (ambulance.hospital?.coordinates) {
        // Fallback to hospital location
        const hospLat = (ambulance.hospital.coordinates as any).lat
        const hospLng = (ambulance.hospital.coordinates as any).lng
        distance = calculateDistance(lat, lng, hospLat, hospLng)
      }

      return {
        ...ambulance,
        distance
      }
    })

    // Sort by distance and return top 5
    const nearestAmbulances = ambulancesWithDistance
      .filter(amb => amb.distance < Infinity)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)

    return NextResponse.json({ ambulances: nearestAmbulances })
  } catch (error) {
    console.error('Error finding nearest ambulances:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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