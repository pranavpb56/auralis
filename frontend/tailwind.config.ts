/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07070f', surface: '#0d0d1a', card: '#121220',
        border: '#1c1c33', primary: '#7c3aed', 'primary-light': '#8b5cf6',
        secondary: '#ec4899', accent: '#06b6d4', text: '#f0f0f8', muted: '#8888a8', subtle: '#3a3a58',
      },
      fontFamily: { display: ['Georgia', 'serif'], body: ['system-ui', 'sans-serif'] },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
};
