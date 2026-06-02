const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main(){
  const rows = await prisma.auditLog.findMany({
    where: { action: { contains: 'auth.login' } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  console.log('recent auth.login audit rows:', rows.length)
  for(const r of rows) console.log(r.action, r.actorId, r.payload)
  process.exit(0)
}

main().catch(e=>{ console.error(e); process.exit(1) })
