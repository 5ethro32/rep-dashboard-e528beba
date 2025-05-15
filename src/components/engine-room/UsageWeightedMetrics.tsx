
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MetricCard from '@/components/MetricCard';
import DonutChart from '@/components/DonutChart';
import { formatCurrency, formatPercentage, calculateUsageWeightedMetrics } from '@/utils/formatting-utils';
import { TrendingUp, DollarSign, Percent, Flag, TrendingDown } from 'lucide-react';

interface UsageWeightedMetricsProps {
  data: any[];
  showProposed?: boolean;
}

const UsageWeightedMetrics: React.FC<UsageWeightedMetricsProps> = ({
  data,
  showProposed = false
}) => {
  // Use the centralized calculation function with error handling
  let metrics;
  try {
    metrics = calculateUsageWeightedMetrics(data);
  } catch (error) {
    console.error('Error calculating usage-weighted metrics:', error);
    // Provide fallback values if calculation fails
    metrics = {
      weightedMargin: 0,
      proposedWeightedMargin: 0,
      marginImprovement: 0,
      businessMargin: 0,
      proposedBusinessMargin: 0,
      businessMarginImprovement: 0,
      totalRevenue: 0,
      totalProfit: 0,
      proposedRevenue: 0,
      proposedProfit: 0,
      validItemCount: 0,
      totalUsage: 0,
      marginDistribution: []
    };
  }

  useEffect(() => {
    console.log('UsageWeightedMetrics: Received metrics', {
      weightedMargin: metrics.weightedMargin,
      proposedWeightedMargin: metrics.proposedWeightedMargin,
      marginImprovement: metrics.marginImprovement,
      businessMargin: metrics.businessMargin,
      proposedBusinessMargin: metrics.proposedBusinessMargin,
      businessMarginImprovement: metrics.businessMarginImprovement,
      itemCount: data?.length || 0
    });
  }, [metrics, data?.length]);

  // Define chart colors to match the homepage style - red theme
  const brandColors = [
    '#ef4444', // Primary red
    '#dc2626', // Darker red
    '#f87171', // Lighter red/pink
    '#fb923c', // Orange (for contrast/accent)
    '#b91c1c', // Deep red
    '#fca5a5', // Very light red
  ];
  
  // Update chart data with new colors and add the required 'value' property
  const marginDistributionWithColors = metrics.marginDistribution.map((band, index) => ({
    ...band,
    color: brandColors[index % brandColors.length],
    value: band.count // Adding the required 'value' property, using count as the value
  }));
  
  // Determine if there's margin improvement and other metrics improvements
  const hasMarginImprovement = metrics.marginImprovement > 0;
  const marginChangeClass = hasMarginImprovement ? 'text-green-400' : 'text-red-400';
  const marginChangePrefix = hasMarginImprovement ? '+' : '';
  
  // Determine if there's business margin improvement
  const hasBusinessMarginImprovement = metrics.businessMarginImprovement > 0;
  const businessMarginChangeClass = hasBusinessMarginImprovement ? 'text-green-400' : 'text-red-400';
  const businessMarginChangePrefix = hasBusinessMarginImprovement ? '+' : '';
  
  // Calculate revenue improvement (if proposed is available)
  const revenueImprovement = showProposed && metrics.totalRevenue > 0 ? 
    ((metrics.proposedRevenue - metrics.totalRevenue) / metrics.totalRevenue) * 100 : 0;
  const hasRevenueImprovement = revenueImprovement > 0;
  const revenueChangeClass = hasRevenueImprovement ? 'text-green-400' : 'text-red-400';
  const revenueChangePrefix = hasRevenueImprovement ? '+' : '';
  
  // Calculate profit improvement (if proposed is available)
  const profitImprovement = showProposed && metrics.totalProfit > 0 ? 
    ((metrics.proposedProfit - metrics.totalProfit) / metrics.totalProfit) * 100 : 0;
  const hasProfitImprovement = profitImprovement > 0;
  const profitChangeClass = hasProfitImprovement ? 'text-green-400' : 'text-red-400';
  const profitChangePrefix = hasProfitImprovement ? '+' : '';
  
  // Choose whether to show current or proposed metrics
  const displayRevenue = showProposed ? metrics.proposedRevenue : metrics.totalRevenue;
  const displayProfit = showProposed ? metrics.proposedProfit : metrics.totalProfit;
  const displayMargin = showProposed ? metrics.proposedWeightedMargin : metrics.weightedMargin;
  const displayBusinessMargin = showProposed ? metrics.proposedBusinessMargin : metrics.businessMargin;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg mb-6 col-span-1 md:col-span-2">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4">Margin Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-white/10 bg-gray-800/40 backdrop-blur-sm">
              <CardContent className="p-4">
                <h4 className="text-sm text-gray-400 mb-2">Total Business Margin</h4>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">{displayBusinessMargin.toFixed(2)}%</div>
                  {showProposed && (
                    <div className={`text-sm ${businessMarginChangeClass}`}>
                      {businessMarginChangePrefix}{metrics.businessMarginImprovement.toFixed(2)}%
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400">Total Profit ÷ Total Revenue</p>
                <p className="text-xs text-gray-400 mt-1">Best measure of overall financial performance</p>
              </CardContent>
            </Card>
            
            <Card className="border border-white/10 bg-gray-800/40 backdrop-blur-sm">
              <CardContent className="p-4">
                <h4 className="text-sm text-gray-400 mb-2">Usage-Weighted Average Margin</h4>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">{displayMargin.toFixed(2)}%</div>
                  {showProposed && (
                    <div className={`text-sm ${marginChangeClass}`}>
                      {marginChangePrefix}{metrics.marginImprovement.toFixed(2)}%
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400">Average of product margins, weighted by usage</p>
                <p className="text-xs text-gray-400 mt-1">Reflects typical margin on products sold</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    
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
            {metrics.marginImprovement !== 0 && showProposed && (
              <div className="flex items-center text-xs">
                <span className="text-muted-foreground mr-1">Margin Change:</span>
                <span className={marginChangeClass}>
                  {marginChangePrefix}{metrics.marginImprovement.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className="h-48 relative">
            <DonutChart 
              data={marginDistributionWithColors.map(band => ({
                name: band.name,
                value: band.profit > 0 && (showProposed ? metrics.proposedProfit : metrics.totalProfit) > 0 
                  ? band.profit / (showProposed ? metrics.proposedProfit : metrics.totalProfit) * 100 
                  : 0,
                color: band.color,
                profit: band.profit
              }))} 
              innerValue={formatCurrency(showProposed ? metrics.proposedProfit : metrics.totalProfit)} 
              innerLabel="Total Profit" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageWeightedMetrics;
