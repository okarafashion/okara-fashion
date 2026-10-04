/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-subtle': 'var(--color-surface-subtle)',
        foreground: 'var(--color-text)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
        accent: 'var(--color-accent)',
        'accent-subtle': 'var(--color-accent-subtle)',
      },
      fontFamily: {
        editorial: ['var(--font-editorial)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.15em',
        luxury: '0.25em',
      },
      boxShadow: {
        'luxury-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
        'luxury-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
