
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

  // Show change indicators for months with comparison data
  const showChangeIndicators = selectedMonth === 'March' || selectedMonth === 'April';

  useEffect(() => {
    // Recalculate changes whenever toggle states change
    setFilteredChanges(summaryChanges);
    
    console.log("SummaryMetrics useEffect: Selected Month:", selectedMonth);
    console.log("SummaryMetrics useEffect: Summary Data:", summary);
    console.log("SummaryMetrics useEffect: Summary Changes:", summaryChanges);
    
    // Add clarity about which data sources are being used
    if (selectedMonth === 'April') {
      console.log("Using April Data table with March Data MTD for comparison");
    } else if (selectedMonth === 'March') {
      console.log("Using March Data table with February Data for comparison");
    }
  }, [summaryChanges, includeRetail, includeReva, includeWholesale, selectedMonth, summary]);

  // Create a change indicator for the KPI cards
  const renderChangeIndicator = (changeValue: number) => {
    // Safety check to avoid NaN or null values
    if (!showChangeIndicators || changeValue === undefined || changeValue === null || isNaN(changeValue) || Math.abs(changeValue) < 0.1) return undefined;
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}%`,
      type: changeValue > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  // Calculate previous value based on current value and percent change
  const getPreviousValue = (current: number, changePercent: number) => {
    if (!showChangeIndicators || changePercent === undefined || changePercent === null || isNaN(changePercent) || Math.abs(changePercent) < 0.1) return current;
    return current / (1 + changePercent / 100);
  };

  // Calculate comparison month for subtitle
  const getComparisonMonthText = () => {
    if (selectedMonth === 'March') return 'February';
    if (selectedMonth === 'April') return 'March (MTD)';
    return '';
  };
  
  // Get data source text for clarity
  const getDataSourceText = () => {
    if (selectedMonth === 'April') return 'From April Data table';
    if (selectedMonth === 'March') return 'From March Data table';
    return 'From February Data table';
  };
  
  // Get comparison text for clarity
  const getComparisonSourceText = () => {
    if (selectedMonth === 'April') return 'Compared to March Data MTD';
    if (selectedMonth === 'March') return 'Compared to February Data';
    return '';
  };

  console.log("Rendering SummaryMetrics with data and filter state:", { 
    summary, 
    summaryChanges: filteredChanges,
    filters: { includeRetail, includeReva, includeWholesale },
    selectedMonth,
    showChangeIndicators 
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
      {/* Revenue Card */}
      <MetricCard
        title="Revenue"
        value={formatCurrency(safeTotal.spend, 0)}
        change={renderChangeIndicator(safeChanges.spend)}
        subtitle={showChangeIndicators ? 
          `${getComparisonMonthText()}: ${formatCurrency(getPreviousValue(safeTotal.spend, safeChanges.spend), 0)}` : 
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        isLoading={isLoading}
      />
      
      {/* Profit Card */}
      <MetricCard
        title="Profit"
        value={formatCurrency(safeTotal.profit, 0)}
        change={renderChangeIndicator(safeChanges.profit)}
        subtitle={showChangeIndicators ? 
          `${getComparisonMonthText()}: ${formatCurrency(getPreviousValue(safeTotal.profit, safeChanges.profit), 0)}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        valueClassName="text-finance-red"
        isLoading={isLoading}
      />
      
      {/* Margin Card */}
      <MetricCard
        title="Margin"
        value={formatPercent(safeTotal.margin)}
        change={renderChangeIndicator(safeChanges.margin)}
        subtitle={showChangeIndicators ? 
          `${getComparisonMonthText()}: ${formatPercent(getPreviousValue(safeTotal.margin, safeChanges.margin))}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        isLoading={isLoading}
      />
      
      {/* Packs Card */}
      <MetricCard
        title="Packs"
        value={formatNumber(safeTotal.packs)}
        change={renderChangeIndicator(safeChanges.packs)}
        subtitle={showChangeIndicators ? 
          `${getComparisonMonthText()}: ${formatNumber(getPreviousValue(safeTotal.packs, safeChanges.packs))}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        isLoading={isLoading}
      />
      
      {/* Data Source Information Card */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-4">
        <div className="text-xs text-finance-gray/80 mt-1 text-center">
          <span className="mr-2">{getDataSourceText()}</span>
          {showChangeIndicators && <span>{getComparisonSourceText()}</span>}
        </div>
      </div>
    </div>
  );
};

export default SummaryMetrics;
