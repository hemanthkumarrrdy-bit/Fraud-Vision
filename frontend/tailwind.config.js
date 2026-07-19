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
        gs: {
          navy: {
            DEFAULT: '#0B132B',
            dark: '#070C1B',
            light: '#1C2541',
            muted: '#5A6A85',
          },
          gold: {
            DEFAULT: '#D4AF37',
            hover: '#C29B27',
            light: '#F4E5B8',
          },
          slate: {
            DEFAULT: '#F8FAFC',
            border: '#E2E8F0',
            darkborder: '#1E293B',
            bg: '#F1F5F9',
          },
          status: {
            safe: '#10B981',       // Emerald for low risk
            warning: '#F59E0B',    // Amber for moderate risk
            danger: '#EF4444',     // Red for high risk
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
