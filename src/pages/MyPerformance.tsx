
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PersonalPerformanceCard from '@/components/my-performance/PersonalPerformanceCard';
import GoalTrackingComponent from '@/components/my-performance/GoalTrackingComponent';
import AccountHealthSection from '@/components/my-performance/AccountHealthSection';
import ActivityImpactAnalysis from '@/components/my-performance/ActivityImpactAnalysis';
import PersonalizedInsights from '@/components/my-performance/PersonalizedInsights';
import RepPerformanceComparison from '@/components/my-performance/RepPerformanceComparison';
import { formatCurrency, formatPercent } from '@/utils/rep-performance-utils';

const MyPerformance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // Mock data for components
  const [performanceData, setPerformanceData] = useState({
    profit: 125000,
    margin: 18.5,
    visits: 45,
    orders: 32,
    conversionRate: 71.1,
    changeFromLastMonth: 8.3,
    revenueGoalProgress: 85,
    profitGoalProgress: 92,
    visitsGoalProgress: 78
  });
  
  const [accountHealthData, setAccountHealthData] = useState({
    totalAccounts: 38,
    activeAccounts: 28,
    atRiskAccounts: 3,
    growingAccounts: 12,
    stableAccounts: 21,
    decliningAccounts: 5,
    accountsWithNoVisit: 7,
    accountActivity: [
      { week: 'Week 1', visits: 12, orders: 8 },
      { week: 'Week 2', visits: 9, orders: 7 },
      { week: 'Week 3', visits: 15, orders: 10 },
      { week: 'Week 4', visits: 11, orders: 7 },
    ]
  });
  
  const [visitData, setVisitData] = useState({
    totalVisits: 45,
    plannedVisits: 52,
    completionRate: 86.5,
    successfulVisits: 32,
    conversionRate: 71.1,
    avgProfitPerVisit: 3906.25,
    visitTrend: [
      { date: '2023-01-01', visits: 10, value: 35000 },
      { date: '2023-02-01', visits: 12, value: 42000 },
      { date: '2023-03-01', visits: 9, value: 31000 },
      { date: '2023-04-01', visits: 14, value: 47000 },
    ]
  });
  
  const [userData, setUserData] = useState({
    profit: 125000,
    visits: 45,
    orders: 32,
    margin: 18.5
  });
  
  const [teamAverages, setTeamAverages] = useState({
    profit: 98000,
    visits: 38,
    orders: 28,
    margin: 16.8
  });
  
  // Function to handle refresh
  const handleRefresh = async () => {
    console.log('Refreshing My Performance data');
    setLoading(true);
    
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      toast({
        title: "Data refreshed",
        description: "Your performance data has been updated",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "There was a problem refreshing the data",
        variant: "destructive"
      });
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout 
      showChatInterface={true}
      selectedMonth="March" 
      showUserSelector={false}
      onRefresh={handleRefresh}
      isLoading={loading}
    >
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Performance Dashboard</h1>
              <p className="text-white/60">Track your personal performance metrics and goals</p>
            </div>
            <TabsList className="mt-4 md:mt-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PersonalPerformanceCard 
                performanceData={performanceData} 
                isLoading={loading} 
              />
              <RepPerformanceComparison 
                userData={userData} 
                averageData={teamAverages} 
                isLoading={loading} 
                userName="Your"
              />
            </div>
            <ActivityImpactAnalysis 
              visitData={visitData} 
              accountHealthData={accountHealthData} 
              isLoading={loading} 
            />
          </TabsContent>
          
          <TabsContent value="accounts">
            <AccountHealthSection 
              accountHealthData={accountHealthData} 
              isLoading={loading} 
              formatCurrency={formatCurrency} 
              formatPercent={formatPercent} 
            />
          </TabsContent>
          
          <TabsContent value="goals">
            <GoalTrackingComponent 
              performanceData={performanceData} 
              accountHealthData={accountHealthData} 
              visitData={visitData} 
              isLoading={loading} 
              formatCurrency={formatCurrency} 
              formatPercent={formatPercent} 
            />
          </TabsContent>
          
          <TabsContent value="insights">
            <PersonalizedInsights 
              accountHealthData={accountHealthData} 
              visitData={visitData} 
              performanceData={performanceData} 
              isLoading={loading} 
              formatCurrency={formatCurrency} 
              formatPercent={formatPercent} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MyPerformance;
