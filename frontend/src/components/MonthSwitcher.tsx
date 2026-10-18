import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { formatMonth, shiftMonthKey } from '../utils/format';

interface MonthSwitcherProps {
  month: string;
  onChange: (month: string) => void;
  /** Latest selectable month (YYYY-MM), e.g. the current month. */
  max?: string;
}

export default function MonthSwitcher({ month, onChange, max }: MonthSwitcherProps) {
  const next = shiftMonthKey(month, 1);
  return (
    <Paper variant="outlined" sx={{ display: 'inline-flex', alignItems: 'center', px: 0.5 }}>
      <IconButton size="small" aria-label="Previous month" onClick={() => onChange(shiftMonthKey(month, -1))}>
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="body2" sx={{ minWidth: 130, textAlign: 'center', fontWeight: 600 }} aria-live="polite">
        {formatMonth(month)}
      </Typography>
      <IconButton size="small" aria-label="Next month" disabled={Boolean(max && next > max)} onClick={() => onChange(next)}>
        <ChevronRightIcon />
      </IconButton>
    </Paper>
  );
}
