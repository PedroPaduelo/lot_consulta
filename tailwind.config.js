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
      boxShadow: {
         'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // Example subtle shadow
         'card-dark': '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2)', // Slightly adjusted for dark
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Added forms plugin
  ],
}
