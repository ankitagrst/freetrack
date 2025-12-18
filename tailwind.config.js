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
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          light: '#fee2e2'
        },
        success: {
          DEFAULT: '#16a34a',
          dark: '#15803d',
          light: '#dcfce7'
        },
        info: {
          DEFAULT: '#06b6d4',
          dark: '#0891b2',
          light: '#cffafe'
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
          DEFAULT: '#6b7280',
          muted: '#9ca3af'
        },
        sidebar: {
          DEFAULT: '#050505',
          text: '#F5F1E8'
        },
        bg: {
          DEFAULT: '#F7F9FB',
          light: '#F5F1E8'
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
