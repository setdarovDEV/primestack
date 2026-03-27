const ENV_API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '')

function isLoopbackHost(value: string): boolean {
  return value === 'localhost' || value === '127.0.0.1' || value === '::1'
}

function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    // Safety: ignore localhost API base on real domains to prevent broken prod auth.
    if (ENV_API_BASE) {
      try {
        const parsed = new URL(ENV_API_BASE)
        if (!(isLoopbackHost(parsed.hostname) && !isLoopbackHost(hostname))) {
          return ENV_API_BASE
        }
      } catch {
        return ENV_API_BASE
      }
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080'
    }
    return origin
  }
  if (ENV_API_BASE) return ENV_API_BASE
  return 'http://localhost:8080'
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
let authRedirectInProgress = false

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return ''
  const target = `${name}=`
  const found = document.cookie
    .split('; ')
    .find((row) => row.startsWith(target))
  if (!found) return ''
  return decodeURIComponent(found.slice(target.length))
}

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${resolveApiBase()}${path}`, {
    credentials: 'include',
    ...init,
  })
  return res
}

async function forceAdminReauth(): Promise<void> {
  if (typeof window === 'undefined' || authRedirectInProgress) return
  authRedirectInProgress = true

  try {
    await fetch(`${resolveApiBase()}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // no-op
  }

  if (!window.location.pathname.startsWith('/admin/login')) {
    window.location.assign('/admin/login?reauth=1')
    return
  }

  const params = new URLSearchParams(window.location.search)
  if (params.get('reauth') !== '1') {
    params.set('reauth', '1')
    window.location.replace(`/admin/login?${params.toString()}`)
  }
}

export async function adminApiFetch(path: string, init?: RequestInit) {
  const method = (init?.method || 'GET').toUpperCase()
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (!SAFE_METHODS.has(method)) {
    const csrfToken = getCookieValue('admin_csrf')
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
  }

  const res = await fetch(`${resolveApiBase()}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  })

  if (res.status === 401) {
    void forceAdminReauth()
    throw new Error('Sessiya tugagan. Qaytadan kiring')
  }

  if (!res.ok) {
    let message = 'API so‘rovida xatolik'
    try {
      const json = await res.json()
      if (json?.error) message = json.error
    } catch {
      // no-op
    }
    throw new Error(message)
  }
  return res
}
