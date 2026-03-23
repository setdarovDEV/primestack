import type { Metadata } from 'next'
import PublicLayout from '@/components/layout/PublicLayout'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionBadge from '@/components/ui/SectionBadge'
import CTASection from '@/components/sections/CTASection'
import { Target, Eye, Heart, Zap, Users, Award, Globe, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Biz haqimizda',
  description: "PRIMESTACK — 2016 yildan beri faoliyat yuritayotgan IT kompaniya. Bizning missiya, jamoamiz va qadriyatlarimiz haqida.",
}

const values = [
  { icon: Target, title: 'Aniqlik', description: 'Har bir loyihada aniq maqsad va reja. Vaqt va sifat bo\'yicha eng yuqori standart.' },
  { icon: Zap, title: 'Tezkorlik', description: 'Agile yondashuv bilan tez iteratsiyalar. MVP\'dan scalable produktgacha optimal yo\'l.' },
  { icon: Heart, title: 'G\'amxo\'rlik', description: "Mijoz muvaffaqiyati — bizning muvaffaqiyat. Loyihadan so'ng ham qo'llab-quvvatlash." },
  { icon: Globe, title: 'Global standart', description: "Mahalliy bozor uchun xalqaro darajadagi texnik yechimlar. Best practice har doim." },
]

const milestones = [
  { year: '2016', title: 'Kompaniya tashkil topdi', desc: 'Toshkentda 5 nafar dasturchi bilan boshlandik.' },
  { year: '2018', title: 'Birinchi enterprise mijoz', desc: "O'zbekistonning yetakchi bankidan yirik buyurtma." },
  { year: '2020', title: '50+ loyiha', desc: "Fintech, e-commerce va SaaS bo'yicha ixtisoslashuv." },
  { year: '2022', title: 'Xalqaro bozorga chiqish', desc: 'UAE va Qozog\'iston bozorlarida loyihalar.' },
  { year: '2024', title: '40+ mutaxassis', desc: 'Full-stack, mobile va DevOps bo\'yicha kengayish.' },
  { year: '2026', title: '120+ muvaffaqiyatli loyiha', desc: 'Markaziy Osiyo\'ning #1 IT hamkori bo\'lish yo\'lida.' },
]

const stats = [
  { icon: Users, label: 'Mutaxassislar', value: '40+' },
  { icon: Award, label: 'Muvaffaqiyatli loyihalar', value: '120+' },
  { icon: Globe, label: 'Mamlakatlar', value: '5+' },
  { icon: TrendingUp, label: 'Yillik o\'sish', value: '85%' },
]

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0057FF, transparent)', filter: 'blur(60px)' }} />
        <div className="container-custom relative">
          <AnimatedSection className="max-w-3xl">
            <SectionBadge>Biz haqimizda</SectionBadge>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-6">
              Texnologiya orqali <span className="gradient-text">o'zgarish yaratamiz</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed mb-8">
              PRIMESTACK — 2016 yildan beri O'zbekiston va xalqaro bozorda enterprise-grade IT yechimlar yetkazib kelayotgan kompaniya.
              Biz faqat kod yozmaymiz — biznesingizni raqamli kelajakka olib chiqamiz.
            </p>
          </AnimatedSection>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <AnimatedSection key={stat.label} delay={i * 0.08}>
                  <div className="p-5 rounded-2xl text-center"
                    style={{ background: 'rgba(15,30,53,0.7)', border: '1px solid rgba(26,45,74,0.8)' }}>
                    <Icon size={20} className="text-primary-400 mx-auto mb-2" />
                    <div className="font-display font-bold text-3xl gradient-text">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Target, title: 'Missiyamiz', color: '#0057FF', text: "O'zbekistondagi va xalqaro bozorlardagi bizneslarni zamonaviy texnologiyalar bilan ta'minlash, ularning raqamli transformatsiyasiga hissa qo'shish." },
              { icon: Eye, title: 'Vizionimiz', color: '#00D4FF', text: "Markaziy Osiyo'ning eng ishonchli va innovatsion IT hamkori bo'lib, global standartda yechimlar yaratish." },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <AnimatedSection key={item.title} delay={i * 0.1}>
                  <div className="p-8 rounded-2xl h-full"
                    style={{ background: 'rgba(15,30,53,0.6)', border: `1px solid ${item.color}25` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                      <Icon size={22} style={{ color: item.color }} />
                    </div>
                    <h3 className="font-display font-bold text-2xl text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.text}</p>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-12">
            <SectionBadge>Qadriyatlar</SectionBadge>
            <h2 className="font-display font-bold text-4xl text-white">
              Nima biz uchun <span className="gradient-text">muhim</span>
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <AnimatedSection key={v.title} delay={i * 0.1}>
                  <div className="p-6 rounded-2xl card-hover h-full"
                    style={{ background: 'rgba(15,30,53,0.6)', border: '1px solid rgba(26,45,74,0.8)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                      style={{ background: 'rgba(0,87,255,0.12)', border: '1px solid rgba(0,87,255,0.2)' }}>
                      <Icon size={18} className="text-primary-400" />
                    </div>
                    <h4 className="font-display font-semibold text-white mb-2">{v.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{v.description}</p>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-14">
            <SectionBadge>Tariximiz</SectionBadge>
            <h2 className="font-display font-bold text-4xl text-white">
              O'sish <span className="gradient-text">yo'li</span>
            </h2>
          </AnimatedSection>
          <div className="relative max-w-3xl mx-auto">
            {/* Line */}
            <div className="absolute left-[88px] top-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(to bottom, rgba(0,87,255,0.6), rgba(0,212,255,0.2))' }} />

            <div className="space-y-8">
              {milestones.map((m, i) => (
                <AnimatedSection key={m.year} delay={i * 0.08} direction="left">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-20 text-right">
                      <span className="font-mono font-bold text-sm text-primary-400">{m.year}</span>
                    </div>
                    <div className="flex-shrink-0 w-3 h-3 rounded-full mt-0.5 relative z-10"
                      style={{ background: '#0057FF', boxShadow: '0 0 12px rgba(0,87,255,0.6)' }} />
                    <div className="flex-1 pb-2">
                      <h4 className="font-display font-semibold text-white mb-1">{m.title}</h4>
                      <p className="text-sm text-gray-400">{m.desc}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </PublicLayout>
  )
}
