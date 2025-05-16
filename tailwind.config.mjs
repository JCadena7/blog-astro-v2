/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['class', '[data-theme="dark"]'],
  safelist: [
    'text-neutral-700',
    'dark:text-neutral-200',
    'text-neutral-800',
    'dark:text-neutral-100',
    // ...otras clases que uses dinámicamente
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            blockquote: {
              fontStyle: 'italic',
              color: 'theme(colors.gray.600)',
              borderLeftWidth: '4px',
              borderLeftColor: 'theme(colors.primary.500)',
              paddingLeft: '1rem',
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
            },
            'thead th': {
              backgroundColor: 'theme(colors.gray.100)',
              padding: '0.5rem',
              textAlign: 'left',
            },
            'tbody td': {
              padding: '0.5rem',
              borderBottomWidth: '1px',
              borderBottomColor: 'theme(colors.gray.200)',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};
