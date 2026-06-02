import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change_me_long_secret',
    })
  }

  async validate(payload: any) {
    // payload expected: { sub, tenant_id, tenant_slug, role, email }
    return {
      id: payload.sub,
      tenantId: payload.tenant_id,
      tenantSlug: payload.tenant_slug,
      role: payload.role,
      email: payload.email,
    }
  }
}
