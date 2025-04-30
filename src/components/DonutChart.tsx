
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
      <div className="bg-gray-800 p-2 border border-white/10 rounded-md text-xs md:text-sm shadow-lg backdrop-blur-sm">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-white/80">{`${payload[0].value}%`}</p>
        <p className="text-white/80">{payload[0].payload.profit ? formatCurrency(payload[0].payload.profit) : ''}</p>
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
            innerRadius="55%" // Adjusted inner radius for a bit thicker donut
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
                fill={entry.color} 
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
          {innerLabel && <div className="text-2xs md:text-xs text-finance-gray mt-0.5 opacity-80">{innerLabel}</div>}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
