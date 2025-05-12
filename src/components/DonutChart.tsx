
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DataItem {
  name: string;
  value: number;
  color: string;
  profit?: number;
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
    return `£${value.toFixed(2)}`;
  }
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/90 backdrop-blur-sm p-3 border border-white/10 rounded-md text-xs md:text-sm shadow-lg">
        <p className="text-white font-medium mb-1">{payload[0].name}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white/80">Value:</span>
            <span className="font-medium">{typeof payload[0].value === 'number' ? 
              Number.isInteger(payload[0].value) ? payload[0].value : payload[0].value.toFixed(2) 
              : payload[0].value}
              {!payload[0].name.includes('%') && payload[0].value > 1 && '%'}
            </span>
          </div>
          {payload[0].payload.profit !== undefined && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 mt-1">
              <span className="text-white/80">Profit:</span>
              <span className="font-medium">{formatCurrency(payload[0].payload.profit)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const DonutChart: React.FC<DonutChartProps> = ({ data, innerValue, innerLabel }) => {
  // Ensure we have some minimum size for segments to avoid tiny ones
  const processedData = data.map(item => ({
    ...item,
    value: Math.max(item.value, 0.1) // Ensure minimum value for visibility
  }));
  
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processedData}
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
            stroke="transparent"
          >
            {processedData.map((entry, index) => (
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
          {innerLabel && <div className="text-2xs md:text-xs text-white/60 mt-0.5">{innerLabel}</div>}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
