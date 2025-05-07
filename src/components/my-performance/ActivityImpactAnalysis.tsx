
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatDate } from '@/utils/date-utils';

interface ActivityImpactAnalysisProps {
  visitData: any[];
  accountHealthData: any[];
  isLoading: boolean;
}

const ActivityImpactAnalysis: React.FC<ActivityImpactAnalysisProps> = ({
  visitData,
  accountHealthData,
  isLoading
}) => {
  // Process visit data to show correlation with account health
  const processedData = useMemo(() => {
    // Guard for empty data
    if (!visitData?.length || !accountHealthData?.length) return [];
    
    // Count visits per account
    const visitsPerAccount = visitData.reduce((acc, visit) => {
      const accountRef = visit.customer_ref;
      if (!accountRef) return acc;
      
      if (!acc[accountRef]) {
        acc[accountRef] = {
          count: 0,
          hasOrder: 0,
          totalProfit: 0,
          accountName: visit.customer_name
        };
      }
      
      acc[accountRef].count += 1;
      if (visit.has_order) {
        acc[accountRef].hasOrder += 1;
      }
      acc[accountRef].totalProfit += visit.profit || 0;
      
      return acc;
    }, {});
    
    // Match with account health data
    const accountHealthMap = new Map(
      accountHealthData.map(account => [account.accountRef, account])
    );
    
    // Create visualization data
    return Object.entries(visitsPerAccount).map(([accountRef, data]: [string, any]) => {
      const healthData = accountHealthMap.get(accountRef);
      const profitTrend = healthData ? healthData.profitChangePercent : 0;
      
      return {
        accountName: data.accountName,
        visitCount: data.count,
        ordersPlaced: data.hasOrder,
        conversionRate: data.count > 0 ? (data.hasOrder / data.count) * 100 : 0,
        visitProfit: data.totalProfit,
        profitPerVisit: data.count > 0 ? data.totalProfit / data.count : 0,
        profitTrend
      };
    }).sort((a, b) => b.visitCount - a.visitCount);
  }, [visitData, accountHealthData]);
  
  // Calculate weekly visit trends
  const weeklyVisitData = useMemo(() => {
    if (!visitData?.length) return [];
    
    // Group visits by week
    const weeklyData = visitData.reduce((acc, visit) => {
      const visitDate = new Date(visit.date);
      // Format the week (e.g., "Apr 1 - Apr 7")
      const weekStart = new Date(visitDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Move to start of week (Sunday)
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      
      const weekKey = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekKey,
          visits: 0,
          orders: 0,
          profit: 0,
        };
      }
      
      acc[weekKey].visits += 1;
      if (visit.has_order) {
        acc[weekKey].orders += 1;
      }
      acc[weekKey].profit += visit.profit || 0;
      
      return acc;
    }, {});
    
    return Object.values(weeklyData);
  }, [visitData]);

  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
        <CardContent className="p-4 md:p-6">
          <Skeleton className="h-8 w-1/3 mb-6 bg-white/10" />
          <Skeleton className="h-80 bg-white/5 mb-6" />
          <Skeleton className="h-8 w-1/3 mb-4 bg-white/10" />
          <Skeleton className="h-64 bg-white/5" />
        </CardContent>
      </Card>
    );
  }

  // Determine if we have enough data
  const hasVisitData = visitData?.length > 0;
  const hasEnoughDataForAnalysis = processedData.length > 0;

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
      <CardContent className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Activity Impact Analysis</h3>
        
        {!hasVisitData ? (
          <div className="bg-gray-900/60 border border-white/10 rounded-lg p-6 text-center">
            <p className="text-white/70">No visit data available to analyze impact.</p>
            <p className="text-sm text-white/50 mt-2">
              Record customer visits in the Rep Tracker to see how they correlate with account performance.
            </p>
          </div>
        ) : (
          <>
            {/* Weekly Visit Trends */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-white/80 mb-4">Weekly Visit Activity</h4>
              <div className="h-80 bg-gray-900/60 border border-white/10 rounded-lg p-4">
                {weeklyVisitData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyVisitData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="week" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(22,22,22,0.9)', 
                          borderColor: 'rgba(255,255,255,0.1)',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="visits" name="Total Visits" fill="#ef4444" />
                      <Bar dataKey="orders" name="Orders Placed" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50">
                    Not enough weekly data to display trends
                  </div>
                )}
              </div>
            </div>
            
            {/* Visit Impact Analysis */}
            {hasEnoughDataForAnalysis ? (
              <div className="mb-6">
                <h4 className="text-md font-medium text-white/80 mb-4">Visit Impact by Account</h4>
                <div className="h-80 bg-gray-900/60 border border-white/10 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={processedData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="accountName" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      />
                      <YAxis yAxisId="visits" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                      <YAxis yAxisId="profit" orientation="right" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(22,22,22,0.9)', 
                          borderColor: 'rgba(255,255,255,0.1)',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="visitCount" name="Visits" fill="#ef4444" yAxisId="visits" />
                      <Bar dataKey="visitProfit" name="Visit Profit" fill="#22c55e" yAxisId="profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/60 border border-white/10 rounded-lg p-6 text-center mt-6">
                <p className="text-white/70">Not enough data to analyze visit impact on account performance.</p>
                <p className="text-sm text-white/50 mt-2">
                  Continue recording customer visits and sales to see correlations.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityImpactAnalysis;
