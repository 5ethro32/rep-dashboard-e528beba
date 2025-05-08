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
  const [compareMonth, setCompareMonth] = useState<string>('April');
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [accountHealthData, setAccountHealthData] = useState<any[]>([]);
  const [visitData, setVisitData] = useState<any[]>([]);
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDisplayName, setSelectedUserDisplayName] = useState<string>('My Data');
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [accountHealthMonth, setAccountHealthMonth] = useState<string>('May');
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
  
  // Sync accountHealthMonth with the main selectedMonth
  useEffect(() => {
    setAccountHealthMonth(selectedMonth);
  }, [selectedMonth]);
  
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
    setAccountHealthMonth(month);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPersonalPerformanceData = async () => {
    try {
      console.log('Fetching performance data for user:', selectedUserId, 'Month:', selectedMonth, 'Compare with:', compareMonth);
      
      // If we're viewing "All Data", we need to handle this differently
      if (selectedUserId === "all") {
        console.log('Fetching all data for admin view');
        
        // Determine the table names based on selected month and previous month
        let currentTable;
        let previousTable;
        
        // Set current table based on selected month
        switch (selectedMonth) {
          case 'May':
            currentTable = 'May_Data';
            break;
          case 'April':
            currentTable = 'mtd_daily';
            break;
          case 'March':
            currentTable = 'sales_data';
            break;
          default: // February
            currentTable = 'sales_data_februrary';
        }
        
        // Set previous table based on compare month selection
        if (compareMonth === 'Prior MTD') {
          previousTable = 'Prior_Month_Rolling';
        } else {
          switch (compareMonth) {
            case 'May':
              previousTable = 'May_Data';
              break;
            case 'April':
              previousTable = 'mtd_daily';
              break;
            case 'March':
              previousTable = 'sales_data';
              break;
            default: // February
              previousTable = 'sales_data_februrary';
          }
        }
        
        // Get current month data
        const { data: currentData, error: currentError } = await fetchDataFromTable(currentTable);
        
        if (currentError) throw currentError;
        
        // Calculate current month metrics
        const profitColumn = currentTable === 'sales_data' ? 'profit' : 'Profit';
        const spendColumn = currentTable === 'sales_data' ? 'spend' : 'Spend';
        const currentPerformance = calculatePerformanceMetrics(currentData || [], profitColumn, spendColumn);
        
        // Get previous month data if available
        let previousPerformance = null;
        if (previousTable) {
          const { data: previousData, error: previousError } = await fetchDataFromTable(previousTable);
            
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
      
      // Determine current table based on selected month
      let currentTable;
      switch (selectedMonth) {
        case 'May':
          currentTable = 'May_Data';
          break;
        case 'April':
          currentTable = 'mtd_daily';
          break;
        case 'March':
          currentTable = 'sales_data';
          break;
        default: // February
          currentTable = 'sales_data_februrary';
      }
      
      // Set previous table based on compare month selection
      let previousTable;
      if (compareMonth === 'Prior MTD') {
        previousTable = 'Prior_Month_Rolling';
      } else {
        switch (compareMonth) {
          case 'May':
            previousTable = 'May_Data';
            break;
          case 'April':
            previousTable = 'mtd_daily';
            break;
          case 'March':
            previousTable = 'sales_data';
            break;
          default: // February
            previousTable = 'sales_data_februrary';
        }
      }
      
      // Determine column names based on table structure
      const currentRepColumn = currentTable === 'sales_data' ? 'rep_name' : 'Rep';
      const currentSubRepColumn = currentTable === 'sales_data' ? 'sub_rep' : 'Sub-Rep';
      const currentProfitColumn = currentTable === 'sales_data' ? 'profit' : 'Profit';
      const currentSpendColumn = currentTable === 'sales_data' ? 'spend' : 'Spend';
      
      // Use fullName or userName for matching, prioritizing fullName
      const matchName = fullName || userName;
      
      // Get current month data
      const { data: currentData, error: currentError } = await fetchUserDataFromTable(currentTable, matchName);
      
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
        
        const { data: previousData, error: previousError } = await fetchUserDataFromTable(previousTable, matchName);
        
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
      setIsLoading(true);
      console.log(`Fetching account health data for month: ${selectedMonth}, compare with: ${compareMonth}`);
      
      // Determine current month data source
      let currentMonthTableName: string;
      switch (selectedMonth) {
        case 'May':
          currentMonthTableName = 'May_Data';
          break;
        case 'April':
          currentMonthTableName = 'mtd_daily';
          break;
        case 'March':
          currentMonthTableName = 'sales_data';
          break;
        default: // February
          currentMonthTableName = 'sales_data_februrary';
      }
      
      // Determine comparison data source based on compareMonth selection
      let compareMonthTableName: string;
      if (compareMonth === 'Prior MTD') {
        compareMonthTableName = 'Prior_Month_Rolling';
      } else {
        switch (compareMonth) {
          case 'May':
            compareMonthTableName = 'May_Data';
            break;
          case 'April':
            compareMonthTableName = 'mtd_daily';
            break;
          case 'March':
            compareMonthTableName = 'sales_data';
            break;
          default: // February
            compareMonthTableName = 'sales_data_februrary';
        }
      }
      
      // If viewing all data
      if (selectedUserId === "all") {
        // Fetch current month data
        const { data: currentData, error: currentError } = await fetchDataFromTable(currentMonthTableName);
        if (currentError) throw currentError;
        
        // Fetch comparison month data
        const { data: compareData, error: compareError } = await fetchDataFromTable(compareMonthTableName);
        if (compareError) throw compareError;
        
        // Calculate account health by comparing current and comparison data
        const accountHealth = calculateAccountHealth(currentData || [], compareData || []);
        setAccountHealthData(accountHealth);
        setIsLoading(false);
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
      const { data: currentData, error: currentError } = await fetchUserDataFromTable(currentMonthTableName, matchName);
      if (currentError) throw currentError;
      
      // Get comparison month data
      const { data: compareData, error: compareError } = await fetchUserDataFromTable(compareMonthTableName, matchName);
      if (compareError) throw compareError;
      
      // Calculate account health by comparing current and comparison data
      const accountHealth = calculateAccountHealth(currentData || [], compareData || []);
      setAccountHealthData(accountHealth);
      
    } catch (error) {
      console.error("Error fetching account health data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to fetch data from a specific table
  const fetchDataFromTable = async (tableName: string) => {
    switch (tableName) {
      case 'May_Data':
        return await supabase.from('May_Data').select('*');
      case 'mtd_daily':
        return await supabase.from('mtd_daily').select('*');
      case 'sales_data':
        return await supabase.from('sales_data').select('*');
      case 'sales_data_februrary':
        return await supabase.from('sales_data_februrary').select('*');
      case 'Prior_Month_Rolling':
        return await supabase.from('Prior_Month_Rolling').select('*');
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  };
  
  // Helper function to fetch user-specific data from a specific table
  const fetchUserDataFromTable = async (tableName: string, matchName: string) => {
    switch (tableName) {
      case 'May_Data':
        return await supabase
          .from('May_Data')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      case 'mtd_daily':
        return await supabase
          .from('mtd_daily')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      case 'sales_data':
        return await supabase
          .from('sales_data')
          .select('*')
          .or(`rep_name.ilike.%${matchName}%,sub_rep.ilike.%${matchName}%`);
      case 'sales_data_februrary':
        return await supabase
          .from('sales_data_februrary')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      case 'Prior_Month_Rolling':
        return await supabase
          .from('Prior_Month_Rolling')
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
      default:
        throw new Error(`Unknown table: ${tableName}`);
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
      // Get the rep name - either from Rep or rep_name field depending on the table structure
      const repName = item.Rep || item.rep_name || '';
      
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
      const accountRef = item['Account Ref'] || item.account_ref || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                     typeof item.profit === 'number' ? item.profit : 0;
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                    typeof item.spend === 'number' ? item.spend : 0;
      // Get the rep name from previous data if available
      const prevRepName = item.Rep || item.rep_name || '';
      
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
            onMonthChange={handleAccountHealthMonthChange}
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
