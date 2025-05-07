
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { TrendingUp, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PersonalPerformanceCardProps {
  performanceData: {
    totalProfit: number;
    totalSpend: number;
    margin: number;
    totalAccounts: number;
    activeAccounts: number;
  } | null;
  isLoading: boolean;
}

const PersonalPerformanceCard: React.FC<PersonalPerformanceCardProps> = ({
  performanceData,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-4 md:p-6">
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-5 w-1/3 bg-white/10" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-32 bg-white/5" />
              <Skeleton className="h-32 bg-white/5" />
              <Skeleton className="h-32 bg-white/5" />
              <Skeleton className="h-32 bg-white/5" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const metrics = [
    {
      title: "Total Profit",
      value: formatCurrency(performanceData?.totalProfit || 0),
      icon: <TrendingUp className="h-5 w-5 text-finance-red" />
    },
    {
      title: "Total Spend",
      value: formatCurrency(performanceData?.totalSpend || 0),
      icon: <TrendingUp className="h-5 w-5 text-finance-red" />
    },
    {
      title: "Margin",
      value: formatPercent(performanceData?.margin || 0),
      icon: <TrendingUp className="h-5 w-5 text-finance-red" />
    },
    {
      title: "Active Accounts",
      value: `${formatNumber(performanceData?.activeAccounts || 0)}/${formatNumber(performanceData?.totalAccounts || 0)}`,
      icon: <Users className="h-5 w-5 text-finance-red" />,
      activeRatio: performanceData?.totalAccounts ? 
        (performanceData.activeAccounts / performanceData.totalAccounts) * 100 : 0
    }
  ];

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-4 md:p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-white">Your Performance Summary</h2>
          <p className="text-sm text-white/60">Key metrics for your accounts and performance</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {metrics.map((metric, index) => (
              <Card 
                key={index}
                className="bg-gray-900/60 border-white/10 transition-all duration-300 hover:bg-gray-900/80"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/60 uppercase tracking-wider">{metric.title}</span>
                    {metric.icon}
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-white">{metric.value}</div>
                  
                  {metric.activeRatio !== undefined && (
                    <div className="flex items-center mt-1">
                      <span className={`text-xs ${metric.activeRatio > 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {formatPercent(metric.activeRatio)} Active Ratio
                      </span>
                      {metric.activeRatio > 50 ? (
                        <ArrowUp className="h-3 w-3 ml-1 text-emerald-500" />
                      ) : (
                        <ArrowDown className="h-3 w-3 ml-1 text-amber-500" />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonalPerformanceCard;
