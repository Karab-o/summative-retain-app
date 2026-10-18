import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { useMemo, type ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';
import { buildTheme } from './theme';

export default function AppThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppSelector((state) => state.ui.themeMode);
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={3500} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  );
}
