/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy Storefront (To be phased out)
        background: '#FFFFFF', 
        surface: '#F8FAFC', 
        'surface-flat': '#F1F5F9', 
        primary: '#1E3A8A',
        secondary: '#475569',
        accent: {
          light: '#7DD3FC',
          DEFAULT: '#2FA4B7',
          dark: '#1E6FA3'
        },
        cta: '#E79A3B',
        heading: '#0F172A',
        muted: '#94A3B8',
        divider: '#E2E8F0',
        
        // Eyejack Tokens
        'ej-border': '#000000',
        'ej-text-secondary': '#372d3b',
        'ej-surface-muted': '#ffffff',
        'ej-text-inverse': '#686363',
        'ej-surface-raised': '#f5f5f5',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['system-ui', '-apple-system', 'sans-serif'], // Fallback
      },
      fontSize: {
        'ej-xs': '12px',
        'ej-sm': '13px',
        'ej-md': ['14px', '15.6px'],
        'ej-lg': '16px',
        'ej-xl': '18px',
        'ej-2xl': '20px',
        'ej-3xl': '22px',
        'ej-4xl': '24px',
      },
      spacing: {
        'ej-1': '6px',
        'ej-2': '8px',
        'ej-3': '10px',
        'ej-4': '12px',
        'ej-5': '14px',
        'ej-6': '16.6px',
      },
      borderRadius: {
        'ej-xs': '10px',
      },
      boxShadow: {
        'luxury': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'luxury-hover': '0 12px 40px rgba(0, 0, 0, 0.08)',
        'ej-1': '0px 0px 0px 1px rgba(0, 0, 0, 0.05)',
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
