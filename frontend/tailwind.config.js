/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                cosmic: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065'
                },
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b'
                },
                "on-primary": "#ffffff",
                "on-tertiary-fixed": "#1a1c1c",
                "on-secondary-fixed-variant": "#464747",
                "inverse-primary": "#c6c6c6",
                "on-error": "#ffffff",
                "on-tertiary-container": "#838484",
                "surface-container": "#eeeeee",
                "primary": "#000000",
                "tertiary-fixed": "#e2e2e2",
                "surface": "#f9f9f9",
                "surface-bright": "#f9f9f9",
                "on-background": "#1a1c1c",
                "surface-container-low": "#f3f3f3",
                "secondary-container": "#e0dfdf",
                "background": "#f9f9f9",
                "on-primary-container": "#848484",
                "error": "#ba1a1a",
                "inverse-surface": "#2f3131",
                "on-tertiary": "#ffffff",
                "on-secondary-container": "#626363",
                "primary-fixed": "#e2e2e2",
                "on-error-container": "#93000a",
                "outline-variant": "#cfc4c5",
                "on-primary-fixed-variant": "#474747",
                "primary-container": "#1b1b1b",
                "error-container": "#ffdad6",
                "tertiary": "#000000",
                "outline": "#7e7576",
                "on-surface": "#1a1c1c",
                "on-primary-fixed": "#1b1b1b",
                "primary-fixed-dim": "#c6c6c6",
                "inverse-on-surface": "#f1f1f1",
                "on-tertiary-fixed-variant": "#454747",
                "on-surface-variant": "#4c4546",
                "surface-variant": "#e2e2e2",
                "on-secondary": "#ffffff",
                "surface-container-high": "#e8e8e8",
                "surface-container-highest": "#e2e2e2",
                "tertiary-container": "#1a1c1c",
                "surface-tint": "#5e5e5e",
                "surface-dim": "#dadada",
                "secondary": "#5e5e5f",
                "surface-container-lowest": "#ffffff",
                "secondary-fixed": "#e3e2e2",
                "secondary-fixed-dim": "#c7c6c6",
                "on-secondary-fixed": "#1a1c1c",
                "tertiary-fixed-dim": "#c6c6c6"
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
            spacing: {
                '9': '2.25rem',
                '14': '3.5rem',
                "gutter": "16px",
                "base": "6px",
                "stack-md": "16px",
                "container-margin": "32px",
                "section-gap": "32px",
                "stack-sm": "8px"
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                "display-xl": ["var(--font-hanken-grotesk)", "Hanken Grotesk", "sans-serif"],
                "button-text": ["var(--font-hanken-grotesk)", "Hanken Grotesk", "sans-serif"],
                "body-md": ["var(--font-hanken-grotesk)", "Hanken Grotesk", "sans-serif"],
                "label-sm": ["var(--font-hanken-grotesk)", "Hanken Grotesk", "sans-serif"],
                "headline-lg-mobile": ["var(--font-hanken-grotesk)", "Hanken Grotesk", "sans-serif"],
                "headline-lg": ["var(--font-hanken-grotesk)", "Hanken Grotesk", "sans-serif"]
            },
            fontSize: {
                "display-xl": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                "button-text": ["14px", { "lineHeight": "20px", "fontWeight": "600" }],
                "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                "label-sm": ["13px", { "lineHeight": "18px", "letterSpacing": "0.01em", "fontWeight": "500" }],
                "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                "headline-lg": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.01em", "fontWeight": "600" }]
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'fade-in': 'fade-in 0.4s ease-out forwards',
                'glow': 'glow 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                glow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backdropBlur: {
                xs: '2px',
            }
        }
    },
    plugins: [],
}
