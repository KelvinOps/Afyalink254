// scripts/seed-departments.ts or prisma/seed.ts
import { prisma } from '@/app/lib/prisma'
import { DepartmentType } from '@prisma/client'

interface DepartmentTemplate {
  name: string
  type: DepartmentType
  isEssential: boolean
}

const GLOBAL_DEPARTMENTS: DepartmentTemplate[] = [
  // Emergency & Critical Care
  { name: 'Accident & Emergency Department', type: DepartmentType.ACCIDENT_EMERGENCY, isEssential: true },
  { name: 'Intensive Care Unit (ICU)', type: DepartmentType.ICU, isEssential: true },
  { name: 'High Dependency Unit (HDU)', type: DepartmentType.HDU, isEssential: true },
  
  // Inpatient Wards
  { name: 'General Medical Ward', type: DepartmentType.GENERAL_WARD, isEssential: true },
  { name: 'Surgical Ward', type: DepartmentType.GENERAL_WARD, isEssential: true },
  { name: 'Orthopedic Ward', type: DepartmentType.GENERAL_WARD, isEssential: true },
  { name: 'Isolation Ward', type: DepartmentType.GENERAL_WARD, isEssential: true },
  
  // Specialized Clinical Departments
  { name: 'Cardiology Department', type: DepartmentType.CARDIOLOGY, isEssential: true },
  { name: 'Neurology Department', type: DepartmentType.NEUROLOGY, isEssential: true },
  { name: 'Oncology Department', type: DepartmentType.ONCOLOGY, isEssential: true },
  { name: 'Nephrology Department', type: DepartmentType.DIALYSIS, isEssential: false },
  { name: 'Gastroenterology Department', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Endocrinology Department', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Rheumatology Department', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Pulmonology Department', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Infectious Diseases', type: DepartmentType.OTHER, isEssential: true },
  
  // Women & Children's Health
  { name: 'Maternity Ward', type: DepartmentType.MATERNITY, isEssential: true },
  { name: 'Labor & Delivery Suite', type: DepartmentType.MATERNITY, isEssential: true },
  { name: 'Postnatal Ward', type: DepartmentType.MATERNITY, isEssential: true },
  { name: 'Neonatal ICU (NICU)', type: DepartmentType.ICU, isEssential: true },
  { name: 'Pediatric Ward', type: DepartmentType.PEDIATRICS, isEssential: true },
  { name: 'Pediatric ICU (PICU)', type: DepartmentType.ICU, isEssential: true },
  
  // Surgical Departments
  { name: 'Main Operating Theatre', type: DepartmentType.SURGERY, isEssential: true },
  { name: 'Emergency Theatre', type: DepartmentType.TRAUMA, isEssential: true },
  { name: 'Day Surgery Unit', type: DepartmentType.SURGERY, isEssential: true },
  { name: 'Recovery Room', type: DepartmentType.OTHER, isEssential: true },
  { name: 'General Surgery', type: DepartmentType.SURGERY, isEssential: true },
  { name: 'Orthopedic Surgery', type: DepartmentType.ORTHOPEDICS, isEssential: true },
  { name: 'Neurosurgery', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Cardiothoracic Surgery', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Plastic Surgery', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Urology', type: DepartmentType.OTHER, isEssential: true },
  { name: 'ENT (Ear, Nose & Throat)', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Ophthalmology', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Dental Surgery', type: DepartmentType.OTHER, isEssential: false },
  
  // Diagnostic Departments
  { name: 'Radiology Department', type: DepartmentType.RADIOLOGY, isEssential: true },
  { name: 'CT Scan Unit', type: DepartmentType.RADIOLOGY, isEssential: false },
  { name: 'MRI Unit', type: DepartmentType.RADIOLOGY, isEssential: false },
  { name: 'Ultrasound Unit', type: DepartmentType.RADIOLOGY, isEssential: true },
  { name: 'X-Ray Department', type: DepartmentType.RADIOLOGY, isEssential: true },
  { name: 'Laboratory', type: DepartmentType.LABORATORY, isEssential: true },
  { name: 'Blood Bank', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Histopathology', type: DepartmentType.LABORATORY, isEssential: false },
  { name: 'Microbiology', type: DepartmentType.LABORATORY, isEssential: true },
  
  // Therapeutic Departments
  { name: 'Pharmacy', type: DepartmentType.PHARMACY, isEssential: true },
  { name: 'Physiotherapy', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Occupational Therapy', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Dietetics & Nutrition', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Dialysis Unit', type: DepartmentType.DIALYSIS, isEssential: false },
  { name: 'Chemotherapy Unit', type: DepartmentType.ONCOLOGY, isEssential: false },
  { name: 'Radiotherapy Unit', type: DepartmentType.ONCOLOGY, isEssential: false },
  
  // Support Services
  { name: 'Outpatient Department (OPD)', type: DepartmentType.OUTPATIENT, isEssential: true },
  { name: 'Triage Area', type: DepartmentType.ACCIDENT_EMERGENCY, isEssential: true },
  { name: 'Observation Ward', type: DepartmentType.GENERAL_WARD, isEssential: true },
  { name: 'Mortuary', type: DepartmentType.MORTUARY, isEssential: true },
  { name: 'Medical Records', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Administration', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Central Sterile Supply', type: DepartmentType.OTHER, isEssential: true },
  
  // Specialized Units
  { name: 'Burn Unit', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Stroke Unit', type: DepartmentType.NEUROLOGY, isEssential: false },
  { name: 'Coronary Care Unit (CCU)', type: DepartmentType.CARDIOLOGY, isEssential: false },
  { name: 'Psychiatric Ward', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Geriatric Ward', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Rehabilitation Center', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Pain Management Clinic', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Allergy Clinic', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Diabetes Clinic', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Antenatal Clinic', type: DepartmentType.MATERNITY, isEssential: true },
  { name: 'Family Planning Clinic', type: DepartmentType.MATERNITY, isEssential: true },
  { name: 'Immunization Clinic', type: DepartmentType.PEDIATRICS, isEssential: true },
  { name: 'HIV/AIDS Clinic', type: DepartmentType.OTHER, isEssential: true },
  { name: 'TB Clinic', type: DepartmentType.OTHER, isEssential: true },
  { name: 'Sexual Health Clinic', type: DepartmentType.OTHER, isEssential: false },
  { name: 'Travel Clinic', type: DepartmentType.OTHER, isEssential: false },
]

async function seedDepartments() {
  try {
    console.log('Starting department seeding...')
    
    // First, ensure there's at least one hospital
    const hospitals = await prisma.hospital.findMany()
    
    if (hospitals.length === 0) {
      console.log('No hospitals found. Creating a default hospital...')
      
      // Create a default hospital
      const defaultHospital = await prisma.hospital.create({
        data: {
          id: 'hosp-001',
          name: 'Default Hospital',
          code: 'HOSP-001',
          type: 'PUBLIC',
          level: 'LEVEL_4',
          ownership: 'COUNTY_GOVERNMENT',
          countyId: 'county-001',
          address: '123 Main Street, Nairobi',
          coordinates: { lat: -1.286389, lng: 36.817223 },
          phone: '020-1234567',
          emergencyPhone: '020-1234567',
          email: 'info@hospital.local',
          totalBeds: 500,
          functionalBeds: 450,
          icuBeds: 20,
          hdUnitBeds: 10,
          maternityBeds: 50,
          pediatricBeds: 40,
          emergencyBeds: 30,
          isolationBeds: 10,
          availableBeds: 300,
          availableIcuBeds: 15,
          availableEmergencyBeds: 25,
          powerStatus: 'GRID',
          backupPower: true,
          waterStatus: 'AVAILABLE',
          oxygenStatus: 'AVAILABLE',
          internetStatus: 'AVAILABLE',
          shaContracted: true,
          shaFacilityCode: 'SHA-001',
          services: ['EMERGENCY', 'MATERNITY', 'SURGERY', 'ICU', 'OUTPATIENT'],
          specializations: ['CARDIOLOGY', 'NEUROLOGY', 'ORTHOPEDICS'],
          has24HourService: true,
          hasAmbulance: true,
          hasBloodBank: true,
          hasLaboratory: true,
          hasRadiology: true,
          hasCTScan: true,
          hasMRI: false,
          hasDialysis: true,
          hasPharmacy: true,
          hasOxygenPlant: true,
          hasMortuary: true,
          telemedicineEnabled: true,
          canReceiveReferrals: true,
          canGiveConsultations: true,
          isActive: true,
          operationalStatus: 'OPERATIONAL',
          acceptingPatients: true,
          emergencyOnlyMode: false,
          managedByCounty: true,
          autonomyLevel: 'SEMI_AUTONOMOUS'
        }
      })
      
      hospitals.push(defaultHospital)
      console.log(`Created default hospital: ${defaultHospital.name}`)
    }
    
    // Seed departments for each hospital
    let totalDepartmentsCreated = 0
    
    for (const hospital of hospitals) {
      console.log(`\nSeeding departments for ${hospital.name} (${hospital.code})...`)
      
      let hospitalDepartmentsCreated = 0
      
      for (const dept of GLOBAL_DEPARTMENTS) {
        // Check if department already exists
        const existingDept = await prisma.department.findFirst({
          where: {
            hospitalId: hospital.id,
            name: dept.name,
            type: dept.type
          }
        })
        
        if (!existingDept) {
          // Create department with appropriate capacities
          let defaultBeds: number
          let acceptingPatients: boolean
          
          // Set bed capacity based on department type and essential status
          if (dept.type === DepartmentType.ICU || dept.type === DepartmentType.HDU) {
            defaultBeds = dept.isEssential ? 10 : 5
          } else if (dept.type === DepartmentType.GENERAL_WARD || dept.type === DepartmentType.MATERNITY) {
            defaultBeds = dept.isEssential ? 40 : 20
          } else if (dept.type === DepartmentType.ACCIDENT_EMERGENCY) {
            defaultBeds = 30
          } else if (dept.type === DepartmentType.SURGERY || dept.type === DepartmentType.ORTHOPEDICS) {
            defaultBeds = dept.isEssential ? 25 : 15
          } else {
            defaultBeds = dept.isEssential ? 10 : 5
          }
          
          // Some departments don't have beds
          if (
            dept.type === DepartmentType.RADIOLOGY ||
            dept.type === DepartmentType.LABORATORY ||
            dept.type === DepartmentType.PHARMACY ||
            dept.type === DepartmentType.OUTPATIENT
          ) {
            defaultBeds = 0
            acceptingPatients = false
          } else {
            acceptingPatients = dept.isEssential
          }
          
          try {
            await prisma.department.create({
              data: {
                name: dept.name,
                type: dept.type,
                hospitalId: hospital.id,
                totalBeds: defaultBeds,
                availableBeds: defaultBeds,
                occupancyRate: 0,
                isActive: true,
                isAcceptingPatients: acceptingPatients
              }
            })
            
            hospitalDepartmentsCreated++
            totalDepartmentsCreated++
            
            if (hospitalDepartmentsCreated % 10 === 0) {
              console.log(`  Created ${hospitalDepartmentsCreated} departments so far...`)
            }
          } catch (error) {
            console.error(`  Error creating ${dept.name}:`, error)
          }
        }
      }
      
      console.log(`  ✓ Created ${hospitalDepartmentsCreated} departments for ${hospital.name}`)
    }
    
    console.log(`\n🎉 Department seeding completed!`)
    console.log(`   Total hospitals processed: ${hospitals.length}`)
    console.log(`   Total departments created: ${totalDepartmentsCreated}`)
    
  } catch (error) {
    console.error('Error during department seeding:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedDepartments()