// src/app/api/patients/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Type for patient export data
interface PatientExportData {
  'Patient Number': string
  'Full Name': string
  'Age': number | string
  'Gender': string
  'Phone': string
  'Current Status': string
  'Current Hospital': string
  'Triage Level': string
  'Last Arrival Time': string
  'Date of Birth': string
  'National ID': string
  'SHA Number': string
  'Blood Type': string
  'County of Residence': string
}

// Helper function to calculate age
const calculateAge = (dateOfBirth: string | Date): number | string => {
  try {
    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) return 'N/A'
    
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  } catch {
    return 'N/A'
  }
}

// Helper to format date safely
const formatDate = (date: string | Date | null): string => {
  if (!date) return 'N/A'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toISOString().split('T')[0]
  } catch {
    return 'N/A'
  }
}

// Helper to format datetime safely
const formatDateTime = (date: string | Date | null): string => {
  if (!date) return 'N/A'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')?.toLowerCase() || 'csv'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const hospitalId = searchParams.get('hospitalId') || ''
    
    // Validate format
    const validFormats = ['csv', 'xlsx', 'excel', 'json', 'pdf']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Unsupported format. Use: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Build query filters
    const where: any = {}

    if (search && search.trim().length > 0) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { patientNumber: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { shaNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.currentStatus = status
    }

    if (hospitalId) {
      where.currentHospitalId = hospitalId
    }

    // Fetch all patients with necessary data
    const patients = await prisma.patient.findMany({
      where,
      include: {
        currentHospital: {
          select: {
            name: true,
            code: true
          }
        },
        triageEntries: {
          take: 1,
          orderBy: { arrivalTime: 'desc' },
          select: {
            triageLevel: true,
            status: true,
            arrivalTime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (patients.length === 0) {
      return NextResponse.json(
        { error: 'No patients found matching the criteria' },
        { status: 404 }
      )
    }

    // Format data for export
    const formattedDataForCSVExcelJSON = patients.map(patient => {
      const triage = patient.triageEntries?.[0] || null
      return {
        'Patient ID': patient.id,
        'Patient Number': patient.patientNumber,
        'First Name': patient.firstName || '',
        'Last Name': patient.lastName || '',
        'Full Name': `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        'Date of Birth': formatDate(patient.dateOfBirth),
        'Age': calculateAge(patient.dateOfBirth),
        'Gender': patient.gender || '',
        'Phone': patient.phone || '',
        'National ID': patient.nationalId || '',
        'SHA Number': patient.shaNumber || '',
        'SHA Status': patient.shaStatus || '',
        'Contribution Status': patient.contributionStatus || '',
        'Current Status': patient.currentStatus || '',
        'Current Hospital': patient.currentHospital?.name || '',
        'Hospital Code': patient.currentHospital?.code || '',
        'Triage Level': triage?.triageLevel || '',
        'Triage Status': triage?.status || '',
        'Last Arrival Time': formatDateTime(triage?.arrivalTime),
        'Blood Type': patient.bloodType || '',
        'Allergies': patient.allergies?.join(', ') || '',
        'Chronic Conditions': patient.chronicConditions?.join(', ') || '',
        'County of Residence': patient.countyOfResidence || '',
        'Sub County': patient.subCounty || '',
        'Created At': formatDateTime(patient.createdAt),
        'Updated At': formatDateTime(patient.updatedAt)
      }
    })

    // Simplified data for PDF
    const formattedDataForPDF: PatientExportData[] = patients.map(patient => {
      const triage = patient.triageEntries?.[0] || null
      return {
        'Patient Number': patient.patientNumber || '',
        'Full Name': `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        'Age': calculateAge(patient.dateOfBirth),
        'Gender': patient.gender || '',
        'Phone': patient.phone || '',
        'Current Status': patient.currentStatus || '',
        'Current Hospital': patient.currentHospital?.name || '',
        'Triage Level': triage?.triageLevel || '',
        'Last Arrival Time': formatDate(triage?.arrivalTime),
        'Date of Birth': formatDate(patient.dateOfBirth),
        'National ID': patient.nationalId || '',
        'SHA Number': patient.shaNumber || '',
        'Blood Type': patient.bloodType || '',
        'County of Residence': patient.countyOfResidence || ''
      }
    })

    // Handle different export formats
    switch (format) {
      case 'csv':
        return exportCSV(formattedDataForCSVExcelJSON)
      case 'xlsx':
      case 'excel':
        return exportExcel(formattedDataForCSVExcelJSON)
      case 'json':
        return exportJSON(formattedDataForCSVExcelJSON)
      case 'pdf':
        return exportPDF(formattedDataForPDF, {
          search,
          status,
          hospitalId,
          totalCount: patients.length,
          timestamp: new Date().toISOString()
        })
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error exporting patients:', error)
    return NextResponse.json(
      { error: 'Failed to export patient data' },
      { status: 500 }
    )
  }
}

function exportCSV(data: any[]): Response {
  try {
    if (data.length === 0) {
      return new Response('', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="patients_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Convert to CSV
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle values that might contain commas or quotes
          if (value === null || value === undefined || value === '') return ''
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
    ]

    const csv = csvRows.join('\n')
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="patients_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('CSV export error:', error)
    throw new Error('Failed to generate CSV file')
  }
}

function exportExcel(data: any[]): Response {
  try {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Auto-size columns
    const maxWidths: Record<number, number> = {}
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      maxWidths[col] = 10 // Minimum width
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })]
        if (cell && cell.v) {
          const cellValue = String(cell.v)
          const cellLength = cellValue.length
          if (cellLength > maxWidths[col]) {
            maxWidths[col] = Math.min(cellLength, 50) // Max width 50
          }
        }
      }
    }
    
    ws['!cols'] = Object.keys(maxWidths).map(i => ({ 
      wch: maxWidths[parseInt(i)] + 2 
    }))
    
    XLSX.utils.book_append_sheet(wb, ws, 'Patients')
    
    // Generate buffer
    const excelBuffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false 
    })
    
    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="patients_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Excel export error:', error)
    throw new Error('Failed to generate Excel file')
  }
}

