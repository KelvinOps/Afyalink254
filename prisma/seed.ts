// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

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
  await seedTriageEntries()
  await seedReferrals()
  await seedAmbulances()
  await seedCountyAmbulances()
  await seedDispatchCenters()
  await seedDispatchLogs()
  await seedTransfers()
  await seedEmergencies()
  await seedEmergencyResponses()
  await seedResources()
  await seedSupplyRequests()
  await seedProcurements()
  await seedSHAClaims()
  await seedFinancialRecords()
  await seedPerformanceMetrics()
  await seedSystemAlerts()
  await seedAuditLogs()
  await seedTelemedicineHubs()
  await seedTelemedicineSessions()
  await seedNationalHealthCoordination()

  console.log('✅ Database seeding completed!')
}

async function clearDatabase() {
  const tables = [
    'telemedicine_sessions', 'telemedicine_hubs', 'audit_logs', 'system_alerts',
    'performance_metrics', 'financial_records', 'sha_claims', 'procurements',
    'supply_requests', 'resources', 'emergency_responses', 'emergencies',
    'transfers', 'dispatch_logs', 'county_ambulances', 'ambulances',
    'dispatch_centers', 'referrals', 'triage_entries', 'patients',
    'community_health_promoters', 'staff', 'departments', 'community_health_units',
    'dispensaries', 'health_centers', 'hospitals', 'counties',
    'national_health_coordination'
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
      coordinates: { lat: -1.286389, lng: 36.817223 },
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
      coordinates: { lat: -4.0435, lng: 39.6682 },
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
    },
    {
      id: 'county-003',
      name: 'Kisumu',
      code: 'KE-42',
      region: 'Nyanza',
      population: 1133675,
      area: 2085.9,
      urbanRatio: 0.45,
      coordinates: { lat: -0.1022, lng: 34.7617 },
      governorName: 'Anyang Nyong\'o',
      healthCECName: 'Dr. Gregory Ganda',
      countyHealthDirector: 'Dr. Dickens Onyango',
      countyHQLocation: 'Kisumu County HQ',
      roadNetworkKm: 6800,
      electricityAccess: 65.8,
      internetPenetration: 62.4,
      doctorPopulationRatio: '1:22000',
      nursePopulationRatio: '1:1100',
      maternalMortalityRate: 415,
      infantMortalityRate: 48,
      annualHealthBudget: 6.8,
      healthBudgetPercentage: 22.3,
      isMarginalized: false
    },
    {
      id: 'county-004',
      name: 'Mandera',
      code: 'KE-09',
      region: 'North Eastern',
      population: 867457,
      area: 25787.9,
      urbanRatio: 0.15,
      coordinates: { lat: 3.9373, lng: 41.8569 },
      governorName: 'Mohamed Khalif',
      healthCECName: 'Dr. Ahmed Mohamed',
      countyHealthDirector: 'Dr. Fatuma Abdi',
      countyHQLocation: 'Mandera County HQ',
      roadNetworkKm: 3200,
      electricityAccess: 28.7,
      internetPenetration: 35.2,
      doctorPopulationRatio: '1:65000',
      nursePopulationRatio: '1:2500',
      maternalMortalityRate: 732,
      infantMortalityRate: 79,
      annualHealthBudget: 4.2,
      healthBudgetPercentage: 18.9,
      isMarginalized: true
    },
    {
      id: 'county-005',
      name: 'Nakuru',
      code: 'KE-32',
      region: 'Rift Valley',
      population: 2163783,
      area: 7492.7,
      urbanRatio: 0.52,
      coordinates: { lat: -0.3031, lng: 36.0800 },
      governorName: 'Susan Kihika',
      healthCECName: 'Dr. John Murima',
      countyHealthDirector: 'Dr. Samuel King\'ori',
      countyHQLocation: 'Nakuru County HQ',
      roadNetworkKm: 8900,
      electricityAccess: 72.4,
      internetPenetration: 68.9,
      doctorPopulationRatio: '1:19000',
      nursePopulationRatio: '1:900',
      maternalMortalityRate: 362,
      infantMortalityRate: 39,
      annualHealthBudget: 11.3,
      healthBudgetPercentage: 24.1,
      isMarginalized: false
    }
  ]

  for (const county of counties) {
    await prisma.county.create({ data: county })
  }
}

