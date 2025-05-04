import React from 'react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { SummaryData } from '@/types/rep-performance.types';

interface SummaryMetricsProps {
  selectedMonth: string;
  // Add new props to accept metrics from parent component
  metrics?: SummaryData;
  changes?: {
    totalSpend: number;
    totalProfit: number;
    averageMargin: number;
    totalPacks: number;
    totalAccounts?: number;
    activeAccounts?: number;
  };
  // Add previous month metrics
  previousMonthMetrics?: SummaryData;
  isLoading?: boolean;
  includeRetail?: boolean;
  includeReva?: boolean;
  includeWholesale?: boolean;
  setIncludeRetail?: (value: boolean) => void;
  setIncludeReva?: (value: boolean) => void;
  setIncludeWholesale?: (value: boolean) => void;
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ 
  selectedMonth,
  metrics,
  changes,
  previousMonthMetrics,
  isLoading = false,
  includeRetail,
  includeReva,
  includeWholesale,
  setIncludeRetail,
  setIncludeReva,
  setIncludeWholesale
}) => {
  // Only show change indicators if we're viewing a month other than February
  const showChangeIndicators = selectedMonth !== 'February';

  // Create a change indicator for the KPI cards
  const renderChangeIndicator = (changeValue: number) => {
    if (!showChangeIndicators || !changes || Math.abs(changeValue) < 0.1) return undefined; // No significant change or not showing changes
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}%`,
      type: changeValue > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  // Calculate comparison month for subtitle
  const getComparisonMonthText = () => {
    if (selectedMonth === 'March') return 'February';
    if (selectedMonth === 'April') return 'March';
    if (selectedMonth === 'May') return 'April';
    return '';
  };

  // Render department filter toggle buttons if the state handlers are provided
  const renderFilterToggle = () => {
    // Only render if we have the state handlers
    if (!setIncludeRetail || !setIncludeReva || !setIncludeWholesale) {
      return null;
    }
    
    return (
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
  };

  return (
    <div>
      {renderFilterToggle()}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
        {/* Revenue Card */}
        <MetricCard
          title="Revenue"
          value={formatCurrency(metrics?.totalSpend || 0, 0)}
          change={changes ? renderChangeIndicator(changes.totalSpend) : undefined}
          subtitle={showChangeIndicators && previousMonthMetrics ? 
            `${getComparisonMonthText()}: ${formatCurrency(previousMonthMetrics.totalSpend || 0, 0)}` : 
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
        
        {/* Profit Card */}
        <MetricCard
          title="Profit"
          value={formatCurrency(metrics?.totalProfit || 0, 0)}
          change={changes ? renderChangeIndicator(changes.totalProfit) : undefined}
          subtitle={showChangeIndicators && previousMonthMetrics ? 
            `${getComparisonMonthText()}: ${formatCurrency(previousMonthMetrics.totalProfit || 0, 0)}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        {/* Margin Card */}
        <MetricCard
          title="Margin"
          value={formatPercent(metrics?.averageMargin || 0)}
          change={changes ? renderChangeIndicator(changes.averageMargin) : undefined}
          subtitle={showChangeIndicators && previousMonthMetrics ? 
            `${getComparisonMonthText()}: ${formatPercent(previousMonthMetrics.averageMargin || 0)}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
        
        {/* Packs Card */}
        <MetricCard
          title="Packs"
          value={formatNumber(metrics?.totalPacks || 0)}
          change={changes ? renderChangeIndicator(changes.totalPacks) : undefined}
          subtitle={showChangeIndicators && previousMonthMetrics ? 
            `${getComparisonMonthText()}: ${formatNumber(previousMonthMetrics.totalPacks || 0)}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default SummaryMetrics;
