
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { Wallet, LineChart, Percent, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PersonalPerformanceCardProps {
  performanceData: {
    totalProfit: number;
    totalSpend: number;
    margin: number;
    totalAccounts: number;
    activeAccounts: number;
    rankings?: {
      profitRank?: number;
      spendRank?: number;
      marginRank?: number;
      accountsRank?: number;
    };
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
  
  // Prepare metrics data with a consistent structure for easier rendering
  const metrics = [
    {
      title: "Total Profit",
      value: formatCurrency(performanceData?.totalProfit || 0),
      icon: <Wallet className="h-5 w-5 text-finance-gray" />,
      percentChange: hasComparisonData ? calculatePercentChange(performanceData?.totalProfit || 0, performanceData?.previousMonthData?.totalProfit || 0) : null,
      previousValue: hasComparisonData ? formatCurrency(performanceData?.previousMonthData?.totalProfit || 0) : null,
      rank: performanceData?.rankings?.profitRank || undefined,
      iconClassname: "text-finance-red"
    }, 
    {
      title: "Total Spend",
      value: formatCurrency(performanceData?.totalSpend || 0),
      icon: <LineChart className="h-5 w-5 text-finance-gray" />,
      percentChange: hasComparisonData ? calculatePercentChange(performanceData?.totalSpend || 0, performanceData?.previousMonthData?.totalSpend || 0) : null,
      previousValue: hasComparisonData ? formatCurrency(performanceData?.previousMonthData?.totalSpend || 0) : null,
      rank: performanceData?.rankings?.spendRank || undefined,
      iconClassname: "text-blue-500"
    }, 
    {
      title: "Margin",
      value: formatPercent(performanceData?.margin || 0),
      icon: <Percent className="h-5 w-5 text-finance-gray" />,
      percentChange: hasComparisonData ? performanceData?.margin - (performanceData?.previousMonthData?.margin || 0) : null,
      previousValue: hasComparisonData ? formatPercent(performanceData?.previousMonthData?.margin || 0) : null,
      isPercentagePoint: true, // Margin change is in percentage points, not percent
      rank: performanceData?.rankings?.marginRank || undefined,
      iconClassname: "text-yellow-400"
    },
    {
      title: "Active Accounts",
      value: `${formatNumber(performanceData?.activeAccounts || 0)}/${formatNumber(performanceData?.totalAccounts || 0)}`,
      icon: <Users className="h-5 w-5 text-finance-gray" />,
      activeRatio: performanceData?.totalAccounts ? performanceData.activeAccounts / performanceData.totalAccounts * 100 : 0,
      previousValue: hasComparisonData ? `${formatNumber(performanceData?.previousMonthData?.activeAccounts || 0)}/${formatNumber(performanceData?.previousMonthData?.totalAccounts || 0)}` : null,
      percentChange: hasComparisonData ? calculatePercentChange(performanceData?.activeAccounts || 0, performanceData?.previousMonthData?.activeAccounts || 0) : null,
      rank: performanceData?.rankings?.accountsRank || undefined,
      iconClassname: "text-emerald-500"
    }
  ];
  
  // Helper function to get ranking badge styles
  const getRankingBadgeStyles = (rank?: number) => {
    if (!rank || rank > 3) return null;
    
    switch(rank) {
      case 1: return "bg-amber-500 text-black"; // Gold
      case 2: return "bg-gray-300 text-black";  // Silver
      case 3: return "bg-amber-700 text-white"; // Bronze
      default: return "bg-gray-800 text-white/60";
    }
  };
  
  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-0">
      <CardContent className="p-4 md:p-6 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-gray-900/60 border-white/10 transition-all duration-300 hover:bg-gray-900/80 relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60 uppercase tracking-wider">{metric.title}</span>
                  <div className={cn("h-5 w-5", metric.iconClassname)}>
                    {metric.icon}
                  </div>
                </div>
                
                {/* Metric Value and Change Indicator */}
                <div className="mt-3">
                  <div className="flex items-baseline">
                    {/* Main value with larger text */}
                    <div className="text-xl md:text-2xl font-bold text-white">
                      {metric.value}
                    </div>
                    
                    {/* Percent change indicator (to the right of the value) */}
                    {metric.percentChange !== null && (
                      <div 
                        className={cn(
                          "text-xs flex items-center ml-2",
                          metric.percentChange > 0 ? "text-emerald-500" : 
                          metric.percentChange < 0 ? "text-finance-red" : "text-white/40"
                        )}
                      >
                        {metric.percentChange > 0 ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : metric.percentChange < 0 ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : null}
                        <span>
                          {Math.abs(metric.percentChange).toFixed(1)}
                          {metric.isPercentagePoint ? 'pp' : '%'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Previous month data */}
                  {metric.previousValue && (
                    <div className="text-xs text-white/50 mt-1">
                      Last month: {metric.previousValue}
                    </div>
                  )}
                </div>
                
                {/* Ranking badge - styled according to position with better padding */}
                {metric.rank && metric.rank <= 3 && (
                  <div className={cn(
                    "absolute bottom-2 right-2 rounded-full w-7 h-7 flex items-center justify-center",
                    "shadow-md border border-white/20",
                    getRankingBadgeStyles(metric.rank)
                  )}>
                    <span className="text-xs font-bold">{metric.rank}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalPerformanceCard;
