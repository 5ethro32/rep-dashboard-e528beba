
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MetricCard from '@/components/MetricCard';
import DonutChart from '@/components/DonutChart';
import { formatCurrency, formatPercentage, calculateUsageWeightedMetrics } from '@/utils/formatting-utils';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';
import ChangeIndicator from '@/components/metric-card/ChangeIndicator';

interface UsageWeightedMetricsProps {
  data: any[];
  showProposed?: boolean;
}

const UsageWeightedMetrics: React.FC<UsageWeightedMetricsProps> = ({
  data,
  showProposed = false
}) => {
  // Use the centralized calculation function
  const metrics = calculateUsageWeightedMetrics(data);

  // Define chart colors to match the homepage style - red theme
  const brandColors = [
    '#ef4444', // Primary red
    '#dc2626', // Darker red
    '#f87171', // Lighter red/pink
    '#fb923c', // Orange (for contrast/accent)
    '#b91c1c', // Deep red
    '#fca5a5', // Very light red
  ];
  
  // Update chart data with new colors
  const marginDistributionWithColors = metrics.marginDistribution.map((band, index) => ({
    ...band,
    color: brandColors[index % brandColors.length]
  }));
  
  // Determine if there's a significant margin improvement
  const hasMarginImprovement = metrics.marginImprovement > 0;
  const marginChangeClass = hasMarginImprovement ? 'text-green-400' : 'text-red-400';
  const marginChangePrefix = hasMarginImprovement ? '+' : '';
  
  // Get the correct revenue and profit based on the flag
  const displayedRevenue = showProposed ? metrics.proposedRevenue : metrics.totalRevenue;
  const displayedProfit = showProposed ? metrics.proposedProfit : metrics.totalProfit;
  const displayedMargin = showProposed ? metrics.proposedWeightedMargin : metrics.weightedMargin;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg h-64">
        <CardContent className="p-4">
          <div className="flex justify-between">
            <h3 className="font-medium mb-4">
              Margin Distribution by Product Count
            </h3>
            <div className="text-xs text-muted-foreground">
              {showProposed ? 'Proposed Prices' : 'Current Prices'}
            </div>
          </div>
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Profit Contribution by Margin Band</h3>
            <div className="flex items-center text-xs">
              {showProposed ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Proposed Prices</span>
                  <ChangeIndicator 
                    type={hasMarginImprovement ? "increase" : "decrease"} 
                    value={`${marginChangePrefix}${metrics.marginImprovement.toFixed(2)}%`}
                  />
                </div>
              ) : (
                <span className="text-muted-foreground">Current Prices</span>
              )}
            </div>
          </div>
          <div className="h-48 relative">
            <DonutChart 
              data={marginDistributionWithColors.map(band => ({
                name: band.name,
                value: band.profit > 0 && displayedProfit > 0 ? band.profit / displayedProfit * 100 : 0,
                color: band.color,
                profit: band.profit
              }))} 
              innerValue={formatCurrency(displayedProfit)} 
              innerLabel="Total Profit" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageWeightedMetrics;
