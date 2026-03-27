function normalizeBackendOrigin(raw) {
  let value = (raw || '').trim()
  if (!value) return 'http://localhost:8080'
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
    return 'http://localhost:8080'
  }
}

const BACKEND_ORIGIN = normalizeBackendOrigin(process.env.BACKEND_ORIGIN)

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
