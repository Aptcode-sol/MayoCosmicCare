/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f8fbff',
                    100: '#eef6ff',
                    200: '#dbeeff',
                    300: '#b8ddff',
                    400: '#7cc1ff',
                    500: '#3aa0ff',
                    600: '#0077e6',
                    700: '#005bb4',
                    800: '#003f82',
                    900: '#00254d'
                }
            },
            spacing: {
                '9': '2.25rem',
                '14': '3.5rem'
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui']
            }
        }
    },
    plugins: [],
}
