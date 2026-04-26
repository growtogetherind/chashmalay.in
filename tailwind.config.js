/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF9F6', // Soft Ivory
        surface: '#FFFFFF', // Pure White
        'surface-flat': '#F3EFE6', // Flat surface for accents
        primary: '#1A1A1A', // Deep Charcoal
        secondary: '#757575', // Soft Gray
        accent: {
          light: '#F3EFE6',
          DEFAULT: '#C5A880', // Matte Gold
          dark: '#A38B6B'
        },
        divider: '#EAEAEA', // Hairline Light Gray
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
