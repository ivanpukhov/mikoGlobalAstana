import { createTheme } from '@mantine/core';

const miko = [
  '#e6fffa',
  '#bff7ee',
  '#94f0e2',
  '#5ae8d3',
  '#2ce5cd',
  '#0ce3cb',
  '#0bc3af',
  '#089d8d',
  '#06776c',
  '#03544c',
];

const gray = [
  '#fafafa',
  '#f4f4f5',
  '#e9e9eb',
  '#d4d4d8',
  '#a1a1aa',
  '#71717a',
  '#52525b',
  '#3f3f46',
  '#27272a',
  '#18181b',
];

export const theme = createTheme({
  primaryColor: 'miko',
  primaryShade: 5,
  colors: {
    miko,
    turquoise: miko,
    gray,
  },
  white: '#ffffff',
  black: '#0f172a',
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
  headings: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  radius: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  shadows: {
    xs: '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)',
    sm: '0 2px 8px rgba(15, 23, 42, 0.06)',
    md: '0 4px 14px rgba(15, 23, 42, 0.08)',
    lg: '0 10px 25px rgba(15, 23, 42, 0.10)',
    xl: '0 20px 40px rgba(15, 23, 42, 0.12)',
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        fw: 600,
        size: 'md'
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        withBorder: false,
      },
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
      },
    },
    NumberInput: {
      defaultProps: {
        size: 'md',
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        size: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        centered: true,
        overlayProps: { backgroundOpacity: 0.55, blur: 3 },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
        fw: 700,
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
