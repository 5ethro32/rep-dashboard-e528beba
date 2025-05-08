
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { Wallet, LineChart, Percent, Users, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PersonalPerformanceCardProps {
  performanceData: {
    totalProfit: number;
    totalSpend: number;
    margin: number;
    totalAccounts: number;
    activeAccounts: number;
    // Add comparison data
    previousMonthData?: {
      totalProfit: number;
      totalSpend: number;
      margin: number;
      totalAccounts: number;
      activeAccounts: number;
    };
  } | null;
  isLoading: boolean;
  title?: string;
  subtitle?: string;
}

const PersonalPerformanceCard: React.FC<PersonalPerformanceCardProps> = ({
  performanceData,
  isLoading,
  title,
  subtitle
}) => {
  if (isLoading) {
    return <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-4 md:p-6">
        <div className="space-y-6">
          {title && <div className="flex flex-col space-y-2">
            <Skeleton className="h-7 w-2/3 bg-white/10" />
            <Skeleton className="h-4 w-1/2 bg-white/10" />
          </div>}
          <div className="flex flex-col space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-32 bg-white/5" />
              <Skeleton className="h-32 bg-white/5" />
              <Skeleton className="h-32 bg-white/5" />
              <Skeleton className="h-32 bg-white/5" />
            </div>
          </div>
        </div>
      </Card>;
  }

  // Calculate percent changes if previous month data exists
  const calculatePercentChange = (current: number, previous: number): number => {
    if (!previous) return 0;
    return (current - previous) / previous * 100;
  };
  const hasComparisonData = performanceData?.previousMonthData !== undefined;
  const metrics = [{
    title: "Total Profit",
    value: formatCurrency(performanceData?.totalProfit || 0),
    icon: <Wallet className="h-5 w-5 text-finance-gray" />,
    percentChange: hasComparisonData ? calculatePercentChange(performanceData?.totalProfit || 0, performanceData?.previousMonthData?.totalProfit || 0) : null,
    previousValue: hasComparisonData ? formatCurrency(performanceData?.previousMonthData?.totalProfit || 0) : null
  }, {
    title: "Total Spend",
    value: formatCurrency(performanceData?.totalSpend || 0),
    icon: <LineChart className="h-5 w-5 text-finance-gray" />,
    percentChange: hasComparisonData ? calculatePercentChange(performanceData?.totalSpend || 0, performanceData?.previousMonthData?.totalSpend || 0) : null,
    previousValue: hasComparisonData ? formatCurrency(performanceData?.previousMonthData?.totalSpend || 0) : null
  }, {
    title: "Margin",
    value: formatPercent(performanceData?.margin || 0),
    icon: <Percent className="h-5 w-5 text-finance-gray" />,
    percentChange: hasComparisonData ? performanceData?.margin - (performanceData?.previousMonthData?.margin || 0) : null,
    previousValue: hasComparisonData ? formatPercent(performanceData?.previousMonthData?.margin || 0) : null,
    isPercentagePoint: true // Margin change is in percentage points, not percent
  }, {
    title: "Active Accounts",
    value: `${formatNumber(performanceData?.activeAccounts || 0)}/${formatNumber(performanceData?.totalAccounts || 0)}`,
    icon: <Users className="h-5 w-5 text-finance-gray" />,
    activeRatio: performanceData?.totalAccounts ? performanceData.activeAccounts / performanceData.totalAccounts * 100 : 0,
    previousValue: hasComparisonData ? `${formatNumber(performanceData?.previousMonthData?.activeAccounts || 0)}/${formatNumber(performanceData?.previousMonthData?.totalAccounts || 0)}` : null,
    percentChange: hasComparisonData ? calculatePercentChange(performanceData?.activeAccounts || 0, performanceData?.previousMonthData?.activeAccounts || 0) : null
  }];
  
  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-4 md:p-6">
      <div className="space-y-6">
        {/* Title and Subtitle Section */}
        {title && (
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-700 to-finance-red">
                {title}
              </span>
              <span className="text-white"> Performance Dashboard</span>
            </h2>
            {subtitle && <p className="text-white/60 mt-1">{subtitle}</p>}
          </div>
        )}

        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric, index) => <Card key={index} className="bg-gray-900/60 border-white/10 transition-all duration-300 hover:bg-gray-900/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/60 uppercase tracking-wider">{metric.title}</span>
                    {metric.icon}
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-white">{metric.value}</div>
                  
                  {/* Percent change indicator */}
                  {metric.percentChange !== null && <div className="flex items-center mt-2">
                      {metric.percentChange > 0 ? <ChevronUp className="h-4 w-4 text-emerald-500" /> : metric.percentChange < 0 ? <ChevronDown className="h-4 w-4 text-finance-red" /> : <span className="h-4 w-4 flex items-center justify-center text-white/40">—</span>}
                      
                      <span className={`text-xs ml-1 ${metric.percentChange > 0 ? 'text-emerald-500' : metric.percentChange < 0 ? 'text-finance-red' : 'text-white/40'}`}>
                        {Math.abs(metric.percentChange).toFixed(1)}
                        {metric.isPercentagePoint ? 'pp' : '%'}
                      </span>
                    </div>}
                  
                  {/* Previous month data */}
                  {metric.previousValue && <div className="flex items-center mt-1">
                      <span className="text-xs text-white/50">
                        Last month: {metric.previousValue}
                      </span>
                    </div>}
                  
                  {metric.activeRatio !== undefined}
                </CardContent>
              </Card>)}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonalPerformanceCard;