async function seedHospitals() {
  console.log('🏥 Seeding hospitals...')
  
  // Clear existing hospitals first to avoid conflicts
  await prisma.hospital.deleteMany({})

  const hospitals = [
    {
      id: 'hosp-001',
      name: 'Kenyatta National Hospital',
      code: 'KNH-001',
      mflCode: 'MFL-001',
      type: 'PUBLIC',
      level: 'LEVEL_6',
      ownership: 'NATIONAL_GOVERNMENT',
      countyId: 'county-001',
      subCounty: 'Nairobi West',
      ward: 'Mbagathi',
      constituency: 'Dagoretti South',
      address: 'Hospital Road, Nairobi',
      coordinates: { lat: -1.3045, lng: 36.8012 },
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
      powerStatus: 'GRID',
      backupPower: true,
      waterStatus: 'AVAILABLE',
      oxygenStatus: 'AVAILABLE',
      internetStatus: 'AVAILABLE',
      shaContracted: true,
      shaFacilityCode: 'SHA-KNH-001',
      shaActivationDate: new Date('2023-01-15'),
      kephLevel: 'LEVEL_6',
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
      operationalStatus: 'OPERATIONAL',
      acceptingPatients: true,
      emergencyOnlyMode: false,
      managedByCounty: false,
      autonomyLevel: 'NATIONAL_OVERSIGHT',
      hospitalBoard: 'KNH Board of Management'
    },
    {
      id: 'hosp-002',
      name: 'Mombasa County Hospital',
      code: 'MCH-001',
      mflCode: 'MFL-002',
      type: 'PUBLIC',
      level: 'LEVEL_5',
      ownership: 'COUNTY_GOVERNMENT',
      countyId: 'county-002',
      subCounty: 'Mvita',
      ward: 'Tudor',
      constituency: 'Mvita',
      address: 'Mama Ngina Drive, Mombasa',
      coordinates: { lat: -4.0547, lng: 39.6636 },
      what3words: 'cabinets.spices.tidal',
      elevation: 15,
      accessibilityScore: 88,
      distanceToNearestTarmac: 0.8,
      reachableInRainySeason: true,
      phone: '+254-41-2312001',
      emergencyPhone: '+254-722-456789',
      ambulancePhone: '+254-733-654321',
      email: 'info@mombasahospital.go.ke',
      website: null,
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
      powerStatus: 'GRID',
      backupPower: true,
      waterStatus: 'AVAILABLE',
      oxygenStatus: 'LIMITED',
      internetStatus: 'AVAILABLE',
      shaContracted: true,
      shaFacilityCode: 'SHA-MCH-001',
      shaActivationDate: new Date('2023-03-20'),
      kephLevel: 'LEVEL_5',
      services: ['EMERGENCY', 'MATERNITY', 'SURGERY', 'ICU', 'PEDIATRICS'],
      specializations: ['SURGERY', 'MATERNITY', 'PEDIATRICS'],
      has24HourService: true,
      hasAmbulance: true,
      hasBloodBank: false,
      hasLaboratory: true,
      hasRadiology: true,
      hasCTScan: false,
      hasMRI: false,
      hasDialysis: false,
      hasPharmacy: true,
      hasOxygenPlant: false,
      hasMortuary: true,
      telemedicineEnabled: true,
      canReceiveReferrals: true,
      canGiveConsultations: false,
      isActive: true,
      operationalStatus: 'OPERATIONAL',
      acceptingPatients: true,
      emergencyOnlyMode: false,
      managedByCounty: true,
      autonomyLevel: 'COUNTY_MANAGED',
      hospitalBoard: 'Mombasa County Health Board'
    },
    {
      id: 'hosp-003',
      name: 'Jaramogi Oginga Odinga Teaching & Referral Hospital',
      code: 'JOOTRH-001',
      mflCode: 'MFL-003',
      type: 'PUBLIC',
      level: 'LEVEL_5',
      ownership: 'NATIONAL_GOVERNMENT',
      countyId: 'county-003',
      subCounty: 'Kisumu Central',
      ward: 'Milimani',
      constituency: 'Kisumu Central',
      address: 'Off Kisumu-Busia Road, Kisumu',
      coordinates: { lat: -0.0917, lng: 34.7679 },
      what3words: 'lakes.tropical.views',
      elevation: 1131,
      accessibilityScore: 82,
      distanceToNearestTarmac: 1.2,
      reachableInRainySeason: true,
      phone: '+254-57-2020001',
      emergencyPhone: '+254-722-789012',
      ambulancePhone: '+254-733-890123',
      email: 'info@jootrh.go.ke',
      website: 'https://jootrh.go.ke',
      totalBeds: 550,
      functionalBeds: 500,
      icuBeds: 15,
      hdUnitBeds: 8,
      maternityBeds: 75,
      pediatricBeds: 60,
      emergencyBeds: 40,
      isolationBeds: 20,
      availableBeds: 120,
      availableIcuBeds: 4,
      availableEmergencyBeds: 15,
      lastBedUpdate: new Date(),
      powerStatus: 'GRID',
      backupPower: true,
      waterStatus: 'AVAILABLE',
      oxygenStatus: 'AVAILABLE',
      internetStatus: 'INTERMITTENT',
      shaContracted: true,
      shaFacilityCode: 'SHA-JOOTRH-001',
      shaActivationDate: new Date('2023-02-10'),
      kephLevel: 'LEVEL_5',
      services: ['EMERGENCY', 'MATERNITY', 'SURGERY', 'ICU', 'PEDIATRICS', 'RADIOLOGY'],
      specializations: ['SURGERY', 'MATERNITY', 'PEDIATRICS', 'INTERNAL_MEDICINE'],
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
      managedByCounty: false,
      autonomyLevel: 'SEMI_AUTONOMOUS',
      hospitalBoard: 'JOOTRH Board of Management'
    },
    {
      id: 'hosp-004',
      name: 'Mandera County Referral Hospital',
      code: 'MCRH-001',
      mflCode: 'MFL-004',
      type: 'PUBLIC',
      level: 'LEVEL_4',
      ownership: 'COUNTY_GOVERNMENT',
      countyId: 'county-004',
      subCounty: 'Mandera East',
      ward: 'Mandera Central',
      constituency: 'Mandera East',
      address: 'Mandera Town, Mandera County',
      coordinates: { lat: 3.9367, lng: 41.8592 },
      what3words: 'desert.camels.oasis',
      elevation: 235,
      accessibilityScore: 45,
      distanceToNearestTarmac: 15.5,
      reachableInRainySeason: false,
      phone: '+254-46-2100001',
      emergencyPhone: '+254-722-345678',
      ambulancePhone: '+254-733-234567',
      email: 'manderahospital@mandera.go.ke',
      website: null,
      totalBeds: 120,
      functionalBeds: 95,
      icuBeds: 4,
      hdUnitBeds: 2,
      maternityBeds: 25,
      pediatricBeds: 20,
      emergencyBeds: 15,
      isolationBeds: 8,
      availableBeds: 25,
      availableIcuBeds: 1,
      availableEmergencyBeds: 6,
      lastBedUpdate: new Date(),
      powerStatus: 'GENERATOR',
      backupPower: true,
      waterStatus: 'LIMITED',
      oxygenStatus: 'CRITICAL',
      internetStatus: 'INTERMITTENT',
      shaContracted: false,
      shaFacilityCode: null,
      shaActivationDate: null,
      kephLevel: 'LEVEL_4',
      services: ['EMERGENCY', 'MATERNITY', 'OUTPATIENT'],
      specializations: ['GENERAL_MEDICINE', 'MATERNITY'],
      has24HourService: false,
      hasAmbulance: true,
      hasBloodBank: false,
      hasLaboratory: true,
      hasRadiology: false,
      hasCTScan: false,
      hasMRI: false,
      hasDialysis: false,
      hasPharmacy: true,
      hasOxygenPlant: false,
      hasMortuary: true,
      telemedicineEnabled: false,
      canReceiveReferrals: true,
      canGiveConsultations: false,
      isActive: true,
      operationalStatus: 'LIMITED_CAPACITY',
      acceptingPatients: true,
      emergencyOnlyMode: false,
      managedByCounty: true,
      autonomyLevel: 'COUNTY_MANAGED',
      hospitalBoard: null
    },
    {
      id: 'hosp-005',
      name: 'Nakuru Level 5 Hospital',
      code: 'NL5H-001',
      mflCode: 'MFL-005',
      type: 'PUBLIC',
      level: 'LEVEL_5',
      ownership: 'COUNTY_GOVERNMENT',
      countyId: 'county-005',
      subCounty: 'Nakuru East',
      ward: 'Biashara',
      constituency: 'Nakuru Town East',
      address: 'Kenyatta Avenue, Nakuru',
      coordinates: { lat: -0.2875, lng: 36.0753 },
      what3words: 'flamingos.lakeside.views',
      elevation: 1850,
      accessibilityScore: 90,
      distanceToNearestTarmac: 0.3,
      reachableInRainySeason: true,
      phone: '+254-51-2210001',
      emergencyPhone: '+254-722-567890',
      ambulancePhone: '+254-733-456789',
      email: 'info@nakuruhospital.go.ke',
      website: null,
      totalBeds: 380,
      functionalBeds: 350,
      icuBeds: 10,
      hdUnitBeds: 4,
      maternityBeds: 50,
      pediatricBeds: 40,
      emergencyBeds: 30,
      isolationBeds: 12,
      availableBeds: 75,
      availableIcuBeds: 2,
      availableEmergencyBeds: 10,
      lastBedUpdate: new Date(),
      powerStatus: 'GRID',
      backupPower: true,
      waterStatus: 'AVAILABLE',
      oxygenStatus: 'AVAILABLE',
      internetStatus: 'AVAILABLE',
      shaContracted: true,
      shaFacilityCode: 'SHA-NL5H-001',
      shaActivationDate: new Date('2023-04-05'),
      kephLevel: 'LEVEL_5',
      services: ['EMERGENCY', 'MATERNITY', 'SURGERY', 'ICU', 'PEDIATRICS'],
      specializations: ['SURGERY', 'MATERNITY', 'PEDIATRICS'],
      has24HourService: true,
      hasAmbulance: true,
      hasBloodBank: false,
      hasLaboratory: true,
      hasRadiology: true,
      hasCTScan: false,
      hasMRI: false,
      hasDialysis: false,
      hasPharmacy: true,
      hasOxygenPlant: false,
      hasMortuary: true,
      telemedicineEnabled: true,
      canReceiveReferrals: true,
      canGiveConsultations: false,
      isActive: true,
      operationalStatus: 'OPERATIONAL',
      acceptingPatients: true,
      emergencyOnlyMode: false,
      managedByCounty: true,
      autonomyLevel: 'COUNTY_MANAGED',
      hospitalBoard: 'Nakuru County Health Board'
    }
  ]

  for (const hospital of hospitals) {
    await prisma.hospital.create({ 
      data: hospital 
    })
    console.log(`✅ Created hospital: ${hospital.name}`)
  }
}


