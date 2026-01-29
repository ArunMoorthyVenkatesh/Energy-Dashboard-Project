/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media', // Switches automatically based on OS theme (or use 'class' for manual)
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#1f6eff',
          orange: '#f09c37',
          green: '#67ae5b',
          gray: '#606060',
        },
        secondary: {
          gray: '#808080',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
