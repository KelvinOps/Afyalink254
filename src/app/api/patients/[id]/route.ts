// src/app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params // ✅ Fixed: Await params

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        currentHospital: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            address: true
          }
        },
        triageEntries: {
          orderBy: { arrivalTime: 'desc' },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            assessedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        },
        transfers: {
          orderBy: { requestedAt: 'desc' },
          include: {
            originHospital: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            destinationHospital: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            ambulance: {
              select: {
                id: true,
                registrationNumber: true,
                type: true
              }
            }
          }
        },
        referrals: {
          orderBy: { referredAt: 'desc' },
          include: {
            originHospital: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            destinationHospital: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        shaClaims: {
          orderBy: { serviceDate: 'desc' },
          include: {
            hospital: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        emergencies: {
          orderBy: { reportedAt: 'desc' },
          include: {
            county: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(patient)

  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params // ✅ Fixed: Await params
    const body = await request.json()

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    })

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        otherNames: body.otherNames,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender,
        phone: body.phone,
        alternatePhone: body.alternatePhone,
        email: body.email,
        nationalId: body.nationalId,
        countyOfResidence: body.countyOfResidence,
        subCounty: body.subCounty,
        ward: body.ward,
        village: body.village,
        landmark: body.landmark,
        what3words: body.what3words,
        nextOfKinName: body.nextOfKinName,
        nextOfKinPhone: body.nextOfKinPhone,
        nextOfKinRelation: body.nextOfKinRelation,
        bloodType: body.bloodType,
        allergies: body.allergies,
        chronicConditions: body.chronicConditions,
        disabilities: body.disabilities,
        shaNumber: body.shaNumber,
        shaStatus: body.shaStatus,
        contributionStatus: body.contributionStatus,
        currentHospitalId: body.currentHospitalId,
        currentStatus: body.currentStatus
      },
      include: {
        currentHospital: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        userRole: 'SYSTEM',
        userName: 'System',
        action: 'UPDATE',
        entityType: 'PATIENT',
        entityId: updatedPatient.id,
        description: `Patient updated: ${updatedPatient.firstName} ${updatedPatient.lastName}`,
        success: true
      }
    })

    return NextResponse.json(updatedPatient)

  } catch (error) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params // ✅ Fixed: Await params

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    })

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Check if patient has active records
    const activeRecords = await prisma.triageEntry.count({
      where: {
        patientId: id,
        status: {
          in: ['WAITING', 'IN_ASSESSMENT', 'IN_TREATMENT', 'AWAITING_ADMISSION', 'AWAITING_TRANSFER']
        }
      }
    })

    if (activeRecords > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patient with active medical records' },
        { status: 400 }
      )
    }

    await prisma.patient.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        userRole: 'SYSTEM',
        userName: 'System',
        action: 'DELETE',
        entityType: 'PATIENT',
        entityId: id,
        description: `Patient deleted: ${existingPatient.firstName} ${existingPatient.lastName}`,
        success: true
      }
    })

    return NextResponse.json({ message: 'Patient deleted successfully' })

  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}