import { Controller, Post, Body, Req, Res, Get, UseInterceptors, HttpCode } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'
import { AuditInterceptor } from '../common/audit.interceptor'

@Controller('auth')
@UseInterceptors(AuditInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const { email, password } = body
    const user = await this.authService.validateUser(email, password)
    if (!user) {
      // Audit handled by interceptor (auth.login_failed)
      return { error: 'invalid_credentials' }
    }
    const tokens = await this.authService.login(user)
    // set refresh token as httpOnly cookie
    res.cookie('refresh_token', tokens.refresh_token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 })
    return { access_token: tokens.access_token }
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
  async me(@Req() req: Request) {
    return { user: (req as any).user || null }
  }
}
