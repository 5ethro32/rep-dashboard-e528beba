
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
  previousMonthSummary?: {
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
  previousMonthSummary,
  isLoading,
  includeRetail,
  includeReva,
  includeWholesale,
  selectedMonth = 'March'
}) => {
  // Calculate filtered change indicators based on current toggle state
  const [filteredChanges, setFilteredChanges] = useState(summaryChanges);
  // Track if data is available for comparison
  const [dataAvailable, setDataAvailable] = useState(false);

  // Show change indicators for months with comparison data
  const showChangeIndicators = selectedMonth === 'March' || selectedMonth === 'April';

  // Update changes and data availability status when props change
  useEffect(() => {
    console.log("SummaryMetrics: Props changed, updating state", {
      selectedMonth,
      summaryChanges,
      previousMonthSummary
    });
    
    // Recalculate changes whenever parent props change
    setFilteredChanges(summaryChanges);
    
    // Check if we have valid comparison data
    const hasValidData = previousMonthSummary !== undefined && 
                         previousMonthSummary !== null &&
                         Object.keys(previousMonthSummary).length > 0;
    setDataAvailable(hasValidData);
    
    console.log("SummaryMetrics useEffect: Summary Data:", summary);
    console.log("SummaryMetrics useEffect: Summary Changes:", summaryChanges);
    console.log("SummaryMetrics useEffect: Previous Month Summary:", previousMonthSummary);
    console.log("SummaryMetrics useEffect: Data available for comparison:", hasValidData);
  }, [summaryChanges, summary, previousMonthSummary, selectedMonth, includeRetail, includeReva, includeWholesale]);

  // Create a change indicator for the KPI cards
  const renderChangeIndicator = (changeValue: number) => {
    // While loading, don't show indicators
    if (isLoading) return undefined;
    
    // Check if we have valid data and should show indicators
    if (!dataAvailable || !showChangeIndicators) return undefined;
    
    // Safety check to avoid NaN or null values
    if (changeValue === undefined || changeValue === null || isNaN(changeValue) || Math.abs(changeValue) < 0.1) return undefined;
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}%`,
      type: changeValue > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  // Get previous value with better logging and validation
  const getPreviousValue = (metric: keyof typeof summary) => {
    // Make sure we have valid previous month data
    if (previousMonthSummary && dataAvailable) {
      // Check if the data exists for this metric
      if (previousMonthSummary[metric] !== undefined) {
        const prevValue = previousMonthSummary[metric];
        console.log(`Using direct previousMonthSummary for ${metric} (${selectedMonth} comparing to previous month):`, prevValue);
        return prevValue;
      } else {
        console.warn(`Missing ${metric} in previousMonthSummary data for ${selectedMonth} view`);
      }
    } else {
      console.warn(`No previousMonthSummary data available for ${selectedMonth} view`);
    }
    
    // Fall back to current metric value if no previous value is available
    console.log(`Falling back to current value for ${metric} (${selectedMonth}):`, summary[metric]);
    return summary[metric];
  };

  // Calculate comparison month for subtitle
  const getComparisonMonthText = () => {
    if (selectedMonth === 'March') return 'February';
    if (selectedMonth === 'April') return 'March';
    return '';
  };

  // Enhanced logging for metrics data flow
  console.log("Rendering SummaryMetrics with data:", { 
    selectedMonth,
    summary, 
    summaryChanges: filteredChanges,
    previousMonthSummary,
    showChangeIndicators,
    dataAvailable,
    filters: { includeRetail, includeReva, includeWholesale }
  });

  // Ensure we have valid data to prevent crashes
  const safeTotal = {
    spend: summary?.totalSpend || 0,
    profit: summary?.totalProfit || 0,
    margin: summary?.averageMargin || 0,
    packs: summary?.totalPacks || 0
  };

  const safeChanges = {
    spend: filteredChanges?.totalSpend || 0,
    profit: filteredChanges?.totalProfit || 0, 
    margin: filteredChanges?.averageMargin || 0,
    packs: filteredChanges?.totalPacks || 0
  };

  // Determine what to display in the subtitle
  const getSubtitleText = (metric: keyof typeof summary) => {
    if (isLoading) return undefined;
    
    if (showChangeIndicators && dataAvailable) {
      return `${getComparisonMonthText()}: ${
        metric === 'totalSpend' ? formatCurrency(getPreviousValue(metric), 0) :
        metric === 'totalProfit' ? formatCurrency(getPreviousValue(metric), 0) :
        metric === 'averageMargin' ? formatPercent(getPreviousValue(metric)) :
        formatNumber(getPreviousValue(metric))
      }`;
    } else if (selectedMonth === 'February') {
      return 'No comparison data available';
    } 
    
    return undefined;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
      {/* Revenue Card */}
      <MetricCard
        title="Revenue"
        value={formatCurrency(safeTotal.spend, 0)}
        change={renderChangeIndicator(safeChanges.spend)}
        subtitle={getSubtitleText('totalSpend')}
        isLoading={isLoading}
      />
      
      {/* Profit Card */}
      <MetricCard
        title="Profit"
        value={formatCurrency(safeTotal.profit, 0)}
        change={renderChangeIndicator(safeChanges.profit)}
        subtitle={getSubtitleText('totalProfit')}
        valueClassName="text-finance-red"
        isLoading={isLoading}
      />
      
      {/* Margin Card */}
      <MetricCard
        title="Margin"
        value={formatPercent(safeTotal.margin)}
        change={renderChangeIndicator(safeChanges.margin)}
        subtitle={getSubtitleText('averageMargin')}
        isLoading={isLoading}
      />
      
      {/* Packs Card */}
      <MetricCard
        title="Packs"
        value={formatNumber(safeTotal.packs)}
        change={renderChangeIndicator(safeChanges.packs)}
        subtitle={getSubtitleText('totalPacks')}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SummaryMetrics;
