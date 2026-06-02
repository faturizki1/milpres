import { Controller, Post, Body, Req, Res, Get, UseInterceptors, HttpCode, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'
import { AuditInterceptor } from '../common/audit.interceptor'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import { RolesGuard } from '../common/roles.guard'
import { Roles } from '../common/roles.decorator'

@Controller('auth')
@UseInterceptors(AuditInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const { email, password } = body
      const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown'
      if (await this.authService.isBlockedIP(String(ip))) {
        return { error: 'too_many_requests' }
      }
      const user = await this.authService.validateUser(email, password)
      if (!user) {
        await this.authService.recordFailedIP(String(ip))
        return { error: 'invalid_credentials' }
      }
      await this.authService.resetFailedIP(String(ip))
      const tokens = await this.authService.login(user)
      // set refresh token as httpOnly cookie
      res.cookie('refresh_token', tokens.refresh_token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 })
      return { access_token: tokens.access_token }
    } catch (err) {
      console.error('login error', err)
      return { statusCode: 500, message: 'Internal server error' }
    }
    
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const token = req.cookies?.refresh_token
    if (!token) return { error: 'no_refresh_token' }
    const tokens = await this.authService.refresh(token)
    return tokens
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token
    if (token) await this.authService.logout(token)
    res.clearCookie('refresh_token')
    return { ok: true }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    // Minimal stub: create token and log - in real app send email
    return { ok: true }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    // Minimal stub
    return { ok: true }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    return { user: (req as any).user || null }
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminOnly(@Req() req: Request) {
    return { msg: 'admin area' }
  }
}
