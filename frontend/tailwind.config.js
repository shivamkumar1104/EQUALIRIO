/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hotel: {
          emerald: '#1A2B32',
          'emerald-light': '#2D4650',
          'emerald-dark': '#1A2B32',
          gold: '#C5A880',
          'gold-light': '#D8C3A4',
          'gold-dark': '#9D805C',
          cream: '#F9F6F0',
          sand: '#E2DCD3',
          dark: '#1A2B32',
          charcoal: '#263A41',
          muted: '#66757B',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        'luxury': '0 20px 50px rgba(26, 43, 50, 0.15)',
        'gold': '0 10px 30px rgba(197, 168, 128, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
      }
    },
  },
  plugins: [],
}
