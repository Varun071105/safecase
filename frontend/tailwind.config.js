/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0C2038',
          dark: '#071526',
          active: '#132A47',
          light: '#1B3557',
          subtle: '#24446E'
        },
        safecase: {
          red: '#C93636',
          redHover: '#B22B2B',
          redLight: '#FDF2F2',
          bg: '#F4F6F8',
          card: '#FFFFFF',
          border: '#E2E8F0',
          textDark: '#0C2038',
          textMuted: '#64748B',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
