import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { BudgetSummary } from '../api/types';
import { BUDGET_STATUS, formatMoney, formatPercent } from '../utils/format';

/** Spent-vs-budget bar with a status chip, used on the dashboard and budgets page. */
export default function BudgetProgress({ summary, dense = false }: { summary: BudgetSummary; dense?: boolean }) {
  const status = BUDGET_STATUS[summary.status];
  const percent = summary.percentUsed ?? 0;
  const barColor = status.color === 'default' ? 'primary' : status.color;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
        <Typography variant={dense ? 'body2' : 'body1'} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          <strong>{formatMoney(summary.spent)}</strong>
          {summary.amount !== null && (
            <Typography component="span" color="text.secondary" variant="inherit">
              {' '}
              of {formatMoney(summary.amount)}
            </Typography>
          )}
        </Typography>
        <Chip size="small" label={status.label} color={status.color} variant={status.color === 'default' ? 'outlined' : 'filled'} />
      </Stack>
      {summary.amount !== null && (
        <>
          <LinearProgress
            variant="determinate"
            value={Math.min(percent, 100)}
            color={barColor}
            sx={{ height: dense ? 6 : 10, borderRadius: 5 }}
            aria-label={`${formatPercent(percent)} of budget used`}
          />
          <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.75 }}>
            <Typography variant="caption" color="text.secondary">
              {formatPercent(percent)} used
            </Typography>
            <Typography
              variant="caption"
              color={summary.status === 'over' ? 'error.main' : 'text.secondary'}
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {summary.remaining !== null && summary.remaining < 0
                ? `${formatMoney(-summary.remaining)} over`
                : `${formatMoney(summary.remaining ?? 0)} left`}
            </Typography>
          </Stack>
        </>
      )}
    </Box>
  );
}
