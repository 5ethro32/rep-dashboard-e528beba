
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

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
  const formatCurrency = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-GB').format(value);
  };

  const renderChangeIndicator = (changeValue: number) => {
    const isPositive = changeValue > 0;
    
    if (Math.abs(changeValue) < 0.1) return null; // No significant change
    
    return (
      <span className={`inline-flex items-center ml-1 ${isPositive ? 'text-emerald-500' : 'text-finance-red'}`}>
        {isPositive ? 
          <ArrowUp className="h-3.5 w-3.5 md:h-4 md:w-4" /> : 
          <ArrowDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
        }
        <span className="text-xs font-medium ml-0.5">{Math.abs(changeValue).toFixed(1)}%</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
      <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-5 backdrop-blur-sm shadow-lg">
        <h3 className="text-xs font-medium text-finance-gray uppercase">Revenue</h3>
        <div className="flex items-center mt-1">
          <p className="text-xl md:text-2xl font-bold">{formatCurrency(summary.totalSpend)}</p>
          {renderChangeIndicator(summaryChanges.totalSpend)}
        </div>
        <div className="text-xs text-finance-gray/80 mt-1">
          {formatCurrency(Math.round(summary.totalSpend / (1 + summaryChanges.totalSpend / 100)))}
        </div>
      </div>
      <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-5 backdrop-blur-sm shadow-lg">
        <h3 className="text-xs font-medium text-finance-gray uppercase">Profit</h3>
        <div className="flex items-center mt-1">
          <p className="text-xl md:text-2xl font-bold text-finance-red">{formatCurrency(summary.totalProfit)}</p>
          {renderChangeIndicator(summaryChanges.totalProfit)}
        </div>
        <div className="text-xs text-finance-gray/80 mt-1">
          {formatCurrency(Math.round(summary.totalProfit / (1 + summaryChanges.totalProfit / 100)))}
        </div>
      </div>
      <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-5 backdrop-blur-sm shadow-lg">
        <h3 className="text-xs font-medium text-finance-gray uppercase">Margin</h3>
        <div className="flex items-center mt-1">
          <p className="text-xl md:text-2xl font-bold">{formatPercent(summary.averageMargin)}</p>
          {renderChangeIndicator(summaryChanges.averageMargin)}
        </div>
        <div className="text-xs text-finance-gray/80 mt-1">
          {formatPercent(summary.averageMargin - summaryChanges.averageMargin)}
        </div>
      </div>
      <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-5 backdrop-blur-sm shadow-lg">
        <h3 className="text-xs font-medium text-finance-gray uppercase">Packs</h3>
        <div className="flex items-center mt-1">
          <p className="text-xl md:text-2xl font-bold">{formatNumber(summary.totalPacks)}</p>
          {renderChangeIndicator(summaryChanges.totalPacks)}
        </div>
        <div className="text-xs text-finance-gray/80 mt-1">
          {formatNumber(Math.round(summary.totalPacks / (1 + summaryChanges.totalPacks / 100)))}
        </div>
      </div>
    </div>
  );
};

export default SummaryMetrics;