async function seedHealthCenters() {
  console.log('🏥 Seeding health centers...')
  const healthCenters = [
    {
      id: 'hc-001',
      name: 'Kibera South Health Center',
      code: 'HC-KIB-001',
      mflCode: 'MFL-HC-001',
      level: 'LEVEL_3',
      countyId: 'county-001',
      subCounty: 'Nairobi West',
      ward: 'Kibera',
      coordinates: { lat: -1.3145, lng: 36.7889 },
      what3words: 'informal.settlements.community',
      phone: '+254-20-2345678',
      beds: 25,
      hasMaternity: true,
      hasLaboratory: true,
      hasMinorTheatre: true,
      has24HourService: false,
      telemedicineEnabled: true,
      canRefer: true,
      shaContracted: true,
      shaFacilityCode: 'SHA-HC-001',
      isActive: true
    },
    {
      id: 'hc-002',
      name: 'Likoni Health Center',
      code: 'HC-LIK-001',
      mflCode: 'MFL-HC-002',
      level: 'LEVEL_3',
      countyId: 'county-002',
      subCounty: 'Likoni',
      ward: 'Likoni',
      coordinates: { lat: -4.0892, lng: 39.6601 },
      what3words: 'ferry.coastal.community',
      phone: '+254-41-2456789',
      beds: 20,
      hasMaternity: true,
      hasLaboratory: true,
      hasMinorTheatre: false,
      has24HourService: false,
      telemedicineEnabled: false,
      canRefer: true,
      shaContracted: true,
      shaFacilityCode: 'SHA-HC-002',
      isActive: true
    }
  ]

  for (const hc of healthCenters) {
    await prisma.healthCenter.create({ data: hc })
    console.log(`✅ Created health center: ${hc.name}`)
  }
}

async function seedDispensaries() {
  console.log('🏥 Seeding dispensaries...')
  const dispensaries = [
    {
      id: 'disp-001',
      name: 'Kawangware Dispensary',
      code: 'DISP-KAW-001',
      mflCode: 'MFL-DISP-001',
      countyId: 'county-001',
      ward: 'Kawangware',
      coordinates: { lat: -1.2987, lng: 36.7654 },
      what3words: 'urban.community.basic',
      phone: '+254-20-2456789',
      hasPharmacy: true,
      canRefer: true,
      telemedicineEnabled: false,
      shaContracted: true,
      shaFacilityCode: 'SHA-DISP-001',
      isActive: true
    },
    {
      id: 'disp-002',
      name: 'Mtongwe Dispensary',
      code: 'DISP-MTO-001',
      mflCode: 'MFL-DISP-002',
      countyId: 'county-002',
      ward: 'Mtongwe',
      coordinates: { lat: -4.0567, lng: 39.6123 },
      what3words: 'coastal.basic.care',
      phone: '+254-41-2567890',
      hasPharmacy: true,
      canRefer: true,
      telemedicineEnabled: false,
      shaContracted: true,
      shaFacilityCode: 'SHA-DISP-002',
      isActive: true
    }
  ]

  for (const disp of dispensaries) {
    await prisma.dispensary.create({ data: disp })
    console.log(`✅ Created dispensary: ${disp.name}`)
  }
}

async function seedCommunityHealthUnits() {
  console.log('🏘️  Seeding community health units...')
  const chus = [
    {
      id: 'chu-001',
      name: 'Kibera CHU',
      code: 'CHU-KIB-001',
      countyId: 'county-001',
      ward: 'Kibera',
      village: 'Soweto',
      linkedFacility: 'HC-KIB-001',
      linkedFacilityType: 'HEALTH_CENTER',
      householdsRegistered: 850,
      populationCovered: 4250,
      isActive: true
    },
    {
      id: 'chu-002',
      name: 'Mikindani CHU',
      code: 'CHU-MIK-001',
      countyId: 'county-002',
      ward: 'Mikindani',
      village: 'Mikindani',
      linkedFacility: 'DISP-MTO-001',
      linkedFacilityType: 'DISPENSARY',
      householdsRegistered: 620,
      populationCovered: 3100,
      isActive: true
    }
  ]

  for (const chu of chus) {
    await prisma.communityHealthUnit.create({ data: chu })
    console.log(`✅ Created CHU: ${chu.name}`)
  }
}

async function seedDepartments() {
  console.log('🏢 Seeding departments...')
  const departments = [
    {
      id: 'dept-001',
      name: 'Accident & Emergency',
      type: 'ACCIDENT_EMERGENCY',
      hospitalId: 'hosp-001',
      hodName: 'Dr. James Kamau',
      hodPhone: '+254-722-111111',
      totalBeds: 85,
      availableBeds: 25,
      occupancyRate: 70.6,
      isActive: true,
      isAcceptingPatients: true
    },
    {
      id: 'dept-002',
      name: 'Intensive Care Unit',
      type: 'ICU',
      hospitalId: 'hosp-001',
      hodName: 'Dr. Susan Wanjiku',
      hodPhone: '+254-722-111112',
      totalBeds: 45,
      availableBeds: 12,
      occupancyRate: 73.3,
      isActive: true,
      isAcceptingPatients: true
    }
  ]

  for (const dept of departments) {
    await prisma.department.create({ data: dept })
    console.log(`✅ Created department: ${dept.name}`)
  }
}

async function seedCommunityHealthPromoters() {
  console.log('👩‍⚕️ Seeding community health promoters...')
  const chps = [
    {
      id: 'chp-001',
      firstName: 'Faith',
      lastName: 'Wambui',
      phone: '+254-723-100001',
      nationalId: '67890123',
      communityHealthUnitId: 'chu-001',
      countyId: 'county-001',
      householdsAssigned: 150,
      trainingLevel: 'CERTIFIED',
      certificationDate: new Date('2022-06-15'),
      isActive: true
    },
    {
      id: 'chp-002',
      firstName: 'Hassan',
      lastName: 'Ali',
      phone: '+254-723-100002',
      nationalId: '78901234',
      communityHealthUnitId: 'chu-002',
      countyId: 'county-002',
      householdsAssigned: 120,
      trainingLevel: 'ADVANCED',
      certificationDate: new Date('2023-02-20'),
      isActive: true
    }
  ]

  for (const chp of chps) {
    await prisma.communityHealthPromoter.create({ data: chp })
    console.log(`✅ Created CHP: ${chp.firstName} ${chp.lastName}`)
  }
}

async function seedPatients() {
  console.log('👤 Seeding patients...')
  const patients = [
    {
      id: 'patient-001',
      patientNumber: 'PAT-KNH-001',
      nationalId: '10000001',
      firstName: 'Samuel',
      lastName: 'Gitonga',
      dateOfBirth: new Date('1985-06-15'),
      gender: 'MALE',
      phone: '+254-724-100001',
      countyOfResidence: 'Nairobi',
      subCounty: 'Westlands',
      ward: 'Kitisuru',
      bloodType: 'O_POSITIVE',
      allergies: ['Penicillin', 'Sulfa'],
      chronicConditions: ['Hypertension'],
      shaNumber: 'SHA-00123456',
      shaStatus: 'REGISTERED',
      contributionStatus: 'UP_TO_DATE',
      shaRegistrationDate: new Date('2023-03-20'),
      outstandingBills: 0,
      totalPaid: 15000,
      currentHospitalId: 'hosp-001',
      currentStatus: 'REGISTERED'
    },
    {
      id: 'patient-002',
      patientNumber: 'PAT-MCH-001',
      nationalId: '10000002',
      firstName: 'Aisha',
      lastName: 'Mohamed',
      dateOfBirth: new Date('1992-09-22'),
      gender: 'FEMALE',
      phone: '+254-724-100002',
      countyOfResidence: 'Mombasa',
      subCounty: 'Mvita',
      ward: 'Tudor',
      bloodType: 'A_POSITIVE',
      allergies: [],
      chronicConditions: ['Asthma'],
      shaNumber: 'SHA-00123457',
      shaStatus: 'REGISTERED',
      contributionStatus: 'UP_TO_DATE',
      shaRegistrationDate: new Date('2023-04-15'),
      outstandingBills: 2500,
      totalPaid: 8000,
      currentHospitalId: 'hosp-002',
      currentStatus: 'IN_TRIAGE'
    }
  ]

  for (const patient of patients) {
    await prisma.patient.create({ data: patient })
    console.log(`✅ Created patient: ${patient.firstName} ${patient.lastName}`)
  }
}

// Add stub functions for the remaining seed operations to avoid errors
async function seedTriageEntries() {
  console.log('🚑 Seeding triage entries...')
  // Implementation can be added later
}

async function seedReferrals() {
  console.log('🔄 Seeding referrals...')
  // Implementation can be added later
}

async function seedAmbulances() {
  console.log('🚑 Seeding ambulances...')
  // Implementation can be added later
}

async function seedCountyAmbulances() {
  console.log('🚑 Seeding county ambulances...')
  // Implementation can be added later
}

async function seedDispatchCenters() {
  console.log('📞 Seeding dispatch centers...')
  // Implementation can be added later
}

async function seedDispatchLogs() {
  console.log('📋 Seeding dispatch logs...')
  // Implementation can be added later
}

async function seedTransfers() {
  console.log('🔄 Seeding transfers...')
  // Implementation can be added later
}

async function seedEmergencies() {
  console.log('🚨 Seeding emergencies...')
  // Implementation can be added later
}

async function seedEmergencyResponses() {
  console.log('🚑 Seeding emergency responses...')
  // Implementation can be added later
}

async function seedResources() {
  console.log('📦 Seeding resources...')
  // Implementation can be added later
}

async function seedSupplyRequests() {
  console.log('📋 Seeding supply requests...')
  // Implementation can be added later
}

async function seedProcurements() {
  console.log('🛒 Seeding procurements...')
  // Implementation can be added later
}

async function seedSHAClaims() {
  console.log('💰 Seeding SHA claims...')
  // Implementation can be added later
}

async function seedFinancialRecords() {
  console.log('💳 Seeding financial records...')
  // Implementation can be added later
}

async function seedPerformanceMetrics() {
  console.log('📊 Seeding performance metrics...')
  // Implementation can be added later
}

async function seedSystemAlerts() {
  console.log('⚠️  Seeding system alerts...')
  // Implementation can be added later
}

async function seedAuditLogs() {
  console.log('📝 Seeding audit logs...')
  // Implementation can be added later
}

async function seedTelemedicineHubs() {
  console.log('📡 Seeding telemedicine hubs...')
  // Implementation can be added later
}

async function seedTelemedicineSessions() {
  console.log('💻 Seeding telemedicine sessions...')
  // Implementation can be added later
}

async function seedNationalHealthCoordination() {
  console.log('🇰🇪 Seeding national health coordination...')
  // Implementation can be added later
}


