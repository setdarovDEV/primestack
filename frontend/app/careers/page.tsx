import type { Metadata } from 'next'
import CareersPageContent from '@/components/sections/CareersPageContent'

export const metadata: Metadata = {
  title: 'Vakansiyalar',
  description: "PRIMESTACK jamoasiga qo'shiling — IT sohasining eng zo'r jamoasi.",
}

export default function CareersPage() {
  return <CareersPageContent />
}

