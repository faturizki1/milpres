import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private _reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this._reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) return true
    const req = context.switchToHttp().getRequest()
    const user = req.user
    if (!user) return false
    if (!requiredRoles.includes(user.role)) throw new ForbiddenException()
    return true
  }
}
