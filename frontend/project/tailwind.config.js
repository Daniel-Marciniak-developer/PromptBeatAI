/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'accent-from': '#6f00ff',
        'accent-to': '#009dff',
        'glass': 'rgba(255, 255, 255, 0.05)',
        'border': 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        '16': '16px',
      },
      boxShadow: {
        'accent-from/25': '0 25px 50px -12px rgba(111, 0, 255, 0.25)',
        'accent-to/25': '0 25px 50px -12px rgba(0, 157, 255, 0.25)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'hue-rotate': 'hue-rotate 3s linear infinite',
      },
    },
  },
  plugins: [],
};