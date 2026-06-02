import { Injectable } from '@nestjs/common'
import IORedis from 'ioredis'
import { Queue } from 'bullmq'

const redis = new IORedis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) })
const queue = new Queue('notifications', { connection: redis })

@Injectable()
export class NotificationsService {
  async notifyAuthor(tenantId:string, userId:string, payload:any){
    await queue.add('notify', { tenantId, userId, payload })
  }
}
