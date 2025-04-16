
import React from 'react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';

interface WeeklySummaryProps {
  data: {
    totalVisits: number;
    totalProfit: number;
    totalOrders: number;
    conversionRate: number;
    dailyAvgProfit: number;
    avgProfitPerVisit: number;
    avgProfitPerOrder: number;
  };
  previousData?: {
    totalVisits: number;
    totalProfit: number;
    totalOrders: number;
    conversionRate: number;
    dailyAvgProfit: number;
    avgProfitPerVisit: number;
    avgProfitPerOrder: number;
  };
  weekStartDate: Date;
  weekEndDate: Date;
  isLoading?: boolean;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ 
  data, 
  previousData, 
  weekStartDate, 
  weekEndDate,
  isLoading = false
}) => {
  const calculateChange = (current: number, previous: number) => {
    if (!previous) return { value: '0%', type: 'neutral' as const };
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: `${Math.abs(percentChange).toFixed(1)}%`,
      type: percentChange > 0 ? 'increase' as const : percentChange < 0 ? 'decrease' as const : 'neutral' as const
    };
  };

  return (
    <div className="mb-8 animate-slide-in-up">
      {/* Update the grid to be 2 columns on mobile, 4 on larger screens */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total Visits"
          value={formatNumber(data.totalVisits)}
          change={previousData ? calculateChange(data.totalVisits, previousData.totalVisits) : undefined}
          subtitle={previousData ? `Previous: ${formatNumber(previousData.totalVisits)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Total Profit"
          value={formatCurrency(data.totalProfit)}
          change={previousData ? calculateChange(data.totalProfit, previousData.totalProfit) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.totalProfit)}` : undefined}
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Total Orders"
          value={formatNumber(data.totalOrders)}
          change={previousData ? calculateChange(data.totalOrders, previousData.totalOrders) : undefined}
          subtitle={previousData ? `Previous: ${formatNumber(previousData.totalOrders)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${data.conversionRate.toFixed(1)}%`}
          change={previousData ? calculateChange(data.conversionRate, previousData.conversionRate) : undefined}
          subtitle={previousData ? `Previous: ${previousData.conversionRate.toFixed(1)}%` : undefined}
          isLoading={isLoading}
        />
      </div>
      
      {/* Update the second grid to be 2 columns on mobile, 3 on larger screens */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
        <MetricCard
          title="Daily Avg Profit"
          value={formatCurrency(data.dailyAvgProfit)}
          change={previousData ? calculateChange(data.dailyAvgProfit, previousData.dailyAvgProfit) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.dailyAvgProfit)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Avg Profit Per Visit"
          value={formatCurrency(data.avgProfitPerVisit)}
          change={previousData ? calculateChange(data.avgProfitPerVisit, previousData.avgProfitPerVisit) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.avgProfitPerVisit)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Avg Profit Per Order"
          value={formatCurrency(data.avgProfitPerOrder)}
          change={previousData ? calculateChange(data.avgProfitPerOrder, previousData.avgProfitPerOrder) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.avgProfitPerOrder)}` : undefined}
          isLoading={isLoading}
          className="col-span-2 md:col-span-1" // Make the last card span 2 columns on mobile
        />
      </div>
    </div>
  );
};

export default WeeklySummary;
