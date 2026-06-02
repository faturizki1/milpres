import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const path = req.path
    const method = req.method
    const actor = req.user?.id || null
    const tenantId = req.user?.tenantId || null

    const action = (() => {
      if (path.includes('/auth/login') && method === 'POST') return 'auth.login'
      if (path.includes('/auth/logout') && method === 'POST') return 'auth.logout'
      return null
    })()

    if (!action) return next.handle()

    return next.handle().pipe(
      tap(async (res) => {
        try {
          const success = !(res && res.error)
          await prisma.auditLog.create({ data: {
            tenantId,
            actorId: actor,
            actorRole: req.user?.role || 'ANONYMOUS',
            action: success ? action : action + '_failed',
            resource: 'auth',
            payload: { path, body: req.body },
          }})
        } catch (e) {
          console.error('audit log error', e)
        }
      })
    )
  }
}
