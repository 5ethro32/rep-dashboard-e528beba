
import React from 'react';
import { LineChart as RechartLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  avg?: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  avgColor?: string;
  showAverage?: boolean;
  yAxisFormatter?: (value: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  color = "#ea384c", 
  avgColor = "#8E9196", 
  showAverage = true,
  yAxisFormatter = (value) => `£${value}k`
}) => {
  // Calculate the minimum value for the Y-axis
  const minValue = Math.floor(Math.min(...data.map(item => item.value)) * 0.9);
  const avgValues = data.filter(item => item.avg !== undefined).map(item => item.avg);
  const minAvg = avgValues.length > 0 ? Math.min(...avgValues as number[]) : Infinity;
  
  // Set the domain minimum to be slightly lower than the lowest data point
  const yAxisMin = Math.min(minValue, minAvg !== Infinity ? Math.floor(minAvg * 0.9) : minValue);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartLine
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="name" 
          tickLine={false} 
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tick={{ fill: '#8E9196', fontSize: 12 }}
        />
        <YAxis 
          domain={[yAxisMin, 'auto']}
          tickLine={false} 
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tick={{ fill: '#8E9196', fontSize: 12 }}
          tickFormatter={yAxisFormatter}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1A1F2C', 
            borderColor: 'rgba(255,255,255,0.1)',
            color: '#ffffff'
          }}
          labelStyle={{ color: '#ffffff' }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2}
          dot={{ fill: color, r: 3 }}
          activeDot={{ fill: color, r: 5, strokeWidth: 2 }}
        />
        {showAverage && (
          <Line 
            type="monotone" 
            dataKey="avg" 
            stroke={avgColor} 
            strokeWidth={1.5}
            dot={{ fill: avgColor, r: 2 }}
            activeDot={{ fill: avgColor, r: 4, strokeWidth: 1 }}
          />
        )}
      </RechartLine>
    </ResponsiveContainer>
  );
};

export default LineChart;
