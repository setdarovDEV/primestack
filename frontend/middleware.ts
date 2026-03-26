import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = 'admin_token'
const ROOT_ADMIN_PATH = '/admin'
const LOGIN_PATH = '/admin/login'
const DASHBOARD_PATH = '/admin/dashboard'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value)

  if (pathname === ROOT_ADMIN_PATH) {
    return NextResponse.redirect(new URL(hasSession ? DASHBOARD_PATH : LOGIN_PATH, request.url))
  }

  if (pathname === LOGIN_PATH && hasSession) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url))
  }

  if (pathname !== LOGIN_PATH && !hasSession) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
