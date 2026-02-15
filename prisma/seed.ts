// prisma/seed.ts
// CRITICAL FIX: Import all enum types from Prisma
import { 
  PrismaClient,
  HospitalType,
  HospitalLevel,
  Ownership,
  PowerStatus,
  WaterStatus,
  OxygenStatus,
  InternetStatus,
  OperationalStatus,
  AutonomyLevel,
  KEPHLevel,
  Prisma
} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data (optional - be careful in production!)
  await clearDatabase()

  // Seed in correct order to respect foreign key constraints
  await seedCounties()
  await seedHospitals()
  await seedHealthCenters()
  await seedDispensaries()
  await seedCommunityHealthUnits()
  await seedDepartments()
  await seedStaff()
  await seedCommunityHealthPromoters()
  await seedPatients()

  console.log('✅ Database seeding completed!')
}

async function clearDatabase() {
  const tables = [
    'staff', 'departments', 'community_health_promoters',
    'patients', 'community_health_units', 'dispensaries', 
    'health_centers', 'hospitals', 'counties'
  ]

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
  }
}

async function seedCounties() {
  console.log('🏛️  Seeding counties...')
  const counties = [
    {
      id: 'county-001',
      name: 'Nairobi',
      code: 'KE-47',
      region: 'Nairobi',
      population: 4397073,
      area: 694.9,
      urbanRatio: 1.0,
      coordinates: { lat: -1.286389, lng: 36.817223 } as Prisma.InputJsonValue,
      governorName: 'Johnson Sakaja',
      healthCECName: 'Dr. Anastasia Nyalita',
      countyHealthDirector: 'Dr. Ouma Oluga',
      countyHQLocation: 'City Hall, Nairobi',
      roadNetworkKm: 12000,
      electricityAccess: 95.2,
      internetPenetration: 85.7,
      doctorPopulationRatio: '1:15000',
      nursePopulationRatio: '1:800',
      maternalMortalityRate: 362,
      infantMortalityRate: 31,
      annualHealthBudget: 15.2,
      healthBudgetPercentage: 28.5,
      isMarginalized: false
    },
    {
      id: 'county-002',
      name: 'Mombasa',
      code: 'KE-01',
      region: 'Coast',
      population: 1208333,
      area: 294.7,
      urbanRatio: 0.85,
      coordinates: { lat: -4.0435, lng: 39.6682 } as Prisma.InputJsonValue,
      governorName: 'Abdulswamad Nassir',
      healthCECName: 'Dr. Pauline Oginga',
      countyHealthDirector: 'Dr. Khadija Shikely',
      countyHQLocation: 'Mombasa County HQ',
      roadNetworkKm: 4500,
      electricityAccess: 88.5,
      internetPenetration: 78.3,
      doctorPopulationRatio: '1:18000',
      nursePopulationRatio: '1:950',
      maternalMortalityRate: 385,
      infantMortalityRate: 35,
      annualHealthBudget: 8.5,
      healthBudgetPercentage: 25.8,
      isMarginalized: false
    }
  ]

  for (const county of counties) {
    await prisma.county.create({ data: county })
  }
}

