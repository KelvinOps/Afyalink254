import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTableCounts() {
  console.log('🔢 Table Record Counts:\n')

  const tables = [
    { name: 'Counties', count: await prisma.county.count() },
    { name: 'Hospitals', count: await prisma.hospital.count() },
    { name: 'Health Centers', count: await prisma.healthCenter.count() },
    { name: 'Dispensaries', count: await prisma.dispensary.count() },
    { name: 'Departments', count: await prisma.department.count() },
    { name: 'Staff', count: await prisma.staff.count() },
    { name: 'Patients', count: await prisma.patient.count() },
    { name: 'Triage Entries', count: await prisma.triageEntry.count() },
    { name: 'Referrals', count: await prisma.referral.count() },
    { name: 'Ambulances', count: await prisma.ambulance.count() },
    { name: 'SHA Claims', count: await prisma.sHAClaim.count() },
  ]

  tables.forEach(table => {
    const status = table.count > 0 ? '✅' : '❌'
    console.log(`${status} ${table.name}: ${table.count} records`)
  })

  await prisma.$disconnect()
}

checkTableCounts()