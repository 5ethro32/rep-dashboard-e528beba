import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, RefreshCw, TrendingDown, TrendingUp, Users, Award, Star } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import { Skeleton } from '@/components/ui/skeleton';
import PersonalPerformanceCard from '@/components/my-performance/PersonalPerformanceCard';
import AccountHealthSection from '@/components/my-performance/AccountHealthSection';
import ActivityImpactAnalysis from '@/components/my-performance/ActivityImpactAnalysis';
import PersonalizedInsights from '@/components/my-performance/PersonalizedInsights';
import GoalTrackingComponent from '@/components/my-performance/GoalTrackingComponent';

const MyPerformance = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('May');
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [accountHealthData, setAccountHealthData] = useState<any[]>([]);
  const [visitData, setVisitData] = useState<any[]>([]);
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const isMobile = useIsMobile();
  
  // Fetch all the data the user needs
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, selectedMonth]);
  
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch personal performance data
      await Promise.all([
        fetchPersonalPerformanceData(),
        fetchAccountHealthData(),
        fetchVisitData()
      ]);
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPersonalPerformanceData = async () => {
    try {
      console.log('Fetching personal performance data for user:', user?.id);
      
      // Get the email username to match with rep data
      let userName = '';
      if (user?.email) {
        userName = user.email.split('@')[0];
        // Capitalize first letter for matching with rep names
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      
      // We also try to get the profile info for a more accurate match
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();
      
      const fullName = profileData ? 
        `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
        '';
      
      console.log('Matching with names:', { userName, fullName });
      
      // Get the appropriate table based on selected month
      let tableName;
      switch (selectedMonth) {
        case 'May':
          tableName = 'May_Data';
          break;
        case 'April':
          tableName = 'mtd_daily';
          break;
        case 'March':
          tableName = 'sales_data';
          break;
        default:
          tableName = 'sales_data_februrary';
      }
      
      // Determine column names based on table structure
      const repColumn = tableName === 'sales_data' ? 'rep_name' : 'Rep';
      const subRepColumn = tableName === 'sales_data' ? 'sub_rep' : 'Sub-Rep';
      const profitColumn = tableName === 'sales_data' ? 'profit' : 'Profit';
      const spendColumn = tableName === 'sales_data' ? 'spend' : 'Spend';
      
      // Query the data where user matches as rep or sub-rep
      // We use fullName if available, otherwise userName for matching
      const matchName = fullName || userName;
      
      let query;
      
      if (tableName === 'May_Data') {
        query = supabase
          .from('May_Data')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      } else if (tableName === 'mtd_daily') {
        query = supabase
          .from('mtd_daily')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      } else if (tableName === 'sales_data') {
        query = supabase
          .from('sales_data')
          .select('*')
          .or(`rep_name.ilike.%${matchName}%,sub_rep.ilike.%${matchName}%`);
      } else {
        query = supabase
          .from('sales_data_februrary')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log(`Found ${data?.length || 0} records for ${matchName} in ${tableName}`);
      
      // Calculate summary metrics for the user
      const performance = calculatePerformanceMetrics(data || [], profitColumn, spendColumn);
      setPerformanceData(performance);
    } catch (error) {
      console.error("Error fetching personal performance data:", error);
    }
  };
  
  const fetchAccountHealthData = async () => {
    // Similar to personal performance data but focused on account trends
    try {
      // Get the current and previous month data for comparison
      // This is simplified for now - actual implementation would compare current and previous month
      
      // Get user name for matching
      let userName = '';
      if (user?.email) {
        userName = user.email.split('@')[0];
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();
      
      const fullName = profileData ? 
        `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
        '';
      
      const matchName = fullName || userName;
      
      // Get current month data
      let currentQuery;
      if (selectedMonth === 'May') {
        currentQuery = supabase
          .from('May_Data')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      } else {
        currentQuery = supabase
          .from('mtd_daily')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      }
      
      const { data: currentData } = await currentQuery;
      
      // Get previous month data
      let previousQuery;
      if (selectedMonth === 'May') {
        previousQuery = supabase
          .from('Prior_Month_Rolling')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      } else {
        previousQuery = supabase
          .from('sales_data')
          .select('*')
          .or(`rep_name.ilike.%${matchName}%,sub_rep.ilike.%${matchName}%`);
      }
      
      const { data: previousData } = await previousQuery;
      
      // Calculate account health by comparing current and previous data
      const accountHealth = calculateAccountHealth(currentData || [], previousData || []);
      setAccountHealthData(accountHealth);
      
    } catch (error) {
      console.error("Error fetching account health data:", error);
    }
  };
  
  const fetchVisitData = async () => {
    // Fetch customer visits data to analyze impact
    try {
      if (user?.id) {
        const { data, error } = await supabase
          .from('customer_visits')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        console.log(`Found ${data?.length || 0} visit records for user`);
        setVisitData(data || []);
      }
    } catch (error) {
      console.error("Error fetching visit data:", error);
    }
  };
  
  // Helper functions to calculate metrics
  const calculatePerformanceMetrics = (data: any[], profitColumn: string, spendColumn: string) => {
    if (!data || data.length === 0) return {
      totalProfit: 0,
      totalSpend: 0,
      margin: 0,
      totalAccounts: 0,
      activeAccounts: 0
    };
    
    const accountSet = new Set();
    const activeAccountSet = new Set();
    
    let totalProfit = 0;
    let totalSpend = 0;
    
    data.forEach(item => {
      // Handle different column naming conventions
      const profit = typeof item[profitColumn] === 'number' ? item[profitColumn] : 0;
      const spend = typeof item[spendColumn] === 'number' ? item[spendColumn] : 0;
      const accountRef = item['Account Ref'] || item.account_ref;
      
      totalProfit += profit;
      totalSpend += spend;
      
      if (accountRef) {
        accountSet.add(accountRef);
        if (spend > 0) {
          activeAccountSet.add(accountRef);
        }
      }
    });
    
    return {
      totalProfit,
      totalSpend,
      margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
      totalAccounts: accountSet.size,
      activeAccounts: activeAccountSet.size
    };
  };
  
  const calculateAccountHealth = (currentData: any[], previousData: any[]) => {
    // Maps for current and previous month data
    const currentAccounts = new Map();
    const previousAccounts = new Map();
    
    // Process current month data
    currentData.forEach(item => {
      const accountRef = item['Account Ref'] || '';
      const accountName = item['Account Name'] || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 0;
      const spend = typeof item.Spend === 'number' ? item.Spend : 0;
      
      if (accountRef) {
        currentAccounts.set(accountRef, {
          name: accountName,
          profit,
          spend,
          margin: spend > 0 ? (profit / spend) * 100 : 0
        });
      }
    });
    
    // Process previous month data
    previousData.forEach(item => {
      const accountRef = item['Account Ref'] || item.account_ref || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                     typeof item.profit === 'number' ? item.profit : 0;
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                    typeof item.spend === 'number' ? item.spend : 0;
      
      if (accountRef) {
        previousAccounts.set(accountRef, {
          profit,
          spend,
          margin: spend > 0 ? (profit / spend) * 100 : 0
        });
      }
    });
    
    // Analyze each account's health
    const healthScores = [];
    
    currentAccounts.forEach((currentData, accountRef) => {
      const previousData = previousAccounts.get(accountRef);
      
      // Calculate metrics
      const profitChange = previousData ? currentData.profit - previousData.profit : 0;
      const profitChangePercent = previousData && previousData.profit !== 0 ? 
        (profitChange / previousData.profit) * 100 : 0;
      
      const spendChange = previousData ? currentData.spend - previousData.spend : 0;
      const spendChangePercent = previousData && previousData.spend !== 0 ?
        (spendChange / previousData.spend) * 100 : 0;
        
      const marginChange = previousData ? currentData.margin - previousData.margin : 0;
      
      // Calculate health score: simplified version for demo
      // A real implementation would have a more sophisticated algorithm
      let healthScore = 0;
      if (profitChangePercent > 10) healthScore += 2;
      else if (profitChangePercent > 0) healthScore += 1;
      else if (profitChangePercent < -10) healthScore -= 2;
      else if (profitChangePercent < 0) healthScore -= 1;
      
      if (marginChange > 5) healthScore += 2;
      else if (marginChange > 0) healthScore += 1;
      else if (marginChange < -5) healthScore -= 2;
      else if (marginChange < 0) healthScore -= 1;
      
      if (spendChangePercent > 10) healthScore += 1;
      
      const status = healthScore > 2 ? 'improving' : 
                     healthScore < -1 ? 'declining' : 'stable';
      
      healthScores.push({
        accountRef,
        accountName: currentData.name,
        profit: currentData.profit,
        spend: currentData.spend,
        margin: currentData.margin,
        profitChange,
        profitChangePercent,
        spendChange,
        spendChangePercent,
        marginChange,
        healthScore,
        status
      });
    });
    
    return healthScores.sort((a, b) => b.healthScore - a.healthScore);
  };
  
  const handleRefresh = async () => {
    await fetchAllData();
    setAutoRefreshed(true);
    setTimeout(() => setAutoRefreshed(false), 3000);
  };
  
  // Render the page
  return (
    <AppLayout showChatInterface={!isMobile}>
      <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent overflow-x-hidden">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">
              My
            </span>{' '}
            Performance Dashboard
          </h1>
          <p className="text-white/60">
            Track your key metrics, account health, and get personalized insights based on your performance data.
          </p>
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <ActionsHeader 
            onRefresh={handleRefresh}
            isLoading={isLoading}
            autoRefreshed={autoRefreshed}
          />
          
          <div className="flex-shrink-0">
            <PerformanceHeader 
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              hideTitle={true}
            />
          </div>
        </div>

        {/* Personal Performance Overview */}
        <div className="mb-6">
          <PersonalPerformanceCard
            performanceData={performanceData}
            isLoading={isLoading}
          />
        </div>

        {/* Main content tabs */}
        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className={`${isMobile ? 'flex flex-wrap' : 'grid grid-cols-4'} mb-6 md:mb-8 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/5 shadow-lg p-1`}>
            <TabsTrigger value="accounts" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
              Account Health
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
              Activity Impact
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs md:text-sm py-1 md:py-2">
              Goal Tracking
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="accounts" className="mt-0">
            <AccountHealthSection 
              accountHealthData={accountHealthData}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </TabsContent>
          
          <TabsContent value="activity" className="mt-0">
            <ActivityImpactAnalysis
              visitData={visitData}
              accountHealthData={accountHealthData}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="insights" className="mt-0">
            <PersonalizedInsights
              accountHealthData={accountHealthData}
              visitData={visitData}
              performanceData={performanceData}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </TabsContent>
          
          <TabsContent value="goals" className="mt-0">
            <GoalTrackingComponent
              performanceData={performanceData}
              accountHealthData={accountHealthData}
              visitData={visitData}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

// Add in the missing methods
const fetchVisitData = async function() {
  // Fetch customer visits data to analyze impact
  try {
    if (this.user?.id) {
      const { data, error } = await supabase
        .from('customer_visits')
        .select('*')
        .eq('user_id', this.user.id);
        
      if (error) throw error;
      
      console.log(`Found ${data?.length || 0} visit records for user`);
      this.setVisitData(data || []);
    }
  } catch (error) {
    console.error("Error fetching visit data:", error);
  }
};

const calculatePerformanceMetrics = function(data, profitColumn, spendColumn) {
  if (!data || data.length === 0) return {
    totalProfit: 0,
    totalSpend: 0,
    margin: 0,
    totalAccounts: 0,
    activeAccounts: 0
  };
  
  const accountSet = new Set();
  const activeAccountSet = new Set();
  
  let totalProfit = 0;
  let totalSpend = 0;
  
  data.forEach(item => {
    // Handle different column naming conventions
    const profit = typeof item[profitColumn] === 'number' ? item[profitColumn] : 0;
    const spend = typeof item[spendColumn] === 'number' ? item[spendColumn] : 0;
    const accountRef = item['Account Ref'] || item.account_ref;
    
    totalProfit += profit;
    totalSpend += spend;
    
    if (accountRef) {
      accountSet.add(accountRef);
      if (spend > 0) {
        activeAccountSet.add(accountRef);
      }
    }
  });
  
  return {
    totalProfit,
    totalSpend,
    margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
    totalAccounts: accountSet.size,
    activeAccounts: activeAccountSet.size
  };
};

const calculateAccountHealth = function(currentData, previousData) {
  // Maps for current and previous month data
  const currentAccounts = new Map();
  const previousAccounts = new Map();
  
  // Process current month data
  currentData.forEach(item => {
    const accountRef = item['Account Ref'] || '';
    const accountName = item['Account Name'] || '';
    const profit = typeof item.Profit === 'number' ? item.Profit : 0;
    const spend = typeof item.Spend === 'number' ? item.Spend : 0;
    
    if (accountRef) {
      currentAccounts.set(accountRef, {
        name: accountName,
        profit,
        spend,
        margin: spend > 0 ? (profit / spend) * 100 : 0
      });
    }
  });
  
  // Process previous month data
  previousData.forEach(item => {
    const accountRef = item['Account Ref'] || item.account_ref || '';
    const profit = typeof item.Profit === 'number' ? item.Profit : 
                   typeof item.profit === 'number' ? item.profit : 0;
    const spend = typeof item.Spend === 'number' ? item.Spend : 
                  typeof item.spend === 'number' ? item.spend : 0;
    
    if (accountRef) {
      previousAccounts.set(accountRef, {
        profit,
        spend,
        margin: spend > 0 ? (profit / spend) * 100 : 0
      });
    }
  });
  
  // Analyze each account's health
  const healthScores = [];
  
  currentAccounts.forEach((currentData, accountRef) => {
    const previousData = previousAccounts.get(accountRef);
    
    // Calculate metrics
    const profitChange = previousData ? currentData.profit - previousData.profit : 0;
    const profitChangePercent = previousData && previousData.profit !== 0 ? 
      (profitChange / previousData.profit) * 100 : 0;
    
    const spendChange = previousData ? currentData.spend - previousData.spend : 0;
    const spendChangePercent = previousData && previousData.spend !== 0 ?
      (spendChange / previousData.spend) * 100 : 0;
      
    const marginChange = previousData ? currentData.margin - previousData.margin : 0;
    
    // Calculate health score: simplified version for demo
    // A real implementation would have a more sophisticated algorithm
    let healthScore = 0;
    if (profitChangePercent > 10) healthScore += 2;
    else if (profitChangePercent > 0) healthScore += 1;
    else if (profitChangePercent < -10) healthScore -= 2;
    else if (profitChangePercent < 0) healthScore -= 1;
    
    if (marginChange > 5) healthScore += 2;
    else if (marginChange > 0) healthScore += 1;
    else if (marginChange < -5) healthScore -= 2;
    else if (marginChange < 0) healthScore -= 1;
    
    if (spendChangePercent > 10) healthScore += 1;
    
    const status = healthScore > 2 ? 'improving' : 
                   healthScore < -1 ? 'declining' : 'stable';
    
    healthScores.push({
      accountRef,
      accountName: currentData.name,
      profit: currentData.profit,
      spend: currentData.spend,
      margin: currentData.margin,
      profitChange,
      profitChangePercent,
      spendChange,
      spendChangePercent,
      marginChange,
      healthScore,
      status
    });
  });
  
  return healthScores.sort((a, b) => b.healthScore - a.healthScore);
};

MyPerformance.prototype.fetchVisitData = fetchVisitData;

export default MyPerformance;
