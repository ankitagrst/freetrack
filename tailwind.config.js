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
          DEFAULT: '#2DB36C',
          dark: '#1F8F5F',
          light: '#4FC98A'
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          light: '#fee2e2'
        },
        success: {
          DEFAULT: '#2DB36C',
          dark: '#1F8F5F',
          light: '#D1FAE5'
        },
        info: {
          DEFAULT: '#4FC98A',
          dark: '#2DB36C',
          light: '#D1FAE5'
        },
        accent: {
          DEFAULT: '#7c3aed',
          dark: '#6d28d9',
          light: '#f5f3ff'
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          light: '#fff7ed'
        },
        neutral: {
          DEFAULT: '#1F2933',
          muted: '#6B7280'
        },
        sidebar: {
          DEFAULT: '#1F2933',
          text: '#F4F6F5'
        },
        bg: {
          DEFAULT: '#F4F6F5',
          light: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial']
      },
      borderRadius: {
        DEFAULT: '4px'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
