
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MetricCard from '@/components/MetricCard';
import DonutChart from '@/components/DonutChart';

interface UsageWeightedMetricsProps {
  data: any[];
}

const UsageWeightedMetrics: React.FC<UsageWeightedMetricsProps> = ({ data }) => {
  // Calculate usage-weighted metrics
  const calculateMetrics = () => {
    if (!data || data.length === 0) return {
      weightedMargin: 0,
      totalRevenue: 0,
      totalProfit: 0,
      usageCount: 0,
      marginDistribution: [],
      marginImprovement: 0
    };

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalUsage = 0;
    let proposedRevenue = 0;
    let proposedProfit = 0;
    
    // For margin distribution
    const marginBands = [
      { name: '<5%', value: 0, color: '#ef4444', profit: 0 }, // Red
      { name: '5-10%', value: 0, color: '#f97316', profit: 0 }, // Orange
      { name: '10-15%', value: 0, color: '#eab308', profit: 0 }, // Yellow
      { name: '15-20%', value: 0, color: '#84cc16', profit: 0 }, // Light Green
      { name: '20%+', value: 0, color: '#22c55e', profit: 0 }  // Green
    ];
    
    data.forEach(item => {
      if (item.revaUsage && item.currentREVAPrice) {
        const currentRevenue = item.revaUsage * item.currentREVAPrice;
        const currentProfit = item.revaUsage * (item.currentREVAPrice - item.avgCost);
        
        // Calculate proposed values if available
        const proposedPrice = item.proposedPrice || item.currentREVAPrice;
        const proposedItemRevenue = item.revaUsage * proposedPrice;
        const proposedItemProfit = item.revaUsage * (proposedPrice - item.avgCost);
        
        totalRevenue += currentRevenue;
        totalProfit += currentProfit;
        totalUsage += item.revaUsage;
        proposedRevenue += proposedItemRevenue;
        proposedProfit += proposedItemProfit;
        
        // Categorize for margin distribution
        const margin = item.currentREVAMargin * 100;
        if (margin < 5) {
          marginBands[0].value += 1;
          marginBands[0].profit += currentProfit;
        } else if (margin < 10) {
          marginBands[1].value += 1;
          marginBands[1].profit += currentProfit;
        } else if (margin < 15) {
          marginBands[2].value += 1;
          marginBands[2].profit += currentProfit;
        } else if (margin < 20) {
          marginBands[3].value += 1;
          marginBands[3].profit += currentProfit;
        } else {
          marginBands[4].value += 1;
          marginBands[4].profit += currentProfit;
        }
      }
    });
    
    const weightedMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const proposedWeightedMargin = proposedRevenue > 0 ? (proposedProfit / proposedRevenue) * 100 : 0;
    const marginImprovement = proposedWeightedMargin - weightedMargin;
    
    return {
      weightedMargin,
      totalRevenue,
      totalProfit,
      proposedWeightedMargin,
      marginImprovement,
      usageCount: totalUsage,
      marginDistribution: marginBands
    };
  };
  
  const metrics = calculateMetrics();
  
  return (
    <div className="space-y-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-semibold">Usage-Weighted Analysis</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Usage-Weighted Margin"
          value={`${metrics.weightedMargin.toFixed(2)}%`}
          change={metrics.marginImprovement !== 0 ? {
            value: `${metrics.marginImprovement > 0 ? '+' : ''}${metrics.marginImprovement.toFixed(2)}%`,
            type: metrics.marginImprovement >= 0 ? 'increase' : 'decrease'
          } : undefined}
          subtitle="Based on product usage volume"
        />
        <MetricCard
          title="Total Revenue (Usage-Weighted)"
          value={`£${metrics.totalRevenue.toLocaleString()}`}
          subtitle={`${metrics.usageCount.toLocaleString()} total units`}
        />
        <MetricCard
          title="Usage-Weighted Profit"
          value={`£${metrics.totalProfit.toLocaleString()}`}
          subtitle="Profit calculated from actual usage"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg h-64">
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-4">Margin Distribution by Product Count</h3>
            <div className="h-48 relative">
              <DonutChart 
                data={metrics.marginDistribution}
                innerValue={data.length > 0 ? data.length.toString() : "0"}
                innerLabel="Products"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg h-64">
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-4">Profit Contribution by Margin Band</h3>
            <div className="h-48 relative">
              <DonutChart 
                data={metrics.marginDistribution.map(band => ({
                  name: band.name,
                  value: band.profit > 0 ? (band.profit / metrics.totalProfit) * 100 : 0,
                  color: band.color,
                  profit: band.profit
                }))}
                innerValue={`£${Math.round(metrics.totalProfit).toLocaleString()}`}
                innerLabel="Total Profit"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Separator className="bg-gray-700/30 my-6" />
    </div>
  );
};

export default UsageWeightedMetrics;
