import React from 'react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatNumber } from '@/utils/rep-performance-utils';

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
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getChangeType = (change: number) => {
    if (Math.abs(change) < 0.1) return 'neutral';
    return change > 0 ? 'increase' : 'decrease';
  };

  return (
    <div className="mb-8 animate-slide-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total Visits"
          value={formatNumber(data.totalVisits)}
          change={previousData ? {
            value: `${Math.abs(calculateChange(data.totalVisits, previousData.totalVisits)).toFixed(1)}%`,
            type: getChangeType(calculateChange(data.totalVisits, previousData.totalVisits))
          } : undefined}
          subtitle={previousData ? `Previous: ${formatNumber(previousData.totalVisits)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Total Profit"
          value={formatCurrency(data.totalProfit)}
          change={previousData ? {
            value: `${Math.abs(calculateChange(data.totalProfit, previousData.totalProfit)).toFixed(1)}%`,
            type: getChangeType(calculateChange(data.totalProfit, previousData.totalProfit))
          } : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.totalProfit)}` : undefined}
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Total Orders"
          value={formatNumber(data.totalOrders)}
          change={previousData ? {
            value: `${Math.abs(calculateChange(data.totalOrders, previousData.totalOrders)).toFixed(1)}%`,
            type: getChangeType(calculateChange(data.totalOrders, previousData.totalOrders))
          } : undefined}
          subtitle={previousData ? `Previous: ${formatNumber(previousData.totalOrders)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${data.conversionRate.toFixed(1)}%`}
          change={previousData ? {
            value: `${Math.abs(calculateChange(data.conversionRate, previousData.conversionRate)).toFixed(1)}%`,
            type: getChangeType(calculateChange(data.conversionRate, previousData.conversionRate))
          } : undefined}
          subtitle={previousData ? `Previous: ${previousData.conversionRate.toFixed(1)}%` : undefined}
          isLoading={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4">
        <MetricCard
          title="Daily Avg Profit"
          value={formatCurrency(data.dailyAvgProfit)}
          change={previousData ? {
            value: `${Math.abs(calculateChange(data.dailyAvgProfit, previousData.dailyAvgProfit)).toFixed(1)}%`,
            type: getChangeType(calculateChange(data.dailyAvgProfit, previousData.dailyAvgProfit))
          } : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.dailyAvgProfit)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Avg Profit Per Visit"
          value={formatCurrency(data.avgProfitPerVisit)}
          change={previousData ? {
            value: `${Math.abs(calculateChange(data.avgProfitPerVisit, previousData.avgProfitPerVisit)).toFixed(1)}%`,
            type: getChangeType(calculateChange(data.avgProfitPerVisit, previousData.avgProfitPerVisit))
          } : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.avgProfitPerVisit)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Avg Profit Per Order"
          value={formatCurrency(data.avgProfitPerOrder)}
          change={previousData ? {
            value: `${Math.abs(calculateChange(data.avgProfitPerOrder, previousData.avgProfitPerOrder)).toFixed(1)}%`,
            type: getChangeType(calculateChange(data.avgProfitPerOrder, previousData.avgProfitPerOrder))
          } : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.avgProfitPerOrder)}` : undefined}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default WeeklySummary;
