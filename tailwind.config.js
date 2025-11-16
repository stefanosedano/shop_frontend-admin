/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ui: {
          bg: {
            base: 'var(--ui-bg-base)',
            subtle: 'var(--ui-bg-subtle)',
            component: 'var(--ui-bg-component)',
            hover: 'var(--ui-bg-hover)',
            disabled: 'var(--ui-bg-disabled)',
            interactive: 'var(--ui-bg-interactive)',
          },
          fg: {
            base: 'var(--ui-fg-base)',
            subtle: 'var(--ui-fg-subtle)',
            muted: 'var(--ui-fg-muted)',
            disabled: 'var(--ui-fg-disabled)',
            interactive: 'var(--ui-fg-interactive)',
            error: 'var(--ui-fg-error)',
          },
          border: {
            base: 'var(--ui-border-base)',
            strong: 'var(--ui-border-strong)',
            interactive: 'var(--ui-border-interactive)',
            error: 'var(--ui-border-error)',
          },
        },
      },
      boxShadow: {
        'elevation-card-rest': 'var(--elevation-card-rest)',
        'elevation-card-hover': 'var(--elevation-card-hover)',
        'elevation-modal': 'var(--elevation-modal)',
        'borders-focus': 'var(--borders-focus)',
      },
    },
  },
  plugins: [],
}
