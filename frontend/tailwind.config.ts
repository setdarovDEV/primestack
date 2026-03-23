import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0057FF',
          50: '#EBF1FF',
          100: '#C8D9FF',
          200: '#95B3FF',
          300: '#628DFF',
          400: '#2F67FF',
          500: '#0057FF',
          600: '#0044CC',
          700: '#003199',
          800: '#001E66',
          900: '#000B33',
        },
        accent: {
          DEFAULT: '#00D4FF',
          50: '#E0FAFF',
          100: '#B3F2FF',
          200: '#66E4FF',
          300: '#19D7FF',
          400: '#00D4FF',
          500: '#00A8CC',
          600: '#007D99',
          700: '#005266',
          800: '#002633',
          900: '#000D11',
        },
        dark: {
          DEFAULT: '#080E1F',
          50: '#F0F4FF',
          100: '#D0DCF7',
          200: '#9FB3E8',
          300: '#6E8AD9',
          400: '#3D61CA',
          500: '#1A3BAB',
          600: '#122C88',
          700: '#0B1D65',
          800: '#060F42',
          900: '#020618',
          950: '#080E1F',
        },
        navy: {
          DEFAULT: '#0D1729',
          card: '#0F1E35',
          border: '#1A2D4A',
          light: '#1E3555',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'spin-slow': 'spin 20s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 87, 255, 0.4)' },
          '100%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.7)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-mesh': 'radial-gradient(at 40% 20%, #0057FF22 0px, transparent 50%), radial-gradient(at 80% 0%, #00D4FF22 0px, transparent 50%), radial-gradient(at 0% 50%, #0057FF15 0px, transparent 50%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

export default config
