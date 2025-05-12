
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MetricCard from '@/components/MetricCard';
import DonutChart from '@/components/DonutChart';
import { formatCurrency, formatPercentage, calculateUsageWeightedMetrics } from '@/utils/formatting-utils';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface UsageWeightedMetricsProps {
  data: any[];
}

const UsageWeightedMetrics: React.FC<UsageWeightedMetricsProps> = ({
  data
}) => {
  // Use the centralized calculation function
  const metrics = calculateUsageWeightedMetrics(data);

  // Define chart colors to match the homepage style
  const brandColors = [
    '#ef4444', // Finance Red (primary brand color)
    '#f97316', // Orange
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Green
    '#ec4899', // Pink
  ];
  
  // Update chart data with new colors
  const marginDistributionWithColors = metrics.marginDistribution.map((band, index) => ({
    ...band,
    color: brandColors[index % brandColors.length]
  }));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg h-64">
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Margin Distribution by Product Count</h3>
          <div className="h-48 relative">
            <DonutChart 
              data={marginDistributionWithColors} 
              innerValue={metrics.validItemCount.toString()} 
              innerLabel="Products" 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg h-64">
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Profit Contribution by Margin Band</h3>
          <div className="h-48 relative">
            <DonutChart 
              data={marginDistributionWithColors.map(band => ({
                name: band.name,
                value: band.profit > 0 && metrics.totalProfit > 0 ? band.profit / metrics.totalProfit * 100 : 0,
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
  );
};

export default UsageWeightedMetrics;