async function seedHospitals() {
  console.log('🏥 Seeding hospitals...')
  
  await prisma.hospital.deleteMany({})

  const hospitals: Prisma.HospitalCreateInput[] = [
    {
      id: 'hosp-001',
      name: 'Kenyatta National Hospital',
      code: 'KNH-001',
      mflCode: 'MFL-001',
      type: HospitalType.PUBLIC, // ✅ Use enum
      level: HospitalLevel.LEVEL_6, // ✅ Use enum
      ownership: Ownership.NATIONAL_GOVERNMENT, // ✅ Use enum
      county: {
        connect: { id: 'county-001' }
      },
      subCounty: 'Nairobi West',
      ward: 'Mbagathi',
      constituency: 'Dagoretti South',
      address: 'Hospital Road, Nairobi',
      coordinates: { lat: -1.3045, lng: 36.8012 } as Prisma.InputJsonValue,
      what3words: 'spoons.radiate.rocket',
      elevation: 1670,
      accessibilityScore: 95,
      distanceToNearestTarmac: 0.5,
      reachableInRainySeason: true,
      phone: '+254-20-2726300',
      emergencyPhone: '+254-722-203277',
      ambulancePhone: '+254-733-123456',
      email: 'info@knh.or.ke',
      website: 'https://knh.or.ke',
      totalBeds: 1800,
      functionalBeds: 1650,
      icuBeds: 45,
      hdUnitBeds: 15,
      maternityBeds: 180,
      pediatricBeds: 150,
      emergencyBeds: 85,
      isolationBeds: 30,
      availableBeds: 320,
      availableIcuBeds: 12,
      availableEmergencyBeds: 25,
      lastBedUpdate: new Date(),
      powerStatus: PowerStatus.GRID, // ✅ Use enum
      backupPower: true,
      waterStatus: WaterStatus.AVAILABLE, // ✅ Use enum
      oxygenStatus: OxygenStatus.AVAILABLE, // ✅ Use enum
      internetStatus: InternetStatus.AVAILABLE, // ✅ Use enum
      shaContracted: true,
      shaFacilityCode: 'SHA-KNH-001',
      shaActivationDate: new Date('2023-01-15'),
      kephLevel: KEPHLevel.LEVEL_6, // ✅ Use enum
      services: ['EMERGENCY', 'MATERNITY', 'SURGERY', 'ICU', 'CARDIOLOGY', 'NEUROLOGY', 'ONCOLOGY'],
      specializations: ['CARDIOLOGY', 'NEUROLOGY', 'ONCOLOGY', 'ORTHOPEDICS', 'PEDIATRICS'],
      has24HourService: true,
      hasAmbulance: true,
      hasBloodBank: true,
      hasLaboratory: true,
      hasRadiology: true,
      hasCTScan: true,
      hasMRI: true,
      hasDialysis: true,
      hasPharmacy: true,
      hasOxygenPlant: true,
      hasMortuary: true,
      telemedicineEnabled: true,
      canReceiveReferrals: true,
      canGiveConsultations: true,
      isActive: true,
      operationalStatus: OperationalStatus.OPERATIONAL, // ✅ Use enum
      acceptingPatients: true,
      emergencyOnlyMode: false,
      managedByCounty: false,
      autonomyLevel: AutonomyLevel.NATIONAL_OVERSIGHT, // ✅ Use enum
      hospitalBoard: 'KNH Board of Management'
    },
    {
      id: 'hosp-002',
      name: 'Mombasa County Hospital',
      code: 'MCH-001',
      mflCode: 'MFL-002',
      type: HospitalType.PUBLIC,
      level: HospitalLevel.LEVEL_5,
      ownership: Ownership.COUNTY_GOVERNMENT,
      county: {
        connect: { id: 'county-002' }
      },
      subCounty: 'Mvita',
      ward: 'Tudor',
      constituency: 'Mvita',
      address: 'Mama Ngina Drive, Mombasa',
      coordinates: { lat: -4.0547, lng: 39.6636 } as Prisma.InputJsonValue,
      phone: '+254-41-2312001',
      emergencyPhone: '+254-722-456789',
      email: 'info@mombasahospital.go.ke',
      totalBeds: 450,
      functionalBeds: 420,
      icuBeds: 12,
      hdUnitBeds: 6,
      maternityBeds: 60,
      pediatricBeds: 45,
      emergencyBeds: 35,
      isolationBeds: 15,
      availableBeds: 85,
      availableIcuBeds: 3,
      availableEmergencyBeds: 12,
      lastBedUpdate: new Date(),
      powerStatus: PowerStatus.GRID,
      backupPower: true,
      waterStatus: WaterStatus.AVAILABLE,
      oxygenStatus: OxygenStatus.LIMITED,
      internetStatus: InternetStatus.AVAILABLE,
      shaContracted: true,
      shaFacilityCode: 'SHA-MCH-001',
      kephLevel: KEPHLevel.LEVEL_5,
      services: ['EMERGENCY', 'MATERNITY', 'SURGERY'],
      has24HourService: true,
      hasAmbulance: true,
      hasLaboratory: true,
      hasRadiology: true,
      hasPharmacy: true,
      hasMortuary: true,
      telemedicineEnabled: true,
      canReceiveReferrals: true,
      isActive: true,
      operationalStatus: OperationalStatus.OPERATIONAL,
      acceptingPatients: true,
      managedByCounty: true,
      autonomyLevel: AutonomyLevel.COUNTY_MANAGED
    }
  ]

  for (const hospital of hospitals) {
    await prisma.hospital.create({ data: hospital })
    console.log(`✅ Created hospital: ${hospital.name}`)
  }
}

async function seedHealthCenters() {
  console.log('🏥 Seeding health centers...')
  // Implementation
}

async function seedDispensaries() {
  console.log('🏥 Seeding dispensaries...')
  // Implementation
}

async function seedCommunityHealthUnits() {
  console.log('🏘️  Seeding community health units...')
  // Implementation
}

async function seedDepartments() {
  console.log('🏢 Seeding departments...')
  // Implementation
}

async function seedStaff() {
  console.log('👨‍⚕️ Seeding staff...')
  // Implementation
}

async function seedCommunityHealthPromoters() {
  console.log('👩‍⚕️ Seeding community health promoters...')
  // Implementation  
}

async function seedPatients() {
  console.log('👤 Seeding patients...')
  // Implementation
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })