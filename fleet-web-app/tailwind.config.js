export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Toast animation classes — built dynamically so Tailwind's purge can miss them
    'translate-x-0',
    'translate-x-full',
    'opacity-0',
    'opacity-100',
    'pointer-events-auto',
    'pointer-events-none',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1296D4',
          light: '#E8F8FF',
          deep: '#0677AD',
        },
        surface: '#FFFFFF',
        canvas: '#DFF4FA',
      },
      boxShadow: {
        soft: '0 18px 55px rgba(8, 47, 73, 0.10)',
        glass: '0 14px 40px rgba(8, 47, 73, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out forwards',
        'fade-in': 'fade-in 0.35s ease-out forwards',
      },
    },
  },
  plugins: [],
}
