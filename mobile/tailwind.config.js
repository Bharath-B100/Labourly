/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: '#FFFFFF',
        raised: '#FFFFFF',
        ink: '#202326',
        muted: '#202326',
        accent: '#202326',
        sunshine: '#FFCC25',
        mint: '#E5E7EB',
        tinted: '#E5E7EB',
        outline: '#E5E7EB',
      },
    },
  },
  plugins: [],
};
