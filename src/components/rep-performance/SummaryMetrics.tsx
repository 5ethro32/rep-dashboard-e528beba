
import React from 'react';
import { 
  formatCurrency, 
  formatPercent, 
  formatNumber, 
  calculateSummary 
} from '@/utils/rep-performance-utils';
import { Card, CardContent } from '@/components/ui/card';
import { RenderChangeIndicator } from '@/components/rep-performance/ChangeIndicators';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryData } from '@/types/rep-performance.types';
import { useIsMobile } from '@/hooks/use-mobile';

interface SummaryMetricsProps {
  summary: SummaryData;
  summaryChanges: {
    totalSpend: number;
    totalProfit: number;
    averageMargin: number;
    totalPacks: number;
    totalAccounts: number;
    activeAccounts: number;
  };
  isLoading: boolean;
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  selectedMonth: string;
  selectedUserName?: string;
}

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ 
  summary, 
  summaryChanges, 
  isLoading,
  includeRetail,
  includeReva,
  includeWholesale,
  selectedMonth,
  selectedUserName = 'All Data'
}) => {
  const isMobile = useIsMobile();
  
  // Get the text prefix based on selected user
  const getPrefix = () => {
    if (selectedUserName === 'All Data') {
      return 'Total';
    } else if (selectedUserName === 'My Data') {
      return 'My';
    } else {
      return `${selectedUserName}'s`;
    }
  };
  
  const prefix = getPrefix();
  
  const metricConfig = [
    {
      id: 'profit',
      title: `${prefix} Profit`,
      value: summary.totalProfit,
      change: summaryChanges.totalProfit,
      formatter: formatCurrency,
      color: 'from-green-500/20 to-green-500/5'
    },
    {
      id: 'margin',
      title: 'Average Margin',
      value: summary.averageMargin,
      change: summaryChanges.averageMargin,
      formatter: formatPercent,
      color: 'from-blue-500/20 to-blue-500/5'
    },
    {
      id: 'spend',
      title: `${prefix} Spend`,
      value: summary.totalSpend,
      change: summaryChanges.totalSpend,
      formatter: formatCurrency,
      color: 'from-pink-500/20 to-pink-500/5'
    },
    {
      id: 'packs',
      title: `${prefix} Packs`,
      value: summary.totalPacks,
      change: summaryChanges.totalPacks,
      formatter: formatNumber,
      color: 'from-amber-500/20 to-amber-500/5'
    },
    {
      id: 'activeAccounts',
      title: `${prefix} Active Accounts`,
      value: summary.activeAccounts,
      change: summaryChanges.activeAccounts,
      formatter: formatNumber,
      color: 'from-violet-500/20 to-violet-500/5'
    },
    {
      id: 'totalAccounts',
      title: `${prefix} Total Accounts`,
      value: summary.totalAccounts,
      change: summaryChanges.totalAccounts,
      formatter: formatNumber,
      color: 'from-slate-500/20 to-slate-500/5'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {metricConfig.map((metric) => (
        <Card 
          key={metric.id}
          className={`rounded-xl border-white/10 shadow-lg overflow-hidden bg-gradient-to-b ${metric.color} hover:scale-[1.01] transition-all`}
        >
          <CardContent className="p-4">
            <h3 className="text-sm md:text-base text-white/70 font-medium truncate">
              {metric.title}
            </h3>
            
            {isLoading ? (
              <Skeleton className="h-9 w-full mt-2" />
            ) : (
              <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-2 mt-2">
                <span className="text-2xl md:text-3xl font-bold text-white">
                  {metric.formatter(metric.value)}
                </span>
                
                <div className={`${isMobile ? 'mt-1' : 'mb-1'}`}>
                  <RenderChangeIndicator 
                    changeValue={metric.change} 
                    size={isMobile ? "small" : "large"} 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryMetrics;
