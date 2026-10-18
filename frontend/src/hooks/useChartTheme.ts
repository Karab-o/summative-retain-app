import { useTheme } from '@mui/material/styles';
import { formatMoney } from '../utils/format';

/** Shared Recharts styling that follows the active MUI theme (light or dark). */
export function useChartTheme() {
  const theme = useTheme();
  return {
    axis: { fontSize: 12, fill: theme.palette.text.secondary },
    gridColor: theme.palette.divider,
    primary: theme.palette.primary.main,
    tooltip: {
      contentStyle: {
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 8,
        color: theme.palette.text.primary,
        fontSize: 13,
      },
      labelStyle: { color: theme.palette.text.secondary, marginBottom: 4 },
      itemStyle: { color: theme.palette.text.primary },
      cursor: { fill: theme.palette.action.hover },
      formatter: (value: unknown) => formatMoney(Number(value)),
    },
  };
}
