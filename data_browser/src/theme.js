import { createTheme } from '@mui/material/styles';

export const THEME_MODE_STORAGE_KEY = 'marin-data-browser-theme-mode';

export function createAppTheme(mode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? '#0f1117' : '#f5f7fb',
        paper: isDark ? '#161b22' : '#ffffff',
      },
      primary: {
        main: isDark ? '#8ab4f8' : '#1f6feb',
      },
      secondary: {
        main: isDark ? '#9aa4b2' : '#6e7781',
      },
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontSize: 14,
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      body2: {
        lineHeight: 1.45,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          size: 'small',
        },
      },
    },
  });
}
