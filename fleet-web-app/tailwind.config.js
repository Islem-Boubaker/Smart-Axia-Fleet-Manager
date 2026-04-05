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
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#3B82F6',
          light: '#EFF6FF',
          deep: '#2563EB',
        },
        surface: '#FFFFFF',
        canvas: '#F1F5F9',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(15, 23, 42, 0.06)',
        glass: '0 4px 24px rgba(15, 23, 42, 0.04)',
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
