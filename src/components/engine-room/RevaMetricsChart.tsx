
import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';

interface RevaMetricsChartProps {
  data: any[];
}

const RevaMetricsChart: React.FC<RevaMetricsChartProps> = ({ data }) => {
  const [activeMetric, setActiveMetric] = useState<'margin' | 'profit'>('margin');
  
  // Color configuration
  const colors = {
    currentMargin: '#f43f5e',
    proposedMargin: '#ec4899',
    currentProfit: '#3b82f6',
    proposedProfit: '#8b5cf6',
    barFill: '#0f172a',
  };
  
  // Format large numbers with k for thousands, etc.
  const formatYAxisValue = (value: number) => {
    if (activeMetric === 'profit') {
      if (value >= 1000) {
        return `£${(value / 1000).toFixed(1)}k`;
      }
      return `£${value}`;
    } else {
      return `${value}%`;
    }
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
          {activeMetric === 'margin' ? (
            <>
              <p className="text-xs flex items-center">
                <span className="w-3 h-3 inline-block mr-2" style={{ backgroundColor: colors.proposedMargin }}></span>
                <span>Proposed Margin: {payload[0] && payload[0].value !== undefined ? payload[0].value.toFixed(2) : '0.00'}%</span>
              </p>
              <p className="text-xs flex items-center">
                <span className="w-3 h-3 inline-block mr-2" style={{ backgroundColor: colors.currentMargin }}></span>
                <span>Current Margin: {payload[1] && payload[1].value !== undefined ? payload[1].value.toFixed(2) : '0.00'}%</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-xs flex items-center">
                <span className="w-3 h-3 inline-block mr-2" style={{ backgroundColor: colors.proposedProfit }}></span>
                <span>Proposed Profit: £{payload[0] && payload[0].value !== undefined ? payload[0].value.toLocaleString() : '0'}</span>
              </p>
              <p className="text-xs flex items-center">
                <span className="w-3 h-3 inline-block mr-2" style={{ backgroundColor: colors.currentProfit }}></span>
                <span>Current Profit: £{payload[1] && payload[1].value !== undefined ? payload[1].value.toLocaleString() : '0'}</span>
              </p>
            </>
          )}
          <p className="text-xs flex items-center mt-1">
            <span className="w-3 h-3 inline-block mr-2" style={{ backgroundColor: colors.barFill }}></span>
            <span>Item Count: {payload[2] && payload[2].value !== undefined ? payload[2].value : '0'}</span>
          </p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full h-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {activeMetric === 'margin' 
            ? 'Margin Analysis by Usage Rank' 
            : 'Profit Analysis by Usage Rank'}
        </h3>
        <div className="flex space-x-2">
          <Button 
            variant={activeMetric === 'margin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveMetric('margin')}
          >
            Margin
          </Button>
          <Button
            variant={activeMetric === 'profit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveMetric('profit')}
          >
            Profit
          </Button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
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
          <Legend />
          
          {activeMetric === 'margin' ? (
            <>
              <Line
                type="monotone"
                dataKey="proposedMargin"
                name="Proposed Margin"
                stroke={colors.proposedMargin}
                strokeWidth={2}
                dot={{ r: 4 }}
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey="currentMargin"
                name="Current Margin"
                stroke={colors.currentMargin}
                strokeWidth={2}
                dot={{ r: 4 }}
                yAxisId="left"
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="proposedProfit"
                name="Proposed Profit"
                stroke={colors.proposedProfit}
                strokeWidth={2}
                dot={{ r: 4 }}
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey="currentProfit"
                name="Current Profit"
                stroke={colors.currentProfit}
                strokeWidth={2}
                dot={{ r: 4 }}
                yAxisId="left"
              />
            </>
          )}
          
          <Bar 
            dataKey="itemCount" 
            name="Item Count" 
            yAxisId="right"
            barSize={20}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors.barFill} fillOpacity={0.4} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevaMetricsChart;
