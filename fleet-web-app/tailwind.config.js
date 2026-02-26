export default {
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
    extend: {},
  },
  plugins: [],
}
