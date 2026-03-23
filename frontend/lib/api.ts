export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '')

function getAdminToken(): string {
  if (typeof document === 'undefined') return ''
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin_token='))
    ?.split('=')[1] || ''
}

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init)
  return res
}

export async function adminApiFetch(path: string, init?: RequestInit) {
  const token = getAdminToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

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

