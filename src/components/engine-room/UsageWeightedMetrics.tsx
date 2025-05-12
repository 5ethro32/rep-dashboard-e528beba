
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MetricCard from '@/components/MetricCard';
import DonutChart from '@/components/DonutChart';
import { formatCurrency, formatPercentage, calculateUsageWeightedMetrics } from '@/utils/formatting-utils';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface UsageWeightedMetricsProps {
  data: any[];
  comparisonData?: any[];
  showComparison?: boolean;
}

const UsageWeightedMetrics: React.FC<UsageWeightedMetricsProps> = ({
  data,
  comparisonData,
  showComparison = false
}) => {
  // Use the centralized calculation function for current data
  const metrics = calculateUsageWeightedMetrics(data);
  
  // Calculate comparison metrics if comparison is enabled and data is provided
  const comparisonMetrics = showComparison && comparisonData 
    ? calculateUsageWeightedMetrics(comparisonData)
    : null;

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
  
  // Calculate changes if comparison data is available
  const weightedMarginChange = comparisonMetrics 
    ? comparisonMetrics.weightedMargin - metrics.weightedMargin
    : 0;
    
  const totalProfitChange = comparisonMetrics 
    ? comparisonMetrics.totalProfit - metrics.totalProfit
    : 0;
    
  const totalRevenueChange = comparisonMetrics 
    ? comparisonMetrics.totalRevenue - metrics.totalRevenue
    : 0;
  
  // Format percentage change for display
  const formatChange = (change: number) => {
    if (Math.abs(change) < 0.01) return '0%';
    return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
  };
  
  // Format currency change for display
  const formatCurrencyChange = (change: number) => {
    if (Math.abs(change) < 0.01) return formatCurrency(0);
    return `${change > 0 ? '+' : ''}${formatCurrency(change)}`;
  };
  
  // Determine change type for styling
  const getChangeType = (change: number) => {
    if (Math.abs(change) < 0.01) return 'neutral';
    return change > 0 ? 'increase' : 'decrease';
  };
  
  // Determine if there's a significant margin improvement
  const marginChangeClass = weightedMarginChange > 0 ? 'text-green-400' : 'text-red-400';
  const marginChangePrefix = weightedMarginChange > 0 ? '+' : '';
  
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Profit Contribution by Margin Band</h3>
            <div className="flex items-center text-xs">
              <span className="text-muted-foreground mr-1">Margin Change:</span>
              <span className={marginChangeClass}>
                {marginChangePrefix}{metrics.marginImprovement.toFixed(2)}%
              </span>
            </div>
          </div>
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
            {showComparison && comparisonMetrics && (
              <div className="absolute bottom-2 right-2 bg-gray-800/90 px-2 py-1 rounded text-xs">
                <span className={totalProfitChange > 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrencyChange(totalProfitChange)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageWeightedMetrics;
