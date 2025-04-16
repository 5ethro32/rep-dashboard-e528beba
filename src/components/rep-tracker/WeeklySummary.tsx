import React from 'react';
import { Info } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const renderMetricWithTooltip = (title: string, tooltip: string) => (
    <div className="flex items-center gap-1.5">
      <span>{title}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-gray-400 hover:text-gray-300 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-sm">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="mb-8 animate-slide-in-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title={renderMetricWithTooltip(
            "Total Visits",
            "Total number of customer visits conducted during this week"
          )}
          value={formatNumber(data.totalVisits)}
          change={previousData ? calculateChange(data.totalVisits, previousData.totalVisits) : undefined}
          subtitle={previousData ? `Previous: ${formatNumber(previousData.totalVisits)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title={renderMetricWithTooltip(
            "Total Profit",
            "Total profit generated from all orders during this week"
          )}
          value={formatCurrency(data.totalProfit)}
          change={previousData ? calculateChange(data.totalProfit, previousData.totalProfit) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.totalProfit)}` : undefined}
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        <MetricCard
          title={renderMetricWithTooltip(
            "Total Orders",
            "Total number of orders placed during customer visits this week"
          )}
          value={formatNumber(data.totalOrders)}
          change={previousData ? calculateChange(data.totalOrders, previousData.totalOrders) : undefined}
          subtitle={previousData ? `Previous: ${formatNumber(previousData.totalOrders)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title={renderMetricWithTooltip(
            "Conversion Rate",
            "Percentage of visits that resulted in an order (Total Orders / Total Visits)"
          )}
          value={`${data.conversionRate.toFixed(1)}%`}
          change={previousData ? calculateChange(data.conversionRate, previousData.conversionRate) : undefined}
          subtitle={previousData ? `Previous: ${previousData.conversionRate.toFixed(1)}%` : undefined}
          isLoading={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
        <MetricCard
          title={renderMetricWithTooltip(
            "Daily Avg Profit",
            "Average profit generated per day during this week"
          )}
          value={formatCurrency(data.dailyAvgProfit)}
          change={previousData ? calculateChange(data.dailyAvgProfit, previousData.dailyAvgProfit) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.dailyAvgProfit)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title={renderMetricWithTooltip(
            "Avg Profit Per Visit",
            "Average profit generated per customer visit (Total Profit / Total Visits)"
          )}
          value={formatCurrency(data.avgProfitPerVisit)}
          change={previousData ? calculateChange(data.avgProfitPerVisit, previousData.avgProfitPerVisit) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.avgProfitPerVisit)}` : undefined}
          isLoading={isLoading}
        />
        
        <MetricCard
          title={renderMetricWithTooltip(
            "Avg Profit Per Order",
            "Average profit generated per order (Total Profit / Total Orders)"
          )}
          value={formatCurrency(data.avgProfitPerOrder)}
          change={previousData ? calculateChange(data.avgProfitPerOrder, previousData.avgProfitPerOrder) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.avgProfitPerOrder)}` : undefined}
          isLoading={isLoading}
          className="col-span-2 md:col-span-1"
        />
      </div>
    </div>
  );
};

export default WeeklySummary;
