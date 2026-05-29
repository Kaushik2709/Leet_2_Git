/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
    "./popup.tsx",
    "./contents/**/*.{ts,tsx}",
    "./background/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
