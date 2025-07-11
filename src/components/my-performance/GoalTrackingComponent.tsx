
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ChevronUp, ChevronDown, Flag, Settings, Target } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { useUserGoals } from '@/hooks/useUserGoals';
import GoalEditModal from './GoalEditModal';

interface GoalTrackingComponentProps {
  performanceData: any;
  accountHealthData: any[];
  visitData: any[];
  isLoading: boolean;
  formatCurrency: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
  selectedUserId?: string | null;
  selectedUserDisplayName?: string;
}

const GoalTrackingComponent: React.FC<GoalTrackingComponentProps> = ({
  performanceData,
  accountHealthData,
  visitData,
  isLoading,
  formatCurrency,
  formatPercent,
  selectedUserId,
  selectedUserDisplayName
}) => {
  const [metricType, setMetricType] = useState<string>('profit');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<any>(null);
  
  // Use the custom goals hook
  const {
    goals,
    hasCustomGoals,
    isLoading: isLoadingGoals,
    isSaving,
    saveCustomGoals,
    resetToCalculatedGoals,
    getSuggestedGoals,
    canCustomize
  } = useUserGoals(selectedUserId, selectedUserDisplayName);

  // Generate trend data when performance data or goals change
  useEffect(() => {
    generateTrendData();
  }, [performanceData, goals]);

  // Handle opening the goal edit modal
  const handleEditGoals = async () => {
    try {
      const suggested = await getSuggestedGoals();
      setSuggestedGoals(suggested);
    } catch (error) {
      console.error('Error getting suggested goals:', error);
    }
    setIsModalOpen(true);
  };

  // Handle saving goals from modal
  const handleSaveGoals = async (newGoals: any) => {
    const success = await saveCustomGoals(newGoals);
    if (success) {
      // Regenerate trend data with new goals
      await generateTrendData();
    }
    return success;
  };

  // Handle resetting goals from modal
  const handleResetGoals = async () => {
    const success = await resetToCalculatedGoals();
    if (success) {
      // Regenerate trend data with reset goals
      await generateTrendData();
    }
    return success;
  };
  
  // Generate trend data for visualization using realistic data patterns
  const generateTrendData = async () => {
    // Base the trend on the current performance data
    if (!performanceData) {
      setTrendData([]);
      return;
    }
    
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    
    // Ensure current month is included
    if (!months.includes(currentMonth)) {
      months[months.length - 1] = currentMonth;
    }
    
    // Generate historical data with realistic trends
    // (In a real app, this would fetch from the database)
    const baseProfit = performanceData.totalProfit || 100000;
    const baseMargin = performanceData.margin || 15;
    const baseRatio = performanceData.totalAccounts ? 
      (performanceData.activeAccounts / performanceData.totalAccounts) * 100 : 70;
    const basePacks = performanceData.totalPacks || 5000;
    
    // Create historical data that shows a trend leading up to current values
    const data = months.map((month, index) => {
      const factor = 0.8 + (index * 0.05); // Gradually increase to simulate growth
      const isCurrentMonth = index === months.length - 1;
      
      return {
        month,
        profit: isCurrentMonth ? baseProfit : Math.round(baseProfit * factor),
        margin: isCurrentMonth ? baseMargin : Math.round((baseMargin * factor) * 10) / 10,
        activeRatio: isCurrentMonth ? baseRatio : Math.round((baseRatio * factor) * 10) / 10,
        packs: isCurrentMonth ? basePacks : Math.round(basePacks * factor)
      };
    });
    
    setTrendData(data);
  };
  
  // Calculate goal progress
  const calculateProgress = () => {
    if (!performanceData) return { profit: 0, margin: 0, activeRatio: 0, packs: 0 };
    
    const activeRatio = performanceData.totalAccounts > 0 ? 
      (performanceData.activeAccounts / performanceData.totalAccounts) * 100 : 0;
      
    return {
      profit: (performanceData.totalProfit / goals.profit) * 100,
      margin: (performanceData.margin / goals.margin) * 100,
      activeRatio: (activeRatio / goals.activeRatio) * 100,
      packs: (performanceData.totalPacks / goals.packs) * 100
    };
  };
  
  const progress = calculateProgress();
  
  // Calculate month-over-month change
  const calculateChange = () => {
    if (!trendData || trendData.length < 2) return { profit: 0, margin: 0, activeRatio: 0, packs: 0 };
    
    const current = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    
    return {
      profit: ((current.profit - previous.profit) / previous.profit) * 100,
      margin: current.margin - previous.margin,
      activeRatio: current.activeRatio - previous.activeRatio,
      packs: ((current.packs - previous.packs) / previous.packs) * 100
    };
  };
  
  const changes = calculateChange();
  
  // Title and label for each metric type
  const metricInfo = {
    profit: {
      title: "Profit Goal Tracking",
      yAxisLabel: "Profit (£)",
      format: (value: number) => formatCurrency(value),
      goal: formatCurrency(goals.profit),
      changeFormat: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    },
    margin: {
      title: "Margin Goal Tracking",
      yAxisLabel: "Margin (%)",
      format: (value: number) => `${value.toFixed(1)}%`,
      goal: `${goals.margin.toFixed(1)}%`,
      changeFormat: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    },
    activeRatio: {
      title: "Active Accounts Ratio Goal",
      yAxisLabel: "Active Ratio (%)",
      format: (value: number) => `${value.toFixed(1)}%`,
      goal: `${goals.activeRatio.toFixed(1)}%`,
      changeFormat: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    },
    packs: {
      title: "Packs Goal",
      yAxisLabel: "Packs",
      format: (value: number) => formatNumber(value),
      goal: formatNumber(goals.packs),
      changeFormat: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    }
  };

  if (isLoading || isLoadingGoals) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
        <CardContent className="p-4 md:p-6">
          <Skeleton className="h-8 w-1/3 mb-4 bg-white/10" />
          <Skeleton className="h-10 w-4/5 mb-6 bg-white/10" />
          <Skeleton className="h-80 bg-white/5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg md:text-xl font-semibold text-white">Goal Tracking</h3>
            {hasCustomGoals ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Custom
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                Auto-Generated
              </Badge>
            )}
          </div>
          {canCustomize && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditGoals}
              className="flex items-center gap-2"
              disabled={isLoadingGoals}
            >
              <Settings className="h-4 w-4" />
              Edit Goals
            </Button>
          )}
        </div>
        
        {!performanceData ? (
          <div className="bg-gray-900/60 border border-white/10 rounded-lg p-6 text-center">
            <p className="text-white/70">No performance data available to track goals.</p>
          </div>
        ) : (
          <>
            <Tabs defaultValue="profit" onValueChange={setMetricType} className="w-full mb-4">
              <TabsList className="grid grid-cols-4 mb-4 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/5 shadow-lg p-1">
                <TabsTrigger value="profit" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
                  Profit
                </TabsTrigger>
                <TabsTrigger value="margin" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
                  Margin
                </TabsTrigger>
                <TabsTrigger value="activeRatio" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
                  Active Ratio
                </TabsTrigger>
                <TabsTrigger value="packs" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
                  Packs
                </TabsTrigger>
              </TabsList>
              
              <div className="bg-gray-900/60 border border-white/10 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-white/80">{metricInfo[metricType as keyof typeof metricInfo]?.title}</h4>
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-finance-red" />
                    <span className="text-sm text-white/70">Goal: {metricInfo[metricType as keyof typeof metricInfo]?.goal}</span>
                  </div>
                </div>
                
                <Progress 
                  value={Math.min(100, progress[metricType as keyof typeof progress])} 
                  className="h-2.5 bg-white/10" 
                />
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-white">
                      {metricInfo[metricType as keyof typeof metricInfo]?.format(trendData[trendData.length - 1]?.[metricType as keyof typeof trendData[0]] || 0)}
                    </span>
                    <span className="text-xs text-white/60">
                      current
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    {changes[metricType as keyof typeof changes] > 0 ? (
                      <ChevronUp className="h-4 w-4 text-emerald-500" />
                    ) : changes[metricType as keyof typeof changes] < 0 ? (
                      <ChevronDown className="h-4 w-4 text-finance-red" />
                    ) : null}
                    <span className={`text-xs ${
                      changes[metricType as keyof typeof changes] > 0 ? 'text-emerald-500' : 
                      changes[metricType as keyof typeof changes] < 0 ? 'text-finance-red' : 
                      'text-white/60'
                    }`}>
                      {metricInfo[metricType as keyof typeof metricInfo]?.changeFormat(changes[metricType as keyof typeof changes])}
                      {' vs last month'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="h-80 bg-gray-900/60 border border-white/10 rounded-lg p-4">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      />
                      <YAxis 
                        tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'rgba(22,22,22,0.9)', 
                          borderColor: 'rgba(255,255,255,0.1)',
                          color: 'white'
                        }}
                        formatter={(value) => [
                          metricInfo[metricType as keyof typeof metricInfo]?.format(value as number),
                          metricInfo[metricType as keyof typeof metricInfo]?.title
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={metricType} 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        dot={{ fill: '#ef4444', strokeWidth: 2 }} 
                        activeDot={{ r: 6, fill: '#ef4444' }}
                      />
                      <ReferenceLine 
                        y={goals[metricType as keyof typeof goals]} 
                        stroke="rgba(255,255,255,0.3)" 
                        strokeDasharray="3 3" 
                        label={{ 
                          value: 'Goal', 
                          position: 'right', 
                          fill: 'rgba(255,255,255,0.7)',
                          fontSize: 12
                        }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50">
                    Not enough data to display trends
                  </div>
                )}
              </div>
            </Tabs>
          </>
        )}

        <GoalEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentGoals={goals}
          suggestedGoals={suggestedGoals}
          hasCustomGoals={hasCustomGoals}
          onSave={handleSaveGoals}
          onReset={handleResetGoals}
          isSaving={isSaving}
          canCustomize={canCustomize}
        />
      </CardContent>
    </Card>
  );
};

export default GoalTrackingComponent;
