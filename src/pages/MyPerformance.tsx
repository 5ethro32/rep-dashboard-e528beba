import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
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
  const [selectedMonth, setSelectedMonth] = useState<string>('June');
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [accountHealthData, setAccountHealthData] = useState<any[]>([]);
  const [visitData, setVisitData] = useState<any[]>([]);
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(propSelectedUserId || null);
  const [selectedUserDisplayName, setSelectedUserDisplayName] = useState<string>(propSelectedUserName || 'My Data');
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [compareMonth, setCompareMonth] = useState<string>('May');
  const [accountHealthMonth, setAccountHealthMonth] = useState<string>('June');
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
      
      console.log('MyPerformance - Using provided userId:', propSelectedUserId);
      console.log('MyPerformance - Using provided displayName:', propSelectedUserName);
    } else if (user && !selectedUserId) {
      setSelectedUserId(user.id);
      console.log('MyPerformance - Using current user ID:', user.id);
      
      // Try to get user's name from profile
      const fetchUserProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();
          
        if (data?.first_name) {
          setUserFirstName(data.first_name);
          console.log('MyPerformance - Found user first name:', data.first_name);
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
  
  // Handle user selection from the header
  const handleUserSelection = (userId: string | null, displayName: string) => {
    console.log(`MyPerformance: User selection changed to ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserDisplayName(displayName);
    
    // Extract first name if we have a full name
    if (displayName !== "My Data" && displayName !== "All Data") {
      const firstName = displayName.split(' ')[0];
      setUserFirstName(firstName);
    }
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
        console.log('Fetching aggregated data for "All Data" view');
        
        // Determine the table names based on selected month and previous month
        let currentTable;
        let previousTable;
        switch (selectedMonth) {
          case 'June':
            currentTable = 'June_Data';
            previousTable = 'May_Data'; // May data for comparison
            break;
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
            // Handle different column names: sales_data uses 'rep_type', others use 'Department'
            const department = item.Department || item.department || item.rep_type || '';
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
                // Handle different column names: sales_data uses 'rep_type', others use 'Department'
                const department = item.Department || item.department || item.rep_type || '';
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
      
      // Determine which user's data to fetch
      let targetUserId = selectedUserId;
      
      // If "My Data" is selected, use the current logged-in user's ID
      if (selectedUserDisplayName === "My Data") {
        targetUserId = user?.id || selectedUserId;
        console.log('My Data selected: Using logged-in user ID:', targetUserId);
      }
      
      // Get the target user's profile information
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', targetUserId)
        .single();
      
      // Get the user's email to help with matching records
      let userEmail = '';
      if (targetUserId === user?.id) {
        userEmail = user.email || '';
      } else {
        // For other users, try to construct a likely email from their profile data
        // This is just a fallback and may not be accurate
        const domain = user?.email ? user.email.split('@')[1] : 'avergenerics.co.uk';
        userEmail = `${targetUserId.split('-')[0]}@${domain}`;
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
      
      console.log('Matching with names:', { userName, fullName, targetUserId, selectedUserDisplayName });
      
      // Determine table names based on selected month and previous month
      let currentTable;
      let previousTable;
      switch (selectedMonth) {
        case 'June':
          currentTable = 'June_Data';
          previousTable = 'May_Data'; // May data for comparison
          break;
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
          // Handle different column names: sales_data uses 'rep_type', others use 'Department'
          const department = item.Department || item.department || item.rep_type || '';
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
              // Handle different column names: sales_data uses 'rep_type', others use 'Department'
              const department = item.Department || item.department || item.rep_type || '';
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
      case 'June':
        tableName = 'June_Data';
        break;
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
    
    // Function to normalize rep names for better matching
    const normalizeRepName = (name: string) => {
      if (!name) return '';
      // Convert to lowercase, remove extra spaces, and standardize
      return name.toLowerCase().trim().replace(/\s+/g, ' ');
    };
    
    // Function to get a canonical rep name (for display)
    const getCanonicalRepName = (name: string) => {
      if (!name) return '';
      // Return the original name but trimmed
      return name.trim();
    };
    
    data.forEach(item => {
      const originalRepName = item.Rep || item.rep_name || '';
      if (!originalRepName) return;
      
      // Filter out department names and invalid rep names
      const departmentNames = ['RETAIL', 'REVA', 'WHOLESALE', 'TRADE'];
      const nonRepNames = ['YVONNE WALTON', 'ADAM FORSYTHE']; // Known non-rep names that appear in data
      const upperRepName = originalRepName.toUpperCase().trim();
      
      // Skip if this is a department name
      if (departmentNames.includes(upperRepName)) {
        return;
      }
      
      // Skip if this is a known non-rep name
      if (nonRepNames.includes(upperRepName)) {
        return;
      }
      
      // Skip if the name is too short (likely not a real name)
      if (originalRepName.trim().length < 3) {
        return;
      }
      
      // Skip if the name contains only numbers or special characters
      if (!/[a-zA-Z]/.test(originalRepName)) {
        return;
      }
      
      const normalizedRepName = normalizeRepName(originalRepName);
      const canonicalRepName = getCanonicalRepName(originalRepName);
      
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                    typeof item.profit === 'number' ? item.profit : 0;
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                   typeof item.spend === 'number' ? item.spend : 0;
      const accountRef = item['Account Ref'] || item.account_ref || '';
      
      // Use normalized name as key but store canonical name for display
      if (!repMap.has(normalizedRepName)) {
        repMap.set(normalizedRepName, {
          repName: canonicalRepName, // Use the canonical name for display
          profit: 0,
          spend: 0,
          accounts: new Set(),
          activeAccounts: new Set(),
          recordCount: 0
        });
      }
      
      const repData = repMap.get(normalizedRepName);
      repData.profit += profit;
      repData.spend += spend;
      repData.recordCount += 1;
      
      if (accountRef) {
        repData.accounts.add(accountRef);
        if (spend > 0) {
          repData.activeAccounts.add(accountRef);
        }
      }
    });
    
    // Convert map to array and calculate derivatives
    const processedReps = Array.from(repMap.values()).map(rep => ({
      repName: rep.repName,
      profit: rep.profit,
      spend: rep.spend,
      margin: rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0,
      totalAccounts: rep.accounts.size,
      activeAccounts: rep.activeAccounts.size,
      recordCount: rep.recordCount
    }));
    
    console.log('processRepData output:', {
      totalReps: processedReps.length,
      totalProfit: processedReps.reduce((sum, rep) => sum + rep.profit, 0),
      craigData: processedReps.find(rep => rep.repName.toLowerCase().includes('craig')),
      allRepNames: processedReps.map(rep => rep.repName).sort()
    });
    
    return processedReps;
  };
  
  const fetchRepComparisonData = async () => {
    try {
      // Fetch monthly data for all reps
      const months = ['February', 'March', 'April', 'May', 'June'];
      const monthlyTables = [
        'sales_data_februrary',
        'sales_data',
        'mtd_daily',
        'May_Data',
        'June_Data'
      ];
      
      // Get data for each month
      const monthlyData = await Promise.all(
        monthlyTables.map(table => fetchDataFromTable(table))
      );
      
      // Apply department filtering to each month's data before processing
      const filteredMonthlyData = monthlyData.map((result, index) => {
        let filteredData = result.data || [];
        const originalCount = filteredData.length;
        
        // Apply department filtering - only filter if not all departments are selected
        if (!includeRetail || !includeReva || !includeWholesale) {
          filteredData = filteredData.filter((item: any) => {
            // Handle different column names: sales_data uses 'rep_type', others use 'Department'
            const department = item.Department || item.department || item.rep_type || '';
            const deptUpper = department.toUpperCase();
            
            // Include the record if its department is enabled
            if (deptUpper === 'RETAIL') return includeRetail;
            if (deptUpper === 'REVA') return includeReva;
            if (deptUpper === 'WHOLESALE' || deptUpper === 'TRADE') return includeWholesale;
            
            // Include records with unknown/empty departments by default
            return true;
          });
          
          console.log(`Month ${months[index]}: Filtered from ${originalCount} to ${filteredData.length} records`);
          console.log(`Filters: Retail=${includeRetail}, REVA=${includeReva}, Wholesale=${includeWholesale}`);
        } else {
          console.log(`Month ${months[index]}: No filtering applied - all departments selected`);
        }
        
        return { ...result, data: filteredData };
      });
      
      // Process data to get monthly metrics by rep
      const processedMonthlyData = filteredMonthlyData.map((result, index) => {
        console.log(`Month ${months[index]} before processing:`, {
          totalRecords: result.data?.length || 0,
          sampleDepartments: result.data?.slice(0, 5).map(item => item.Department || item.department) || [],
          craigRecords: result.data?.filter(item => 
            (item.Rep || item.rep_name || '').includes('Craig')).length || 0,
          uniqueRepNames: [...new Set(result.data?.map(item => item.Rep || item.rep_name).filter(Boolean))].sort()
        });
        
        const repData = processRepData(result.data || []);
        console.log(`Month ${months[index]} processed data:`, {
          totalRecords: result.data?.length || 0,
          totalReps: repData.length,
          totalProfit: repData.reduce((sum, rep) => sum + rep.profit, 0),
          craigData: repData.find(rep => rep.repName.includes('Craig'))
        });
        return {
          month: months[index],
          data: repData
        };
      });
      
      // Transform data for chart format
      const repNames = new Set<string>();
      const userRepName = selectedUserDisplayName !== "My Data" ? selectedUserDisplayName : (userFirstName || "");
      
      console.log('Chart data processing:', {
        selectedUserDisplayName,
        userFirstName,
        userRepName,
        includeRetail,
        includeReva,
        includeWholesale
      });
      
      // Collect all rep names from filtered data
      filteredMonthlyData.forEach((monthResult, index) => {
        const monthRepData = processRepData(monthResult.data || []);
        monthRepData.forEach(rep => {
          // Skip the current user's data as we'll handle it separately
          if (!rep.repName.includes(userRepName)) {
            // Additional filtering to ensure we only get proper rep names
            const repName = rep.repName.trim();
            
            // Skip department names
            const departmentNames = ['RETAIL', 'REVA', 'WHOLESALE', 'TRADE'];
            if (departmentNames.includes(repName.toUpperCase())) {
              return;
            }
            
            // Skip known non-rep names
            const nonRepNames = ['YVONNE WALTON', 'ADAM FORSYTHE'];
            if (nonRepNames.includes(repName.toUpperCase())) {
              return;
            }
            
            // Only include names that look like proper names (contain at least one space for first/last name)
            // or are known single names
            if (repName.includes(' ') || repName.length > 3) {
              repNames.add(rep.repName);
            }
          }
        });
      });
      
      console.log('Collected rep names for comparison:', Array.from(repNames));
      
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
      
      // For "All Data" view, we want to show the total aggregated data
      // For "My Data" and individual user views, we show their specific data using the SAME method as metric cards
      const isAllDataView = selectedUserId === "all";
      const isMyDataView = selectedUserDisplayName === "My Data";
      
      // For individual users (including "My Data"), we need to use the same approach as metric cards
      if (!isAllDataView) {
        // Use the same user matching logic as metric cards
        // Determine which user's data to fetch
        let targetUserId = selectedUserId;
        
        // If "My Data" is selected, use the current logged-in user's ID
        if (isMyDataView) {
          targetUserId = user?.id || selectedUserId;
          console.log('Chart My Data view: Using logged-in user ID:', targetUserId);
        }
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', targetUserId)
          .single();
        
        let userEmail = '';
        if (targetUserId === user?.id) {
          userEmail = user.email || '';
        }
        
        let userName = '';
        if (userEmail) {
          userName = userEmail.split('@')[0];
          userName = userName.charAt(0).toUpperCase() + userName.slice(1);
        }
        
        const fullName = profileData ? 
          `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
          '';
        
        const matchName = fullName || userName;
        console.log(`Chart data matching with: ${matchName} (targetUserId: ${targetUserId}, isMyDataView: ${isMyDataView})`);
        
        
        // For each month, get user data using the same method as metric cards
        for (let i = 0; i < months.length; i++) {
          const month = months[i];
          const table = monthlyTables[i];
          
          console.log(`Getting chart data for ${matchName} from ${table} for ${month}`);
          
          // Get user data using the same method as metric cards
          const { data: userMonthData, error } = await fetchUserDataFromTable(table, matchName);
          
          if (!error && userMonthData) {
            // Apply department filtering (same as metric cards)
            let filteredUserData = userMonthData;
            if (!includeRetail || !includeReva || !includeWholesale) {
              filteredUserData = filteredUserData.filter((item: any) => {
                // Handle different column names: sales_data uses 'rep_type', others use 'Department'
                const department = item.Department || item.department || item.rep_type || '';
                if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
                if (!includeReva && department.toUpperCase() === 'REVA') return false;
                if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
                return true;
              });
            }
            
            // Calculate metrics using the same method as metric cards
            const profitColumn = table === 'sales_data' ? 'profit' : 'Profit';
            const spendColumn = table === 'sales_data' ? 'spend' : 'Spend';
            const metrics = calculatePerformanceMetrics(filteredUserData, profitColumn, spendColumn);
            
            console.log(`Chart data for ${matchName} in ${month}:`, {
              profit: metrics.totalProfit,
              spend: metrics.totalSpend,
              margin: metrics.margin,
              accounts: metrics.totalAccounts,
              recordCount: filteredUserData.length
            });
            
            userData.profit.push({ month: month.substring(0, 3), value: metrics.totalProfit });
            userData.spend.push({ month: month.substring(0, 3), value: metrics.totalSpend });
            userData.packs.push({ month: month.substring(0, 3), value: metrics.totalAccounts });
            userData.margin.push({ month: month.substring(0, 3), value: metrics.margin });
          }
        }
      } else {
        // For "All Data" view, use aggregated totals from filtered data
        for (let i = 0; i < months.length; i++) {
          const month = months[i];
          const table = monthlyTables[i];
          
          // Get the filtered data for this month (same filtering as individual users)
          const filteredMonthData = filteredMonthlyData[i];
          
          // Calculate metrics directly from filtered raw data (same as metric cards)
          const profitColumn = table === 'sales_data' ? 'profit' : 'Profit';
          const spendColumn = table === 'sales_data' ? 'spend' : 'Spend';
          const metrics = calculatePerformanceMetrics(filteredMonthData.data || [], profitColumn, spendColumn);
          
          console.log(`Using aggregated filtered data for "All Data" in ${month}:`, {
            profit: metrics.totalProfit,
            spend: metrics.totalSpend,
            margin: metrics.margin,
            accounts: metrics.totalAccounts,
            recordCount: filteredMonthData.data?.length || 0
          });
          
          userData.profit.push({ month: month.substring(0, 3), value: metrics.totalProfit });
          userData.spend.push({ month: month.substring(0, 3), value: metrics.totalSpend });
          userData.packs.push({ month: month.substring(0, 3), value: metrics.totalAccounts });
          userData.margin.push({ month: month.substring(0, 3), value: metrics.margin });
        }
      }
      
      // Calculate team averages using the same filtered data approach
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        const table = monthlyTables[i];
        
        // Get the filtered data for this month
        const filteredMonthData = filteredMonthlyData[i];
        
        // Process all reps in the filtered data
        const monthRepData = processRepData(filteredMonthData.data || []);
        
        let totalProfit = 0;
        let totalSpend = 0;
        let totalPacks = 0;
        let totalMargin = 0;
        let repCount = 0;
        
        monthRepData.forEach(rep => {
          totalProfit += rep.profit;
          totalSpend += rep.spend;
          totalPacks += rep.totalAccounts || 0;
          totalMargin += rep.margin;
          repCount++;
        });
        
        // Add average for the month
        if (repCount > 0) {
          averageData.profit.push({ 
            month: month.substring(0, 3), 
            value: totalProfit / repCount 
          });
          averageData.spend.push({ 
            month: month.substring(0, 3), 
            value: totalSpend / repCount 
          });
          averageData.packs.push({ 
            month: month.substring(0, 3), 
            value: totalPacks / repCount 
          });
          averageData.margin.push({ 
            month: month.substring(0, 3), 
            value: totalMargin / repCount 
          });
          
          console.log(`Team average for ${month} (filtered):`, {
            profit: totalProfit / repCount,
            spend: totalSpend / repCount,
            margin: totalMargin / repCount,
            repCount: repCount
          });
        }
      }
      
      // Prepare comparison data for each rep using the SAME filtered data approach
      const comparisonData = Array.from(repNames).map(repName => {
        const repData = {
          repName,
          profit: [] as { month: string; value: number }[],
          spend: [] as { month: string; value: number }[],
          packs: [] as { month: string; value: number }[],
          margin: [] as { month: string; value: number }[]
        };
        
        // For each month, get the rep's data using the same filtering approach
        for (let i = 0; i < months.length; i++) {
          const month = months[i];
          const table = monthlyTables[i];
          
          // Get the filtered data for this month (same as what we used for user data)
          const filteredMonthData = filteredMonthlyData[i];
          
          // Find this rep's data in the filtered dataset
          let repMonthData = filteredMonthData.data?.filter((item: any) => {
            const itemRepName = item.Rep || item.rep_name || '';
            return itemRepName.includes(repName) || repName.includes(itemRepName);
          }) || [];
          
          if (repMonthData.length > 0) {
            // Calculate metrics for this rep using the same method as user data
            const profitColumn = table === 'sales_data' ? 'profit' : 'Profit';
            const spendColumn = table === 'sales_data' ? 'spend' : 'Spend';
            const metrics = calculatePerformanceMetrics(repMonthData, profitColumn, spendColumn);
            
            repData.profit.push({ month: month.substring(0, 3), value: metrics.totalProfit });
            repData.spend.push({ month: month.substring(0, 3), value: metrics.totalSpend });
            repData.packs.push({ month: month.substring(0, 3), value: metrics.totalAccounts });
            repData.margin.push({ month: month.substring(0, 3), value: metrics.margin });
            
            console.log(`Comparison rep ${repName} in ${month}:`, {
              profit: metrics.totalProfit,
              spend: metrics.totalSpend,
              margin: metrics.margin,
              recordCount: repMonthData.length
            });
          } else {
            // No data for this rep in this month
            repData.profit.push({ month: month.substring(0, 3), value: 0 });
            repData.spend.push({ month: month.substring(0, 3), value: 0 });
            repData.packs.push({ month: month.substring(0, 3), value: 0 });
            repData.margin.push({ month: month.substring(0, 3), value: 0 });
          }
        }
        
        return repData;
      });
      
      // Only include reps with at least some data
      const filteredComparisonData = comparisonData.filter(
        rep => rep.profit.length > 0
      );
      
      // Sort by total profit (sum of all months) to get top performers
      const sortedByProfit = filteredComparisonData.sort((a, b) => {
        const totalProfitA = a.profit.reduce((sum, month) => sum + month.value, 0);
        const totalProfitB = b.profit.reduce((sum, month) => sum + month.value, 0);
        return totalProfitB - totalProfitA; // Descending order (highest first)
      });
      
      console.log('Final comparison data being set:', {
        totalReps: filteredComparisonData.length,
        repNames: filteredComparisonData.map(rep => rep.repName).sort(),
        topPerformers: sortedByProfit.slice(0, 5).map(rep => ({
          name: rep.repName,
          totalProfit: rep.profit.reduce((sum, month) => sum + month.value, 0)
        }))
      });
      
      // Set the state with the processed data
      setUserTrendsData(userData);
      setTeamAverageData(averageData);
      setRepComparisonData(sortedByProfit.slice(0, 5)); // Limit to top 5 performers by profit
      
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
        case 'June':
          currentMonthTableName = 'June_Data';
          break;
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
          currentMonthTableName = 'June_Data';
      }
      
      // Determine comparison data source based on compareMonth selection
      let compareMonthTableName: string;
      switch (compareMonth) {
        case 'June':
          compareMonthTableName = compareMonth === accountHealthMonth ? 'May_Data' : 'June_Data';
          break;
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
            // Handle different column names: sales_data uses 'rep_type', others use 'Department'
            const department = item.Department || item.department || item.rep_type || '';
            if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
            if (!includeReva && department.toUpperCase() === 'REVA') return false;
            if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
            return true;
          });
          
          filteredCompareData = filteredCompareData.filter((item: any) => {
            // Handle different column names: sales_data uses 'rep_type', others use 'Department'
            const department = item.Department || item.department || item.rep_type || '';
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
          // Handle different column names: sales_data uses 'rep_type', others use 'Department'
          const department = item.Department || item.department || item.rep_type || '';
          if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
          if (!includeReva && department.toUpperCase() === 'REVA') return false;
          if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
          return true;
        });
        
        filteredCompareData = filteredCompareData.filter((item: any) => {
          // Handle different column names: sales_data uses 'rep_type', others use 'Department'
          const department = item.Department || item.department || item.rep_type || '';
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
          case 'June_Data':
            query = supabase
              .from('June_Data')
              .select('*')
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
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
  
  // Helper function to fetch user-specific data from a table
  const fetchUserDataFromTable = async (tableName: string, matchName: string) => {
    console.log(`Fetching user data from table: ${tableName} for user: ${matchName}`);
    const PAGE_SIZE = 1000;
    let allData: any[] = [];
    let page = 0;
    let hasMoreData = true;
    
    while (hasMoreData) {
      try {
        let query;
        
        switch (tableName) {
          case 'June_Data':
            query = supabase
              .from('June_Data')
              .select('*')
              .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            break;
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
          console.error(`Error fetching from ${tableName}:`, error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          
          // If we got less than PAGE_SIZE records, we've reached the end
          if (data.length < PAGE_SIZE) {
            hasMoreData = false;
          }
        } else {
          hasMoreData = false;
        }
        
        console.log(`Fetched page ${page} from ${tableName} for user ${matchName}: ${data?.length || 0} records`);
      } catch (error) {
        console.error(`Error fetching page ${page} from ${tableName}:`, error);
        hasMoreData = false;
      }
    }
    
    console.log(`Total records fetched from ${tableName} for user ${matchName}: ${allData.length}`);
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
    currentData.forEach((item, index) => {
      // Try multiple ways to get account reference
      const accountRef = item['Account Ref'] || item.account_ref || item.AccountRef || '';
      const accountName = item['Account Name'] || item.account_name || item.AccountName || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                     typeof item.profit === 'number' ? item.profit : 0;
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                    typeof item.spend === 'number' ? item.spend : 0;
      // Get the rep name - either from Rep or rep_name field depending on the table structure
      const repName = item.Rep || item.rep_name || '';
      
      // If no account ref, create one from account name + rep name
      const effectiveAccountRef = accountRef || 
        (accountName && repName ? `${accountName}_${repName}` : '') ||
        (accountName ? accountName : '');
      
      // Only process if we have some way to identify the account and it has meaningful data
      if (effectiveAccountRef && (profit !== 0 || spend !== 0)) {
        currentAccounts.set(effectiveAccountRef, {
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
      // Try multiple ways to get account reference
      const accountRef = item['Account Ref'] || item.account_ref || item.AccountRef || '';
      const accountName = item['Account Name'] || item.account_name || item.AccountName || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                     typeof item.profit === 'number' ? item.profit : 0;
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                    typeof item.spend === 'number' ? item.spend : 0;
      // Get the rep name from previous data if available
      const prevRepName = item.Rep || item.rep_name || '';
      
      // If no account ref, create one from account name + rep name (same logic as current data)
      const effectiveAccountRef = accountRef || 
        (accountName && prevRepName ? `${accountName}_${prevRepName}` : '') ||
        (accountName ? accountName : '');
      
      if (effectiveAccountRef && (profit !== 0 || spend !== 0)) {
        previousAccounts.set(effectiveAccountRef, {
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
  
  // Render the page content directly (AppLayout wrapper is handled at App level)
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent overflow-x-hidden">
        {/* Simple filter controls without header styling */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Department filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIncludeRetail(!includeRetail)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                includeRetail 
                  ? 'bg-finance-red text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Retail
            </button>
            <button
              onClick={() => setIncludeReva(!includeReva)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                includeReva 
                  ? 'bg-finance-red text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              REVA
            </button>
            <button
              onClick={() => setIncludeWholesale(!includeWholesale)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                includeWholesale 
                  ? 'bg-finance-red text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Wholesale
            </button>
          </div>
          
          {/* Month selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-700 bg-gray-900/70 text-white hover:bg-gray-800 transition-colors focus:outline-none">
              <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Month: {selectedMonth}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-950/95 backdrop-blur-sm border border-white/5 z-50">
              <DropdownMenuItem 
                className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
                onClick={() => setSelectedMonth('June')}
              >
                June 2025
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
                onClick={() => setSelectedMonth('May')}
              >
                May 2025
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
                onClick={() => setSelectedMonth('April')}
              >
                April 2025
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
                onClick={() => setSelectedMonth('March')}
              >
                March 2025
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" 
                onClick={() => setSelectedMonth('February')}
              >
                February 2025
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
