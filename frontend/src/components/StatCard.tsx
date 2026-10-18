import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  caption?: ReactNode;
  tone?: Tone;
}

export default function StatCard({ label, value, icon, caption, tone = 'primary' }: StatCardProps) {
  const theme = useTheme();
  const color = theme.palette[tone].main;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" component="p" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </Typography>
          </div>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(color, 0.12), color }}>
            {icon}
          </Avatar>
        </Stack>
        {caption && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
