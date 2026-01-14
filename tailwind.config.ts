import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['Source Code Pro', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'accent-gold': 'hsl(var(--primary))',
        'accent-orange': '#ffab40',
        'accent-red': 'hsl(var(--destructive))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        breathe1: {
          '0%, 100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.3)' },
          '15%': { opacity: '0.8' },
          '50%': { opacity: '0.9', transform: 'translate(calc(-50% + 250px), calc(-50% - 150px)) scale(1.1)' },
          '85%': { opacity: '0.6' },
        },
        breathe2: {
          '0%, 100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.3)' },
          '15%': { opacity: '0.75' },
          '50%': { opacity: '0.85', transform: 'translate(calc(-50% - 280px), calc(-50% + 120px)) scale(1.15)' },
          '85%': { opacity: '0.5' },
        },
        breathe3: {
          '0%, 100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.3)' },
          '15%': { opacity: '0.7' },
          '50%': { opacity: '0.85', transform: 'translate(calc(-50% + 180px), calc(-50% + 200px)) scale(1.2)' },
          '85%': { opacity: '0.55' },
        },
        breathe4: {
          '0%, 100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.3)' },
          '15%': { opacity: '0.8' },
          '50%': { opacity: '0.9', transform: 'translate(calc(-50% - 200px), calc(-50% - 180px)) scale(1.1)' },
          '85%': { opacity: '0.6' },
        },
        breathe5: {
          '0%, 100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.3)' },
          '15%': { opacity: '0.65' },
          '50%': { opacity: '0.8', transform: 'translate(calc(-50% + 300px), calc(-50% + 80px)) scale(1.15)' },
          '85%': { opacity: '0.5' },
        },
        breathe6: {
          '0%, 100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.3)' },
          '15%': { opacity: '0.75' },
          '50%': { opacity: '0.85', transform: 'translate(calc(-50% - 150px), calc(-50% + 250px)) scale(1.12)' },
          '85%': { opacity: '0.55' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 hsl(var(--primary) / 0.6)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 10px hsl(var(--primary) / 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.2), 0 0 40px hsl(var(--primary) / 0.1)' },
          '50%': { boxShadow: '0 0 30px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.2)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'hsl(var(--primary) / 0.2)' },
          '50%': { borderColor: 'hsl(var(--primary) / 0.5)' },
        },
        'slide-up': {
            from: { opacity: '0', transform: 'translateY(30px)' },
            to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
            '0%, 100%': { transform: 'translateX(0)' },
            '25%': { transform: 'translateX(-5px)' },
            '75%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        breathe1: 'breathe1 8s ease-in-out infinite',
        breathe2: 'breathe2 9s ease-in-out infinite',
        breathe3: 'breathe3 10s ease-in-out infinite',
        breathe4: 'breathe4 7s ease-in-out infinite',
        breathe5: 'breathe5 11s ease-in-out infinite',
        breathe6: 'breathe6 8.5s ease-in-out infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
        glow: 'glow 3s ease-in-out infinite',
        'border-glow': 'border-glow 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s ease-out',
        'shake': 'shake 0.4s ease',
        'spin-fast': 'spin 0.8s linear infinite'
      },
      backgroundSize: {
        '200%': '200% auto',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
