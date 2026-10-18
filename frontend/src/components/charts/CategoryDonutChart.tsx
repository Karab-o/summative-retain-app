import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySpending } from '../../api/types';
import { useChartTheme } from '../../hooks/useChartTheme';
import { formatMoney, formatPercent } from '../../utils/format';

/** Donut chart of spending per category with a legend listing amounts and shares. */
export default function CategoryDonutChart({ data, total }: { data: CategorySpending[]; total: number }) {
  const chart = useChartTheme();

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
      <Box sx={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((row) => (
                <Cell key={row.categoryId ?? row.name} fill={row.color} />
              ))}
            </Pie>
            <Tooltip {...chart.tooltip} />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
            <Typography variant="subtitle1" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(total)}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Stack spacing={1} sx={{ flex: 1, width: '100%', minWidth: 0 }} component="ul" style={{ margin: 0, padding: 0 }}>
        {data.map((row) => (
          <Stack key={row.categoryId ?? row.name} direction="row" spacing={1} component="li" sx={{ alignItems: 'center', listStyle: 'none' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
            <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {row.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatPercent(row.percentage)}
            </Typography>
            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 80, textAlign: 'right' }}>
              {formatMoney(row.total)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
