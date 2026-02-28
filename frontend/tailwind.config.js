/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'deep-space': '#0F172A',
                'neon-mint': '#10B981',
                'electric-cyan': '#06B6D4',
                'alert-crimson': '#EF4444',
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
