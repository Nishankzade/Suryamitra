/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sun-yellow': '#FFB800',
        'sun-orange': '#FF6B00',
        'sky-blue':   '#4A90D9',
        'deep-sky':   '#0A1628',
        'surface':    '#0F1E35',
        'surface2':   '#162440',
      },
      fontFamily: {
        baloo: ['"Baloo 2"', 'cursive'],
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        pulseDot: {
          '0%,100%': { opacity: 1 },
          '50%':     { opacity: 0.4 },
        },
      },
    },
  },
  plugins: [],
}
