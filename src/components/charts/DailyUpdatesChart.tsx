import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

export interface DailyUpdateData {
  update_day: string; // YYYY-MM-DD
  update_count: number;
}

interface DailyUpdatesChartProps {
  data: DailyUpdateData[];
}

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return (
      <div className="bg-surface-light dark:bg-surface-dark p-3 rounded-md shadow-lg border border-border-light dark:border-border-dark text-sm">
        <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{`Data: ${formattedDate}`}</p>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">{`Consultas Atualizadas: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


const DailyUpdatesChart: React.FC<DailyUpdatesChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark py-10">Sem dados de atualizações diárias para exibir.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: -10, bottom: 5 }} // Adjust margins
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="update_day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20} // Adjust gap for dates
          tickFormatter={(value) => {
            try {
              const date = new Date(value + 'T00:00:00Z'); // Treat as UTC date
              return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
            } catch (e) {
              return value; // Fallback
            }
          }}
          stroke="hsl(var(--text-secondary))" // Use Tailwind variable placeholders if possible, otherwise direct color
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="hsl(var(--text-secondary))"
          fontSize={12}
          allowDecimals={false} // Ensure integer ticks
        />
        <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }}
            content={<CustomTooltip />}
        />
        <Bar
          dataKey="update_count"
          fill="hsl(var(--primary))" // Use primary color variable
          radius={[4, 4, 0, 0]} // Rounded top corners
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DailyUpdatesChart;
