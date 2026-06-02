import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

@Controller('public')
export class PublicController {
  @Get(':tenantSlug/site-config')
  async siteConfig(@Param('tenantSlug') tenantSlug:string){
    const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } })
    if(!tenant) throw new NotFoundException('tenant_not_found')
    const siteConfig = await prisma.siteConfig.findUnique({ where: { tenantId: tenant.id } })
    return { tenant, siteConfig }
  }

  @Get(':tenantSlug/contents')
  async list(@Param('tenantSlug') tenantSlug:string){
    const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } })
    if(!tenant) return []
    const contents = await prisma.content.findMany({
      where: { tenantId: tenant.id, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      include: { category: true, tags: true, thumbnail: true, ogImage: true }
    })
    contents.forEach((c:any) => prisma.content.update({ where: { id: c.id }, data: { viewCount: { increment: 1 } } }).catch(()=>{}))
    return contents
  }

  @Get(':tenantSlug/contents/:slug')
  async detail(@Param('tenantSlug') tenantSlug:string, @Param('slug') slug:string){
    const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } })
    if(!tenant) throw new NotFoundException('tenant_not_found')
    const content = await prisma.content.findFirst({
      where: { tenantId: tenant.id, slug, status: 'PUBLISHED' },
      include: { category: true, tags: true, thumbnail: true, ogImage: true }
    })
    if(!content) throw new NotFoundException('article_not_found')
    await prisma.content.update({ where: { id: content.id }, data: { viewCount: { increment: 1 } } }).catch(()=>{})
    return content
  }

  @Get(':tenantSlug/media/:mediaId/presigned')
  async presignedMedia(@Param('tenantSlug') tenantSlug:string, @Param('mediaId') mediaId:string){
    const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } })
    if(!tenant) throw new NotFoundException('tenant_not_found')
    const media = await prisma.media.findFirst({ where: { id: mediaId, tenantId: tenant.id } })
    if(!media) throw new NotFoundException('media_not_found')
    const base = process.env.MINIO_PUBLIC_URL || 'https://minio.local'
    return {
      downloadUrl: `${base}/${encodeURIComponent(media.storageKey)}`,
      filename: media.originalName,
      mimeType: media.mimeType,
    }
  }
}
