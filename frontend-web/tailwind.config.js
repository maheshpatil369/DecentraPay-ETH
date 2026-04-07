/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        dp: {
          bg:      '#0a0a1a',
          bg2:     '#11112a',
          bg3:     '#1a1a38',
          surface: '#16163a',
          border:  'rgba(255,255,255,0.07)',
          accent:  '#6c63ff',
          accent2: '#00d4aa',
          accent3: '#ff6b9d',
          text:    '#f0f0ff',
          text2:   '#9999cc',
          text3:   '#5555aa',
          success: '#00d4aa',
          danger:  '#ff4d6d',
          warning: '#ffb703',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'spin-slow': 'spin 0.7s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow':      '0 0 40px rgba(108,99,255,0.18)',
        'glow-sm':   '0 4px 20px rgba(108,99,255,0.35)',
        'card':      '0 8px 32px rgba(0,0,0,0.45)',
      },
      borderRadius: {
        'xl2': '14px',
        'xl3': '22px',
      },
    },
  },
  plugins: [],
};
