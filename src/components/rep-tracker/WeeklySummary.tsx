
import React from 'react';
import { Info, Users, Package, Award, Calendar, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface WeeklySummaryProps {
  data: {
    totalVisits: number;
    totalProfit: number;
    totalOrders: number;
    conversionRate: number;
    dailyAvgProfit: number;
    topProfitOrder: number;
    avgProfitPerOrder: number;
    plannedVisits: number;
  };
  previousData?: {
    totalVisits: number;
    totalProfit: number;
    totalOrders: number;
    conversionRate: number;
    dailyAvgProfit: number;
    topProfitOrder: number;
    avgProfitPerOrder: number;
    plannedVisits: number;
  };
  weekStartDate: Date;
  weekEndDate: Date;
  isLoading?: boolean;
  rankings?: {
    visitsRank?: number;
    profitRank?: number;
    ordersRank?: number;
    conversionRank?: number;
  };
  hideRankings?: boolean;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ 
  data, 
  previousData, 
  weekStartDate, 
  weekEndDate,
  isLoading = false,
  rankings,
  hideRankings = false
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
    <div className="mb-8 animate-slide-in-up space-y-3 md:space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <MetricCard
          title={renderMetricWithTooltip(
            "Total Visits",
            "Total number of customer visits conducted during this week"
          )}
          value={formatNumber(data.totalVisits)}
          change={previousData ? calculateChange(data.totalVisits, previousData.totalVisits) : undefined}
          subtitle={previousData ? `Previous: ${formatNumber(previousData.totalVisits)}` : undefined}
          isLoading={isLoading}
          className="h-full"
          icon={<Users className="h-5 w-5" />}
          ranking={rankings?.visitsRank}
          hideRanking={hideRankings}
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
          className="h-full"
          icon={<ShoppingBag className="h-5 w-5" />}
          ranking={rankings?.ordersRank}
          hideRanking={hideRankings}
        />
        
        <MetricCard
          title={renderMetricWithTooltip(
            "Total Profit",
            "Total profit generated from all orders during this week"
          )}
          value={formatCurrency(data.totalProfit)}
          change={previousData ? calculateChange(data.totalProfit, previousData.totalProfit) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.totalProfit)}` : undefined}
          valueClassName="font-extrabold text-white"
          isLoading={isLoading}
          className="h-full"
          icon={<Wallet className="h-5 w-5" />}
          ranking={rankings?.profitRank}
          hideRanking={hideRankings}
        />

        <MetricCard
          title={renderMetricWithTooltip(
            "Daily Avg Profit",
            "Average profit generated per day with visits during this week"
          )}
          value={formatCurrency(data.dailyAvgProfit)}
          change={previousData ? calculateChange(data.dailyAvgProfit, previousData.dailyAvgProfit) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.dailyAvgProfit)}` : undefined}
          isLoading={isLoading}
          className="h-full"
          icon={<Calendar className="h-5 w-5" />}
          hideRanking={hideRankings}
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
          className="h-full"
          icon={<TrendingUp className="h-5 w-5" />}
          hideRanking={hideRankings}
        />
        
        <MetricCard
          title={renderMetricWithTooltip(
            "Top Profit Order",
            "Highest profit amount from any single order this week"
          )}
          value={formatCurrency(data.topProfitOrder)}
          change={previousData ? calculateChange(data.topProfitOrder, previousData.topProfitOrder) : undefined}
          subtitle={previousData ? `Previous: ${formatCurrency(previousData.topProfitOrder)}` : undefined}
          isLoading={isLoading}
          className="h-full"
          icon={<Award className="h-5 w-5 text-yellow-400" />}
          iconClassName="text-yellow-400"
          hideRanking={hideRankings}
        />
      </div>
    </div>
  );
};

export default WeeklySummary;
