/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       "#1E222F",   // page background
        surface:  "#2B3040",   // cards / sheets
        primary:  "#4F46E5",   // brand indigo
        success:  "#16A34A",
        danger:   "#DC2626",
        warning:  "#F59E0B",
        text:     "#E5E7EB",
        subtext:  "#9CA3AF",
      },
      borderRadius: { 
        card: '0.75rem' 
      },
    },
  },
  plugins: [],
}; 