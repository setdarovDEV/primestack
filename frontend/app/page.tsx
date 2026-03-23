import type { Metadata } from 'next'
import PublicLayout from '@/components/layout/PublicLayout'
import HeroSection from '@/components/sections/HeroSection'
import ServicesSection from '@/components/sections/ServicesSection'
import ProjectsSection from '@/components/sections/ProjectsSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import CTASection from '@/components/sections/CTASection'

export const metadata: Metadata = {
  title: 'PRIMESTACK — Premium IT Solutions',
  description: 'PRIMESTACK — zamonaviy IT kompaniya. Web, mobile va cloud yechimlar. Enterprise darajasidagi dasturiy ta\'minot.',
}

export default function HomePage() {
  return (
    <PublicLayout>
      <HeroSection />
      <ServicesSection />
      <ProjectsSection />
      <TestimonialsSection />
      <CTASection />
    </PublicLayout>
  )
}
