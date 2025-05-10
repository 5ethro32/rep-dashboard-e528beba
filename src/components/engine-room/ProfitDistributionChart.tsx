
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProfitDistributionChartProps {
  data: any[];
}

const ProfitDistributionChart: React.FC<ProfitDistributionChartProps> = ({ data }) => {
  // Process data for profit distribution by usage rank
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const rankGroups: {[key: string]: {
      currentProfit: number,
      proposedProfit: number,
      currentRevenue: number,
      proposedRevenue: number,
      itemCount: number
    }} = {};
    
    // Group by rank and calculate totals
    data.forEach(item => {
      const rank = `Rank ${item.usageRank}`;
      
      if (!rankGroups[rank]) {
        rankGroups[rank] = {
          currentProfit: 0,
          proposedProfit: 0,
          currentRevenue: 0,
          proposedRevenue: 0,
          itemCount: 0
        };
      }
      
      const group = rankGroups[rank];
      const currentRevenue = item.currentREVAPrice * item.revaUsage;
      const currentProfit = (item.currentREVAPrice - item.avgCost) * item.revaUsage;
      
      const proposedPrice = item.proposedPrice || item.currentREVAPrice;
      const proposedRevenue = proposedPrice * item.revaUsage;
      const proposedProfit = (proposedPrice - item.avgCost) * item.revaUsage;
      
      group.currentRevenue += currentRevenue;
      group.currentProfit += currentProfit;
      group.proposedRevenue += proposedRevenue;
      group.proposedProfit += proposedProfit;
      group.itemCount++;
    });
    
    // Convert to chart data format
    return Object.keys(rankGroups).map(rank => {
      const group = rankGroups[rank];
      const currentMargin = group.currentRevenue > 0 ? (group.currentProfit / group.currentRevenue) * 100 : 0;
      const proposedMargin = group.proposedRevenue > 0 ? (group.proposedProfit / group.proposedRevenue) * 100 : 0;
      
      return {
        name: rank,
        currentProfit: group.currentProfit,
        proposedProfit: group.proposedProfit,
        profitChange: group.proposedProfit - group.currentProfit,
        currentMargin,
        proposedMargin,
        marginChange: proposedMargin - currentMargin,
        itemCount: group.itemCount
      };
    });
  }, [data]);
  
  // Calculate overall profit impact
  const totalImpact = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.profitChange, 0);
  }, [chartData]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded-md shadow-lg">
          <p className="text-sm font-bold mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <p>Current Profit: £{payload[0].payload.currentProfit.toLocaleString()}</p>
            <p>Proposed Profit: £{payload[1].payload.proposedProfit.toLocaleString()}</p>
            <div className="pt-1 mt-1 border-t border-gray-700">
              <p>Current Margin: {payload[0].payload.currentMargin.toFixed(2)}%</p>
              <p>Proposed Margin: {payload[0].payload.proposedMargin.toFixed(2)}%</p>
              <p>Products: {payload[0].payload.itemCount}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profit Distribution by Usage Rank</h2>
        
        <div>
          <Badge variant={totalImpact >= 0 ? "default" : "destructive"} className="text-sm">
            {totalImpact >= 0 ? '+' : ''}£{totalImpact.toLocaleString()} Profit Impact
          </Badge>
        </div>
      </div>
      
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={(value) => `£${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="currentProfit" 
                  name="Current Profit" 
                  fill="#3b82f6" 
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="proposedProfit" 
                  name="Proposed Profit" 
                  fill="#8b5cf6" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitDistributionChart;
