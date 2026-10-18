import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import Brand from './Brand';

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 4,
        background: (theme) =>
          `radial-gradient(circle at 15% 10%, ${theme.palette.primary.main}22, transparent 40%), radial-gradient(circle at 85% 90%, ${theme.palette.secondary.main}1f, transparent 40%)`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Brand size={40} />
        </Box>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" component="h1">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
              {subtitle}
            </Typography>
            {children}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
