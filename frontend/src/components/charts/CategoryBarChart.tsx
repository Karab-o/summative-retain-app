import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CategoryUsage } from '../../api/types';
import { useChartTheme } from '../../hooks/useChartTheme';
import { formatCompactMoney } from '../../utils/format';

/** Horizontal bars of total spending per category (admin insights). */
export default function CategoryBarChart({ data }: { data: CategoryUsage[] }) {
  const chart = useChartTheme();
  const height = Math.max(200, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={chart.gridColor} />
        <XAxis type="number" tick={chart.axis} tickLine={false} axisLine={false} tickFormatter={formatCompactMoney} />
        <YAxis type="category" dataKey="name" tick={chart.axis} tickLine={false} axisLine={false} width={120} />
        <Tooltip {...chart.tooltip} />
        <Bar dataKey="total" name="Total spent" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((row) => (
            <Cell key={row.categoryId} fill={row.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
