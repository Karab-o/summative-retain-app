import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '../../hooks/useChartTheme';
import { formatCompactMoney, formatMonth } from '../../utils/format';

/** Bar chart of how much was spent on each day of the month. */
export default function DailySpendingChart({ data, month }: { data: { day: number; total: number }[]; month: string }) {
  const chart = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={chart.gridColor} />
        <XAxis dataKey="day" tick={chart.axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={8} />
        <YAxis tick={chart.axis} tickLine={false} axisLine={false} width={56} tickFormatter={formatCompactMoney} />
        <Tooltip {...chart.tooltip} labelFormatter={(day) => `${formatMonth(month).split(' ')[0]} ${day}`} />
        <Bar dataKey="total" name="Spent" fill={chart.primary} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
