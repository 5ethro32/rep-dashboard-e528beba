
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ZAxis, Legend, Label
} from 'recharts';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/utils/formatting-utils';

interface RevaMetricsChartProps {
  data: any[];
  showProposed?: boolean;
}

const RevaMetricsChartUpdated: React.FC<RevaMetricsChartProps> = ({ 
  data,
  showProposed = false
}) => {
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  
  // Filter data based on flags if needed
  const filteredData = showOnlyFlagged 
    ? data.filter(item => item.flag1 || item.flag2)
    : data;

  // Use the showProposed prop to determine which prices to display
  const chartData = filteredData.map(item => ({
    ...item,
    price: showProposed ? item.proposedPrice : item.currentPrice,
    margin: showProposed ? item.proposedMargin : item.currentMargin,
  }));

  // Custom tooltip to show point details
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-gray-900/90 p-3 rounded shadow-lg border border-gray-800 max-w-xs">
          <p className="font-medium mb-1 truncate">{data.name}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p>Price: <span className="text-primary">{formatCurrency(data.price)}</span></p>
            <p>Avg Cost: <span className="text-primary">{formatCurrency(data.avgCost)}</span></p>
            <p>Margin: <span className="text-primary">{(data.margin * 100).toFixed(2)}%</span></p>
            <p>Usage: <span className="text-primary">{data.usage}</span></p>
            <p>Market Low: <span className="text-primary">{formatCurrency(data.marketLow)}</span></p>
            <p>Rank: <span className="text-primary">{data.usageRank}</span></p>
          </div>
          {data.flag1 && <p className="mt-2 text-red-400 text-xs">Flagged: Price above market</p>}
          {data.flag2 && <p className="mt-2 text-amber-400 text-xs">Flagged: Low margin</p>}
        </div>
      );
    }
    return null;
  };

  // Define colors for the scatter plot points
  const getMarkerFill = (item: any) => {
    if (item.flag1) return '#ef4444'; // red-500
    if (item.flag2) return '#f59e0b'; // amber-500
    return '#3b82f6'; // blue-500
  };

  // Calculate max X and Y for chart boundaries with some padding
  const maxUsage = Math.max(...chartData.map(item => item.usage || 0)) * 1.1;
  const maxMargin = Math.max(...chartData.map(item => item.margin || 0)) * 1.1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Usage vs. Margin Analysis</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm">All Items</span>
          <Switch 
            checked={showOnlyFlagged} 
            onCheckedChange={setShowOnlyFlagged} 
          />
          <span className="text-sm">Flagged Only</span>
        </div>
      </div>
      
      <div className="h-[500px] overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 40, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis
              type="number"
              dataKey="usage"
              name="Usage"
              domain={[0, maxUsage]}
              tickFormatter={(value) => value.toLocaleString()}
            >
              <Label value="Usage Volume" position="bottom" offset={-20} />
            </XAxis>
            <YAxis 
              type="number" 
              dataKey="margin" 
              name="Margin" 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              domain={[0, maxMargin]}
            >
              <Label value="Margin %" position="insideLeft" angle={-90} offset={10} />
            </YAxis>
            <ZAxis 
              type="number" 
              dataKey="avgCost" 
              range={[50, 400]} 
              name="Average Cost" 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Scatter 
              name={showProposed ? "Proposed Prices" : "Current Prices"} 
              data={chartData} 
              fill="#8884d8"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getMarkerFill(entry)}
                  opacity={0.7}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevaMetricsChartUpdated;
