/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class strategy for dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme Colors
        'background-light': '#F9FAFB', // gray-50
        'surface-light': '#FFFFFF',    // white
        'text-primary-light': '#1F2937', // gray-800
        'text-secondary-light': '#6B7280', // gray-500
        'primary-light': '#2563EB',      // blue-600
        'primary-hover-light': '#1D4ED8', // blue-700
        'border-light': '#E5E7EB',       // gray-200
        'muted-light': '#F3F4F6',        // gray-100

        // Dark Theme Colors
        'background-dark': '#111827', // gray-900
        'surface-dark': '#1F2937',    // gray-800
        'text-primary-dark': '#F9FAFB', // gray-100
        'text-secondary-dark': '#9CA3AF', // gray-400
        'primary-dark': '#3B82F6',      // blue-500
        'primary-hover-dark': '#2563EB', // blue-600
        'border-dark': '#374151',       // gray-700
        'muted-dark': '#374151',        // gray-700
      },
      // Example: Define semantic color names if needed
      // backgroundColor: theme => ({
      //   ...theme('colors'),
      //   'app-bg': theme('colors.background-light'),
      //   'app-bg-dark': theme('colors.background-dark'),
      //   'card-bg': theme('colors.surface-light'),
      //   'card-bg-dark': theme('colors.surface-dark'),
      // }),
      // textColor: theme => ({
      //   ...theme('colors'),
      //   'base': theme('colors.text-primary-light'),
      //   'base-dark': theme('colors.text-primary-dark'),
      //   'muted': theme('colors.text-secondary-light'),
      //   'muted-dark': theme('colors.text-secondary-dark'),
      // }),
      // borderColor: theme => ({
      //   ...theme('colors'),
      //   'default': theme('colors.border-light'),
      //   'default-dark': theme('colors.border-dark'),
      // })
    },
  },
  plugins: [],
}
