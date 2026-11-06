/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nothing: {
          bg: '#0A0A0A',
          card: '#121212',
          border: '#242424',
          accent: '#E50914',
          muted: '#8A8A8A'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}

