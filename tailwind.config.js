/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/popup/**/*.{tsx,ts}",
    "./src/options/**/*.{tsx,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
      }
    }
  },
  plugins: []
}
