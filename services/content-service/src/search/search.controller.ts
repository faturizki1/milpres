import { Controller, Get, Query } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

@Controller('search')
export class SearchController {
  @Get()
  async search(@Query('q') q:string, @Query('tenantSlug') tenantSlug:string){
    if(!q) return []
    const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } })
    if(!tenant) return []
    // use plainto_tsquery and to_tsvector on title+body
    const rows = await prisma.$queryRawUnsafe(`SELECT id, title, slug, ts_rank_cd( (setweight(to_tsvector('indonesian', coalesce(title,'')), 'A') || setweight(to_tsvector('indonesian', coalesce(body,'')), 'B')) , plainto_tsquery('indonesian', $1)) as rank FROM "Content" WHERE "tenantId" = $2 AND status = 'PUBLISHED' ORDER BY rank DESC LIMIT 50`, q, tenant.id)
    return rows
  }
}
