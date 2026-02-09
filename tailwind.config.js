/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'DM Serif Display', 'Georgia', 'serif'],
      },
      colors: {
        forest: {
          DEFAULT: '#2A4036',
          light: '#4A6359',
          dark: '#1F3029',
        },
        sage: {
          DEFAULT: '#E7ECEA',
          dark: '#D1D8D6',
        },
        sand: {
          DEFAULT: '#F7F5F0',
        },
        mist: {
          DEFAULT: '#FDFCFB',
        },
        'ocean-muted': '#5B7A8C',
        'text-primary': '#252825',
        'text-soft': '#5C5F5C',
        stone: '#7D786D',
      },
    },
  },
  plugins: [],
};
