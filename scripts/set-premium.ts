import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.update({
    where: { email: 'wisshab68@gmail.com' },
    data: {
      subscriptionStatus: 'active',
      subscriptionId: 'manual_founder',
      stripeCustomerId: 'manual_founder'
    }
  })
  console.log('Done — compte mis en Premium')
}

main().catch(console.error).finally(() => prisma.$disconnect())
