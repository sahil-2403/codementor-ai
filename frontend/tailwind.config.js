const color = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: color('--color-page'),
        surface: color('--color-surface'),
        'surface-secondary': color('--color-surface-secondary'),
        foreground: color('--color-foreground'),
        'muted-foreground': color('--color-muted-foreground'),
        border: color('--color-border'),
        primary: {
          DEFAULT: color('--color-primary'),
          strong: color('--color-primary-strong'),
          soft: color('--color-primary-soft')
        },
        success: {
          DEFAULT: color('--color-success'),
          soft: color('--color-success-soft')
        },
        warning: {
          DEFAULT: color('--color-warning'),
          soft: color('--color-warning-soft')
        },
        error: {
          DEFAULT: color('--color-error'),
          soft: color('--color-error-soft')
        },
        focus: color('--color-focus')
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      borderRadius: {
        control: '0.75rem',
        surface: '1rem',
        panel: '1.25rem'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(17, 24, 39, 0.04), 0 8px 24px rgba(17, 24, 39, 0.06)',
        panel: '0 1px 3px rgba(17, 24, 39, 0.06), 0 16px 40px rgba(17, 24, 39, 0.08)',
        focus: '0 0 0 4px rgb(var(--color-primary-soft))'
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.2, 0, 0, 1)'
      }
    }
  },
  plugins: []
};
