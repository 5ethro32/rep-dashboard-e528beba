
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import PersonalPerformanceCard from '@/components/my-performance/PersonalPerformanceCard';
import AccountHealthSection from '@/components/my-performance/AccountHealthSection';
import ActivityImpactAnalysis from '@/components/my-performance/ActivityImpactAnalysis';
import PersonalizedInsights from '@/components/my-performance/PersonalizedInsights';
import GoalTrackingComponent from '@/components/my-performance/GoalTrackingComponent';

// Define the allowed table names for type safety
type TableName = 'May_Data' | 'Prior_Month_Rolling' | 'mtd_daily' | 'sales_data' | 'sales_data_februrary' | 
                'admin_starred_accounts' | 'customer_visits' | 'week_plans' | 'Prior Month Rolling Old' | 
                'profiles' | 'unified_sales_data' | 'user_starred_accounts';

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
  const [compareMonth, setCompareMonth] = useState<string>('April');
  const [accountHealthMonth, setAccountHealthMonth] = useState<string>('May');
  // Add department filter states
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const isMobile = useIsMobile();
  
  // Add the filterDataByDepartment function
  const filterDataByDepartment = (data: any[]): any[] => {
    if (includeRetail && includeReva && includeWholesale) {
      return data; // Return all data if all filters are on
    }
    
    return data.filter(item => {
      const department = item.Department || item.department || '';
      
      if (!includeRetail && department.toUpperCase() === 'RETAIL') {
        return false;
      }
      if (!includeReva && department.toUpperCase() === 'REVA') {
        return false;
      }
      if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department === 'Wholesale')) {
        return false;
      }
      
      return true;
    });
  };
  
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
  }, [user, selectedMonth, selectedUserId, includeRetail, includeReva, includeWholesale]);
  
  // Fetch account health data when account health month or compare month changes
  useEffect(() => {
    if (user && selectedUserId) {
      fetchAccountHealthData();
    }
  }, [accountHealthMonth, compareMonth]);
  
  const handleSelectUser = (userId: string | null, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserDisplayName(displayName);
    
    // Extract first name from display name
    const firstName = displayName.split(' ')[0];
    setUserFirstName(firstName);
    
    setIsLoading(true);
  };
  
  const handleAccountHealthMonthChange = (month: string) => {
    setAccountHealthMonth(month);
    setIsLoading(true);
  };
  
  const handleCompareMonthChange = (month: string) => {
    setCompareMonth(month);
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
        let currentTable: TableName;
        let previousTable: TableName | null;
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
        const currentData = await fetchAllRecordsFromTable(currentTable);
        
        // Filter data by department before calculating metrics
        const filteredCurrentData = filterDataByDepartment(currentData || []);
        
        // Calculate current month metrics
        const profitColumn = currentTable === 'sales_data' ? 'profit' : 'Profit';
        const spendColumn = currentTable === 'sales_data' ? 'spend' : 'Spend';
        const currentPerformance = calculatePerformanceMetrics(filteredCurrentData || [], profitColumn, spendColumn);
        
        // Get previous month data if available
        let previousPerformance = null;
        if (previousTable) {
          const previousData = await fetchAllRecordsFromTable(previousTable);
          
          // Filter previous data by department as well
          const filteredPreviousData = filterDataByDepartment(previousData || []);
            
          if (filteredPreviousData && filteredPreviousData.length > 0) {
            const prevProfitColumn = previousTable === 'sales_data' ? 'profit' : 'Profit';
            const prevSpendColumn = previousTable === 'sales_data' ? 'spend' : 'Spend';
            previousPerformance = calculatePerformanceMetrics(filteredPreviousData, prevProfitColumn, prevSpendColumn);
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
      let currentTable: TableName;
      let previousTable: TableName | null;
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
      const currentData = await fetchAllUserRecordsFromTable(currentTable, matchName);
      
      if (!currentData) throw new Error("Failed to fetch current month data");
      
      // Filter data by department before calculating metrics
      const filteredCurrentData = filterDataByDepartment(currentData || []);
      
      // Calculate current month metrics
      const currentPerformance = calculatePerformanceMetrics(
        filteredCurrentData || [], 
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
        
        const previousData = await fetchAllUserRecordsFromTable(previousTable, matchName);
        
        if (previousData && previousData.length > 0) {
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
      console.log(`Fetching account health data for month: ${accountHealthMonth}, compare with: ${compareMonth}`);
      
      // Determine current month data source
      let currentMonthTableName: TableName;
      switch (accountHealthMonth) {
        case 'May':
          currentMonthTableName = 'May_Data';
          break;
        case 'April':
          currentMonthTableName = 'mtd_daily';
          break;
        case 'March':
          currentMonthTableName = 'sales_data';
          break;
        case 'February':
          currentMonthTableName = 'sales_data_februrary';
          break;
        default:
          currentMonthTableName = 'May_Data';
      }
      
      // Determine comparison data source based on compareMonth selection
      let compareMonthTableName: TableName;
      switch (compareMonth) {
        case 'May':
          compareMonthTableName = 'May_Data';
          break;
        case 'April':
          compareMonthTableName = compareMonth === accountHealthMonth ? 'Prior_Month_Rolling' : 'mtd_daily';
          break;
        case 'March':
          compareMonthTableName = 'sales_data';
          break;
        case 'February':
          compareMonthTableName = 'sales_data_februrary';
          break;
        default:
          compareMonthTableName = 'Prior_Month_Rolling';
      }
      
      // If viewing all data
      if (selectedUserId === "all") {
        // Fetch current month data
        const currentData = await fetchAllRecordsFromTable(currentMonthTableName);
        if (!currentData) throw new Error("Failed to fetch current month data");
        
        // Filter current data by department
        const filteredCurrentData = filterDataByDepartment(currentData || []);
        
        // Fetch comparison month data
        const compareData = await fetchAllRecordsFromTable(compareMonthTableName);
        if (!compareData) throw new Error("Failed to fetch comparison month data");
        
        // Filter comparison data by department
        const filteredCompareData = filterDataByDepartment(compareData || []);
        
        // Calculate account health by comparing current and comparison data
        const accountHealth = calculateAccountHealth(filteredCurrentData, filteredCompareData);
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
      
      // Get current month data and filter by department
      const currentData = await fetchAllUserRecordsFromTable(currentMonthTableName, matchName);
      if (!currentData) throw new Error("Failed to fetch current month user data");
      const filteredCurrentData = filterDataByDepartment(currentData || []);
      
      // Get comparison month data and filter by department
      const compareData = await fetchAllUserRecordsFromTable(compareMonthTableName, matchName);
      if (!compareData) throw new Error("Failed to fetch comparison month user data");
      const filteredCompareData = filterDataByDepartment(compareData || []);
      
      // Calculate account health by comparing current and comparison data
      const accountHealth = calculateAccountHealth(filteredCurrentData, filteredCompareData);
      setAccountHealthData(accountHealth);
      
    } catch (error) {
      console.error("Error fetching account health data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // New function to fetch all records with pagination from a table
  const fetchAllRecordsFromTable = async (tableName: TableName): Promise<any[]> => {
    try {
      const PAGE_SIZE = 1000; // Supabase's max page size
      let page = 0;
      let allData: any[] = [];
      let hasMore = true;
      
      console.log(`Starting paginated fetch from ${tableName}`);
      
      while (hasMore) {
        const query = supabase
          .from(tableName)
          .select('*')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          
        const { data, error } = await query;
        
        if (error) {
          console.error(`Error fetching page ${page} from ${tableName}:`, error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          console.log(`Fetched page ${page} from ${tableName}: ${data.length} records (total: ${allData.length})`);
          page++;
          
          // Check if we've reached the end
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`Completed fetch from ${tableName}: ${allData.length} total records`);
      return allData;
    } catch (error) {
      console.error(`Error in fetchAllRecordsFromTable for ${tableName}:`, error);
      throw error;
    }
  };
  
  // New function to fetch all user-specific records with pagination
  const fetchAllUserRecordsFromTable = async (tableName: TableName, matchName: string): Promise<any[]> => {
    try {
      const PAGE_SIZE = 1000; // Supabase's max page size
      let page = 0;
      let allData: any[] = [];
      let hasMore = true;
      
      console.log(`Starting paginated fetch for user ${matchName} from ${tableName}`);
      
      while (hasMore) {
        let query;
        
        switch (tableName) {
          case 'May_Data':
          case 'mtd_daily':
          case 'sales_data_februrary':
          case 'Prior_Month_Rolling':
          case 'Prior Month Rolling Old':
            query = supabase
              .from(tableName)
              .select('*')
              .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'sales_data':
            query = supabase
              .from(tableName)
              .select('*')
              .or(`rep_name.ilike.%${matchName}%,sub_rep.ilike.%${matchName}%`)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          default:
            throw new Error(`Unknown table: ${tableName}`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error(`Error fetching page ${page} for user ${matchName} from ${tableName}:`, error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          console.log(`Fetched page ${page} for user ${matchName} from ${tableName}: ${data.length} records (total: ${allData.length})`);
          page++;
          
          // Check if we've reached the end
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`Completed fetch for user ${matchName} from ${tableName}: ${allData.length} total records`);
      return allData;
    } catch (error) {
      console.error(`Error in fetchAllUserRecordsFromTable for ${tableName} and user ${matchName}:`, error);
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
      
      {/* Filters and month selector in the same row */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        {/* Performance filters */}
        <div className="flex-grow">
          <PerformanceFilters 
            includeRetail={includeRetail}
            setIncludeRetail={setIncludeRetail}
            includeReva={includeReva}
            setIncludeReva={setIncludeReva}
            includeWholesale={includeWholesale}
            setIncludeWholesale={setIncludeWholesale}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            showMonthSelector={true}
          />
        </div>
        
        {/* Remove the redundant header with month selector since we already have it in the filters */}
        {/* <div className="flex-shrink-0">
          <PerformanceHeader 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onRefresh={handleRefresh}
            hideTitle={true}
          />
        </div> */}
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
            selectedMonth={accountHealthMonth}
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
