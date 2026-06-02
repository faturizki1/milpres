const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main(){
  const t = await prisma.tenant.findMany({ take: 20 })
  console.log('tenants:', t.map(x=>({id:x.id,slug:x.slug,name:x.name})))
  process.exit(0)
}
main().catch(e=>{ console.error(e); process.exit(1) })
