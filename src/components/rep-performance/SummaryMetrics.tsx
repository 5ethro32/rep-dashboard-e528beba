import React from 'react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import useDepartmentMetrics from '@/hooks/useDepartmentMetrics';

interface SummaryMetricsProps {
  selectedMonth: string;
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ selectedMonth }) => {
  // Use the department metrics hook to get standardized metrics across all months
  const {
    combinedMetrics: metrics,
    combinedChanges: changes,
    isLoading,
    includeRetail,
    includeReva,
    includeWholesale,
    setIncludeRetail,
    setIncludeReva, 
    setIncludeWholesale
  } = useDepartmentMetrics(selectedMonth);

  // Only show change indicators if we're viewing a month other than February
  const showChangeIndicators = selectedMonth !== 'February';

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

  // Calculate comparison month for subtitle
  const getComparisonMonthText = () => {
    if (selectedMonth === 'March') return 'February';
    if (selectedMonth === 'April') return 'March';
    if (selectedMonth === 'May') return 'April';
    return '';
  };

  // Render department filter toggle buttons
  const renderFilterToggle = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={includeRetail} 
          onChange={e => setIncludeRetail(e.target.checked)}
          className="form-checkbox h-4 w-4 text-green-600"
        />
        <span>Retail</span>
      </label>
      
      <label className="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={includeReva} 
          onChange={e => setIncludeReva(e.target.checked)}
          className="form-checkbox h-4 w-4 text-blue-600" 
        />
        <span>REVA</span>
      </label>
      
      <label className="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={includeWholesale} 
          onChange={e => setIncludeWholesale(e.target.checked)}
          className="form-checkbox h-4 w-4 text-purple-600" 
        />
        <span>Wholesale</span>
      </label>
    </div>
  );

  return (
    <div>
      {renderFilterToggle()}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
        {/* Revenue Card */}
        <MetricCard
          title="Revenue"
          value={formatCurrency(metrics.totalSpend || 0, 0)}
          change={renderChangeIndicator(changes.totalSpend)}
          subtitle={showChangeIndicators ? 
            `${getComparisonMonthText()}: ${formatCurrency(getPreviousValue(metrics.totalSpend || 0, changes.totalSpend), 0)}` : 
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
        
        {/* Profit Card */}
        <MetricCard
          title="Profit"
          value={formatCurrency(metrics.totalProfit || 0, 0)}
          change={renderChangeIndicator(changes.totalProfit)}
          subtitle={showChangeIndicators ? 
            `${getComparisonMonthText()}: ${formatCurrency(getPreviousValue(metrics.totalProfit || 0, changes.totalProfit), 0)}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        {/* Margin Card */}
        <MetricCard
          title="Margin"
          value={formatPercent(metrics.averageMargin || 0)}
          change={renderChangeIndicator(changes.averageMargin)}
          subtitle={showChangeIndicators ? 
            `${getComparisonMonthText()}: ${formatPercent(getPreviousValue(metrics.averageMargin || 0, changes.averageMargin))}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
        
        {/* Packs Card */}
        <MetricCard
          title="Packs"
          value={formatNumber(metrics.totalPacks || 0)}
          change={renderChangeIndicator(changes.totalPacks)}
          subtitle={showChangeIndicators ? 
            `${getComparisonMonthText()}: ${formatNumber(getPreviousValue(metrics.totalPacks || 0, changes.totalPacks))}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default SummaryMetrics;
