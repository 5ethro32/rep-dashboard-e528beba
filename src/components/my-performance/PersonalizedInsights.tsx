
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users
} from 'lucide-react';

interface PersonalizedInsightsProps {
  accountHealthData: any[];
  visitData: any[];
  performanceData: any;
  isLoading: boolean;
  formatCurrency: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
}

const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({
  accountHealthData,
  visitData,
  performanceData,
  isLoading,
  formatCurrency,
  formatPercent
}) => {
  // Generate insights based on the available data
  const insights = useMemo(() => {
    if (!accountHealthData?.length || !performanceData) return [];
    
    const insights = [];
    
    // Insight 1: Declining accounts with no recent visits
    const decliningAccounts = accountHealthData.filter(a => a.status === 'declining');
    
    if (decliningAccounts.length > 0) {
      // Get account refs for declining accounts
      const decliningRefs = new Set(decliningAccounts.map(a => a.accountRef));
      
      // Check which of these have had recent visits (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      
      const recentlyVisitedRefs = new Set(
        visitData
          .filter(v => new Date(v.date) >= thirtyDaysAgo)
          .map(v => v.customer_ref)
      );
      
      // Find declining accounts with no recent visits
      const unvisitedDeclining = decliningAccounts.filter(
        a => !recentlyVisitedRefs.has(a.accountRef)
      );
      
      if (unvisitedDeclining.length > 0) {
        insights.push({
          type: 'action',
          icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
          title: 'Accounts Needing Attention',
          description: `${unvisitedDeclining.length} declining accounts haven't been visited in the last 30 days.`,
          details: unvisitedDeclining.slice(0, 3).map(a => ({
            name: a.accountName,
            metric: `${formatPercent(a.profitChangePercent)} profit change`
          }))
        });
      }
    }
    
    // Insight 2: Top performing accounts
    const topAccounts = [...accountHealthData]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3);
      
    if (topAccounts.length > 0) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
        title: 'Your Top Performing Accounts',
        description: 'These accounts are generating the highest profit.',
        details: topAccounts.map(a => ({
          name: a.accountName,
          metric: formatCurrency(a.profit)
        }))
      });
    }
    
    // Insight 3: Visit frequency impact
    if (visitData.length > 0) {
      // Group accounts by visit frequency
      const accountVisits: Record<string, { name: string, visits: number, profit: number }> = {};
      
      visitData.forEach(visit => {
        const accountRef = visit.customer_ref;
        if (!accountVisits[accountRef]) {
          accountVisits[accountRef] = {
            name: visit.customer_name,
            visits: 0,
            profit: 0
          };
        }
        accountVisits[accountRef].visits += 1;
        accountVisits[accountRef].profit += Number(visit.profit) || 0;
      });
      
      // Calculate average profit per visit
      const accountsWithVisits = Object.values(accountVisits);
      if (accountsWithVisits.length > 0) {
        const totalVisits = accountsWithVisits.reduce(
          (sum, account) => sum + account.visits, 0
        );
        const avgVisitsPerAccount = totalVisits / accountsWithVisits.length;
        
        const totalProfit = accountsWithVisits.reduce(
          (sum, account) => sum + account.profit, 0
        );
        // Make sure to handle potential division by zero
        const avgProfitPerVisit = totalVisits > 0 ? totalProfit / totalVisits : 0;
        
        insights.push({
          type: 'info',
          icon: <Calendar className="h-5 w-5 text-blue-500" />,
          title: 'Visit Impact Analysis',
          description: `On average, each customer visit generates ${formatCurrency(avgProfitPerVisit)} in profit.`,
          details: [
            {
              name: 'Average visits per account',
              metric: avgVisitsPerAccount.toFixed(1)
            },
            {
              name: 'Total visits recorded',
              metric: visitData.length.toString()
            }
          ]
        });
      }
    }
    
    // Insight 4: Active accounts ratio
    if (performanceData) {
      const totalAccounts = performanceData.totalAccounts || 0;
      const activeAccounts = performanceData.activeAccounts || 0;
      
      const activeRatio = totalAccounts > 0 ? 
        (activeAccounts / totalAccounts) * 100 : 0;
      
      const insight = {
        type: activeRatio >= 70 ? 'success' : 'warning',
        icon: <Users className="h-5 w-5 text-blue-500" />,
        title: 'Account Activation',
        description: `${formatPercent(activeRatio)} of your accounts are active (with spend > 0).`,
        details: [] as {name: string, metric: string}[]
      };
      
      if (activeRatio < 70) {
        const inactiveCount = totalAccounts - activeAccounts;
        insight.details.push({
          name: 'Inactive accounts',
          metric: inactiveCount.toString()
        });
        
        // Find inactive accounts
        const inactiveAccounts = accountHealthData
          .filter(a => a.spend === 0)
          .sort((a, b) => b.profitChangePercent - a.profitChangePercent)
          .slice(0, 2);
          
        inactiveAccounts.forEach(account => {
          insight.details.push({
            name: account.accountName,
            metric: 'Inactive'
          });
        });
      }
      
      insights.push(insight);
    }
    
    return insights;
  }, [accountHealthData, visitData, performanceData, formatCurrency, formatPercent]);

  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
        <CardContent className="p-4 md:p-6">
          <Skeleton className="h-8 w-1/3 mb-6 bg-white/10" />
          <div className="space-y-4">
            <Skeleton className="h-32 bg-white/5" />
            <Skeleton className="h-32 bg-white/5" />
            <Skeleton className="h-32 bg-white/5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
      <CardContent className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Personal Performance Insights</h3>
        
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <Card 
                key={index}
                className={`border-l-4 ${
                  insight.type === 'action' ? 'border-l-amber-500' :
                  insight.type === 'success' ? 'border-l-emerald-500' :
                  insight.type === 'warning' ? 'border-l-finance-red' :
                  'border-l-blue-500'
                } bg-gray-900/60 border-y border-r border-white/10`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {insight.icon}
                    <h4 className="font-medium text-white">{insight.title}</h4>
                  </div>
                  <p className="text-white/70 mb-3">{insight.description}</p>
                  
                  {insight.details && insight.details.length > 0 && (
                    <div className="pl-2 border-l-2 border-white/10 mt-3">
                      {insight.details.map((detail, i) => (
                        <div key={i} className="flex justify-between text-sm py-1">
                          <span className="text-white/60">{detail.name}</span>
                          <span className="font-medium text-white">{detail.metric}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/60 border border-white/10 rounded-lg p-6 text-center">
            <CheckCircle className="w-10 h-10 text-white/30 mx-auto mb-3" />
            <p className="text-white/70">No specific insights available at this time.</p>
            <p className="text-sm text-white/50 mt-2">
              Continue recording customer visits and sales data to generate personalized insights.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalizedInsights;
