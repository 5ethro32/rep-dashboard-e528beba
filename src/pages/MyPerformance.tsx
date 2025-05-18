
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
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
  
  const mockUserData = {
    profit: 125000,
    margin: 14.7,
    activeRatio: 90.5,
    visitConversion: 66.7
  };
  
  const mockAverageData = {
    profit: 105000,
    margin: 13.2,
    activeRatio: 82.5,
    visitConversion: 58.4
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
              userData={mockUserData}
              averageData={mockAverageData}
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
