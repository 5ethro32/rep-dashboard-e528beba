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
import { toast } from '@/components/ui/use-toast';

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
  const [compareMonth, setCompareMonth] = useState<string>('April');
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
  
  // Handle changes in selectedMonth or compareMonth
  useEffect(() => {
    if (user && selectedUserId) {
      fetchAllData();
    }
  }, [user, selectedMonth, compareMonth, selectedUserId]);
  
  // No need to sync accountHealthMonth since we're using selectedMonth directly
  
  const handleSelectUser = (userId: string | null, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserDisplayName(displayName);
    
    // Extract first name from display name
    const firstName = displayName.split(' ')[0];
    setUserFirstName(firstName);
    
    setIsLoading(true);
  };
  
  // Update both the account health month and the main selected month
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setIsLoading(true);
    
    // Automatically adjust compare month if needed
    if (month === compareMonth) {
      // If the new selected month is the same as the compare month,
      // set compare month to the previous month or Prior MTD for May
      if (month === 'May') {
        setCompareMonth('Prior MTD');
      } else if (month === 'April') {
        setCompareMonth('March');
      } else if (month === 'March') {
        setCompareMonth('February');
      } else {
        setCompareMonth('March'); // Default fallback if February is selected
      }
    }
  };
  
  // Update the comparison month
  const handleCompareMonthChange = (month: string) => {
    setCompareMonth(month);
    setIsLoading(true);
  };
  
  // Make sure account health section uses the main month/compare settings
  const handleAccountHealthMonthChange = (month: string) => {
    handleMonthChange(month);
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
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPersonalPerformanceData = async () => {
    try {
      console.log('Fetching performance data for user:', selectedUserId, 'Month:', selectedMonth, 'Compare with:', compareMonth);
      
      // Get the current month table name and column structure
      const { currentTable, currentColumns } = getTableInfoForMonth(selectedMonth);
      
      // Get the comparison month table name and column structure
      const { currentTable: compareTable, currentColumns: compareColumns } = getTableInfoForMonth(compareMonth);
      
      console.log(`Using tables: ${currentTable} vs ${compareTable}`);
      
      // If we're viewing "All Data", fetch aggregate data
      if (selectedUserId === "all") {
        console.log('Fetching all data for admin view');
        
        // Get current month data - use type assertion for table name
        const { data: currentData, error: currentError } = await supabase
          .from(currentTable as any)
          .select('*');
        
        if (currentError) throw currentError;
        
        // Calculate current month metrics
        const currentPerformance = calculatePerformanceMetrics(
          currentData || [], 
          currentColumns.profit, 
          currentColumns.spend
        );
        
        // Get previous month data if available
        let previousPerformance = null;
        if (compareTable) {
          const { data: previousData, error: previousError } = await supabase
            .from(compareTable as any)
            .select('*');
            
          if (!previousError && previousData) {
            previousPerformance = calculatePerformanceMetrics(
              previousData, 
              compareColumns.profit, 
              compareColumns.spend
            );
          }
        }
        
        // Set performance data with previous month comparison
        setPerformanceData({
          ...currentPerformance,
          previousMonthData: previousPerformance
        });
        return;
      }
      
      // For specific users, fetch their data
      // Get the user's profile information and potential match criteria
      const matchName = await getUserMatchName(selectedUserId);
      
      // Get current month data for this user
      const { data: currentData, error: currentError } = await fetchUserDataFromTable(
        currentTable, 
        matchName,
        currentColumns.repName,
        currentColumns.subRep
      );
      
      if (currentError) throw currentError;
      
      // Calculate current month metrics
      const currentPerformance = calculatePerformanceMetrics(
        currentData || [], 
        currentColumns.profit, 
        currentColumns.spend
      );
      
      // Get previous month data if available
      let previousPerformance = null;
      if (compareTable) {
        const { data: previousData, error: previousError } = await fetchUserDataFromTable(
          compareTable, 
          matchName,
          compareColumns.repName,
          compareColumns.subRep
        );
        
        if (!previousError && previousData && previousData.length > 0) {
          previousPerformance = calculatePerformanceMetrics(
            previousData, 
            compareColumns.profit, 
            compareColumns.spend
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
      throw error;
    }
  };
  
  const fetchAccountHealthData = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching account health data for month: ${selectedMonth}, compare with: ${compareMonth}`);
      
      // Get the current month and comparison month table info
      const { currentTable, currentColumns } = getTableInfoForMonth(selectedMonth);
      const { currentTable: compareTable, currentColumns: compareColumns } = getTableInfoForMonth(compareMonth);
      
      // If viewing all data
      if (selectedUserId === "all") {
        // Fetch current month data - use type assertion for table name
        const { data: currentData, error: currentError } = await supabase
          .from(currentTable as any)
          .select('*');
        if (currentError) throw currentError;
        
        // Fetch comparison month data - use type assertion for table name
        const { data: compareData, error: compareError } = await supabase
          .from(compareTable as any)
          .select('*');
        if (compareError) throw compareError;
        
        // Calculate account health by comparing current and comparison data
        const accountHealth = calculateAccountHealth(
          currentData || [], 
          compareData || [],
          currentColumns,
          compareColumns
        );
        setAccountHealthData(accountHealth);
        return;
      }
      
      // For specific users, fetch their data
      const matchName = await getUserMatchName(selectedUserId);
      
      // Get current month data
      const { data: currentData, error: currentError } = await fetchUserDataFromTable(
        currentTable, 
        matchName,
        currentColumns.repName,
        currentColumns.subRep
      );
      if (currentError) throw currentError;
      
      // Get comparison month data
      const { data: compareData, error: compareError } = await fetchUserDataFromTable(
        compareTable, 
        matchName,
        compareColumns.repName,
        compareColumns.subRep
      );
      if (compareError) throw compareError;
      
      // Calculate account health by comparing current and comparison data
      const accountHealth = calculateAccountHealth(
        currentData || [], 
        compareData || [],
        currentColumns,
        compareColumns
      );
      setAccountHealthData(accountHealth);
      
    } catch (error) {
      console.error("Error fetching account health data:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get table info for a given month
  const getTableInfoForMonth = (month: string) => {
    let currentTable: string;
    let currentColumns = {
      repName: '',
      subRep: '',
      profit: '',
      spend: '',
      accountRef: '',
      accountName: '',
      dept: ''
    };
    
    switch (month) {
      case 'May':
        currentTable = 'May_Data';
        currentColumns = {
          repName: 'Rep',
          subRep: 'Sub-Rep',
          profit: 'Profit',
          spend: 'Spend',
          accountRef: 'Account Ref',
          accountName: 'Account Name',
          dept: 'Department'
        };
        break;
      case 'Prior MTD':
        currentTable = 'Prior_Month_Rolling';
        currentColumns = {
          repName: 'Rep',
          subRep: 'Sub-Rep',
          profit: 'Profit',
          spend: 'Spend',
          accountRef: 'Account Ref',
          accountName: 'Account Name',
          dept: 'Department'
        };
        break;
      case 'April':
        currentTable = 'mtd_daily';
        currentColumns = {
          repName: 'Rep',
          subRep: 'Sub-Rep',
          profit: 'Profit',
          spend: 'Spend',
          accountRef: 'Account Ref',
          accountName: 'Account Name',
          dept: 'Department'
        };
        break;
      case 'March':
        currentTable = 'sales_data';
        currentColumns = {
          repName: 'rep_name',
          subRep: 'sub_rep',
          profit: 'profit',
          spend: 'spend',
          accountRef: 'account_ref',
          accountName: 'account_name',
          dept: 'rep_type'
        };
        break;
      default: // February
        currentTable = 'sales_data_februrary';
        currentColumns = {
          repName: 'Rep',
          subRep: 'Sub-Rep',
          profit: 'Profit',
          spend: 'Spend',
          accountRef: 'Account Ref',
          accountName: 'Account Name',
          dept: 'Department'
        };
    }
    
    return { currentTable, currentColumns };
  };
  
  // Helper function to get user match name
  const getUserMatchName = async (userId: string | null): Promise<string> => {
    if (!userId || userId === "all") {
      return '';
    }
    
    // Get user's profile information
    const { data: profileData } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();
    
    // Get the user's email to help with matching records
    let userEmail = '';
    if (userId === user?.id) {
      userEmail = user.email || '';
    } else {
      // For other users, try to construct a likely email from their profile data
      const domain = user?.email ? user.email.split('@')[1] : 'avergenerics.co.uk';
      userEmail = `${userId.split('-')[0]}@${domain}`;
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
    
    // Use fullName or userName for matching, prioritizing fullName
    return fullName || userName;
  };
  
  // Helper function to fetch user-specific data from a table
  const fetchUserDataFromTable = async (tableName: string, matchName: string, repNameColumn: string, subRepColumn: string) => {
    try {
      // We need to handle table names in a type-safe way for Supabase
      // This approach uses type assertions since we know the table names are valid
      
      // For tables using snake_case column naming
      if (tableName === 'sales_data') {
        return await supabase
          .from('sales_data')
          .select('*')
          .or(`${repNameColumn}.ilike.%${matchName}%,${subRepColumn}.ilike.%${matchName}%`);
      } 
      // For other tables with specific names
      else if (tableName === 'May_Data') {
        return await supabase
          .from('May_Data')
          .select('*')
          .or(`"${repNameColumn}".ilike.%${matchName}%,"${subRepColumn}".ilike.%${matchName}%`);
      }
      else if (tableName === 'mtd_daily') {
        return await supabase
          .from('mtd_daily')
          .select('*')
          .or(`"${repNameColumn}".ilike.%${matchName}%,"${subRepColumn}".ilike.%${matchName}%`);
      }
      else if (tableName === 'Prior_Month_Rolling') {
        return await supabase
          .from('Prior_Month_Rolling')
          .select('*')
          .or(`"${repNameColumn}".ilike.%${matchName}%,"${subRepColumn}".ilike.%${matchName}%`);
      }
      else if (tableName === 'sales_data_februrary') {
        return await supabase
          .from('sales_data_februrary')
          .select('*')
          .or(`"${repNameColumn}".ilike.%${matchName}%,"${subRepColumn}".ilike.%${matchName}%`);
      }
      // Fallback that should not be reached - we'll throw an error
      else {
        throw new Error(`Unsupported table name: ${tableName}`);
      }
    } catch (error) {
      console.error(`Error fetching user data from ${tableName}:`, error);
      throw error;
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
        setVisitData(data || []);
      }
    } catch (error) {
      console.error("Error fetching visit data:", error);
      throw error;
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
      const profit = typeof item[profitColumn] === 'number' ? item[profitColumn] : 
                     typeof item[profitColumn] === 'string' ? parseFloat(item[profitColumn]) : 0;
      
      const spend = typeof item[spendColumn] === 'number' ? item[spendColumn] : 
                    typeof item[spendColumn] === 'string' ? parseFloat(item[spendColumn]) : 0;
                    
      // Handle different account reference column names
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
  
  const calculateAccountHealth = (
    currentData: any[], 
    previousData: any[],
    currentColumns: any,
    previousColumns: any
  ) => {
    // Maps for current and previous month data
    const currentAccounts = new Map();
    const previousAccounts = new Map();
    
    // Process current month data
    currentData.forEach(item => {
      const accountRef = item[currentColumns.accountRef] || '';
      const accountName = item[currentColumns.accountName] || '';
      
      const profit = typeof item[currentColumns.profit] === 'number' ? item[currentColumns.profit] : 
                     typeof item[currentColumns.profit] === 'string' ? parseFloat(item[currentColumns.profit]) : 0;
                     
      const spend = typeof item[currentColumns.spend] === 'number' ? item[currentColumns.spend] : 
                    typeof item[currentColumns.spend] === 'string' ? parseFloat(item[currentColumns.spend]) : 0;
                    
      // Get the rep name 
      const repName = item[currentColumns.repName] || '';
      
      if (accountRef) {
        currentAccounts.set(accountRef, {
          name: accountName,
          profit,
          spend,
          repName,
          margin: spend > 0 ? (profit / spend) * 100 : 0
        });
      }
    });
    
    // Process previous month data
    previousData.forEach(item => {
      const accountRef = item[previousColumns.accountRef] || '';
      
      const profit = typeof item[previousColumns.profit] === 'number' ? item[previousColumns.profit] : 
                     typeof item[previousColumns.profit] === 'string' ? parseFloat(item[previousColumns.profit]) : 0;
                     
      const spend = typeof item[previousColumns.spend] === 'number' ? item[previousColumns.spend] : 
                    typeof item[previousColumns.spend] === 'string' ? parseFloat(item[previousColumns.spend]) : 0;
                    
      // Get the rep name from previous data
      const prevRepName = item[previousColumns.repName] || '';
      
      if (accountRef) {
        previousAccounts.set(accountRef, {
          profit,
          spend,
          repName: prevRepName,
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
      
      // Use rep name from current data, fallback to previous data if needed
      const repName = currentData.repName || (previousData ? previousData.repName : '');
      
      healthScores.push({
        accountRef,
        accountName: currentData.name,
        repName,
        profit: currentData.profit,
        spend: currentData.spend,
        margin: currentData.margin,
        profitChange,
        profitChangePercent,
        spendChange,
        spendChangePercent,
        marginChange,
        healthScore,
        status,
        previousProfit: previousData ? previousData.profit : 0,
        previousSpend: previousData ? previousData.spend : 0,
        previousMargin: previousData ? previousData.margin : 0
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
  
  const getCompareMonthDisplay = () => {
    return compareMonth === 'Prior MTD' ? 'Prior MTD' : `${compareMonth} 2025`;
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
            setSelectedMonth={handleMonthChange}
            compareMonth={compareMonth}
            setCompareMonth={handleCompareMonthChange}
            showCompareSelector={true}
            hideTitle={true}
            onRefresh={handleRefresh}
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
            onMonthChange={handleMonthChange}
            onCompareMonthChange={handleCompareMonthChange}
            selectedMonth={selectedMonth}
            compareMonth={compareMonth}
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
            selectedUserId={selectedUserId}
            selectedUserDisplayName={selectedUserDisplayName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyPerformance;
