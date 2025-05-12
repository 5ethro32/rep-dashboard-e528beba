
import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { cn } from "@/lib/utils";

interface RevaMetricsChartUpdatedProps {
  data: any[];
}

const RevaMetricsChartUpdated: React.FC<RevaMetricsChartUpdatedProps> = ({ data }) => {
  // Color configuration aligned with branding
  const colors = {
    proposedMargin: '#9b87f5', // Updated to brand purple
    currentMargin: '#3b82f6', // Updated to brand blue
    barFill: '#1A1F2C', // Updated to dark background
  };
  
  // Custom tooltip to show all values with improved styling
  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 p-3 rounded-md shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center">
              <span className="w-2 h-2 inline-block mr-2 rounded-full" style={{ backgroundColor: colors.proposedMargin }}></span>
              <span className="text-xs">Proposed Margin:</span>
            </div>
            <span className="text-xs font-medium">{payload[0] && payload[0].value !== undefined ? payload[0].value.toFixed(2) : '0.00'}%</span>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center">
              <span className="w-2 h-2 inline-block mr-2 rounded-full" style={{ backgroundColor: colors.currentMargin }}></span>
              <span className="text-xs">Current Margin:</span>
            </div>
            <span className="text-xs font-medium">{payload[1] && payload[1].value !== undefined ? payload[1].value.toFixed(2) : '0.00'}%</span>
          </div>
          
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-700/50 mt-1">
            <div className="flex items-center">
              <span className="w-2 h-2 inline-block mr-2 rounded-full" style={{ backgroundColor: colors.barFill }}></span>
              <span className="text-xs">Item Count:</span>
            </div>
            <span className="text-xs font-medium">{payload[2] && payload[2].value !== undefined ? payload[2].value : '0'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="proposedMarginGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.proposedMargin} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={colors.proposedMargin} stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            tickMargin={10}
            hide={false} // Hide axis label but keep ticks
          />
          
          <YAxis 
            yAxisId="left"
            orientation="left"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
            domain={['dataMin - 5', 'dataMax + 5']}
            hide={true} // Hide axis label but keep ticks
          />
          
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            domain={[0, 'dataMax + 20']}
            hide={true} // Hide axis label but keep ticks
          />
          
          <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
          
          <Bar 
            dataKey="itemCount" 
            name="Item Count" 
            yAxisId="right"
            barSize={30}
            fillOpacity={0.5}
            fill={colors.barFill}
            radius={[5, 5, 0, 0]}
          />
          
          <Line
            type="monotone"
            dataKey="proposedMargin"
            name="Proposed Margin"
            stroke={colors.proposedMargin}
            strokeWidth={2.5}
            dot={{ r: 5, strokeWidth: 0, fill: colors.proposedMargin }}
            activeDot={{ r: 7, strokeWidth: 0 }}
            yAxisId="left"
            isAnimationActive={true}
            animationDuration={1000}
            connectNulls={true}
          />
          
          <Line
            type="monotone"
            dataKey="currentMargin"
            name="Current Margin"
            stroke={colors.currentMargin}
            strokeWidth={2.5}
            dot={{ r: 5, strokeWidth: 0, fill: colors.currentMargin }}
            activeDot={{ r: 7, strokeWidth: 0 }}
            yAxisId="left"
            isAnimationActive={true}
            animationDuration={1000}
            connectNulls={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevaMetricsChartUpdated;
