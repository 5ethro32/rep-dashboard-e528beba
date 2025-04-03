
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
  // Calculate the minimum and maximum values for the Y-axis
  const minValue = Math.min(...data.map(item => item.value));
  const maxValue = Math.max(...data.map(item => item.value));
  const avgValues = data.filter(item => item.avg !== undefined).map(item => item.avg);
  const minAvg = avgValues.length > 0 ? Math.min(...avgValues as number[]) : Infinity;
  
  // Set the domain to be slightly padded from the data points for better visualization
  const yAxisMin = Math.floor(Math.min(minValue, minAvg !== Infinity ? minAvg : minValue) * 0.95);
  const yAxisMax = Math.ceil(Math.max(...data.map(item => item.value)) * 1.05);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartLine
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis 
          dataKey="name" 
          tickLine={false} 
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tick={{ fill: '#8E9196', fontSize: 12 }}
        />
        <YAxis 
          domain={[yAxisMin, yAxisMax]}
          tickLine={false} 
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tick={{ fill: '#8E9196', fontSize: 12 }}
          tickFormatter={yAxisFormatter}
          allowDecimals={false}
          width={50}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1A1F2C', 
            borderColor: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
          labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '5px' }}
          itemStyle={{ padding: '2px 0' }}
          cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2.5}
          dot={{ fill: color, r: 2, strokeWidth: 0 }}
          activeDot={{ fill: color, r: 4, strokeWidth: 2 }}
          animationDuration={1500}
        />
        {showAverage && (
          <Line 
            type="monotone" 
            dataKey="avg" 
            stroke={avgColor} 
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={{ fill: avgColor, r: 1.5, strokeWidth: 0 }}
            activeDot={{ fill: avgColor, r: 3, strokeWidth: 1 }}
            animationDuration={1500}
          />
        )}
      </RechartLine>
    </ResponsiveContainer>
  );
};

export default LineChart;
