
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface ImpactAnalysisProps {
  currentMetrics: {
    totalRevenue: number;
    totalProfit: number;
    weightedMargin: number;
  };
  proposedMetrics: {
    proposedRevenue: number;
    proposedProfit: number;
    proposedWeightedMargin: number;
  };
  activeRule: string;
}

const ImpactAnalysis: React.FC<ImpactAnalysisProps> = ({
  currentMetrics, 
  proposedMetrics,
  activeRule
}) => {
  // Calculate changes and differences
  const revenueDifference = proposedMetrics.proposedRevenue - currentMetrics.totalRevenue;
  const revenueChangePercent = currentMetrics.totalRevenue ? (revenueDifference / currentMetrics.totalRevenue) * 100 : 0;
  
  const profitDifference = proposedMetrics.proposedProfit - currentMetrics.totalProfit;
  const profitChangePercent = currentMetrics.totalProfit ? (profitDifference / currentMetrics.totalProfit) * 100 : 0;
  
  const marginDifference = proposedMetrics.proposedWeightedMargin - currentMetrics.weightedMargin;
  
  // Check if we're showing the current view, if so, don't show changes
  if (activeRule === 'current') {
    return null;
  }

  // Generate rule title
  const getRuleTitle = () => {
    switch (activeRule) {
      case 'rule1': return "Rule 1 - Market-based Pricing";
      case 'rule2': return "Rule 2 - Margin-based Pricing";
      case 'combined': return "Combined Rules";
      default: return "";
    }
  };

  return (
    <Card className="mb-8 border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Impact Analysis: {getRuleTitle()}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <MetricCard 
            title="Revenue Impact" 
            value={formatCurrency(revenueDifference)}
            icon={<DollarSign className="h-5 w-5" />}
            iconPosition="right"
            change={{
              value: `${Math.abs(revenueChangePercent).toFixed(2)}%`,
              type: revenueChangePercent >= 0 ? 'increase' : 'decrease'
            }}
            subtitle={`From ${formatCurrency(currentMetrics.totalRevenue)} to ${formatCurrency(proposedMetrics.proposedRevenue)}`}
          />
          
          <MetricCard 
            title="Profit Impact" 
            value={formatCurrency(profitDifference)}
            icon={<TrendingUp className="h-5 w-5" />}
            iconPosition="right"
            change={{
              value: `${Math.abs(profitChangePercent).toFixed(2)}%`,
              type: profitChangePercent >= 0 ? 'increase' : 'decrease'
            }}
            subtitle={`From ${formatCurrency(currentMetrics.totalProfit)} to ${formatCurrency(proposedMetrics.proposedProfit)}`}
          />
          
          <MetricCard 
            title="Margin Impact" 
            value={`${marginDifference.toFixed(2)}%`}
            icon={<Percent className="h-5 w-5" />}
            iconPosition="right"
            change={{
              value: `${Math.abs(marginDifference).toFixed(2)}%`,
              type: marginDifference >= 0 ? 'increase' : 'decrease'
            }}
            subtitle={`From ${formatPercentage(currentMetrics.weightedMargin)} to ${formatPercentage(proposedMetrics.proposedWeightedMargin)}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ImpactAnalysis;
