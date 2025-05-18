
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

const MyPerformance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
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
              <PersonalPerformanceCard />
              <RepPerformanceComparison />
            </div>
            <ActivityImpactAnalysis />
          </TabsContent>
          
          <TabsContent value="accounts">
            <AccountHealthSection />
          </TabsContent>
          
          <TabsContent value="goals">
            <GoalTrackingComponent />
          </TabsContent>
          
          <TabsContent value="insights">
            <PersonalizedInsights />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MyPerformance;
