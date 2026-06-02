import { PrismaClient, Role, ContentStatus, ContentType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Super admin (global)
  const superAdmin = await prisma.user.create({
    data: {
      id: undefined,
      tenantId: undefined as any,
      email: 'superadmin@milpers.local',
      passwordHash: 'changeme',
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  }).catch(() => null)

  // Create two tenants
  const t1 = await prisma.tenant.create({ data: { slug: 'batalion-1', name: 'Batalion 1' } })
  const t2 = await prisma.tenant.create({ data: { slug: 'batalion-2', name: 'Batalion 2' } })

  // For each tenant, create admin + 2 staff and 5 contents
  for (const tenant of [t1, t2]) {
    const admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `${tenant.slug}.admin@milpers.local`,
        passwordHash: 'changeme',
        fullName: `${tenant.name} Admin`,
        role: Role.ADMIN,
      },
    })

    const staff1 = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `${tenant.slug}.staff1@milpers.local`,
        passwordHash: 'changeme',
        fullName: `${tenant.name} Staff 1`,
        role: Role.STAFF,
      },
    })

    const staff2 = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `${tenant.slug}.staff2@milpers.local`,
        passwordHash: 'changeme',
        fullName: `${tenant.name} Staff 2`,
        role: Role.STAFF,
      },
    })

    // create 5 contents with varying status
    const statuses = [ContentStatus.DRAFT, ContentStatus.IN_REVIEW, ContentStatus.APPROVED, ContentStatus.PUBLISHED, ContentStatus.REJECTED]
    for (let i = 0; i < 5; i++) {
      await prisma.content.create({
        data: {
          tenantId: tenant.id,
          authorId: i % 2 === 0 ? staff1.id : staff2.id,
          title: `Contoh Konten ${i + 1} - ${tenant.slug}`,
          slug: `contoh-konten-${i + 1}`,
          body: `<p>Ini isi konten contoh ${i + 1}</p>`,
          contentType: ContentType.ARTICLE,
          status: statuses[i],
        },
      })
    }
  }

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
