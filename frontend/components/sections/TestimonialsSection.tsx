'use client'
import { motion } from 'framer-motion'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Jasur Toshmatov',
    role: 'CTO, Kapital Bank',
    text: "PRIMESTACK bilan ishlash ajoyib tajriba bo'ldi. Ular loyihani muddatidan oldin va sifatli topshirdi. Professional jamoa!",
    rating: 5,
  },
  {
    name: 'Malika Yusupova',
    role: 'Product Manager, Uzum',
    text: "Texnik yechimlar bo'yicha juda chuqur bilimga ega. Murakkab talablarni tushunish va amalga oshirishda tengsiz.",
    rating: 5,
  },
  {
    name: 'Bobur Karimov',
    role: 'Founder, LogiTrack',
    text: "Startup'imiz uchun MVP'dan to enterprise produktgacha yo'lda PRIMESTACK hamroh bo'ldi. Tavsiya qilaman!",
    rating: 5,
  },
]

const clients = ['BMG SOFT', 'AcademicNumberOne', 'Protouch', 'Weel']

export default function TestimonialsSection() {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <AnimatedSection className="text-center mb-12">
          <SectionBadge>Mijozlar fikri</SectionBadge>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
            Ular <span className="gradient-text">ishondi</span>
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} delay={i * 0.1}>
              <div className="p-6 rounded-2xl h-full relative"
                style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="#0057FF" className="text-primary-500" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-display font-bold text-sm text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 font-display font-bold text-6xl text-primary-500/5 leading-none">"</div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Marquee clients */}
        <AnimatedSection>
          <div className="text-center mb-6">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">Ishongan kompaniyalar</span>
          </div>
          <div className="relative overflow-hidden" style={{ mask: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
            <div className="flex gap-8 animate-marquee whitespace-nowrap">
              {[...clients, ...clients].map((client, i) => (
                <div key={i} className="flex items-center gap-2 px-6 py-3 rounded-xl flex-shrink-0"
                  style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.6)' }}>
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                  <span className="font-display font-semibold text-gray-300 text-sm">{client}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
