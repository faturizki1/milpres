import { Controller, Get, Query } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

@Controller('analytics')
export class AnalyticsController {
  @Get('contents/views')
  async views(@Query('tenantId') tenantId:string){
    const rows = await prisma.content.findMany({ where: { tenantId }, select: { id:true, title:true, viewCount:true }, orderBy: { viewCount: 'desc' }, take: 20 })
    return rows
  }
}
