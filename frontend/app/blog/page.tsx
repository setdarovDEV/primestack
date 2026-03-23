import type { Metadata } from 'next'
import BlogPageContent from '@/components/sections/BlogPageContent'

export const metadata: Metadata = {
  title: 'Blog',
  description: "PRIMESTACK blog — IT, dasturlash, startuplar va texnologiya haqida maqolalar.",
}

export default function BlogPage() {
  return <BlogPageContent />
}

