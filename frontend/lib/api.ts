export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '')

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

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
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
  })
  return res
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

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/admin/login'
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
