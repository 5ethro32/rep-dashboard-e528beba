
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
  selectedMonth?: string;
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ 
  summary, 
  summaryChanges, 
  isLoading,
  includeRetail,
  includeReva,
  includeWholesale,
  selectedMonth = 'March'
}) => {
  // Calculate filtered change indicators based on current toggle state
  const [filteredChanges, setFilteredChanges] = useState(summaryChanges);

  // Only show change indicators if we're viewing March, April, or comparing to previous data
  const showChangeIndicators = selectedMonth === 'March' || selectedMonth === 'April';

  useEffect(() => {
    // Recalculate changes whenever toggle states change
    setFilteredChanges(summaryChanges);
  }, [summaryChanges, includeRetail, includeReva, includeWholesale]);

  // Create a change indicator for the KPI cards
  const renderChangeIndicator = (changeValue: number) => {
    if (!showChangeIndicators || Math.abs(changeValue) < 0.1) return undefined; // No significant change or not showing changes
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}%`,
      type: changeValue > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  // Calculate previous value based on current value and percent change
  const getPreviousValue = (current: number, changePercent: number) => {
    if (!showChangeIndicators || !changePercent || Math.abs(changePercent) < 0.1) return current;
    return current / (1 + changePercent / 100);
  };

  // Calculate comparison month/period for subtitle
  const getComparisonText = () => {
    if (selectedMonth === 'March') return 'February';
    if (selectedMonth === 'April') return 'Previous Day';
    return '';
  };

  console.log("Rendering SummaryMetrics with data and filter state:", { 
    summary, 
    summaryChanges: filteredChanges,
    filters: { includeRetail, includeReva, includeWholesale },
    selectedMonth,
    showChangeIndicators 
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
      {/* Revenue Card */}
      <MetricCard
        title="Revenue"
        value={formatCurrency(summary.totalSpend || 0, 0)}
        change={renderChangeIndicator(filteredChanges.totalSpend)}
        subtitle={showChangeIndicators ? 
          `${getComparisonText()}: ${formatCurrency(getPreviousValue(summary.totalSpend || 0, filteredChanges.totalSpend), 0)}` : 
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        isLoading={isLoading}
      />
      
      {/* Profit Card */}
      <MetricCard
        title="Profit"
        value={formatCurrency(summary.totalProfit || 0, 0)}
        change={renderChangeIndicator(filteredChanges.totalProfit)}
        subtitle={showChangeIndicators ? 
          `${getComparisonText()}: ${formatCurrency(getPreviousValue(summary.totalProfit || 0, filteredChanges.totalProfit), 0)}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        valueClassName="text-finance-red"
        isLoading={isLoading}
      />
      
      {/* Margin Card */}
      <MetricCard
        title="Margin"
        value={formatPercent(summary.averageMargin || 0)}
        change={renderChangeIndicator(filteredChanges.averageMargin)}
        subtitle={showChangeIndicators ? 
          `${getComparisonText()}: ${formatPercent(getPreviousValue(summary.averageMargin || 0, filteredChanges.averageMargin))}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        isLoading={isLoading}
      />
      
      {/* Packs Card */}
      <MetricCard
        title="Packs"
        value={formatNumber(summary.totalPacks || 0)}
        change={renderChangeIndicator(filteredChanges.totalPacks)}
        subtitle={showChangeIndicators ? 
          `${getComparisonText()}: ${formatNumber(getPreviousValue(summary.totalPacks || 0, filteredChanges.totalPacks))}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        isLoading={isLoading}
      />
    </div>
  );
};

export default SummaryMetrics;
