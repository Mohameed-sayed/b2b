/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ischool: {
          50: '#F7FAFF', // Light Background
          100: '#e5edff',
          500: '#056FEC', // Primary Blue
          600: '#0456b8',
          700: '#1F2A55', // Dark Text / Dark Brand
          800: '#597587', // Secondary Text
          accent: '#FF7F1C', // Secondary Accent Orange
          dark: '#1F2A55',
          card: '#FFFFFF',
          surface: '#F7FAFF'
        },
        brand: {
          primary: '#056FEC',
          accent: '#FF7F1C',
          dark: '#1F2A55',
          secondary: '#597587',
          light: '#F7FAFF',
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['"Somar Rounded"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Somar Rounded"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'bounce-short': 'bounce 0.5s ease-in-out 2',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
