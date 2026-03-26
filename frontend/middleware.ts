import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = 'admin_token'
const ROOT_ADMIN_PATH = '/admin'
const LOGIN_PATH = '/admin/login'
const DASHBOARD_PATH = '/admin/dashboard'

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function hasActiveSession(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value?.trim() || ''
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const rawPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = rawPayload + '='.repeat((4 - (rawPayload.length % 4)) % 4)
    const payload = JSON.parse(atob(paddedPayload))
    const exp = Number(payload?.exp)
    if (Number.isFinite(exp) && exp > 0 && Date.now() >= exp * 1000) {
      return false
    }
  } catch {
    return false
  }

  return true
}

export function middleware(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname)
  const hasSession = hasActiveSession(request)
  const allowReauthLogin = request.nextUrl.searchParams.get('reauth') === '1'

  if (pathname === ROOT_ADMIN_PATH) {
    return NextResponse.redirect(new URL(hasSession ? DASHBOARD_PATH : LOGIN_PATH, request.url))
  }

  if (pathname === LOGIN_PATH && hasSession && !allowReauthLogin) {
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
