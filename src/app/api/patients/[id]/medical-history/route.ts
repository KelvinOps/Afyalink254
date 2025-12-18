import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Fetch comprehensive medical history
    const medicalHistory = await prisma.patient.findUnique({
      where: { id: patientId },
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
        
        // Treatment History
        treatments: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: { firstName: true, lastName: true, specialization: true }
            },
            hospital: {
              select: { name: true }
            }
          }
        },
        
        // Test Results
        labTests: {
          orderBy: { testDate: 'desc' },
          include: {
            orderedBy: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        
        // Diagnosis History
        diagnoses: {
          orderBy: { diagnosedAt: 'desc' },
          include: {
            diagnosedBy: {
              select: { firstName: true, lastName: true, specialization: true }
            }
          }
        },
        
        // Medication History
        prescriptions: {
          orderBy: { prescribedAt: 'desc' },
          include: {
            prescribedBy: {
              select: { firstName: true, lastName: true }
            },
            medication: {
              select: { name: true, dosage: true }
            }
          }
        },
        
        // Visit History
        visits: {
          orderBy: { visitDate: 'desc' },
          include: {
            hospital: {
              select: { name: true }
            },
            doctor: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    })

    if (!medicalHistory) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      medicalHistory
    })

  } catch (error) {
    console.error('Error fetching medical history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}