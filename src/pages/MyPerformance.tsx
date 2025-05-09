
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
import RepPerformanceComparison from '@/components/my-performance/RepPerformanceComparison';

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
  const [repComparisonData, setRepComparisonData] = useState<any[]>([]);
  const [teamAverageData, setTeamAverageData] = useState<any>({
    profit: [],
    spend: [],
    packs: [],
    margin: []
  });
  const [userTrendsData, setUserTrendsData] = useState<any>({
    profit: [],
    spend: [],
    packs: [],
    margin: []
  });
  
  // Add state for department toggles
  const [includeRetail, setIncludeRetail] = useState<boolean>(true);
  const [includeReva, setIncludeReva] = useState<boolean>(true);
  const [includeWholesale, setIncludeWholesale] = useState<boolean>(true);
  
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
  }, [user, selectedMonth, selectedUserId, includeRetail, includeReva, includeWholesale]);
  
  // Fetch account health data when account health month or compare month changes
  useEffect(() => {
    if (user && selectedUserId) {
      fetchAccountHealthData();
    }
  }, [accountHealthMonth, compareMonth, includeRetail, includeReva, includeWholesale]);
  
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
        fetchVisitData(),
        fetchRepComparisonData() // New function to fetch comparison data
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
        const { data: currentData, error: currentError } = await fetchDataFromTable(currentTable);
        
        if (currentError) throw currentError;
        
        // Filter data based on department toggles
        let filteredData = currentData || [];
        if (!includeRetail || !includeReva || !includeWholesale) {
          filteredData = filteredData.filter((item: any) => {
            const department = item.Department || item.department || '';
            if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
            if (!includeReva && department.toUpperCase() === 'REVA') return false;
            if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
            return true;
          });
        }
        
        // Calculate current month metrics
        const profitColumn = currentTable === 'sales_data' ? 'profit' : 'Profit';
        const spendColumn = currentTable === 'sales_data' ? 'spend' : 'Spend';
        const currentPerformance = calculatePerformanceMetrics(filteredData, profitColumn, spendColumn);
        
        // Get previous month data if available
        let previousPerformance = null;
        if (previousTable) {
          const { data: previousData, error: previousError } = await fetchDataFromTable(previousTable);
            
          if (!previousError && previousData) {
            let filteredPreviousData = previousData;
            if (!includeRetail || !includeReva || !includeWholesale) {
              filteredPreviousData = filteredPreviousData.filter((item: any) => {
                const department = item.Department || item.department || '';
                if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
                if (!includeReva && department.toUpperCase() === 'REVA') return false;
                if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
                return true;
              });
            }
            
            const prevProfitColumn = previousTable === 'sales_data' ? 'profit' : 'Profit';
            const prevSpendColumn = previousTable === 'sales_data' ? 'spend' : 'Spend';
            previousPerformance = calculatePerformanceMetrics(filteredPreviousData, prevProfitColumn, prevSpendColumn);
          }
        }
        
        // Set performance data with previous month comparison and rankings
        setPerformanceData({
          ...currentPerformance,
          previousMonthData: previousPerformance,
          rankings: {
            profitRank: 1,
            spendRank: 1,
            marginRank: 1,
            accountsRank: 1
          }
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
      const { data: currentData, error: currentError } = await fetchUserDataFromTable(currentTable, matchName);
      
      if (currentError) throw currentError;
      
      // Filter data based on department toggles
      let filteredData = currentData || [];
      if (!includeRetail || !includeReva || !includeWholesale) {
        filteredData = filteredData.filter((item: any) => {
          const department = item.Department || item.department || '';
          if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
          if (!includeReva && department.toUpperCase() === 'REVA') return false;
          if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
          return true;
        });
      }
      
      // Calculate current month metrics
      const currentPerformance = calculatePerformanceMetrics(
        filteredData, 
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
          let filteredPreviousData = previousData;
          if (!includeRetail || !includeReva || !includeWholesale) {
            filteredPreviousData = filteredPreviousData.filter((item: any) => {
              const department = item.Department || item.department || '';
              if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
              if (!includeReva && department.toUpperCase() === 'REVA') return false;
              if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
              return true;
            });
          }
          
          previousPerformance = calculatePerformanceMetrics(
            filteredPreviousData, 
            previousProfitColumn, 
            previousSpendColumn
          );
        }
      }
      
      // Set performance data with previous month comparison and rankings
      setPerformanceData({
        ...currentPerformance,
        previousMonthData: previousPerformance,
        rankings: {
          profitRank: 1,
          spendRank: 1,
          marginRank: 1,
          accountsRank: 1
        }
      });
      
    } catch (error) {
      console.error("Error fetching personal performance data:", error);
    }
  };
  
  const fetchUserPerformanceDataForAllReps = async () => {
    // Determine current data table based on selected month
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
    
    // Get all data from the table
    const { data, error } = await fetchDataFromTable(tableName);
    
    if (error) {
      console.error("Error fetching all reps data:", error);
      return { data: [] };
    }
    
    // Process data to get rep-specific metrics
    const repData = processRepData(data || []);
    return { data: repData };
  };
  
  const processRepData = (data: any[]) => {
    const repMap = new Map();
    
    data.forEach(item => {
      const repName = item.Rep || item.rep_name || '';
      if (!repName) return;
      
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                    typeof item.profit === 'number' ? item.profit : 0;
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                   typeof item.spend === 'number' ? item.spend : 0;
      const accountRef = item['Account Ref'] || item.account_ref || '';
      
      if (!repMap.has(repName)) {
        repMap.set(repName, {
          repName,
          profit: 0,
          spend: 0,
          accounts: new Set(),
          activeAccounts: new Set()
        });
      }
      
      const repData = repMap.get(repName);
      repData.profit += profit;
      repData.spend += spend;
      
      if (accountRef) {
        repData.accounts.add(accountRef);
        if (spend > 0) {
          repData.activeAccounts.add(accountRef);
        }
      }
    });
    
    // Convert map to array and calculate derivatives
    return Array.from(repMap.values()).map(rep => ({
      repName: rep.repName,
      profit: rep.profit,
      spend: rep.spend,
      margin: rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0,
      totalAccounts: rep.accounts.size,
      activeAccounts: rep.activeAccounts.size
    }));
  };
  
  const fetchRepComparisonData = async () => {
    try {
      // Fetch monthly data for all reps
      const months = ['February', 'March', 'April', 'May'];
      const monthlyTables = [
        'sales_data_februrary',
        'sales_data',
        'mtd_daily',
        'May_Data'
      ];
      
      // Get data for each month
      const monthlyData = await Promise.all(
        monthlyTables.map(table => fetchDataFromTable(table))
      );
      
      // Process data to get monthly metrics by rep
      const processedMonthlyData = monthlyData.map((result, index) => {
        const repData = processRepData(result.data || []);
        return {
          month: months[index],
          data: repData
        };
      });
      
      // Transform data for chart format
      const repNames = new Set<string>();
      const userRepName = selectedUserDisplayName !== "My Data" ? selectedUserDisplayName : (userFirstName || "");
      
      // Collect all rep names
      processedMonthlyData.forEach(monthData => {
        monthData.data.forEach(rep => {
          // Skip the current user's data as we'll handle it separately
          if (!rep.repName.includes(userRepName)) {
            repNames.add(rep.repName);
          }
        });
      });
      
      // Extract user's data across months
      const userData = {
        profit: [] as { month: string; value: number }[],
        spend: [] as { month: string; value: number }[],
        packs: [] as { month: string; value: number }[],
        margin: [] as { month: string; value: number }[]
      };
      
      // Calculate team averages
      const averageData = {
        profit: [] as { month: string; value: number }[],
        spend: [] as { month: string; value: number }[],
        packs: [] as { month: string; value: number }[],
        margin: [] as { month: string; value: number }[]
      };
      
      processedMonthlyData.forEach(monthData => {
        // Calculate averages
        let totalProfit = 0;
        let totalSpend = 0;
        let totalPacks = 0;
        let totalMargin = 0;
        let repCount = 0;
        
        monthData.data.forEach(rep => {
          totalProfit += rep.profit;
          totalSpend += rep.spend;
          totalPacks += rep.totalAccounts || 0;
          totalMargin += rep.margin;
          repCount++;
          
          // Extract user's data if match found
          if (rep.repName.includes(userRepName)) {
            userData.profit.push({ month: monthData.month.substring(0, 3), value: rep.profit });
            userData.spend.push({ month: monthData.month.substring(0, 3), value: rep.spend });
            userData.packs.push({ month: monthData.month.substring(0, 3), value: rep.totalAccounts || 0 });
            userData.margin.push({ month: monthData.month.substring(0, 3), value: rep.margin });
          }
        });
        
        // Add average for the month
        if (repCount > 0) {
          averageData.profit.push({ 
            month: monthData.month.substring(0, 3), 
            value: totalProfit / repCount 
          });
          averageData.spend.push({ 
            month: monthData.month.substring(0, 3), 
            value: totalSpend / repCount 
          });
          averageData.packs.push({ 
            month: monthData.month.substring(0, 3), 
            value: totalPacks / repCount 
          });
          averageData.margin.push({ 
            month: monthData.month.substring(0, 3), 
            value: totalMargin / repCount 
          });
        }
      });
      
      // Prepare comparison data for each rep
      const comparisonData = Array.from(repNames).map(repName => {
        const repData = {
          repName,
          profit: [] as { month: string; value: number }[],
          spend: [] as { month: string; value: number }[],
          packs: [] as { month: string; value: number }[],
          margin: [] as { month: string; value: number }[]
        };
        
        processedMonthlyData.forEach(monthData => {
          const rep = monthData.data.find(r => r.repName === repName);
          if (rep) {
            repData.profit.push({ month: monthData.month.substring(0, 3), value: rep.profit });
            repData.spend.push({ month: monthData.month.substring(0, 3), value: rep.spend });
            repData.packs.push({ month: monthData.month.substring(0, 3), value: rep.totalAccounts || 0 });
            repData.margin.push({ month: monthData.month.substring(0, 3), value: rep.margin });
          }
        });
        
        return repData;
      });
      
      // Only include reps with at least some data
      const filteredComparisonData = comparisonData.filter(
        rep => rep.profit.length > 0
      );
      
      // Set the state with the processed data
      setUserTrendsData(userData);
      setTeamAverageData(averageData);
      setRepComparisonData(filteredComparisonData.slice(0, 5)); // Limit to 5 reps for comparison
      
    } catch (error) {
      console.error("Error fetching rep comparison data:", error);
    }
  };
  
  const fetchAccountHealthData = async () => {
    // Similar to personal performance data but focused on account trends
    try {
      setIsLoading(true);
      console.log(`Fetching account health data for month: ${accountHealthMonth}, compare with: ${compareMonth}`);
      
      // Determine current month data source
      let currentMonthTableName: string;
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
      let compareMonthTableName: string;
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
        const { data: currentData, error: currentError } = await fetchDataFromTable(currentMonthTableName);
        if (currentError) throw currentError;
        
        // Fetch comparison month data
        const { data: compareData, error: compareError } = await fetchDataFromTable(compareMonthTableName);
        if (compareError) throw compareError;
        
        // Filter data based on department toggles
        let filteredCurrentData = currentData || [];
        let filteredCompareData = compareData || [];
        
        if (!includeRetail || !includeReva || !includeWholesale) {
          filteredCurrentData = filteredCurrentData.filter((item: any) => {
            const department = item.Department || item.department || '';
            if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
            if (!includeReva && department.toUpperCase() === 'REVA') return false;
            if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
            return true;
          });
          
          filteredCompareData = filteredCompareData.filter((item: any) => {
            const department = item.Department || item.department || '';
            if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
            if (!includeReva && department.toUpperCase() === 'REVA') return false;
            if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
            return true;
          });
        }
        
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
      
      // Get current month data
      const { data: currentData, error: currentError } = await fetchUserDataFromTable(currentMonthTableName, matchName);
      if (currentError) throw currentError;
      
      // Get comparison month data
      const { data: compareData, error: compareError } = await fetchUserDataFromTable(compareMonthTableName, matchName);
      if (compareError) throw compareError;
      
      // Filter data based on department toggles
      let filteredCurrentData = currentData || [];
      let filteredCompareData = compareData || [];
      
      if (!includeRetail || !includeReva || !includeWholesale) {
        filteredCurrentData = filteredCurrentData.filter((item: any) => {
          const department = item.Department || item.department || '';
          if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
          if (!includeReva && department.toUpperCase() === 'REVA') return false;
          if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
          return true;
        });
        
        filteredCompareData = filteredCompareData.filter((item: any) => {
          const department = item.Department || item.department || '';
          if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
          if (!includeReva && department.toUpperCase() === 'REVA') return false;
          if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
          return true;
        });
      }
      
      // Calculate account health by comparing current and comparison data
      const accountHealth = calculateAccountHealth(filteredCurrentData, filteredCompareData);
      setAccountHealthData(accountHealth);
      
    } catch (error) {
      console.error("Error fetching account health data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to fetch data from a specific table with pagination
  const fetchDataFromTable = async (tableName: string) => {
    console.log(`Fetching data from table: ${tableName} with pagination`);
    const PAGE_SIZE = 1000;
    let allData: any[] = [];
    let page = 0;
    let hasMoreData = true;
    
    while (hasMoreData) {
      try {
        let query;
        
        switch (tableName) {
          case 'May_Data':
            query = supabase
              .from('May_Data')
              .select('*')
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'mtd_daily':
            query = supabase
              .from('mtd_daily')
              .select('*')
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'sales_data':
            query = supabase
              .from('sales_data')
              .select('*')
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'sales_data_februrary':
            query = supabase
              .from('sales_data_februrary')
              .select('*')
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'Prior_Month_Rolling':
            query = supabase
              .from('Prior_Month_Rolling')
              .select('*')
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          default:
            throw new Error(`Unknown table: ${tableName}`);
        }
        
        const { data, error, count } = await query;
        
        if (error) {
          console.error(`Error fetching page ${page} from ${tableName}:`, error);
          return { data: allData, error };
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          
          // Check if we've fetched all available data
          hasMoreData = data.length === PAGE_SIZE;
          console.log(`Fetched ${data.length} records from ${tableName}, page ${page}. Total so far: ${allData.length}`);
        } else {
          hasMoreData = false;
        }
      } catch (error) {
        console.error(`Error in pagination loop for ${tableName}:`, error);
        hasMoreData = false;
        return { data: allData, error };
      }
    }
    
    console.log(`Completed fetching from ${tableName}. Total records: ${allData.length}`);
    return { data: allData, error: null };
  };
  
  // Helper function to fetch user-specific data from a specific table with pagination
  const fetchUserDataFromTable = async (tableName: string, matchName: string) => {
    console.log(`Fetching user data for "${matchName}" from table: ${tableName} with pagination`);
    const PAGE_SIZE = 1000;
    let allData: any[] = [];
    let page = 0;
    let hasMoreData = true;
    
    while (hasMoreData) {
      try {
        let query;
        
        switch (tableName) {
          case 'May_Data':
            query = supabase
              .from('May_Data')
              .select('*')
              .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'mtd_daily':
            query = supabase
              .from('mtd_daily')
              .select('*')
              .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'sales_data':
            query = supabase
              .from('sales_data')
              .select('*')
              .or(`rep_name.ilike.%${matchName}%,sub_rep.ilike.%${matchName}%`)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'sales_data_februrary':
            query = supabase
              .from('sales_data_februrary')
              .select('*')
              .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          case 'Prior_Month_Rolling':
            query = supabase
              .from('Prior_Month_Rolling')
              .select('*')
              .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
          default:
            throw new Error(`Unknown table: ${tableName}`);
        }
        
        const { data, error, count } = await query;
        
        if (error) {
          console.error(`Error fetching user data page ${page} from ${tableName}:`, error);
          return { data: allData, error };
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          
          // Check if we've fetched all available data
          hasMoreData = data.length === PAGE_SIZE;
          console.log(`Fetched ${data.length} user records from ${tableName}, page ${page}. Total so far: ${allData.length}`);
        } else {
          hasMoreData = false;
        }
      } catch (error) {
        console.error(`Error in user data pagination loop for ${tableName}:`, error);
        hasMoreData = false;
        return { data: allData, error };
      }
    }
    
    console.log(`Completed fetching user data from ${tableName}. Total records: ${allData.length}`);
    return { data: allData, error: null };
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
      return "Aver";
    } else {
      return userFirstName ? `${userFirstName}'s` : `${selectedUserDisplayName}'s`;
    }
  };
  
  // Render the page directly without the redundant AppLayout wrapper
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {getTitleName()} Dashboard
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
      
      {/* Add PerformanceFilters component */}
      <PerformanceFilters
        includeRetail={includeRetail}
        setIncludeRetail={setIncludeRetail}
        includeReva={includeReva}
        setIncludeReva={setIncludeReva}
        includeWholesale={includeWholesale}
        setIncludeWholesale={setIncludeWholesale}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />

      {/* Personal Performance Overview */}
      <div className="mb-6">
        <PersonalPerformanceCard
          performanceData={performanceData}
          isLoading={isLoading}
        />
      </div>
      
      {/* Performance Comparison Chart */}
      <div className="mb-6">
        <RepPerformanceComparison
          userData={userTrendsData}
          averageData={teamAverageData}
          comparisonData={repComparisonData}
          isLoading={isLoading}
          userName={selectedUserDisplayName !== "My Data" ? selectedUserDisplayName : "You"}
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
