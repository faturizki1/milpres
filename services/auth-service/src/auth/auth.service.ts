import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()
const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) })

@Injectable()
export class AuthService {
  constructor(private _jwtService: JwtService) {}

  async validateUser(email: string, pass: string) {
    const user = await prisma.user.findFirst({ where: { email } })
    if (!user) return null
    let ok = false
    try {
      ok = await argon2.verify(user.passwordHash, pass)
    } catch (e) {
      // fallback for dev seeds that might have plain text password
      if (user.passwordHash === pass) ok = true
    }
    if (!ok) return null
    return user
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      tenant_id: user.tenantId,
      tenant_slug: '',
      role: user.role,
      email: user.email,
    }
    const accessToken = this._jwtService.sign(payload)
    const refreshToken = uuidv4()
    // store refresh token in redis with expiry 30 days
    await redis.set(`refresh:${refreshToken}`, user.id, 'EX', 30 * 24 * 60 * 60)
    return { access_token: accessToken, refresh_token: refreshToken }
  }

  async refresh(token: string) {
    const key = `refresh:${token}`
    const userId = await redis.get(key)
    if (!userId) throw new UnauthorizedException()
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()
    const payload = {
      sub: user.id,
      tenant_id: user.tenantId,
      tenant_slug: '',
      role: user.role,
      email: user.email,
    }
    const accessToken = this._jwtService.sign(payload)
    return { access_token: accessToken }
  }

  async logout(token: string) {
    await redis.del(`refresh:${token}`)
  }

  // login attempt tracking
  async isBlockedIP(ip: string) {
    const v = await redis.get(`fail:${ip}`)
    return v && parseInt(v) >= 5
  }

  async recordFailedIP(ip: string) {
    const key = `fail:${ip}`
    const v = await redis.incr(key)
    if (v === 1) await redis.expire(key, 30 * 60) // 30 minutes
    return v
  }

  async resetFailedIP(ip: string) {
    await redis.del(`fail:${ip}`)
  }
}
