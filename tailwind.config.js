/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        'primary-red': '#FF0000',
        'accent-white': '#FDFDFD',
        'accent-gray': '#656565',
        'button-black': '#0E0E0E',
        'gradient-start': '#FF1462',
        'gradient-middle': '#FFE53F',
        'gradient-end': '#E50004'
      },
      boxShadow: {
        glow: '0px 0px 72.3px 0px rgba(225, 225, 225, 0.23)'
      },
      gradientColorStops: {
        'start:': '#E600C7',
        'end:': '#FF2C72'
      }
    }
  },
  plugins: []
}
