// src/app/api/patients/[id]/medical-records/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Verify patient exists
    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true }
    })

    if (!patientExists) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // For now, return mock data - you should replace this with actual database queries
    const medicalRecords = [
      {
        id: '1',
        type: 'DIAGNOSIS',
        title: 'Hypertension Diagnosis',
        description: 'Patient diagnosed with stage 1 hypertension based on elevated blood pressure readings over 3 visits.',
        date: new Date().toISOString(),
        createdBy: 'Dr. James Wilson',
        status: 'CONFIRMED',
        attachments: ['lab_results.pdf', 'ecg.pdf']
      },
      {
        id: '2',
        type: 'PRESCRIPTION',
        title: 'Antihypertensive Medication',
        description: 'Prescribed Lisinopril 10mg daily for blood pressure management. Follow up in 4 weeks.',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Dr. Sarah Miller',
        status: 'ACTIVE',
        attachments: ['prescription.pdf']
      },
      {
        id: '3',
        type: 'LAB_RESULT',
        title: 'Blood Test Results',
        description: 'Complete blood count and lipid profile within normal ranges. Cholesterol slightly elevated.',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Lab Technician',
        status: 'REVIEWED',
        attachments: ['blood_test.pdf']
      }
    ]

    return NextResponse.json({
      success: true,
      records: medicalRecords,
      count: medicalRecords.length
    })

  } catch (error) {
    console.error('Error fetching medical records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    )
  }
}

// Search endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const { query } = await request.json()

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // For now, return filtered mock data - you should replace this with actual database queries
    const allRecords = [
      {
        id: '1',
        type: 'DIAGNOSIS',
        title: 'Hypertension Diagnosis',
        description: 'Patient diagnosed with stage 1 hypertension based on elevated blood pressure readings over 3 visits.',
        date: new Date().toISOString(),
        createdBy: 'Dr. James Wilson',
        status: 'CONFIRMED',
        attachments: ['lab_results.pdf', 'ecg.pdf']
      },
      {
        id: '2',
        type: 'PRESCRIPTION',
        title: 'Antihypertensive Medication',
        description: 'Prescribed Lisinopril 10mg daily for blood pressure management. Follow up in 4 weeks.',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Dr. Sarah Miller',
        status: 'ACTIVE',
        attachments: ['prescription.pdf']
      },
      {
        id: '3',
        type: 'LAB_RESULT',
        title: 'Blood Test Results',
        description: 'Complete blood count and lipid profile within normal ranges. Cholesterol slightly elevated.',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Lab Technician',
        status: 'REVIEWED',
        attachments: ['blood_test.pdf']
      }
    ]

    const searchLower = query.toLowerCase()
    const filteredRecords = allRecords.filter(record =>
      record.title.toLowerCase().includes(searchLower) ||
      record.description.toLowerCase().includes(searchLower) ||
      record.type.toLowerCase().includes(searchLower) ||
      record.createdBy.toLowerCase().includes(searchLower)
    )

    return NextResponse.json({
      success: true,
      records: filteredRecords,
      count: filteredRecords.length
    })

  } catch (error) {
    console.error('Error searching medical records:', error)
    return NextResponse.json(
      { error: 'Failed to search medical records' },
      { status: 500 }
    )
  }
}