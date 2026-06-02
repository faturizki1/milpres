import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { fileTypeFromBuffer } from 'file-type'
import { v4 as uuidv4 } from 'uuid'
import { Client as MinioClient } from 'minio'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const prisma = new PrismaClient()
const redis = new IORedis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) })
const queue = new Queue('media-processing', { connection: redis })

const minioClient = new MinioClient({
  endPoint: process.env.MINIO_HOST || 'localhost',
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

@Injectable()
export class MediaService {
  async handleUpload(tenantId:string, file: Express.Multer.File){
    const buf = file.buffer
    const ft = await fileTypeFromBuffer(buf)
    if(!ft || !ft.mime.startsWith('image/')) throw new BadRequestException('invalid_mime')
    const id = uuidv4()
    const now = new Date()
    const path = `originals/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${id}.${ft.ext}`
    // upload to minio
    await minioClient.putObject('media', path, Buffer.from(buf))
    const rec = await prisma.media.create({ data: { id, tenantId, uploaderId: '00000000-0000-0000-0000-000000000000', filename: file.originalname, originalName: file.originalname, mimeType: ft.mime, sizeBytes: BigInt(buf.length), storageKey: path } })
    await queue.add('process', { mediaId: rec.id, path, mime: ft.mime })
    return rec
  }
}
