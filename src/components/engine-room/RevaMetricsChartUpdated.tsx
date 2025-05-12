
import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, Cell } from 'recharts';

interface RevaMetricsChartUpdatedProps {
  data: any[];
  showProposed?: boolean;
  activeRule?: string;
}

const RevaMetricsChartUpdated: React.FC<RevaMetricsChartUpdatedProps> = ({ 
  data,
  showProposed = false,
  activeRule = 'current'
}) => {
  // Custom tooltip to show details
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      // Extract all properties for the selected point
      const item = payload[0].payload;
      return (
        <div className="bg-gray-800/90 p-3 rounded shadow-lg border border-gray-700 text-xs">
          <div className="font-bold mb-1 truncate max-w-[300px]">{item.description}</div>
          <div>Usage: {item.revaUsage}</div>
          <div>Usage Rank: {item.usageRank}</div>
          <div>Avg Cost: £{Number(item.avgCost).toFixed(2)}</div>
          <div>Market Low: £{Number(item.trueMarketLow).toFixed(2)}</div>
          <div>Current REVA: £{Number(item.currentREVAPrice).toFixed(2)}</div>
          {showProposed && (
            <div className="mt-1 pt-1 border-t border-gray-600">
              <div className="text-amber-400">
                {activeRule === 'rule1' && 'Rule 1 Price: '}
                {activeRule === 'rule2' && 'Rule 2 Price: '}
                {activeRule === 'combined' && 'Proposed Price: '}
                £{Number(item.proposedPrice).toFixed(2)}
              </div>
              <div>Price Change: {((item.proposedPrice - item.currentREVAPrice) / item.currentREVAPrice * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Generate the data for the chart based on activeRule
  const getDisplayData = () => {
    if (!showProposed) return data;

    return data.map((item: any) => {
      // Determine which price to use based on the active rule
      const proposedPrice = 
        activeRule === 'rule1' ? (item.rule1Price || item.currentREVAPrice) :
        activeRule === 'rule2' ? (item.rule2Price || item.currentREVAPrice) :
        activeRule === 'combined' ? (item.proposedPrice || item.currentREVAPrice) :
        item.currentREVAPrice;
      
      return {
        ...item,
        proposedPrice
      };
    });
  };

  // Determine if we should render the proposed price series
  const chartData = getDisplayData();
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            type="number" 
            dataKey="trueMarketLow" 
            name="Market Low" 
            unit="£" 
            domain={['dataMin', 'dataMax']} 
            label={{ value: 'Market Low Price', position: 'insideBottom', offset: -10 }}
            stroke="#9ca3af"
            tickFormatter={(value) => `£${value.toFixed(0)}`}
          />
          <YAxis 
            type="number" 
            dataKey="currentREVAPrice" 
            name="Current REVA" 
            unit="£" 
            domain={['dataMin', 'dataMax']} 
            label={{ value: 'REVA Price', position: 'insideLeft', angle: -90, offset: -15 }}
            stroke="#9ca3af"
            tickFormatter={(value) => `£${value.toFixed(0)}`}
          />
          <ZAxis 
            type="number" 
            dataKey="revaUsage" 
            range={[50, 400]} 
            name="Usage" 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Current prices scatter plot */}
          <Scatter 
            name="Current REVA Pricing" 
            data={chartData} 
            fill="#ef4444" 
          />
          
          {/* Proposed prices scatter plot - only show if in a rule view */}
          {showProposed && (
            <Scatter 
              name={
                activeRule === 'rule1' ? 'Rule 1 Pricing' :
                activeRule === 'rule2' ? 'Rule 2 Pricing' :
                activeRule === 'combined' ? 'Proposed Pricing' :
                'Proposed Pricing'
              } 
              data={chartData} 
              fill="#10b981"
              dataKey="proposedPrice"
              yAxisId={0}
            >
              {chartData.map((entry: any, index: number) => {
                // Color based on price change direction
                const isPriceChange = entry.proposedPrice !== entry.currentREVAPrice;
                const isHigher = entry.proposedPrice > entry.currentREVAPrice;
                const color = isPriceChange ? (isHigher ? '#10b981' : '#f97316') : '#6b7280';
                
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Scatter>
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevaMetricsChartUpdated;
