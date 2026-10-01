/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#070a10',
          900: '#0b0f19',
          850: '#111726',
          800: '#161f33',
          700: '#222f4c',
          600: '#334468',
          accent: '#f59e0b',
          cyan: '#06b6d4',
          alert: '#ef4444',
          success: '#10b981',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};
