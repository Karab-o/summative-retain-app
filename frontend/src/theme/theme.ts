import { createTheme } from '@mui/material/styles';
import type { ThemeMode } from '../store/uiSlice';

export function buildTheme(mode: ThemeMode) {
  const light = mode === 'light';
  return createTheme({
    palette: {
      mode,
      primary: { main: light ? '#0f766e' : '#2dd4bf' },
      secondary: { main: light ? '#4f46e5' : '#818cf8' },
      background: light ? { default: '#f4f7f6', paper: '#ffffff' } : { default: '#0b1312', paper: '#111c1b' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", Roboto, system-ui, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiCardHeader: {
        styleOverrides: {
          title: { fontSize: '1rem', fontWeight: 600 },
          subheader: { fontSize: '0.8125rem' },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
      MuiTextField: { defaultProps: { fullWidth: true } },
    },
  });
}
