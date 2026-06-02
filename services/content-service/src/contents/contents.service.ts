import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaClient, ContentStatus } from '@prisma/client'
import slugify from 'slugify'
import createDOMPurify from 'isomorphic-dompurify'
import { JSDOM } from 'jsdom'

const prisma = new PrismaClient()
const DOMPurify = createDOMPurify(new JSDOM('').window)

const VALID_TRANSITIONS: Record<string,string[]> = {
  DRAFT: ['IN_REVIEW','DELETED'],
  IN_REVIEW: ['APPROVED','REJECTED','DELETED'],
  APPROVED: ['PUBLISHED','DELETED'],
  PUBLISHED: ['ARCHIVED','DELETED'],
  REJECTED: ['DRAFT','DELETED'],
}

@Injectable()
export class ContentsService {
  async create(tenantId:string, data:any){
    const title = data.title
    const bodyRaw = data.body || ''
    const sanitized = DOMPurify.sanitize(bodyRaw)
    const slugBase = slugify(title || '', { lower: true, strict: true }) || 'untitled'
    let slug = slugBase
    let i = 1
    while(await prisma.content.findFirst({ where: { slug, tenantId, deletedAt: null } })){
      slug = `${slugBase}-${i++}`
    }
    const words = sanitized.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean)
    const read_time_minutes = Math.max(1, Math.ceil(words.length / 200))
    const content = await prisma.content.create({ data: {
      tenantId,
      title,
      body: sanitized,
      slug,
      status: ContentStatus.DRAFT,
      readTimeMinutes: read_time_minutes,
    }})
    // audit
    await prisma.auditLog.create({ data: { tenantId, actorRole: 'SYSTEM', action: 'content.create', resource: 'content', payload: { contentId: content.id, title } } })
    // create initial version
    await prisma.contentVersion.create({ data: {
      contentId: content.id,
      title: content.title,
      body: content.body,
      snapshotAt: new Date(),
    }})
    return content
  }

  async find(tenantId:string, opts:any={}){
    return prisma.content.findMany({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: opts.take || 50 })
  }

  async findById(tenantId:string, id:string){
    const c = await prisma.content.findFirst({ where: { id, tenantId, deletedAt: null } })
    if(!c) throw new NotFoundException()
    return c
  }

  async update(tenantId:string, id:string, data:any){
    const existing = await this.findById(tenantId, id)
    if(data.status && data.status !== existing.status){
      const allowed = VALID_TRANSITIONS[existing.status] || []
      if(!allowed.includes(data.status)) throw new BadRequestException('invalid_status_transition')
    }
    const sanitized = data.body ? DOMPurify.sanitize(data.body) : existing.body
    const title = data.title ?? existing.title
    const words = sanitized.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean)
    const read_time_minutes = Math.max(1, Math.ceil(words.length / 200))
    const updated = await prisma.content.update({ where: { id }, data: { title, body: sanitized, status: data.status ?? existing.status, readTimeMinutes: read_time_minutes, scheduledAt: data.scheduledAt ?? existing.scheduledAt } })
    // save version
    await prisma.contentVersion.create({ data: { contentId: id, title: updated.title, body: updated.body, snapshotAt: new Date() } })
    // audit
    await prisma.auditLog.create({ data: { tenantId, actorRole: 'SYSTEM', action: 'content.update', resource: 'content', payload: { contentId: id, changes: data } } })
    // keep only 20 versions
    const versions = await prisma.contentVersion.findMany({ where: { contentId: id }, orderBy: { snapshotAt: 'desc' } })
    if(versions.length > 20){
      const toDelete = versions.slice(20)
      await prisma.contentVersion.deleteMany({ where: { id: { in: toDelete.map(v=>v.id) } } })
    }
    return updated
  }

  async softDelete(tenantId:string, id:string){
    await prisma.content.update({ where: { id }, data: { deletedAt: new Date() } })
    await prisma.auditLog.create({ data: { tenantId, actorRole: 'SYSTEM', action: 'content.delete', resource: 'content', payload: { contentId: id } } })
    return { ok: true }
  }
}
