
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
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import { formatDate } from '@/utils/date-utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
          weekStartDate: weekStart, // Store date object for sorting
        };
      }
      
      acc[weekKey].visits += 1;
      if (visit.has_order) {
        acc[weekKey].orders += 1;
      }
      acc[weekKey].profit += visit.profit || 0;
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(weeklyData)
      .sort((a: any, b: any) => a.weekStartDate - b.weekStartDate);
  }, [visitData]);

  // Brand colors for the charts (using finance app colors)
  const visitColor = "#9b87f5"; // Primary Purple from brand colors
  const orderColor = "#10B981"; // Emerald green
  const profitColor = "#ea384c";  // Finance Red
  const barOpacity = 0.85;
  const areaOpacity = 0.25;

  // Limit the number of accounts to display based on device
  const limitedAccountsData = useMemo(() => {
    const limit = isMobile ? 8 : 15; // Show fewer on mobile
    return processedData.slice(0, limit);
  }, [processedData, isMobile]);

  // Custom tooltip for weekly chart
  const CustomWeeklyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-md border border-white/20 p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: visitColor }}></span>
              <span className="text-white/80">Visits:</span> 
              <span className="ml-1 font-semibold text-white">{payload[0].value}</span>
            </p>
            <p className="text-sm flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: orderColor }}></span>
              <span className="text-white/80">Orders:</span> 
              <span className="ml-1 font-semibold text-white">{payload[1].value}</span>
            </p>
            {payload[2] && (
              <p className="text-sm flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: 'linear-gradient(to right, #9b87f5, #ea384c)' }}></span>
                <span className="text-white/80">Profit:</span> 
                <span className="ml-1 font-semibold text-white">£{payload[2].value.toFixed(0)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
  
    return null;
  };

  // Custom tooltip for account chart
  const CustomAccountTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-md border border-white/20 p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: visitColor }}></span>
              <span className="text-white/80">Visits:</span> 
              <span className="ml-1 font-semibold text-white">{payload[0].value}</span>
            </p>
            <p className="text-sm flex items-center">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: profitColor }}></span>
              <span className="text-white/80">Profit:</span> 
              <span className="ml-1 font-semibold text-white">£{payload[1].value.toFixed(0)}</span>
            </p>
          </div>
        </div>
      );
    }
  
    return null;
  };

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
  const hasEnoughDataForAnalysis = limitedAccountsData.length > 0;

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
            {/* Weekly Visit Trends - Enhanced Styled Chart */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-white/80 mb-4">Weekly Visit Activity</h4>
              <div className="h-80 bg-gray-900/60 border border-white/10 rounded-lg p-4 overflow-hidden">
                {weeklyVisitData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={weeklyVisitData}
                      margin={{ top: 20, right: 20, left: 5, bottom: 60 }}
                    >
                      <defs>
                        <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={visitColor} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={visitColor} stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={orderColor} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={orderColor} stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="week" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip content={<CustomWeeklyTooltip />} />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="visits" 
                        fill="url(#visitGradient)" 
                        stroke={visitColor}
                        fillOpacity={areaOpacity}
                        strokeWidth={2}
                      />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="orders" 
                        fill="url(#orderGradient)" 
                        stroke={orderColor}
                        fillOpacity={areaOpacity}
                        strokeWidth={2}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="profit" 
                        stroke={profitColor} 
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2, fill: '#1F2937' }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50">
                    Not enough weekly data to display trends
                  </div>
                )}
              </div>
            </div>
            
            {/* Visit Impact by Account - Enhanced Styled Chart with LIMITED data */}
            {hasEnoughDataForAnalysis ? (
              <div className="mb-6">
                <h4 className="text-md font-medium text-white/80 mb-4">
                  Visit Impact by Account 
                  {processedData.length > limitedAccountsData.length && 
                    <span className="text-xs text-white/50 ml-2">
                      (Showing top {limitedAccountsData.length} of {processedData.length})
                    </span>
                  }
                </h4>
                <div className="h-80 bg-gray-900/60 border border-white/10 rounded-lg p-4 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={limitedAccountsData}
                      margin={{ top: 20, right: 20, left: 5, bottom: 60 }}
                    >
                      <defs>
                        <linearGradient id="visitBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={visitColor} stopOpacity={1}/>
                          <stop offset="100%" stopColor={visitColor} stopOpacity={0.6}/>
                        </linearGradient>
                        <linearGradient id="profitBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={profitColor} stopOpacity={1}/>
                          <stop offset="100%" stopColor={profitColor} stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="accountName" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis 
                        yAxisId="visits" 
                        orientation="left"
                        tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis 
                        yAxisId="profit" 
                        orientation="right"
                        tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip content={<CustomAccountTooltip />} />
                      <Bar 
                        dataKey="visitCount" 
                        name="Visits" 
                        yAxisId="visits" 
                        barSize={30}
                        shape={<CustomVisitBar />}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                      >
                        {limitedAccountsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#visitBarGradient)`} 
                          />
                        ))}
                      </Bar>
                      <Bar 
                        dataKey="visitProfit" 
                        name="Visit Profit" 
                        yAxisId="profit"
                        barSize={30} 
                        shape={<CustomProfitBar />}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                        radius={[4, 4, 0, 0]}
                      >
                        {limitedAccountsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#profitBarGradient)`} 
                          />
                        ))}
                      </Bar>
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

// Custom Bar shapes for stylized visualization
const CustomVisitBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  
  return (
    <g>
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        fill={fill} 
        rx={4}
        ry={4}
        filter="url(#glow)" 
      />
    </g>
  );
};

const CustomProfitBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  
  return (
    <g>
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        fill={fill} 
        rx={4}
        ry={4}
        filter="url(#glow)"
      />
    </g>
  );
};

export default ActivityImpactAnalysis;
