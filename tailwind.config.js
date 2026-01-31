/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'basely-dark': '#0F1419',
        'basely-navy': '#1A2332',
        'basely-orange': '#FF6B35', // Vibrant Ignition Orange
        'basely-orange-dim': '#CC552A',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-jetbrains)'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-gradient': 'linear-gradient(145deg, rgba(26, 35, 50, 0.6) 0%, rgba(15, 20, 25, 0.8) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 107, 53, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.6)' },
        }
      }
    },
  },
  plugins: [],
};