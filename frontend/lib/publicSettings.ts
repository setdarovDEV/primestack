import { apiFetch } from '@/lib/api'

export interface PublicSettings {
  site_name: string
  tagline: string
  email: string
  phone: string
  address: string
  website: string
  footer_text: string
  twitter: string
  linkedin: string
  github: string
  instagram: string
  youtube: string
  telegram_notify: string
}

const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  site_name: 'PRIMESTACK',
  tagline: 'Premium IT Solutions',
  email: 'hello@primestack.uz',
  phone: '+998 90 000 00 00',
  address: 'Toshkent, Uzbekistan',
  website: 'https://primestack.uz',
  footer_text: '© PRIMESTACK. Barcha huquqlar himoyalangan.',
  twitter: '',
  linkedin: '',
  github: '',
  instagram: '',
  youtube: '',
  telegram_notify: '@Primestackuz',
}

const SETTING_KEYS: Array<keyof PublicSettings> = [
  'site_name',
  'tagline',
  'email',
  'phone',
  'address',
  'website',
  'footer_text',
  'twitter',
  'linkedin',
  'github',
  'instagram',
  'youtube',
  'telegram_notify',
]

function normalizeSettings(input: unknown): Partial<PublicSettings> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const raw = input as Record<string, unknown>
  const normalized: Partial<PublicSettings> = {}

  for (const key of SETTING_KEYS) {
    const value = raw[key]
    if (typeof value === 'string') {
      normalized[key] = value
    }
  }

  return normalized
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  try {
    const res = await apiFetch('/api/v1/settings', { cache: 'no-store' })
    if (!res.ok) return DEFAULT_PUBLIC_SETTINGS
    const json = await res.json()
    const fromApi = normalizeSettings(json?.data)
    return { ...DEFAULT_PUBLIC_SETTINGS, ...fromApi }
  } catch {
    return DEFAULT_PUBLIC_SETTINGS
  }
}

export function getMailHref(value: string): string {
  if (!value) return '#'
  return `mailto:${value}`
}

export function getPhoneHref(value: string): string {
  if (!value) return '#'
  return `tel:${value.replace(/[^\d+]/g, '')}`
}

export function getMapHref(value: string): string {
  if (!value) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
}

export function getTelegramHref(value: string): string {
  const raw = value.trim()
  if (!raw) return '#'
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  const username = raw.startsWith('@') ? raw.slice(1) : raw
  return `https://t.me/${encodeURIComponent(username)}`
}

export { DEFAULT_PUBLIC_SETTINGS }
