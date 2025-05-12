
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { DollarSign, Percent, TrendingUp } from 'lucide-react';

interface SimulationResultsProps {
  result: {
    baseline: {
      totalRevenue: number;
      totalProfit: number;
      weightedMargin: number;
      count: number;
    };
    simulated: {
      totalRevenue: number;
      totalProfit: number;
      weightedMargin: number;
      count: number;
    };
    changes: {
      revenueDiff: number;
      revenueDiffPercent: number;
      profitDiff: number;
      profitDiffPercent: number;
      marginDiff: number;
    };
    config: any;
  };
}

const SimulationResults: React.FC<SimulationResultsProps> = ({ result }) => {
  // Calculate whether each metric improved
  const revenueImproved = result.changes.revenueDiff > 0;
  const profitImproved = result.changes.profitDiff > 0;
  const marginImproved = result.changes.marginDiff > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Simulation Results</h3>
      
      {/* Overall metrics comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h4 className="text-sm text-muted-foreground uppercase mb-4">Total Revenue</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <MetricCard 
                title="Current Revenue" 
                value={formatCurrency(result.baseline.totalRevenue)} 
                icon={<DollarSign className="h-5 w-5" />} 
                iconPosition="right" 
              />
              
              <MetricCard 
                title="Simulated Revenue" 
                value={formatCurrency(result.simulated.totalRevenue)} 
                icon={<DollarSign className="h-5 w-5" />} 
                iconPosition="right" 
                change={{
                  value: `${result.changes.revenueDiff > 0 ? '+' : ''}${formatCurrency(result.changes.revenueDiff)} (${result.changes.revenueDiffPercent.toFixed(2)}%)`,
                  type: revenueImproved ? 'increase' : (result.changes.revenueDiff < 0 ? 'decrease' : 'neutral')
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Profit Card */}
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h4 className="text-sm text-muted-foreground uppercase mb-4">Total Profit</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <MetricCard 
                title="Current Profit" 
                value={formatCurrency(result.baseline.totalProfit)} 
                icon={<TrendingUp className="h-5 w-5" />} 
                iconPosition="right" 
              />
              
              <MetricCard 
                title="Simulated Profit" 
                value={formatCurrency(result.simulated.totalProfit)} 
                icon={<TrendingUp className="h-5 w-5" />} 
                iconPosition="right" 
                change={{
                  value: `${result.changes.profitDiff > 0 ? '+' : ''}${formatCurrency(result.changes.profitDiff)} (${result.changes.profitDiffPercent.toFixed(2)}%)`,
                  type: profitImproved ? 'increase' : (result.changes.profitDiff < 0 ? 'decrease' : 'neutral')
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Margin Card */}
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h4 className="text-sm text-muted-foreground uppercase mb-4">Overall Margin</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <MetricCard 
                title="Current Margin" 
                value={formatPercentage(result.baseline.weightedMargin)} 
                icon={<Percent className="h-5 w-5" />} 
                iconPosition="right" 
              />
              
              <MetricCard 
                title="Simulated Margin" 
                value={formatPercentage(result.simulated.weightedMargin)} 
                icon={<Percent className="h-5 w-5" />} 
                iconPosition="right" 
                change={{
                  value: `${result.changes.marginDiff > 0 ? '+' : ''}${result.changes.marginDiff.toFixed(2)}%`,
                  type: marginImproved ? 'increase' : (result.changes.marginDiff < 0 ? 'decrease' : 'neutral')
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Summary note */}
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-2">Simulation Summary</h4>
          <p className="text-sm text-muted-foreground">
            This simulation applied your configured rule parameters to {result.baseline.count} active items.
            The changes {profitImproved ? 'increased' : 'decreased'} overall profit by {formatCurrency(Math.abs(result.changes.profitDiff))}{' '}
            ({Math.abs(result.changes.profitDiffPercent).toFixed(2)}%) and {marginImproved ? 'increased' : 'decreased'}{' '}
            the weighted margin by {Math.abs(result.changes.marginDiff).toFixed(2)} percentage points.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulationResults;
