/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B9AAA',
          dark: '#158a96',
          light: '#2ab4c6'
        },
        sidebar: {
          DEFAULT: '#050505',
          text: '#F5F1E8'
        },
        bg: {
          light: '#F5F1E8'
        }
      },
      borderRadius: {
        DEFAULT: '4px'
      }
    },
  },
  plugins: [],
}