function exportJSON(data: any[]): Response {
  try {
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="patients_${new Date().toISOString().split('T')[0]}.json"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('JSON export error:', error)
    throw new Error('Failed to generate JSON file')
  }
}

function exportPDF(data: PatientExportData[], filters: {
  search: string;
  status: string;
  hospitalId: string;
  totalCount: number;
  timestamp: string;
}): Response {
  try {
    if (data.length === 0) {
      throw new Error('No data to export')
    }

    console.log(`Generating PDF with ${data.length} records...`)
    
    // Prepare table data
    const headers = Object.keys(data[0]) as Array<keyof PatientExportData>
    const tableData = data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle undefined/null values
        if (value === undefined || value === null) return ''
        
        const stringValue = String(value)
        // Truncate very long values for better PDF display
        if (stringValue.length > 30) {
          return stringValue.substring(0, 30) + '...'
        }
        return stringValue
      })
    )

    // Prepare filter information
    const filterInfo: string[] = []
    if (filters.search) filterInfo.push(`Search: ${filters.search}`)
    if (filters.status) filterInfo.push(`Status: ${filters.status}`)
    if (filters.hospitalId) filterInfo.push(`Hospital ID: ${filters.hospitalId}`)

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'landscape', // Landscape for more columns
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Add company/application header
    doc.setFontSize(20)
    doc.setTextColor(30, 64, 175)
    doc.setFont('helvetica', 'bold')
    doc.text('MEDICAL CARE SYSTEM', 148.5, 20, { align: 'center' })
    
    // Add report title
    doc.setFontSize(16)
    doc.setTextColor(59, 130, 246)
    doc.text('PATIENT REGISTRY REPORT', 148.5, 30, { align: 'center' })
    
    // Add generation info
    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    doc.setFont('helvetica', 'normal')
    const genDate = new Date(filters.timestamp)
    doc.text(`Generated: ${genDate.toLocaleDateString()} ${genDate.toLocaleTimeString()}`, 148.5, 40, { align: 'center' })
    
    // Add summary info
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.text(`Total Patients: ${filters.totalCount}`, 148.5, 47, { align: 'center' })
    
    // Add filter information if any
    let startY = 55
    if (filterInfo.length > 0) {
      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128)
      doc.setFont('helvetica', 'italic')
      doc.text(`Filters: ${filterInfo.join(' • ')}`, 148.5, startY, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      startY += 8
    }

    // Create table with autoTable
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: startY,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 1,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246]
      },
      margin: { top: 10, left: 10, right: 10 },
      styles: {
        fontSize: 7,
        cellPadding: 1,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
        font: 'helvetica'
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // Patient Number
        1: { cellWidth: 30, halign: 'left' },   // Full Name
        2: { cellWidth: 10, halign: 'center' }, // Age
        3: { cellWidth: 15, halign: 'center' }, // Gender
        4: { cellWidth: 25, halign: 'left' },   // Phone
        5: { cellWidth: 25, halign: 'center' }, // Current Status
        6: { cellWidth: 30, halign: 'left' },   // Current Hospital
        7: { cellWidth: 20, halign: 'center' }, // Triage Level
        8: { cellWidth: 25, halign: 'center' }, // Last Arrival Time
        9: { cellWidth: 25, halign: 'center' }, // Date of Birth
        10: { cellWidth: 25, halign: 'center' }, // National ID
        11: { cellWidth: 25, halign: 'center' }, // SHA Number
        12: { cellWidth: 20, halign: 'center' }, // Blood Type
        13: { cellWidth: 25, halign: 'left' }   // County of Residence
      },
      didDrawPage: function(data) {
        // Add page numbers in footer
        const pageCount = doc.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(107, 114, 128)
        
        // Page number
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        )
        
        // Total records
        doc.text(
          `Total: ${filters.totalCount} patients`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
        
        // Timestamp
        doc.text(
          `Generated: ${genDate.toLocaleTimeString()}`,
          doc.internal.pageSize.width - data.settings.margin.right,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        )
      }
    })

    // Generate PDF buffer
    const pdfOutput = doc.output('arraybuffer')
    const pdfBuffer = Buffer.from(pdfOutput)
    
    console.log(`PDF generated successfully. Size: ${pdfBuffer.length} bytes`)
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="patients_report_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error: any) {
    console.error('PDF export error:', {
      message: error.message,
      dataLength: data?.length || 0,
      filters
    })
    throw new Error(`Failed to generate PDF file: ${error.message}`)
  }
}