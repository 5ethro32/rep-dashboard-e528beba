
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

// Format currency values with £ symbol and k/m suffixes
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  } else if (value >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  } else {
    return `£${value}`;
  }
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 p-3 rounded-md text-xs md:text-sm shadow-lg backdrop-blur-sm border border-gray-700">
        <p className="text-white font-medium mb-1">{payload[0].name}</p>
        <p className="text-white/80">{`${payload[0].value.toFixed(1)}%`}</p>
        <p className="text-white/80">{payload[0].payload.profit ? formatCurrency(payload[0].payload.profit) : ''}</p>
      </div>
    );
  }
  return null;
};

const DonutChart: React.FC<DonutChartProps> = ({ data, innerValue, innerLabel }) => {
  // Updated brand colors for consistent styling with the rest of the app
  const brandColors = [
    '#ef4444', // Finance Red (primary brand color)
    '#f97316', // Orange
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Green
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#64748b', // Slate
  ];

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={450}
            animationDuration={1000}
            animationBegin={200}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || brandColors[index % brandColors.length]} 
                className="transition-all duration-300 ease-in-out cursor-pointer hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {innerValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <div className="text-lg md:text-xl font-bold text-white">{innerValue}</div>
          {innerLabel && <div className="text-2xs md:text-xs text-gray-400 mt-0.5 opacity-80">{innerLabel}</div>}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
