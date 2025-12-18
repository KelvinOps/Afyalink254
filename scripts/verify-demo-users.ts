// scripts/verify-demo-users.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDemoUsers() {
  console.log('🔍 Verifying demo users in database...')
  
  const demoUsers = [
    'superadmin@health.go.ke',
    'countyadmin@health.go.ke',
    'hospitaladmin@health.go.ke',
    'doctor@health.go.ke',
    'nurse@health.go.ke',
    'triage@health.go.ke',
    'dispatcher@health.go.ke',
    'ambulance@health.go.ke'
  ]

  try {
    for (const email of demoUsers) {
      const user = await prisma.staff.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          hospital: { select: { name: true } },
          healthCenter: { select: { name: true } },
          dispensary: { select: { name: true } }
        }
      })
      
      if (user) {
        console.log(`✅ ${email}: ${user.firstName} ${user.lastName} (${user.role}) - ${user.isActive ? 'Active' : 'Inactive'}`)
        if (user.hospital) console.log(`   🏥 Hospital: ${user.hospital.name}`)
        if (user.healthCenter) console.log(`   🏥 Health Center: ${user.healthCenter.name}`)
        if (user.dispensary) console.log(`   🏥 Dispensary: ${user.dispensary.name}`)
      } else {
        console.log(`❌ ${email}: NOT FOUND`)
      }
    }
  } catch (error) {
    console.error('Error verifying users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDemoUsers()