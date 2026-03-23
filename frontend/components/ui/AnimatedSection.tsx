'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  once?: boolean
}

const directionMap = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { y: 0, x: -40 },
  right: { y: 0, x: 40 },
  none: { y: 0, x: 0 },
}

export default function AnimatedSection({
  children,
  className,
  delay = 0,
  direction = 'up',
  once = true,
}: Props) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: '-80px' })
  const initial = directionMap[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...initial }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, ...initial }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