async function seedStaff() {
  console.log('👨‍⚕️ Seeding staff...')
  
  // Clear existing staff first
  await prisma.staff.deleteMany({})

  const staff = [
    // Super Admin
    {
      id: 'staff-superadmin',
      userId: 'superadmin-001',
      staffNumber: 'SUPER-ADMIN-001',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@health.go.ke',
      phone: '+254-722-000001',
      nationalId: '30000001',
      role: 'ADMINISTRATOR',
      specialization: 'System Administration',
      licenseNumber: 'SYS-ADMIN-001',
      licensingBody: 'Ministry of Health',
      yearsOfExperience: 10,
      facilityType: 'HOSPITAL',
      hospitalId: 'hosp-001',
      departmentId: null,
      employmentType: 'PERMANENT',
      contractType: 'NATIONAL',
      hireDate: new Date('2020-01-15'),
      monthlySalary: 500000,
      lastPaidDate: new Date('2024-01-31'),
      pendingSalaryMonths: 0,
      isActive: true,
      isOnDuty: true,
      currentCaseload: 0,
      maxCaseload: 100,
      telemedicineEnabled: true,
      canGiveRemoteConsultations: true
    },
    // County Admin
    {
      id: 'staff-countyadmin',
      userId: 'countyadmin-001',
      staffNumber: 'COUNTY-ADMIN-001',
      firstName: 'County',
      lastName: 'Admin',
      email: 'countyadmin@health.go.ke',
      phone: '+254-722-000002',
      nationalId: '30000002',
      role: 'ADMINISTRATOR',
      specialization: 'Health Administration',
      licenseNumber: 'COUNTY-ADMIN-001',
      licensingBody: 'County Government',
      yearsOfExperience: 8,
      facilityType: 'HOSPITAL',
      hospitalId: 'hosp-002',
      departmentId: null,
      employmentType: 'PERMANENT',
      contractType: 'COUNTY',
      hireDate: new Date('2021-03-20'),
      monthlySalary: 350000,
      lastPaidDate: new Date('2024-01-31'),
      pendingSalaryMonths: 0,
      isActive: true,
      isOnDuty: true,
      currentCaseload: 0,
      maxCaseload: 50,
      telemedicineEnabled: true,
      canGiveRemoteConsultations: false
    },
    // Hospital Admin
    {
      id: 'staff-hospitaladmin',
      userId: 'hospitaladmin-001',
      staffNumber: 'HOSP-ADMIN-001',
      firstName: 'Hospital',
      lastName: 'Admin',
      email: 'hospitaladmin@health.go.ke',
      phone: '+254-722-000003',
      nationalId: '30000003',
      role: 'ADMINISTRATOR',
      specialization: 'Hospital Management',
      licenseNumber: 'HOSP-ADMIN-001',
      licensingBody: 'Hospital Board',
      yearsOfExperience: 6,
      facilityType: 'HOSPITAL',
      hospitalId: 'hosp-001',
      departmentId: null,
      employmentType: 'PERMANENT',
      contractType: 'COUNTY',
      hireDate: new Date('2022-02-10'),
      monthlySalary: 280000,
      lastPaidDate: new Date('2024-01-31'),
      pendingSalaryMonths: 0,
      isActive: true,
      isOnDuty: true,
      currentCaseload: 0,
      maxCaseload: 25,
      telemedicineEnabled: true,
      canGiveRemoteConsultations: false
    },
    // Doctor
    {
      id: 'staff-doctor',
      userId: 'doctor-001',
      staffNumber: 'DOCTOR-001',
      firstName: 'Medical',
      lastName: 'Doctor',
      email: 'doctor@health.go.ke',
      phone: '+254-722-000004',
      nationalId: '30000004',
      role: 'MEDICAL_OFFICER',
      specialization: 'Emergency Medicine',
      licenseNumber: 'MPDB-001234',
      licensingBody: 'Medical Practitioners & Dentists Board',
      yearsOfExperience: 7,
      facilityType: 'HOSPITAL',
      hospitalId: 'hosp-001',
      departmentId: 'dept-001',
      employmentType: 'PERMANENT',
      contractType: 'NATIONAL',
      hireDate: new Date('2019-05-15'),
      monthlySalary: 220000,
      lastPaidDate: new Date('2024-01-31'),
      pendingSalaryMonths: 0,
      isActive: true,
      isOnDuty: true,
      currentCaseload: 15,
      maxCaseload: 20,
      telemedicineEnabled: true,
      canGiveRemoteConsultations: true
    },
    // Nurse
    {
      id: 'staff-nurse',
      userId: 'nurse-001',
      staffNumber: 'NURSE-001',
      firstName: 'Nursing',
      lastName: 'Staff',
      email: 'nurse@health.go.ke',
      phone: '+254-722-000005',
      nationalId: '30000005',
      role: 'NURSE',
      specialization: 'Emergency Nursing',
      licenseNumber: 'NCK-001234',
      licensingBody: 'Nursing Council of Kenya',
      yearsOfExperience: 5,
      facilityType: 'HOSPITAL',
      hospitalId: 'hosp-001',
      departmentId: 'dept-001',
      employmentType: 'PERMANENT',
      contractType: 'COUNTY',
      hireDate: new Date('2020-08-20'),
      monthlySalary: 120000,
      lastPaidDate: new Date('2024-01-31'),
      pendingSalaryMonths: 0,
      isActive: true,
      isOnDuty: true,
      currentCaseload: 12,
      maxCaseload: 15,
      telemedicineEnabled: false,
      canGiveRemoteConsultations: false
    },
    // Triage Officer
    {
      id: 'staff-triage',
      userId: 'triage-001',
      staffNumber: 'TRIAGE-001',
      firstName: 'Triage',
      lastName: 'Officer',
      email: 'triage@health.go.ke',
      phone: '+254-722-000006',
      nationalId: '30000006',
      role: 'TRIAGE_NURSE',
      specialization: 'Emergency Triage',
      licenseNumber: 'TRIAGE-001',
      licensingBody: 'Ministry of Health',
      yearsOfExperience: 4,
      facilityType: 'HOSPITAL',
      hospitalId: 'hosp-001',
      departmentId: 'dept-001',
      employmentType: 'PERMANENT',
      contractType: 'COUNTY',
      hireDate: new Date('2021-11-10'),
      monthlySalary: 95000,
      lastPaidDate: new Date('2024-01-31'),
      pendingSalaryMonths: 0,
      isActive: true,
      isOnDuty: true,
      currentCaseload: 8,
      maxCaseload: 10,
      telemedicineEnabled: false,
      canGiveRemoteConsultations: false
    },
    // Dispatcher
    {
      id: 'staff-dispatcher',
      userId: 'dispatcher-001',
      staffNumber: 'DISPATCHER-001',
      firstName: 'Dispatch',
      lastName: 'Coordinator',
      email: 'dispatcher@health.go.ke',
      phone: '+254-722-000007',
      nationalId: '30000007',
      role: 'DISPATCHER',
      specialization: 'Emergency Dispatch',
      licenseNumber: 'DISPATCH-001',
      licensingBody: 'Ministry of Health',
      yearsOfExperience: 3,
      facilityType: 'HOSPITAL',
      hospitalId: 'hosp-001',
      departmentId: null,
      employmentType: 'PERMANENT',
      contractType: 'COUNTY',
      hireDate: new Date('2022-04-05'),
      monthlySalary: 85000,
      lastPaidDate: new Date('2024-01-31'),
      pendingSalaryMonths: 0,
      isActive: true,
      isOnDuty: true,
      currentCaseload: 5,
      maxCaseload: 8,
      telemedicineEnabled: false,
      canGiveRemoteConsultations: false
    },
    // Ambulance Driver
    {
      id: 'staff-ambulance',
      userId: 'ambulance-001',
      staffNumber: 'AMBULANCE-001',
      firstName: 'Ambulance',
      lastName: 'Driver',
      email: 'ambulance@health.go.ke',
      phone: '+254-722-000008',
      nationalId: '30000008',
      role: 'AMBULANCE_DRIVER',
      specialization: 'Emergency Transport',
      licenseNumber: 'AMB-DRIVER-001',
      licensingBody: 'NTSA',
      yearsOfExperience: 6,
      facilityType: 'HOSPITAL',
      hospitalId: 'hosp-001',
      departmentId: null,
      employmentType: 'PERMANENT',
      contractType: 'COUNTY',
      hireDate: new Date('2020-12-15'),
      monthlySalary: 75000,
      lastPaidDate: new Date('2024-01-31'),
      pendingSalaryMonths: 0,
      isActive: true,
      isOnDuty: true,
      currentCaseload: 3,
      maxCaseload: 5,
      telemedicineEnabled: false,
      canGiveRemoteConsultations: false
    }
  ]

  for (const staffMember of staff) {
    await prisma.staff.create({ data: staffMember })
    console.log(`✅ Created staff: ${staffMember.firstName} ${staffMember.lastName} (${staffMember.email})`)
  }
}


main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })