
import React from 'react';
import { LineChart as RechartLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  avg?: number;
  isProjected?: boolean; // New field to indicate projected data points
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  avgColor?: string;
  showAverage?: boolean;
  yAxisFormatter?: (value: number) => string;
  // New props for trajectory line
  trajectoryData?: DataPoint[];
  showTrajectory?: boolean;
}

// Format currency values with £ symbol and k/m suffixes
const defaultFormatter = (value: number): string => {
  if (value >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  } else if (value >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  } else {
    return `£${value}`;
  }
};

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  color = "#ea384c", 
  avgColor = "#8E9196", 
  showAverage = true,
  yAxisFormatter = defaultFormatter,
  trajectoryData,
  showTrajectory = false
}) => {
  // Calculate the minimum and maximum values for the Y-axis
  const minValue = Math.min(...data.map(item => item.value));
  const maxValue = Math.max(...data.map(item => item.value));
  const avgValues = data.filter(item => item.avg !== undefined).map(item => item.avg);
  const minAvg = avgValues.length > 0 ? Math.min(...avgValues as number[]) : Infinity;
  
  // Also consider trajectory data for the domain if provided
  const trajectoryMinValue = trajectoryData ? Math.min(...trajectoryData.map(item => item.value)) : Infinity;
  const trajectoryMaxValue = trajectoryData ? Math.max(...trajectoryData.map(item => item.value)) : -Infinity;
  
  // Set the domain to be slightly padded from the data points for better visualization
  const yAxisMin = Math.floor(Math.min(
    minValue, 
    minAvg !== Infinity ? minAvg : minValue,
    trajectoryMinValue !== Infinity ? trajectoryMinValue : minValue
  ) * 0.95);
  
  const yAxisMax = Math.ceil(Math.max(
    maxValue, 
    trajectoryMaxValue !== -Infinity ? trajectoryMaxValue : maxValue
  ) * 1.05);
  
  // Custom tooltip formatter to indicate projected values
  const customTooltipFormatter = (value: any, name: string, props: any) => {
    const isProjected = props.payload?.isProjected;
    const formattedValue = yAxisFormatter(value);
    
    if (isProjected) {
      return [`${formattedValue} (Projected)`, name];
    }
    
    return [formattedValue, name];
  };
  
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
          width={60}
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
          formatter={customTooltipFormatter}
        />
        
        {/* Main data line */}
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2.5}
          dot={{ fill: color, r: 2, strokeWidth: 0 }}
          activeDot={{ fill: color, r: 4, strokeWidth: 2 }}
          animationDuration={1500}
        />
        
        {/* Trajectory line when enabled */}
        {showTrajectory && trajectoryData && (
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={{ fill: color, r: 2, strokeWidth: 0 }}
            activeDot={{ fill: color, r: 4, strokeWidth: 2 }}
            animationDuration={1500}
            data={trajectoryData}
          />
        )}
        
        {/* Average line when enabled */}
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
