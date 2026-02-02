// src/app/api/patients/[id]/history/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

interface VitalSigns {
  heartRate: number
  bloodPressure: string
  respiratoryRate: number
  temperature: number
  oxygenSaturation: number
  painLevel: number
  bloodSugar?: number
  weight?: number
  height?: number
  bmi?: number
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        currentHospital: {
          select: {
            name: true,
            code: true,
            mflCode: true
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

    // Fetch patient history
    const triageEntries = await prisma.triageEntry.findMany({
      where: { patientId },
      include: {
        department: {
          select: {
            name: true,
            type: true
          }
        },
        hospital: {
          select: {
            name: true,
            code: true
          }
        },
        assessedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { arrivalTime: 'desc' }
    })

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Helper functions
    const formatDate = (date: string | Date): string => {
      try {
        const d = new Date(date)
        if (isNaN(d.getTime())) return 'N/A'
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return 'N/A'
      }
    }

    const formatDateTime = (date: string | Date): string => {
      try {
        const d = new Date(date)
        if (isNaN(d.getTime())) return 'N/A'
        return d.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      } catch {
        return 'N/A'
      }
    }

    const calculateAge = (dateOfBirth: string | Date): number => {
      try {
        const birthDate = new Date(dateOfBirth)
        if (isNaN(birthDate.getTime())) return 0
        
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        
        return age
      } catch {
        return 0
      }
    }

    // Helper function to parse vital signs
    const parseVitalSigns = (vitalSigns: any): VitalSigns | null => {
      if (!vitalSigns) return null
      
      try {
        if (typeof vitalSigns === 'object' && vitalSigns !== null) {
          return {
            heartRate: Number(vitalSigns.heartRate) || 0,
            bloodPressure: String(vitalSigns.bloodPressure || 'N/A'),
            respiratoryRate: Number(vitalSigns.respiratoryRate) || 0,
            temperature: Number(vitalSigns.temperature) || 0,
            oxygenSaturation: Number(vitalSigns.oxygenSaturation) || 0,
            painLevel: Number(vitalSigns.painLevel) || 0,
            bloodSugar: vitalSigns.bloodSugar ? Number(vitalSigns.bloodSugar) : undefined,
            weight: vitalSigns.weight ? Number(vitalSigns.weight) : undefined,
            height: vitalSigns.height ? Number(vitalSigns.height) : undefined,
            bmi: vitalSigns.bmi ? Number(vitalSigns.bmi) : undefined
          }
        }
        
        if (typeof vitalSigns === 'string') {
          try {
            const parsed = JSON.parse(vitalSigns)
            return parseVitalSigns(parsed)
          } catch {
            return null
          }
        }
        
        return null
      } catch {
        return null
      }
    }

    // Header
    doc.setFontSize(20)
    doc.setTextColor(30, 64, 175)
    doc.setFont('helvetica', 'bold')
    doc.text('PATIENT MEDICAL HISTORY', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setTextColor(75, 85, 99)
    doc.setFont('helvetica', 'normal')
    doc.text('CONFIDENTIAL MEDICAL REPORT', 105, 28, { align: 'center' })

    // Patient Information Section
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.setFont('helvetica', 'bold')
    doc.text('PATIENT INFORMATION', 20, 45)
    
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    doc.setFont('helvetica', 'normal')
    
    let y = 55
    
    doc.text(`Patient Name: ${patient.firstName} ${patient.lastName}`, 20, y)
    y += 7
    
    doc.text(`Patient Number: ${patient.patientNumber}`, 20, y)
    y += 7
    
    doc.text(`Date of Birth: ${formatDate(patient.dateOfBirth)} (Age: ${calculateAge(patient.dateOfBirth)} years)`, 20, y)
    y += 7
    
    doc.text(`Gender: ${patient.gender}`, 20, y)
    doc.text(`Blood Type: ${patient.bloodType || 'Not Recorded'}`, 105, y)
    y += 7
    
    doc.text(`Phone: ${patient.phone || 'Not Provided'}`, 20, y)
    doc.text(`National ID: ${patient.nationalId || 'Not Provided'}`, 105, y)
    y += 7
    
    doc.text(`Allergies: ${patient.allergies?.join(', ') || 'None'}`, 20, y)
    y += 7
    
    doc.text(`Chronic Conditions: ${patient.chronicConditions?.join(', ') || 'None'}`, 20, y)
    y += 7
    
    if (patient.currentHospital) {
      doc.text(`Current Facility: ${patient.currentHospital.name} (${patient.currentHospital.code})`, 20, y)
      y += 7
    }
    
    y += 3

    // Medical History Section
    if (triageEntries.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(31, 41, 55)
      doc.setFont('helvetica', 'bold')
      doc.text('MEDICAL HISTORY & TRIAGE ENTRIES', 20, y)
      y += 10

      // Table data with safe vital signs access
      const headers = ['Date', 'Complaint', 'Triage Level', 'Hospital', 'Status', 'Vitals']
      const tableData = triageEntries.map(entry => {
        const vitalSigns = parseVitalSigns(entry.vitalSigns)
        const vitalSignsText = vitalSigns 
          ? `HR: ${vitalSigns.heartRate} | BP: ${vitalSigns.bloodPressure}`
          : 'N/A'
        
        return [
          formatDate(entry.arrivalTime),
          entry.chiefComplaint.substring(0, 30) + (entry.chiefComplaint.length > 30 ? '...' : ''),
          entry.triageLevel,
          entry.hospital?.name?.substring(0, 20) || 'N/A',
          entry.status,
          vitalSignsText
        ]
      })

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: y,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 1,
          overflow: 'linebreak',
          lineWidth: 0.1,
          lineColor: [229, 231, 235]
        },
        margin: { left: 20, right: 20 },
        styles: {
          fontSize: 8,
          cellPadding: 1
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 35 }, // Complaint
          2: { cellWidth: 25 }, // Triage Level
          3: { cellWidth: 30 }, // Hospital
          4: { cellWidth: 25 }, // Status
          5: { cellWidth: 40 }  // Vitals
        },
        didDrawPage: function(data) {
          // Footer
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(8)
          doc.setTextColor(107, 114, 128)
          doc.text(
            `Page ${data.pageNumber} of ${pageCount} • Generated: ${new Date().toLocaleString()}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          )
        }
      })
    } else {
      doc.setFontSize(12)
      doc.setTextColor(107, 114, 128)
      doc.setFont('helvetica', 'italic')
      doc.text('No medical history records found for this patient.', 20, y)
    }

    // Finalize PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="patient_history_${patient.patientNumber}_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF export' },
      { status: 500 }
    )
  }
}