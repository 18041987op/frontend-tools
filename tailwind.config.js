/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E6F1FA',
          100: '#CCE3F5',
          200: '#99C7EB',
          300: '#66ABE1',
          400: '#338FD7',
          500: '#1E6FAE',
          600: '#155A8A',
          700: '#104567',
          800: '#0B2F45',
          900: '#061A23',
        },
        accent: {
          50:  '#FFF5E6',
          100: '#FEEBCC',
          200: '#FDD799',
          300: '#FBC366',
          400: '#F9A833',
          500: '#F7941D',
          600: '#E88412',
          700: '#B8690E',
          800: '#894F0B',
          900: '#5A3407',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
