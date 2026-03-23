import type { Metadata } from 'next'
import ProjectsPageContent from '@/components/sections/ProjectsPageContent'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: "PRIMESTACK tomonidan yaratilgan loyihalar — fintech, e-commerce, SaaS va boshqa yo'nalishlar.",
}

export default function ProjectsPage() {
  return <ProjectsPageContent />
}

