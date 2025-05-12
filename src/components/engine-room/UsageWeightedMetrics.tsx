
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MetricCard from '@/components/MetricCard';
import DonutChart from '@/components/DonutChart';
import { formatCurrency, formatPercentage, calculateUsageWeightedMetrics } from '@/utils/formatting-utils';

interface UsageWeightedMetricsProps {
  data: any[];
}

const UsageWeightedMetrics: React.FC<UsageWeightedMetricsProps> = ({ data }) => {
  // Use the centralized calculation function
  const metrics = calculateUsageWeightedMetrics(data);
  
  return (
    <div className="space-y-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-semibold">Margin Distribution</h2>
      </div>
      
      {/* Summary metrics - add these to give more context */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
        <MetricCard
          title="Usage-Weighted Margin"
          value={metrics.weightedMargin.toFixed(2) + '%'}
          subtitle={`Based on ${metrics.validItemCount} valid products`}
        />
        
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle={`${metrics.totalUsage.toLocaleString()} total units`}
        />
        
        <MetricCard
          title="Total Profit"
          value={formatCurrency(metrics.totalProfit)}
          subtitle="Sum of (Price - Cost) × Usage"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg h-64">
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-4">Margin Distribution by Product Count</h3>
            <div className="h-48 relative">
              <DonutChart 
                data={metrics.marginDistribution}
                innerValue={metrics.validItemCount.toString()}
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
                  value: band.profit > 0 && metrics.totalProfit > 0 ? 
                    (band.profit / metrics.totalProfit) * 100 : 0,
                  color: band.color,
                  profit: band.profit
                }))}
                innerValue={formatCurrency(metrics.totalProfit)}
                innerLabel="Total Profit"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsageWeightedMetrics;
