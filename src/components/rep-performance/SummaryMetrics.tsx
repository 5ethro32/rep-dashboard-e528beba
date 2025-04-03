
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
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
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ summary, summaryChanges }) => {
  const renderChangeIndicator = (changeValue: number) => {
    const isPositive = changeValue > 0;
    
    if (Math.abs(changeValue) < 0.1) return null; // No significant change
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}%`,
      type: isPositive ? 'increase' : 'decrease'
    };
  };

  const getPreviousValue = (current: number, changePercent: number) => {
    return Math.round(current / (1 + changePercent / 100));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
      {/* Revenue Card */}
      <MetricCard
        title="Revenue"
        value={formatCurrency(summary.totalSpend, 0)}
        change={summaryChanges.totalSpend ? renderChangeIndicator(summaryChanges.totalSpend) : undefined}
        subtitle={formatCurrency(getPreviousValue(summary.totalSpend, summaryChanges.totalSpend), 0)}
      />
      
      {/* Profit Card */}
      <MetricCard
        title="Profit"
        value={formatCurrency(summary.totalProfit, 0)}
        change={summaryChanges.totalProfit ? renderChangeIndicator(summaryChanges.totalProfit) : undefined}
        subtitle={formatCurrency(getPreviousValue(summary.totalProfit, summaryChanges.totalProfit), 0)}
        valueClassName="text-finance-red"
      />
      
      {/* Margin Card */}
      <MetricCard
        title="Margin"
        value={formatPercent(summary.averageMargin)}
        change={summaryChanges.averageMargin ? renderChangeIndicator(summaryChanges.averageMargin) : undefined}
        subtitle={formatPercent(summary.averageMargin - summaryChanges.averageMargin)}
      />
      
      {/* Packs Card */}
      <MetricCard
        title="Packs"
        value={formatNumber(summary.totalPacks)}
        change={summaryChanges.totalPacks ? renderChangeIndicator(summaryChanges.totalPacks) : undefined}
        subtitle={formatNumber(getPreviousValue(summary.totalPacks, summaryChanges.totalPacks))}
      />
    </div>
  );
};

export default SummaryMetrics;
