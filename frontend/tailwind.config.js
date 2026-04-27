/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#EAF3DE',
          100: '#C0DD97',
          400: '#639922',
          600: '#3B6D11',
          800: '#27500A',
        },
        amber: {
          50:  '#FAEEDA',
          400: '#BA7517',
          800: '#633806',
        },
        red: {
          50:  '#FCEBEB',
          400: '#E24B4A',
          800: '#791F1F',
        },
        teal: {
          50:  '#E1F5EE',
          400: '#1D9E75',
          800: '#085041',
        },
      },
      fontFamily: {
        sans: ['Inter','system-ui','sans-serif'],
      },
    },
  },
  plugins: [],
};
