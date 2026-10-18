import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';
import { formatCompactMoney, formatMonth, formatShortMonth } from '../../utils/format';

/** Area chart of total spending over the last few months. */
export default function MonthlyTrendChart({ data }: { data: { month: string; total: number }[] }) {
  const chart = useChartTheme();
  // React ids contain characters that are not valid inside url(#...), so strip them.
  const gradientId = `trend-${useId().replace(/[^\w-]/g, '')}`;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chart.primary} stopOpacity={0.3} />
            <stop offset="100%" stopColor={chart.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={chart.gridColor} />
        <XAxis dataKey="month" tick={chart.axis} tickLine={false} axisLine={false} tickFormatter={formatShortMonth} />
        <YAxis tick={chart.axis} tickLine={false} axisLine={false} width={56} tickFormatter={formatCompactMoney} />
        <Tooltip {...chart.tooltip} cursor={{ stroke: chart.gridColor }} labelFormatter={(m) => formatMonth(String(m))} />
        <Area
          type="monotone"
          dataKey="total"
          name="Spent"
          stroke={chart.primary}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: chart.primary }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
