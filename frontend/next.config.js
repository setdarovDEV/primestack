const DEFAULT_LOCAL_BACKEND_ORIGIN = 'http://localhost:8080'
const DEFAULT_PROD_BACKEND_ORIGIN = 'https://gracious-nurturing-production.up.railway.app'

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function normalizeBackendOrigin(raw) {
  let value = (raw || '').trim()
  if (!value) return ''
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`
  }

  try {
    const url = new URL(value)
    if (url.hostname.endsWith('.railway.internal') && !url.port) {
      url.port = '8080'
    }
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function resolveBackendOrigin() {
  const fromBackendOrigin = normalizeBackendOrigin(process.env.BACKEND_ORIGIN)
  if (fromBackendOrigin) return fromBackendOrigin

  const fromPublicApi = normalizeBackendOrigin(process.env.NEXT_PUBLIC_API_URL)
  if (fromPublicApi) {
    try {
      const parsed = new URL(fromPublicApi)
      if (!isLoopbackHost(parsed.hostname)) return fromPublicApi
    } catch {
      // no-op
    }
  }

  if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
    return DEFAULT_PROD_BACKEND_ORIGIN
  }
  return DEFAULT_LOCAL_BACKEND_ORIGIN
}

const BACKEND_ORIGIN = resolveBackendOrigin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  env: {
    // Bo'sh qoldirilsa browser origin ishlatiladi (rewrite orqali API ga proksi).
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://primestack.uz',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
