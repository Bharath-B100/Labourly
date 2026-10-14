/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F9F5',
        surface: 'rgba(255,255,255,0.72)',
        raised: '#FFFFFF',
        ink: '#104C49',
        muted: '#466E68',
        accent: '#145C58',
        sunshine: '#F7C948',
        mint: '#DCEEE7',
        tinted: 'rgba(247,201,72,0.23)',
        outline: 'rgba(255,255,255,0.96)',
      },
    },
  },
  plugins: [],
};
