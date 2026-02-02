//api/triage/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const triageEntry = await prisma.triageEntry.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
            dateOfBirth: true,
            gender: true,
            bloodType: true,
            allergies: true,
            chronicConditions: true,
            phone: true
          }
        },
        department: {
          select: {
            name: true,
            type: true
          }
        },
        assessedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    if (!triageEntry) {
      return NextResponse.json(
        { error: 'Triage entry not found' },
        { status: 404 }
      )
    }

    // Calculate waiting time
    const arrivalTime = new Date(triageEntry.arrivalTime)
    const now = new Date()
    const waitingTime = Math.floor((now.getTime() - arrivalTime.getTime()) / (1000 * 60))

    return NextResponse.json({
      ...triageEntry,
      waitingTime
    })

  } catch (error) {
    console.error('Error fetching triage entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if triage entry exists
    const existingEntry = await prisma.triageEntry.findUnique({
      where: { id }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Triage entry not found' },
        { status: 404 }
      )
    }

    const updatedEntry = await prisma.triageEntry.update({
      where: { id },
      data: {
        triageLevel: body.triageLevel,
        status: body.status,
        chiefComplaint: body.chiefComplaint,
        arrivalMode: body.arrivalMode,
        departmentId: body.departmentId,
        vitalSigns: body.vitalSigns,
        notes: body.notes,
        disposition: body.disposition,
        diagnosis: body.diagnosis,
        treatmentGiven: body.treatmentGiven
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        userRole: 'SYSTEM',
        userName: 'Triage System',
        action: 'UPDATE',
        entityType: 'TRIAGE',
        entityId: updatedEntry.id,
        description: `Triage entry updated: ${updatedEntry.triageNumber}`,
        changes: body,
        success: true
      }
    })

    return NextResponse.json(updatedEntry)

  } catch (error) {
    console.error('Error updating triage entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}