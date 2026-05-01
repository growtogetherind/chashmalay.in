/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF', 
        surface: '#F8FAFC', 
        'surface-flat': '#F1F5F9', 
        primary: '#1E3A8A', // Deep Blue
        secondary: '#475569', // Body Text
        accent: {
          light: '#7DD3FC',
          DEFAULT: '#2FA4B7', // Teal
          dark: '#1E6FA3' // Deep Teal
        },
        cta: '#E79A3B', // Premium Orange
        heading: '#0F172A',
        muted: '#94A3B8',
        divider: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Playfair Display', 'serif'],
      },
      boxShadow: {
        'luxury': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'luxury-hover': '0 12px 40px rgba(0, 0, 0, 0.08)',
      },
      transitionTimingFunction: {
        'cinema': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'cinema-in': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1.5rem',
          sm: '2rem',
          lg: '4rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1440px',
        },
      },
    },
  },
  plugins: [],
}
