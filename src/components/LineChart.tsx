
import React from 'react';
import { LineChart as RechartLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  avg?: number;
  isProjected?: boolean; // Field to indicate projected data points
  isTrajectory?: boolean; // Field to indicate trajectory line segments
  // Add new fields for proposed values with rules applied
  proposedRule1Value?: number;
  proposedRule2Value?: number;
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
  // Flag to ensure x-axis only appears once
  shareXAxis?: boolean;
  // Support for right axis customization
  useRightAxis?: boolean;
  // New prop for percentage-based metrics (like margin)
  hasPercentageMetric?: boolean;
  // New props for showing proposed lines
  showProposedRules?: boolean;
  rule1Color?: string;
  rule2Color?: string;
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
  showTrajectory = false,
  shareXAxis = true,
  useRightAxis = false,
  hasPercentageMetric = false,
  showProposedRules = false,
  rule1Color = "#1EAEDB",
  rule2Color = "#8B5CF6"
}) => {
  // Calculate the minimum and maximum values for the Y-axis
  const minValue = Math.min(...data.map(item => item.value));
  const maxValue = Math.max(...data.map(item => item.value));
  const avgValues = data.filter(item => item.avg !== undefined).map(item => item.avg);
  const minAvg = avgValues.length > 0 ? Math.min(...avgValues as number[]) : Infinity;
  
  // Also consider trajectory data for the domain if provided
  const trajectoryMinValue = trajectoryData ? Math.min(...trajectoryData.map(item => item.value)) : Infinity;
  const trajectoryMaxValue = trajectoryData ? Math.max(...trajectoryData.map(item => item.value)) : -Infinity;
  
  // Consider proposed rule values if available
  const rule1Values = data.filter(item => item.proposedRule1Value !== undefined).map(item => item.proposedRule1Value);
  const rule2Values = data.filter(item => item.proposedRule2Value !== undefined).map(item => item.proposedRule2Value);
  
  const minRule1 = rule1Values.length > 0 ? Math.min(...rule1Values as number[]) : Infinity;
  const maxRule1 = rule1Values.length > 0 ? Math.max(...rule1Values as number[]) : -Infinity;
  const minRule2 = rule2Values.length > 0 ? Math.min(...rule2Values as number[]) : Infinity;
  const maxRule2 = rule2Values.length > 0 ? Math.max(...rule2Values as number[]) : -Infinity;
  
  // Set the domain to be slightly padded from the data points for better visualization
  const yAxisMin = Math.floor(Math.min(
    minValue, 
    minAvg !== Infinity ? minAvg : minValue,
    trajectoryMinValue !== Infinity ? trajectoryMinValue : minValue,
    minRule1 !== Infinity ? minRule1 : minValue,
    minRule2 !== Infinity ? minRule2 : minValue
  ) * 0.95);
  
  const yAxisMax = Math.ceil(Math.max(
    maxValue, 
    trajectoryMaxValue !== -Infinity ? trajectoryMaxValue : maxValue,
    maxRule1 !== -Infinity ? maxRule1 : maxValue,
    maxRule2 !== -Infinity ? maxRule2 : maxValue
  ) * 1.05);
  
  // For percentage-based metrics, use a fixed domain from 0-100
  const percentageDomain = hasPercentageMetric ? [0, 100] : [yAxisMin, yAxisMax];
  
  // Custom tooltip formatter to indicate projected values
  const customTooltipFormatter = (value: any, name: string, props: any) => {
    const isProjected = props.payload?.isProjected;
    const isTrajectory = props.payload?.isTrajectory;
    const formattedValue = yAxisFormatter(value);
    
    if (isProjected) {
      return [`${formattedValue} (Projected)`, name];
    }
    
    return [formattedValue, name];
  };
  
  // Custom right axis formatter for percentage values
  const percentageFormatter = (value: number): string => {
    return `${value}%`;
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
          // Ensure XAxis only shows once when multiple lines are displayed
          xAxisId="shared"
          allowDuplicatedCategory={false}
        />
        <YAxis 
          domain={useRightAxis ? undefined : [yAxisMin, yAxisMax]}
          tickLine={false} 
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tick={{ fill: '#8E9196', fontSize: 12 }}
          tickFormatter={yAxisFormatter}
          allowDecimals={false}
          width={60}
          yAxisId="left"
        />
        
        {/* Add a dedicated percentage axis when needed */}
        {hasPercentageMetric && (
          <YAxis 
            domain={percentageDomain}
            tickLine={false} 
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tick={{ fill: '#8E9196', fontSize: 12 }}
            tickFormatter={percentageFormatter}
            orientation="right"
            yAxisId="percentage"
            width={40}
          />
        )}
        
        {/* Optional right axis */}
        {useRightAxis && !hasPercentageMetric && (
          <YAxis 
            orientation="right"
            tickLine={false} 
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tick={{ fill: '#8E9196', fontSize: 12 }}
            allowDecimals={false}
            width={45}
            yAxisId="right"
          />
        )}
        
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
          activeDot={{ r: 4, stroke: color }}
          animationDuration={1500}
          xAxisId="shared"
          connectNulls={true}
          yAxisId={hasPercentageMetric ? "percentage" : (useRightAxis ? "right" : "left")}
        />
        
        {/* Rule 1 line when enabled */}
        {showProposedRules && (
          <Line 
            type="monotone" 
            dataKey="proposedRule1Value"
            name="Rule 1" 
            stroke={rule1Color} 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: rule1Color, r: 2, strokeWidth: 0 }}
            activeDot={{ r: 4, stroke: rule1Color }}
            animationDuration={1500}
            xAxisId="shared"
            connectNulls={true}
            yAxisId={hasPercentageMetric ? "percentage" : (useRightAxis ? "right" : "left")}
          />
        )}
        
        {/* Rule 2 line when enabled */}
        {showProposedRules && (
          <Line 
            type="monotone" 
            dataKey="proposedRule2Value" 
            name="Rule 2"
            stroke={rule2Color} 
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={{ fill: rule2Color, r: 2, strokeWidth: 0 }}
            activeDot={{ r: 4, stroke: rule2Color }}
            animationDuration={1500}
            xAxisId="shared"
            connectNulls={true}
            yAxisId={hasPercentageMetric ? "percentage" : (useRightAxis ? "right" : "left")}
          />
        )}
        
        {/* Trajectory line when enabled */}
        {showTrajectory && trajectoryData && (
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={{ fill: color, r: 2, strokeWidth: 0 }}
            activeDot={{ r: 4, stroke: color }}
            animationDuration={1500}
            data={trajectoryData}
            xAxisId="shared"
            connectNulls={true}
            yAxisId={hasPercentageMetric ? "percentage" : (useRightAxis ? "right" : "left")}
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
            activeDot={{ r: 3, stroke: avgColor }}
            animationDuration={1500}
            xAxisId="shared"
            yAxisId={hasPercentageMetric ? "percentage" : (useRightAxis ? "right" : "left")}
          />
        )}
      </RechartLine>
    </ResponsiveContainer>
  );
};

export default LineChart;
