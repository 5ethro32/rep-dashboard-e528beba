
import React, { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';

interface SummaryMetricsProps {
  summary: {
    totalSpend: number;
    totalProfit: number;
    averageMargin: number;
    totalPacks: number;
  };
  summaryChanges: {
    totalSpend: number;
    totalProfit: number;
    averageMargin: number;
    totalPacks: number;
  };
  isLoading?: boolean;
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ 
  summary, 
  summaryChanges, 
  isLoading,
  includeRetail,
  includeReva,
  includeWholesale
}) => {
  // Calculate filtered change indicators based on current toggle state
  const [filteredChanges, setFilteredChanges] = useState(summaryChanges);

  useEffect(() => {
    // Recalculate changes whenever toggle states change
    setFilteredChanges(summaryChanges);
  }, [summaryChanges, includeRetail, includeReva, includeWholesale]);

  // Create a change indicator for the KPI cards
  const renderChangeIndicator = (changeValue: number) => {
    if (Math.abs(changeValue) < 0.1) return undefined; // No significant change
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}%`,
      type: changeValue > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  // Calculate previous value based on current value and percent change
  const getPreviousValue = (current: number, changePercent: number) => {
    if (!changePercent || Math.abs(changePercent) < 0.1) return current;
    return current / (1 + changePercent / 100);
  };

  console.log("Rendering SummaryMetrics with data and filter state:", { 
    summary, 
    summaryChanges: filteredChanges,
    filters: { includeRetail, includeReva, includeWholesale } 
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
      {/* Revenue Card */}
      <MetricCard
        title="Revenue"
        value={formatCurrency(summary.totalSpend || 0, 0)}
        change={renderChangeIndicator(filteredChanges.totalSpend)}
        subtitle={`Previous: ${formatCurrency(getPreviousValue(summary.totalSpend || 0, filteredChanges.totalSpend), 0)}`}
        isLoading={isLoading}
      />
      
      {/* Profit Card */}
      <MetricCard
        title="Profit"
        value={formatCurrency(summary.totalProfit || 0, 0)}
        change={renderChangeIndicator(filteredChanges.totalProfit)}
        subtitle={`Previous: ${formatCurrency(getPreviousValue(summary.totalProfit || 0, filteredChanges.totalProfit), 0)}`}
        valueClassName="text-finance-red"
        isLoading={isLoading}
      />
      
      {/* Margin Card */}
      <MetricCard
        title="Margin"
        value={formatPercent(summary.averageMargin || 0)}
        change={renderChangeIndicator(filteredChanges.averageMargin)}
        subtitle={`Previous: ${formatPercent(getPreviousValue(summary.averageMargin || 0, filteredChanges.averageMargin))}`}
        isLoading={isLoading}
      />
      
      {/* Packs Card */}
      <MetricCard
        title="Packs"
        value={formatNumber(summary.totalPacks || 0)}
        change={renderChangeIndicator(filteredChanges.totalPacks)}
        subtitle={`Previous: ${formatNumber(getPreviousValue(summary.totalPacks || 0, filteredChanges.totalPacks))}`}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SummaryMetrics;
