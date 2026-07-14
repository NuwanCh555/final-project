/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c7d8fe',
          300: '#a3beff',
          400: '#799bff',
          500: '#4f6fff', // Premium active cobalt indigo blue
          600: '#384eff',
          700: '#2535eb',
          800: '#1e2ac4',
          900: '#1c269c',
          950: '#11155e',
        },
        income: {
          light: '#e6fcf5',
          DEFAULT: '#0ca678', // Vivid Emerald Green
          dark: '#087f5b',
        },
        expense: {
          light: '#fff5f5',
          DEFAULT: '#f03e3e', // Premium Rose Crimson Red
          dark: '#c92a2a',
        },
        warning: {
          light: '#fff9db',
          DEFAULT: '#f59f00', // Amber Yellow
          dark: '#d9480f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 8px 32px 0 rgba(79, 111, 255, 0.15)',
      },
      backdropBlur: {
        glass: '12px',
      }
    },
  },
  plugins: [],
}
