/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          light: '#52B788',
          dark: '#1B4332',
        },
        accent: {
          DEFAULT: '#F4A261',
          light: '#FDDCB0',
        },
        background: '#F8FAF5',
        surface: '#FFFFFF',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        border: '#E5E7EB',
        'text-primary': '#1B1B1B',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        'nunito-regular': ['Nunito-Regular'],
        'nunito-semibold': ['Nunito-SemiBold'],
        'nunito-bold': ['Nunito-Bold'],
        'nunito-extrabold': ['Nunito-ExtraBold'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
    },
  },
  plugins: [],
};
