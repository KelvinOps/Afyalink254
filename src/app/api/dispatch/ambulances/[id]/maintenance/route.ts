// app/api/dispatch/ambulances/[id]/maintenance/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth'
import { auditLog } from '@/app/lib/audit'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if ambulance exists and user has access
    const ambulance = await prisma.ambulance.findUnique({
      where: { id: params.id },
      select: { id: true, facilityId: true, countyId: true }
    })

    if (!ambulance) {
      return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
    }

    // Check access permissions
    if (user.role !== 'ADMIN') {
      if (user.facilityId && ambulance.facilityId !== user.facilityId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      if (user.countyId && ambulance.countyId !== user.countyId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get maintenance records (from a separate maintenance table in real implementation)
    // For now, return mock data
    const maintenanceRecords = [
      {
        id: '1',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Regular Service',
        description: 'Oil change, brake inspection, tire rotation',
        cost: 15000,
        performedBy: 'Kenya Vehicle Services',
        nextServiceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Medical Equipment Check',
        description: 'Defibrillator testing, oxygen system inspection, ventilator calibration',
        cost: 25000,
        performedBy: 'MedTech Solutions',
        nextServiceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    return NextResponse.json({ records: maintenanceRecords })
  } catch (error) {
    console.error('Error fetching maintenance records:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check permissions
    if (!['ADMIN', 'FACILITY_MANAGER', 'MAINTENANCE_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { type, description, cost, performedBy, date } = body

    // Validate required fields
    if (!type || !description || !cost || !performedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if ambulance exists
    const ambulance = await prisma.ambulance.findUnique({
      where: { id: params.id }
    })

    if (!ambulance) {
      return NextResponse.json({ error: 'Ambulance not found' }, { status: 404 })
    }

    // In a real implementation, you would save to a maintenance table
    // For now, create a mock record
    const newRecord = {
      id: `maintenance_${Date.now()}`,
      date: date || new Date().toISOString(),
      type,
      description,
      cost: parseFloat(cost),
      performedBy,
      ambulanceId: params.id
    }

    // Update ambulance's next service date (example logic)
    const nextServiceDate = new Date()
    nextServiceDate.setMonth(nextServiceDate.getMonth() + 3) // Next service in 3 months

    await prisma.ambulance.update({
      where: { id: params.id },
      data: {
        nextServiceDate: nextServiceDate,
        status: 'AVAILABLE' // Return to available status after maintenance
      }
    })

    // Log the action
    await auditLog({
      action: 'CREATE',
      entityType: 'MAINTENANCE',
      entityId: newRecord.id,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      description: `Added maintenance record for ambulance ${ambulance.registrationNumber}`,
      details: { type, cost, performedBy }
    })

    return NextResponse.json({ 
      success: true,
      record: newRecord
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding maintenance record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}