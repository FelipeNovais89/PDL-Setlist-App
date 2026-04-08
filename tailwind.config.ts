import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Azul escuro (backgrounds e nav)
        navy: {
          950: '#060d1f',
          900: '#0a1628',
          800: '#0f2040',
          700: '#162a52',
          600: '#1e3a6e',
        },
        // Amarelo ouro (accent)
        gold: {
          DEFAULT: '#f5c518',
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#f5c518',
          500: '#eab308',
          600: '#ca8a04',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
