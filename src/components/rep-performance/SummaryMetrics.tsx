import React, { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { ChartBar, Wallet, Gauge, Package } from 'lucide-react';

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
  hideRankings?: boolean;
  comparisonSummary?: {
    totalSpend?: number;
    totalProfit?: number;
    averageMargin?: number;
    totalPacks?: number;
  };
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ 
  summary, 
  summaryChanges, 
  isLoading,
  includeRetail,
  includeReva,
  includeWholesale,
  selectedMonth = 'March',
  hideRankings = false,
  comparisonSummary
}) => {
  // Calculate filtered change indicators based on current toggle state
  const [filteredChanges, setFilteredChanges] = useState(summaryChanges);

  // Only show change indicators if we're viewing March, April, May, June, June 2, or July data (compared to previous month)
  const showChangeIndicators = selectedMonth === 'March' || selectedMonth === 'April' || selectedMonth === 'May' || selectedMonth === 'June' || selectedMonth === 'June 2' || selectedMonth === 'July';

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

  // Function to get the previous month's value for display
  const getPreviousValue = (current: number, changePercent: number): number => {
    if (changePercent === 0) return current;
    return current / (1 + changePercent / 100);
  };

  // Function to get comparison values - use actual values when available, calculated for others
  const getComparisonValue = (metricKey: keyof typeof summary): number => {
    // For months with actual comparison data available, use actual values
    if ((selectedMonth === 'June' || selectedMonth === 'June 2' || selectedMonth === 'May' || selectedMonth === 'April' || selectedMonth === 'July') && comparisonSummary) {
      return comparisonSummary[metricKey] || 0;
    }
    
    // For other months, calculate from percentage change
    const currentValue = summary[metricKey];
    const changePercent = filteredChanges[metricKey];
    return getPreviousValue(currentValue, changePercent);
  };

  // Get the correct comparison month name
  const getComparisonMonthName = (): string => {
    if (selectedMonth === 'March') return 'February';
    if (selectedMonth === 'April') return 'March';
    if (selectedMonth === 'May') return 'April';
    if (selectedMonth === 'June') return 'May'; // Display name - actual data comes from June_Data_Comparison
    if (selectedMonth === 'June 2') return 'May'; // Display name - actual data comes from June_Data_Comparison (same as June)
    if (selectedMonth === 'July') return 'June'; // Display name - actual data comes from July_Data_Comparison
    return 'Previous';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-slide-in-up">
      {/* Revenue Card */}
      <MetricCard
        title="Revenue"
        value={formatCurrency(summary.totalSpend || 0, 0)}
        change={renderChangeIndicator(filteredChanges.totalSpend)}
        subtitle={showChangeIndicators ? 
          `${getComparisonMonthName()}: ${formatCurrency(getComparisonValue('totalSpend'), 0)}` : 
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        icon={<ChartBar />}
        isLoading={isLoading}
        hideRanking={hideRankings}
      />
      
      {/* Profit Card */}
      <MetricCard
        title="Profit"
        value={formatCurrency(summary.totalProfit || 0, 0)}
        change={renderChangeIndicator(filteredChanges.totalProfit)}
        subtitle={showChangeIndicators ? 
          `${getComparisonMonthName()}: ${formatCurrency(getComparisonValue('totalProfit'), 0)}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
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
        change={renderChangeIndicator(filteredChanges.averageMargin)}
        subtitle={showChangeIndicators ? 
          `${getComparisonMonthName()}: ${formatPercent(getComparisonValue('averageMargin'))}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        icon={<Gauge />}
        isLoading={isLoading}
        hideRanking={hideRankings}
      />
      
      {/* Packs Card */}
      <MetricCard
        title="Packs"
        value={formatNumber(summary.totalPacks || 0)}
        change={renderChangeIndicator(filteredChanges.totalPacks)}
        subtitle={showChangeIndicators ? 
          `${getComparisonMonthName()}: ${formatNumber(getComparisonValue('totalPacks'))}` :
          selectedMonth === 'February' ? 'No comparison data available' : undefined
        }
        icon={<Package />}
        isLoading={isLoading}
        hideRanking={hideRankings}
      />
    </div>
  );
};

export default SummaryMetrics;
