import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/components/providers/QueryProvider'
import CustomCursor from '@/components/ui/CustomCursor'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://primestack.uz'),
  title: {
    default: 'PRIMESTACK — Premium IT Solutions',
    template: '%s | PRIMESTACK',
  },
  description:
    'PRIMESTACK — zamonaviy IT kompaniya. Web, mobile va cloud yechimlar. Enterprise darajasidagi dasturiy ta\'minot ishlab chiqish.',
  keywords: ['IT kompaniya', 'web development', 'mobile app', 'cloud solutions', 'Toshkent', 'Uzbekistan'],
  authors: [{ name: 'PRIMESTACK Team' }],
  creator: 'PRIMESTACK',
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    url: 'https://primestack.uz',
    siteName: 'PRIMESTACK',
    title: 'PRIMESTACK — Premium IT Solutions',
    description: 'Enterprise-grade IT solutions for modern businesses.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRIMESTACK — Premium IT Solutions',
    description: 'Enterprise-grade IT solutions for modern businesses.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080E1F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="noise">
        <QueryProvider>
          <CustomCursor />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0F1E35',
                color: '#E8EDF7',
                border: '1px solid rgba(26, 45, 74, 0.8)',
                borderRadius: '12px',
                fontFamily: 'var(--font-body)',
              },
              success: { iconTheme: { primary: '#0057FF', secondary: '#fff' } },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
