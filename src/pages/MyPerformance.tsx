import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PersonalPerformanceCard from '@/components/my-performance/PersonalPerformanceCard';
import AccountHealthSection from '@/components/my-performance/AccountHealthSection';
import ActivityImpactAnalysis from '@/components/my-performance/ActivityImpactAnalysis';
import PersonalizedInsights from '@/components/my-performance/PersonalizedInsights';
import GoalTrackingComponent from '@/components/my-performance/GoalTrackingComponent';

interface MyPerformanceProps {
  selectedUserId?: string | null;
  selectedUserName?: string;
}

const MyPerformance: React.FC<MyPerformanceProps> = ({ 
  selectedUserId: propSelectedUserId, 
  selectedUserName: propSelectedUserName 
}) => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('May');
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [accountHealthData, setAccountHealthData] = useState<any[]>([]);
  const [visitData, setVisitData] = useState<any[]>([]);
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDisplayName, setSelectedUserDisplayName] = useState<string>('My Data');
  const [userFirstName, setUserFirstName] = useState<string>('');
  const isMobile = useIsMobile();
  
  // Initialize with props if provided, otherwise use the current user
  useEffect(() => {
    if (propSelectedUserId) {
      setSelectedUserId(propSelectedUserId);
      setSelectedUserDisplayName(propSelectedUserName || "My Data");
      
      // Extract first name if we have a full name
      if (propSelectedUserName) {
        const firstName = propSelectedUserName.split(' ')[0];
        setUserFirstName(firstName);
      }
    } else if (user && !selectedUserId) {
      setSelectedUserId(user.id);
      
      // Try to get user's name from profile
      const fetchUserProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();
          
        if (data?.first_name) {
          setUserFirstName(data.first_name);
        }
      };
      
      fetchUserProfile();
    }
  }, [user, propSelectedUserId, propSelectedUserName]);
  
  // Fetch all the data when user changes
  useEffect(() => {
    if (user && selectedUserId) {
      fetchAllData();
    }
  }, [user, selectedMonth, selectedUserId]);
  
  const handleSelectUser = (userId: string | null, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserDisplayName(displayName);
    
    // Extract first name from display name
    const firstName = displayName.split(' ')[0];
    setUserFirstName(firstName);
    
    setIsLoading(true);
  };
  
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
      console.log('Fetching performance data for user:', selectedUserId);
      
      // If we're viewing "All Data", we need to handle this differently
      if (selectedUserId === "all") {
        console.log('Fetching all data for admin view');
        
        // Determine the table names based on selected month and previous month
        let currentTable;
        let previousTable;
        switch (selectedMonth) {
          case 'May':
            currentTable = 'May_Data';
            previousTable = 'Prior_Month_Rolling'; // Updated: Using Prior_Month_Rolling for April data
            break;
          case 'April':
            currentTable = 'mtd_daily';
            previousTable = 'sales_data'; // March data
            break;
          case 'March':
            currentTable = 'sales_data';
            previousTable = 'sales_data_februrary'; // February data
            break;
          default:
            currentTable = 'sales_data_februrary';
            previousTable = null; // No previous data for February
        }
        
        // Get current month data
        const { data: currentData, error: currentError } = await supabase
          .from(currentTable)
          .select('*');
        
        if (currentError) throw currentError;
        
        // Calculate current month metrics
        const profitColumn = currentTable === 'sales_data' ? 'profit' : 'Profit';
        const spendColumn = currentTable === 'sales_data' ? 'spend' : 'Spend';
        const currentPerformance = calculatePerformanceMetrics(currentData || [], profitColumn, spendColumn);
        
        // Get previous month data if available
        let previousPerformance = null;
        if (previousTable) {
          const { data: previousData, error: previousError } = await supabase
            .from(previousTable)
            .select('*');
            
          if (!previousError && previousData) {
            const prevProfitColumn = previousTable === 'sales_data' ? 'profit' : 'Profit';
            const prevSpendColumn = previousTable === 'sales_data' ? 'spend' : 'Spend';
            previousPerformance = calculatePerformanceMetrics(previousData, prevProfitColumn, prevSpendColumn);
          }
        }
        
        // Set performance data with previous month comparison
        setPerformanceData({
          ...currentPerformance,
          previousMonthData: previousPerformance
        });
        return;
      }
      
      // Get the user's profile information
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', selectedUserId)
        .single();
      
      // Get the user's email to help with matching records
      let userEmail = '';
      if (selectedUserId === user?.id) {
        userEmail = user.email || '';
      } else {
        // For other users, try to construct a likely email from their profile data
        // This is just a fallback and may not be accurate
        const domain = user?.email ? user.email.split('@')[1] : 'avergenerics.co.uk';
        userEmail = `${selectedUserId.split('-')[0]}@${domain}`;
      }
      
      // Extract username from email
      let userName = '';
      if (userEmail) {
        userName = userEmail.split('@')[0];
        // Capitalize first letter for matching with rep names
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      
      const fullName = profileData ? 
        `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
        '';
      
      console.log('Matching with names:', { userName, fullName });
      
      // Determine table names based on selected month and previous month
      let currentTable;
      let previousTable;
      switch (selectedMonth) {
        case 'May':
          currentTable = 'May_Data';
          previousTable = 'Prior_Month_Rolling'; // Updated: Using Prior_Month_Rolling for April data
          break;
        case 'April':
          currentTable = 'mtd_daily';
          previousTable = 'sales_data'; // March data
          break;
        case 'March':
          currentTable = 'sales_data';
          previousTable = 'sales_data_februrary'; // February data
          break;
        default:
          currentTable = 'sales_data_februrary';
          previousTable = null; // No previous data for February
      }
      
      // Determine column names based on table structure
      const currentRepColumn = currentTable === 'sales_data' ? 'rep_name' : 'Rep';
      const currentSubRepColumn = currentTable === 'sales_data' ? 'sub_rep' : 'Sub-Rep';
      const currentProfitColumn = currentTable === 'sales_data' ? 'profit' : 'Profit';
      const currentSpendColumn = currentTable === 'sales_data' ? 'spend' : 'Spend';
      
      // Use fullName or userName for matching, prioritizing fullName
      const matchName = fullName || userName;
      
      // Get current month data
      let currentQuery;
      if (currentTable === 'May_Data' || currentTable === 'mtd_daily' || currentTable === 'sales_data_februrary') {
        currentQuery = supabase
          .from(currentTable)
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      } else {
        currentQuery = supabase
          .from(currentTable)
          .select('*')
          .or(`rep_name.ilike.%${matchName}%,sub_rep.ilike.%${matchName}%`);
      }
      
      const { data: currentData, error: currentError } = await currentQuery;
      
      if (currentError) throw currentError;
      
      // Calculate current month metrics
      const currentPerformance = calculatePerformanceMetrics(
        currentData || [], 
        currentProfitColumn, 
        currentSpendColumn
      );
      
      // Get previous month data if available
      let previousPerformance = null;
      if (previousTable) {
        const previousRepColumn = previousTable === 'sales_data' ? 'rep_name' : 'Rep';
        const previousSubRepColumn = previousTable === 'sales_data' ? 'sub_rep' : 'Sub-Rep';
        const previousProfitColumn = previousTable === 'sales_data' ? 'profit' : 'Profit';
        const previousSpendColumn = previousTable === 'sales_data' ? 'spend' : 'Spend';
        
        let previousQuery;
        if (previousTable === 'May_Data' || previousTable === 'mtd_daily' || previousTable === 'sales_data_februrary' || previousTable === 'Prior_Month_Rolling') {
          previousQuery = supabase
            .from(previousTable)
            .select('*')
            .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
        } else {
          previousQuery = supabase
            .from(previousTable)
            .select('*')
            .or(`rep_name.ilike.%${matchName}%,sub_rep.ilike.%${matchName}%`);
        }
        
        const { data: previousData, error: previousError } = await previousQuery;
        
        if (!previousError && previousData && previousData.length > 0) {
          previousPerformance = calculatePerformanceMetrics(
            previousData, 
            previousProfitColumn, 
            previousSpendColumn
          );
        }
      }
      
      // Set performance data with previous month comparison
      setPerformanceData({
        ...currentPerformance,
        previousMonthData: previousPerformance
      });
      
    } catch (error) {
      console.error("Error fetching personal performance data:", error);
    }
  };
  
  const fetchAccountHealthData = async () => {
    // Similar to personal performance data but focused on account trends
    try {
      // Get the current and previous month data for comparison
      // This is simplified for now - actual implementation would compare current and previous month
      
      // If viewing all data
      if (selectedUserId === "all") {
        let currentQuery;
        if (selectedMonth === 'May') {
          currentQuery = supabase
            .from('May_Data')
            .select('*');
        } else {
          currentQuery = supabase
            .from('mtd_daily')
            .select('*');
        }
        
        const { data: currentData } = await currentQuery;
        
        // Get previous month data
        let previousQuery;
        if (selectedMonth === 'May') {
          previousQuery = supabase
            .from('Prior_Month_Rolling')
            .select('*');
        } else {
          previousQuery = supabase
            .from('sales_data')
            .select('*');
        }
        
        const { data: previousData } = await previousQuery;
        
        // Calculate account health by comparing current and previous data
        const accountHealth = calculateAccountHealth(currentData || [], previousData || []);
        setAccountHealthData(accountHealth);
        return;
      }
      
      // Get user name for matching
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', selectedUserId)
        .single();
      
      // Extract username from email or ID
      let userName = '';
      if (selectedUserId === user?.id && user?.email) {
        userName = user.email.split('@')[0];
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      } else {
        userName = selectedUserId.split('-')[0]; // Use part of the ID as fallback
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      
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
      // For "all" data, get visits from everyone
      if (selectedUserId === "all") {
        const { data, error } = await supabase
          .from('customer_visits')
          .select('*');
          
        if (error) throw error;
        
        console.log(`Found ${data?.length || 0} visit records for all users`);
        setVisitData(data || []);
        return;
      }
      
      // Otherwise get visits for the selected user
      if (selectedUserId) {
        const { data, error } = await supabase
          .from('customer_visits')
          .select('*')
          .eq('user_id', selectedUserId);
          
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
  
  // Get the subtitle description based on user type
  const getSubtitle = () => {
    if (selectedUserId === "all") {
      return "Aggregated view of all performance metrics, account health, and team insights.";
    } else {
      return "Track key metrics, account health, and get personalized insights based on performance data.";
    }
  };
  
  // Get the title display name
  const getTitleName = () => {
    if (selectedUserId === user?.id || !selectedUserId) {
      return "My";
    } else if (selectedUserId === "all") {
      return "All";
    } else {
      return userFirstName ? `${userFirstName}'s` : `${selectedUserDisplayName}'s`;
    }
  };
  
  // Render the page directly without the redundant AppLayout wrapper
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-700 to-finance-red">
            {getTitleName()}
          </span>{' '}
          Performance Dashboard
        </h1>
        <p className="text-white/60">
          {getSubtitle()}
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
  );
};

export default MyPerformance;
