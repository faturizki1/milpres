import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { PrismaClient } from '@prisma/client'
import IORedis from 'ioredis'
import { Queue } from 'bullmq'

const prisma = new PrismaClient()
const redis = new IORedis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) })
const notifyQueue = new Queue('notifications', { connection: redis })

@Injectable()
export class SchedulerService {
  @Cron('* * * * *')
  async handleCron(){
    // find APPROVED with scheduledAt <= now
    const now = new Date()
    const tx = await prisma.$transaction(async (prismaTx) => {
      const toPublish = await prismaTx.content.findMany({ where: { status: 'APPROVED', scheduledAt: { lte: now }, deletedAt: null } })
      for(const c of toPublish){
        await prismaTx.content.update({ where: { id: c.id }, data: { status: 'PUBLISHED' } })
        await prismaTx.auditLog.create({ data: { tenantId: c.tenantId, actorRole: 'SYSTEM', action: 'content.publish', resource: 'content', payload: { contentId: c.id } } })
        // enqueue notification to notifications queue
        await notifyQueue.add('notify', { tenantId: c.tenantId, contentId: c.id, type: 'content.published' })
      }
      return toPublish.length
    })
    if(tx) console.log('published scheduled count', tx)
  }
}
