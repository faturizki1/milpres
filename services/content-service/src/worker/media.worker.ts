import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import sharp from 'sharp'
const redis = new IORedis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT||6379) })
const prisma = require('@prisma/client').PrismaClient ? new (require('@prisma/client').PrismaClient)() : null
const minio = new (require('minio').Client)({ endPoint: process.env.MINIO_HOST||'localhost', port: Number(process.env.MINIO_PORT||9000), useSSL:false, accessKey: process.env.MINIO_ACCESS_KEY||'minioadmin', secretKey: process.env.MINIO_SECRET_KEY||'minioadmin' })

const worker = new Worker('media-processing', async job => {
  const { mediaId, path } = job.data
  // fetch object
  const stream = await minio.getObject('media', path)
  const chunks: Buffer[] = []
  for await (const c of stream) chunks.push(c)
  const buf = Buffer.concat(chunks)
  const sizes = [320,800,1600]
  for(const w of sizes){
    const out = await sharp(buf).resize({ width: w }).webp().toBuffer()
    const outPath = path.replace('originals/', `processed/${w}/`).replace(/\.[^.]+$/, '.webp')
    await minio.putObject('media', outPath, out)
  }
  // update db
  await prisma.media.update({ where: { id: mediaId }, data: { status: 'READY' } })
}, { connection: redis })

worker.on('completed', job => console.log('job completed', job.id))
worker.on('failed', (job, err) => console.error('job failed', job?.id, err))
