import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest){
  const { pathname } = req.nextUrl
  // allow auth routes
  if(pathname.startsWith('/(auth)') || pathname.startsWith('/_next') || pathname.startsWith('/api')) return NextResponse.next()
  const refreshCookie = req.cookies.get('refresh_token')
  if(!refreshCookie) {
    const url = new URL('/(auth)/login', req.url)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: '/((?!_next/static|favicon.ico).*)' }
