import type { Metadata } from 'next'
import ServicesPageContent from '@/components/sections/ServicesPageContent'

export const metadata: Metadata = {
  title: 'Xizmatlar',
  description: 'PRIMESTACK xizmatlari: web ilovalar, mobil ilovalar, cloud yechimlar, UI/UX dizayn va backend development.',
}

export default function ServicesPage() {
  return <ServicesPageContent />
}

