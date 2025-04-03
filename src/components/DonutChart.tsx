
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DataItem[];
  innerValue?: string;
  innerLabel?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-finance-darkSecondary p-2 border border-white/10 rounded-md text-sm">
        <p className="text-white">{`${payload[0].name}: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

const DonutChart: React.FC<DonutChartProps> = ({ data, innerValue, innerLabel }) => {
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={450}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {innerValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold">{innerValue}</div>
          {innerLabel && <div className="text-xs text-finance-gray">{innerLabel}</div>}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
