import type { Metadata } from 'next'
import TeamPageContent from '@/components/sections/TeamPageContent'

export const metadata: Metadata = {
  title: 'Jamoa',
  description: "PRIMESTACK jamoasi — IT sohasining eng yaxshi mutaxassislari.",
}

export default function TeamPage() {
  return <TeamPageContent />
}

