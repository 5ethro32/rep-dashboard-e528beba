
import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Cell
} from 'recharts';

interface RevaMetricsChartProps {
  data: any[];
}

const RevaMetricsChart: React.FC<RevaMetricsChartProps> = ({ data }) => {
  // Color configuration
  const colors = {
    proposedMargin: '#ec4899',
    currentMargin: '#f43f5e',
    barFill: '#1e293b',
  };
  
  // Format large numbers with k for thousands, etc.
  const formatYAxisValue = (value: number) => {
    return `${value}%`;
  };
  
  // Custom tooltip to show all values
  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg">
        <p className="text-sm font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-xs flex items-center">
            <span className="w-3 h-3 inline-block mr-2" style={{ backgroundColor: colors.proposedMargin }}></span>
            <span>Proposed Margin: {payload[0] && payload[0].value !== undefined ? payload[0].value.toFixed(2) : '0.00'}%</span>
          </p>
          <p className="text-xs flex items-center">
            <span className="w-3 h-3 inline-block mr-2" style={{ backgroundColor: colors.currentMargin }}></span>
            <span>Current Margin: {payload[1] && payload[1].value !== undefined ? payload[1].value.toFixed(2) : '0.00'}%</span>
          </p>
          <p className="text-xs flex items-center mt-1">
            <span className="w-3 h-3 inline-block mr-2" style={{ backgroundColor: colors.barFill }}></span>
            <span>Item Count: {payload[2] && payload[2].value !== undefined ? payload[2].value : '0'}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-96">
      <h3 className="text-lg font-semibold mb-4">
        Margin Analysis by Usage Rank
      </h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            orientation="left"
            tickFormatter={formatYAxisValue}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => value}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />
          <Tooltip content={renderTooltip} />
          
          <Line
            type="monotone"
            dataKey="proposedMargin"
            name="Proposed Margin"
            stroke={colors.proposedMargin}
            strokeWidth={3}
            dot={{ r: 5, strokeWidth: 0, fill: colors.proposedMargin }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            yAxisId="left"
          />
          <Line
            type="monotone"
            dataKey="currentMargin"
            name="Current Margin"
            stroke={colors.currentMargin}
            strokeWidth={3}
            dot={{ r: 5, strokeWidth: 0, fill: colors.currentMargin }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            yAxisId="left"
          />
          
          <Bar 
            dataKey="itemCount" 
            name="Item Count" 
            yAxisId="right"
            barSize={60}
            fillOpacity={0.8}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors.barFill} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevaMetricsChart;
