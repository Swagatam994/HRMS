/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08090f',
        panel: '#11131c',
        line: 'rgba(255,255,255,0.12)'
      },
      boxShadow: {
        glow: '0 24px 80px rgba(37, 99, 235, 0.22)'
      }
    }
  },
  plugins: []
};
