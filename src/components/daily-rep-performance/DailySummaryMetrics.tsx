import React from 'react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { ChartBar, Wallet, Gauge, Users } from 'lucide-react';
import { 
  DailySummaryData, 
  DailySummaryChanges, 
  ComparisonPeriod 
} from '@/types/daily-rep-performance.types';

interface DailySummaryMetricsProps {
  summary: DailySummaryData;
  summaryChanges: DailySummaryChanges;
  comparisonPeriod: ComparisonPeriod | null;
  isLoading?: boolean;
  hideRankings?: boolean;
}

const DailySummaryMetrics: React.FC<DailySummaryMetricsProps> = ({ 
  summary, 
  summaryChanges, 
  comparisonPeriod,
  isLoading = false,
  hideRankings = false
}) => {
  
  // Show change indicators if we have comparison data
  const showChangeIndicators = comparisonPeriod !== null;

  // Create a change indicator for the KPI cards
  const renderChangeIndicator = (changeValue: number) => {
    if (!showChangeIndicators || Math.abs(changeValue) < 0.1) return undefined; // No significant change or no comparison
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}%`,
      type: changeValue > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  // Create a change indicator for margin (absolute change)
  const renderMarginChangeIndicator = (changeValue: number) => {
    if (!showChangeIndicators || Math.abs(changeValue) < 0.01) return undefined; // No significant change
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}pp`, // pp = percentage points
      type: changeValue > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  // Function to get the previous period's value for display
  const getPreviousValue = (current: number, changePercent: number): number => {
    if (changePercent === 0) return current;
    return current / (1 + changePercent / 100);
  };

  // Function to get previous margin value for display
  const getPreviousMargin = (current: number, changeAbsolute: number): number => {
    return current - changeAbsolute;
  };

  // Function to format Active Accounts display
  const formatActiveAccounts = (active: number): string => {
    return formatNumber(active);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-slide-in-up">
      {/* Revenue Card */}
      <MetricCard
        title="Revenue"
        value={formatCurrency(summary.totalSpend || 0, 0)}
        change={renderChangeIndicator(summaryChanges.totalSpend)}
        subtitle={showChangeIndicators && comparisonPeriod ? 
          `${comparisonPeriod.label}: ${formatCurrency(getPreviousValue(summary.totalSpend, summaryChanges.totalSpend), 0)}` : 
          !comparisonPeriod ? 'No comparison data available' : undefined
        }
        icon={<ChartBar />}
        isLoading={isLoading}
        hideRanking={hideRankings}
      />
      
      {/* Profit Card */}
      <MetricCard
        title="Profit"
        value={formatCurrency(summary.totalProfit || 0, 0)}
        change={renderChangeIndicator(summaryChanges.totalProfit)}
        subtitle={showChangeIndicators && comparisonPeriod ? 
          `${comparisonPeriod.label}: ${formatCurrency(getPreviousValue(summary.totalProfit, summaryChanges.totalProfit), 0)}` :
          !comparisonPeriod ? 'No comparison data available' : undefined
        }
        valueClassName="font-extrabold text-white"
        icon={<Wallet />}
        isLoading={isLoading}
        hideRanking={hideRankings}
      />
      
      {/* Margin Card */}
      <MetricCard
        title="Margin"
        value={formatPercent(summary.averageMargin || 0)}
        change={renderMarginChangeIndicator(summaryChanges.averageMargin)}
        subtitle={showChangeIndicators && comparisonPeriod ? 
          `${comparisonPeriod.label}: ${formatPercent(getPreviousMargin(summary.averageMargin, summaryChanges.averageMargin))}` :
          !comparisonPeriod ? 'No comparison data available' : undefined
        }
        icon={<Gauge />}
        isLoading={isLoading}
        hideRanking={hideRankings}
      />
      
      {/* Active Accounts Card - NEW: Replaces EDI Profit */}
      <MetricCard
        title="Active Accounts"
        value={formatActiveAccounts(summary.activeAccounts || 0)}
        change={renderChangeIndicator(summaryChanges.activeAccounts)}
        subtitle={showChangeIndicators && comparisonPeriod ? 
          `${comparisonPeriod.label}: ${formatNumber(Math.round(getPreviousValue(summary.activeAccounts, summaryChanges.activeAccounts)))} accounts` :
          !comparisonPeriod ? 'No comparison data available' : undefined
        }
        icon={<Users />}
        isLoading={isLoading}
        hideRanking={hideRankings}
      />
    </div>
  );
};

export default DailySummaryMetrics; 