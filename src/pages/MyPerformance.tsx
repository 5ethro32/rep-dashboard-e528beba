
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';

import PersonalPerformanceCard from '@/components/my-performance/PersonalPerformanceCard';
import PersonalizedInsights from '@/components/my-performance/PersonalizedInsights';
import GoalTrackingComponent from '@/components/my-performance/GoalTrackingComponent';
import AccountHealthSection from '@/components/my-performance/AccountHealthSection';
import ActivityImpactAnalysis from '@/components/my-performance/ActivityImpactAnalysis';
import RepPerformanceComparison from '@/components/my-performance/RepPerformanceComparison';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import { toast } from '@/components/ui/use-toast';
import AppLayout from '@/components/layout/AppLayout';

const MyPerformance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  // Use this flag to skip first render refresh
  const isFirstRender = useRef(true);

  // Mock data for the components
  const mockPerformanceData = {
    totalProfit: 125000,
    totalSpend: 850000,
    margin: 14.7,
    totalAccounts: 42,
    activeAccounts: 38,
    previousMonthData: {
      totalProfit: 118000,
      totalSpend: 800000,
      margin: 14.2,
      totalAccounts: 40,
      activeAccounts: 35
    }
  };
  
  const mockAccountHealthData = [
    { accountRef: "ACC001", accountName: "Pharmacy Plus", profit: 15000, spend: 120000, profitChangePercent: 5.2, status: "growing" },
    { accountRef: "ACC002", accountName: "MediCare Solutions", profit: 8500, spend: 85000, profitChangePercent: -2.1, status: "declining" },
    { accountRef: "ACC003", accountName: "HealthHub", profit: 12000, spend: 95000, profitChangePercent: 1.8, status: "stable" }
  ];
  
  const mockVisitData = [
    { id: 1, date: "2025-05-10", customer_name: "Pharmacy Plus", customer_ref: "ACC001", profit: 1200, outcome: "Order placed" },
    { id: 2, date: "2025-05-12", customer_name: "MediCare Solutions", customer_ref: "ACC002", profit: 0, outcome: "No order" },
    { id: 3, date: "2025-05-15", customer_name: "HealthHub", customer_ref: "ACC003", profit: 950, outcome: "Order placed" }
  ];
  
  // Create time-series data for the performance comparison chart
  const mockTimeSeriesData = {
    profit: [
      { month: "Jan", value: 105000 },
      { month: "Feb", value: 110000 },
      { month: "Mar", value: 115000 },
      { month: "Apr", value: 120000 },
      { month: "May", value: 125000 }
    ],
    spend: [
      { month: "Jan", value: 750000 },
      { month: "Feb", value: 780000 },
      { month: "Mar", value: 800000 },
      { month: "Apr", value: 820000 },
      { month: "May", value: 850000 }
    ],
    packs: [
      { month: "Jan", value: 4200 },
      { month: "Feb", value: 4300 },
      { month: "Mar", value: 4350 },
      { month: "Apr", value: 4400 },
      { month: "May", value: 4500 }
    ],
    margin: [
      { month: "Jan", value: 14.0 },
      { month: "Feb", value: 14.1 },
      { month: "Mar", value: 14.3 },
      { month: "Apr", value: 14.5 },
      { month: "May", value: 14.7 }
    ]
  };
  
  // Create time-series data for the team average
  const mockAverageTimeSeriesData = {
    profit: [
      { month: "Jan", value: 95000 },
      { month: "Feb", value: 98000 },
      { month: "Mar", value: 100000 },
      { month: "Apr", value: 102000 },
      { month: "May", value: 105000 }
    ],
    spend: [
      { month: "Jan", value: 700000 },
      { month: "Feb", value: 710000 },
      { month: "Mar", value: 720000 },
      { month: "Apr", value: 730000 },
      { month: "May", value: 740000 }
    ],
    packs: [
      { month: "Jan", value: 3900 },
      { month: "Feb", value: 3950 },
      { month: "Mar", value: 4000 },
      { month: "Apr", value: 4050 },
      { month: "May", value: 4100 }
    ],
    margin: [
      { month: "Jan", value: 13.0 },
      { month: "Feb", value: 13.2 },
      { month: "Mar", value: 13.5 },
      { month: "Apr", value: 13.8 },
      { month: "May", value: 14.2 }
    ]
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Data refreshed",
        description: "Your performance data has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "There was a problem refreshing the data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Setup global refresh handler
  useEffect(() => {
    if (location.pathname === '/my-performance') {
      window.myPerformanceRefresh = handleRefresh;
    }
    return () => {
      if (window.myPerformanceRefresh) {
        delete window.myPerformanceRefresh;
      }
    };
  }, [location.pathname]);

  // Skip refresh on first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
  }, []);

  return (
    <AppLayout
      showChatInterface={false}
      selectedUserId={user?.id} 
      showUserSelector={false}
      onRefresh={handleRefresh}
      isLoading={isLoading}
    >
      <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-16">
        {/* Remove the duplicated header section and keep only the ActionsHeader for refresh functionality */}
        <div className="mb-6">
          <ActionsHeader onRefresh={handleRefresh} isLoading={isLoading} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 h-full">
              <CardContent className="p-6">
                <PersonalPerformanceCard 
                  performanceData={mockPerformanceData} 
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 h-full">
              <CardContent className="p-6">
                <PersonalizedInsights 
                  accountHealthData={mockAccountHealthData}
                  visitData={mockVisitData}
                  performanceData={mockPerformanceData}
                  isLoading={isLoading}
                  formatCurrency={formatCurrency}
                  formatPercent={formatPercent}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Tabs defaultValue="goals" className="space-y-4">
          <TabsList className="bg-black/20 border-gray-800">
            <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
            <TabsTrigger value="accounts">Account Health</TabsTrigger>
            <TabsTrigger value="activities">Activity Impact</TabsTrigger>
            <TabsTrigger value="comparison">Team Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="goals">
            <GoalTrackingComponent 
              performanceData={mockPerformanceData}
              accountHealthData={mockAccountHealthData}
              visitData={mockVisitData}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </TabsContent>
          
          <TabsContent value="accounts">
            <AccountHealthSection 
              accountHealthData={mockAccountHealthData}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </TabsContent>
          
          <TabsContent value="activities">
            <ActivityImpactAnalysis 
              visitData={mockVisitData}
              accountHealthData={mockAccountHealthData}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="comparison">
            <RepPerformanceComparison 
              userData={mockTimeSeriesData}
              averageData={mockAverageTimeSeriesData}
              isLoading={isLoading}
              userName="Your"
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

// Add the global window type declaration
declare global {
  interface Window {
    myPerformanceRefresh?: () => Promise<void>;
  }
}

export default MyPerformance;
