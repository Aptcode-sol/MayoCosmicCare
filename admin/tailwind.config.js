/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#000000",
                "on-primary": "#ffffff",
                "primary-container": "#1b1b1b",
                "surface": "#f9f9f9",
                "surface-container-lowest": "#ffffff",
                "surface-container-low": "#f3f3f3",
                "surface-container": "#eeeeee",
                "surface-container-high": "#e8e8e8",
                "surface-variant": "#e2e2e2",
                "on-surface": "#1a1c1c",
                "on-surface-variant": "#4c4546",
                "outline": "#7e7576",
                "outline-variant": "#cfc4c5",
                "secondary": "#5e5e5f",
                "on-secondary-fixed-variant": "#464747",
            },
            fontFamily: {
                sans: ['Hanken Grotesk', 'Inter', 'ui-sans-serif', 'system-ui'],
            },
            fontSize: {
                "display-xl": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                "headline-lg": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                "label-sm": ["13px", { "lineHeight": "18px", "letterSpacing": "0.01em", "fontWeight": "500" }],
                "button-text": ["14px", { "lineHeight": "20px", "fontWeight": "600" }],
            },
            spacing: {
                "gutter": "16px",
                "base": "6px",
                "stack-md": "16px",
                "container-margin": "32px",
                "stack-sm": "8px",
            },
            animation: {
                'slide-in-left': 'slide-in-left 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            },
            keyframes: {
                'slide-in-left': {
                    '0%': { transform: 'translateX(-50px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
