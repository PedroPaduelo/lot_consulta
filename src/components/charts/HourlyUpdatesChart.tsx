import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

export interface HourlyUpdateData {
  update_hour: number; // 0-23
  update_count: number;
}

interface HourlyUpdatesChartProps {
  data: HourlyUpdateData[];
  targetDate: string; // YYYY-MM-DD format for display
}

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const hour = parseInt(label, 10);
    const formattedHour = `${String(hour).padStart(2, '0')}:00 - ${String(hour).padStart(2, '0')}:59`;
    return (
      <div className="bg-surface-light dark:bg-surface-dark p-3 rounded-md shadow-lg border border-border-light dark:border-border-dark text-sm">
        <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{`Hora: ${formattedHour}`}</p>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">{`Consultas Atualizadas: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const HourlyUpdatesChart: React.FC<HourlyUpdatesChartProps> = ({ data, targetDate }) => {
   // Ensure data for all 24 hours (0-23) exists, filling gaps with 0 count
   const completeData = Array.from({ length: 24 }, (_, i) => {
     const existing = data.find(d => d.update_hour === i);
     return existing || { update_hour: i, update_count: 0 };
   });

  if (!completeData || completeData.every(d => d.update_count === 0)) {
     const formattedTargetDate = new Date(targetDate + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark py-10">Sem dados de atualizações por hora para exibir ({formattedTargetDate}).</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={completeData}
        margin={{ top: 5, right: 10, left: -10, bottom: 5 }} // Adjust margins
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="update_hour"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${String(value).padStart(2, '0')}:00`} // Format as HH:00
          stroke="hsl(var(--text-secondary))"
          fontSize={12}
          interval={2} // Show every 3rd hour label to avoid clutter
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

export default HourlyUpdatesChart;
