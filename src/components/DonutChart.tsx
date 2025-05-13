
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DataItem {
  name: string;
  value: number; // This is the required property that was missing in UsageWeightedMetrics
  color: string;
  profit?: number; // Making this optional since it's only used in some contexts
  range?: string; // Making range optional as it's not used directly in rendering
  count?: number; // Making count optional as it's converted to value
  revenue?: number; // Adding revenue as optional
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
  // Updated brand colors to match homepage donuts - using red shades predominantly
  const brandColors = [
    '#ef4444', // Primary red
    '#dc2626', // Darker red
    '#f87171', // Lighter red/pink
    '#fb923c', // Orange (for contrast/accent)
    '#b91c1c', // Deep red
    '#fca5a5', // Very light red
    '#fdba74', // Light orange
    '#c2410c', // Dark orange
    '#fecdd3', // Pale pink
    '#7f1d1d', // Very dark red
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
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1}
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
