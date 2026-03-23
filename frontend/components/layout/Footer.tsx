'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Linkedin, Instagram, Mail, Phone, MapPin, ArrowUpRight, Send, Youtube } from 'lucide-react'
import {
  DEFAULT_PUBLIC_SETTINGS,
  fetchPublicSettings,
  getMailHref,
  getMapHref,
  getPhoneHref,
  getTelegramHref,
  type PublicSettings,
} from '@/lib/publicSettings'

const footerLinks = {
  company: [
    { href: '/about', label: 'Biz haqimizda' },
    { href: '/team', label: 'Jamoa' },
    { href: '/careers', label: 'Vakansiyalar' },
    { href: '/blog', label: 'Blog' },
  ],
  services: [
    { href: '/services', label: 'Web ilovalar' },
    { href: '/services', label: 'Mobil ilovalar' },
    { href: '/services', label: 'Cloud yechimlar' },
    { href: '/services', label: 'UI/UX dizayn' },
  ],
  links: [
    { href: '/projects', label: 'Portfolio' },
    { href: '/contact', label: "Bog'lanish" },
    { href: '/privacy', label: 'Maxfiylik siyosati' },
    { href: '/terms', label: 'Foydalanish shartlari' },
  ],
}

const socialDefs = [
  { icon: Send, key: 'telegram_notify', label: 'Telegram' },
  { icon: Instagram, key: 'instagram', label: 'Instagram' },
  { icon: Github, key: 'github', label: 'GitHub' },
  { icon: Youtube, key: 'youtube', label: 'YouTube' },
  { icon: Linkedin, key: 'linkedin', label: 'LinkedIn' },
] as const

export default function Footer() {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS)

  useEffect(() => {
    let active = true
    const load = async () => {
      const next = await fetchPublicSettings()
      if (active) setSettings(next)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const socialLinks = useMemo(
    () =>
      socialDefs
        .map((item) => ({
          ...item,
          href: item.key === 'telegram_notify'
            ? getTelegramHref(settings.telegram_notify)
            : settings[item.key].trim(),
        }))
        .filter((item) => item.href),
    [settings]
  )

  return (
    <footer className="relative border-t border-navy-border bg-dark-950">
      {/* Glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />

      <div className="container-custom py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-primary-500 rounded-lg rotate-45 group-hover:rotate-[55deg] transition-transform duration-300" />
                <div className="absolute inset-1 bg-accent-400 rounded-md rotate-45 group-hover:rotate-[35deg] transition-transform duration-300 opacity-70" />
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">
                PRIME<span className="text-primary-400">STACK</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              {settings.tagline || 'Premium IT Solutions'}. Biznesingizni raqamli kelajakka olib chiqamiz - tezkor, ishonchli va chiroyli.
            </p>

            <div className="flex flex-col gap-2.5 mb-6">
              {[
                { icon: Mail, text: settings.email, href: getMailHref(settings.email) },
                { icon: Phone, text: settings.phone, href: getPhoneHref(settings.phone) },
                { icon: MapPin, text: settings.address, href: getMapHref(settings.address) },
              ].map(({ icon: Icon, text, href }, idx) => (
                <a key={`${idx}-${text}`} href={href} className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors">
                  <Icon size={14} className="text-primary-400 flex-shrink-0" />
                  <span>{text}</span>
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.25 }}
                  whileHover={{ y: -3, scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(26,45,74,0.8)' }}
                  title={label}
                >
                  <Icon size={16} className="text-white transition-transform duration-200 group-hover:scale-110" />
                  <span
                    className="pointer-events-none absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ boxShadow: '0 0 20px rgba(255,255,255,0.35)' }}
                  />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Kompaniya', links: footerLinks.company },
            { title: 'Xizmatlar', links: footerLinks.services },
            { title: "Foydali havolalar", links: footerLinks.links },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-white text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-navy-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {settings.footer_text || `© ${new Date().getFullYear()} PRIMESTACK. Barcha huquqlar himoyalangan.`}
          </p>
          <p className="text-xs text-gray-600 font-mono">PRIMESTACK</p>
        </div>
      </div>
    </footer>
  )
}
