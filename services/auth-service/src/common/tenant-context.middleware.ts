import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string | undefined
      if (tenantId) {
        // set_config for current transaction/session
        await prisma.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantId}', true)`)
      }
    } catch (e) {
      // ignore
    }
    next()
  }
}
