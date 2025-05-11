
import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Cell } from 'recharts';

interface RevaMetricsChartProps {
  data: any[];
}

const RevaMetricsChartUpdated: React.FC<RevaMetricsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex justify-center items-center h-64 bg-gray-800/30 rounded-lg">No data available</div>;
  }

  // Sort data by group number
  const sortedData = [...data].sort((a, b) => {
    const groupA = parseInt(a.name.split(' ')[1]);
    const groupB = parseInt(b.name.split(' ')[1]);
    return groupA - groupB;
  });

  // Custom tooltip to show more details
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Safely format numbers with null/undefined checks
      const formatValue = (value: number | null | undefined) => {
        if (value === null || value === undefined) {
          return "N/A";
        }
        return value.toFixed(1);
      };
      
      // Safely format currency with null/undefined checks
      const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) {
          return "N/A";
        }
        return `£${value.toLocaleString()}`;
      };
      
      return (
        <div className="bg-gray-800 p-3 rounded shadow-lg border border-gray-700">
          <p className="font-bold text-sm">{label}</p>
          <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
            <div>
              <p><span className="text-blue-400">Current Margin:</span> {formatValue(data.currentMargin)}%</p>
              <p><span className="text-green-400">Proposed Margin:</span> {formatValue(data.proposedMargin)}%</p>
            </div>
            <div>
              <p><span className="text-blue-400">Current Profit:</span> {formatCurrency(data.currentProfit)}</p>
              <p><span className="text-green-400">Proposed Profit:</span> {formatCurrency(data.proposedProfit)}</p>
            </div>
            <p className="col-span-2"><span className="text-gray-400">Items:</span> {data.itemCount}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate the maximum profit value for proper scaling
  const maxProfit = Math.max(...sortedData.map(item => 
    Math.max(
      item.currentProfit || 0, 
      item.proposedProfit || 0
    )
  ));
  
  // Calculate the maximum margin value
  const maxMargin = Math.max(...sortedData.map(item => 
    Math.max(
      item.currentMargin || 0, 
      item.proposedMargin || 0
    )
  )) * 100; // Convert to percentage
  
  // Format Y-axis labels for profit
  const formatProfitAxis = (value: number) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(0)}K`;
    }
    return `£${value}`;
  };

  return (
    <div className="w-full h-72 md:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={sortedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            label={{ value: 'Margin %', angle: -90, position: 'insideLeft' }}
            domain={[0, Math.max(maxMargin * 1.1, 30)]} // Set domain with padding, minimum 30%
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: 'Profit', angle: 90, position: 'insideRight' }}
            tickFormatter={formatProfitAxis}
            domain={[0, maxProfit * 1.1]} // Set domain with 10% padding
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Render bars first to make them appear behind the lines */}
          <Bar 
            yAxisId="right" 
            dataKey="currentProfit" 
            name="Current Profit" 
            fill="#3b82f6" 
            opacity={0.6} 
            stackId="profit" // Remove stackId to show separate bars
          />
          <Bar 
            yAxisId="right" 
            dataKey="proposedProfit" 
            name="Proposed Profit" 
            fill="#10b981" 
            opacity={0.6} 
            stackId="profit" // Remove stackId to show separate bars
          />
          
          {/* Lines rendered after bars so they show on top */}
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="currentMargin" 
            name="Current Margin %" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 5 }} 
          />
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="proposedMargin" 
            name="Proposed Margin %" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 5 }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevaMetricsChartUpdated;
