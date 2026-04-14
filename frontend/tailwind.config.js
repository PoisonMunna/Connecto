/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        'gradient-dark':  'linear-gradient(135deg, #1e1b4b, #0f172a)',
      },
      animation: {
        'fade-in':       'fadeIn .35s ease both',
        'slide-up':      'slideUp .4s ease both',
        'slide-right':   'slideRight .35s ease both',
        'slide-in-toast':'slideInToast .3s ease both',
        'pulse-slow':    'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':     'spin 1s linear infinite',
        'bounce-soft':   'bounceSoft .6s ease both',
      },
      keyframes: {
        fadeIn:        { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:       { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight:    { from: { opacity: 0, transform: 'translateX(-20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        slideInToast:  { from: { opacity: 0, transform: 'translateX(110%)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        bounceSoft:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow':      '0 0 20px rgba(59,130,246,.35)',
        'glow-lg':   '0 0 40px rgba(59,130,246,.25)',
        'card':      '0 4px 24px rgba(0,0,0,.35)',
        'card-hover':'0 8px 40px rgba(0,0,0,.5)',
      },
    },
  },
  plugins: [],
};
