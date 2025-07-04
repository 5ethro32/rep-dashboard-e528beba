import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { formatCurrency } from '@/utils/rep-performance-utils';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import { toast } from '@/components/ui/use-toast';
import AccountSummaryCards from '@/components/rep-performance/AccountSummaryCards';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

interface AccountPerformanceProps {
  selectedUserId?: string | null;
  selectedUserName?: string;
}

type AllowedTable = 'mtd_daily' | 'sales_data' | 'sales_data_februrary' | 'Prior_Month_Rolling' | 'May_Data' | 'June_Data' | 'June_Data_Comparison';
type DataItem = {
  [key: string]: any;
  "Account Name"?: string;
  account_name?: string;
  "Account Ref"?: string;
  account_ref?: string;
  Rep?: string;
  rep_name?: string;
  "Sub-Rep"?: string;
  sub_rep?: string;
  Profit?: number;
  profit?: number;
  Spend?: number;
  spend?: number;
  Department?: string;
  department?: string;
};

const AccountPerformance: React.FC<AccountPerformanceProps> = ({ 
  selectedUserId: propSelectedUserId, 
  selectedUserName: propSelectedUserName 
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('July MTD');
  
  // Set dynamic page title
  usePageTitle();
  const [currentMonthRawData, setCurrentMonthRawData] = useState<DataItem[]>([]);
  const [previousMonthRawData, setPreviousMonthRawData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState({
    current: 0,
    previous: 0
  });
  const [topRep, setTopRep] = useState({
    name: '',
    profit: 0
  });
  const [accountsTrendData, setAccountsTrendData] = useState({
    increasing: 0,
    decreasing: 0
  });
  
  // Add state for department toggles
  const [includeRetail, setIncludeRetail] = useState<boolean>(true);
  const [includeReva, setIncludeReva] = useState<boolean>(true);
  const [includeWholesale, setIncludeWholesale] = useState<boolean>(true);
  
  const isMobile = useIsMobile();
  const {
    user,
    isAdmin
  } = useAuth();

  // State for selected user to filter by
  const [selectedUserId, setSelectedUserId] = useState<string | null>(propSelectedUserId || "all");
  const [selectedUserName, setSelectedUserName] = useState<string>(propSelectedUserName || "All Data");
  
  // Update local state when props change
  useEffect(() => {
    if (propSelectedUserId !== undefined) {
      setSelectedUserId(propSelectedUserId);
      setSelectedUserName(propSelectedUserName || "All Data");
      console.log('AccountPerformance - Props changed, updating selectedUserId to:', propSelectedUserId);
    }
  }, [propSelectedUserId, propSelectedUserName]);

  useEffect(() => {
    fetchComparisonData();
  }, [selectedMonth, selectedUserId, selectedUserName, includeRetail, includeReva, includeWholesale]);

  // Handle user selection change
  const handleUserChange = (userId: string | null, displayName: string) => {
    console.log(`AccountPerformance: User selection changed to ${displayName} (${userId})`);
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
    // Data will refresh due to the useEffect dependency
  };
  
  const fetchAllRecordsFromTable = async (table: AllowedTable, columnFilter?: {
    column: string;
    value: string;
  }) => {
    console.log(`Fetching data from ${table} with filter:`, columnFilter);
    console.log(`Selected user: ${selectedUserName} (${selectedUserId})`);
    const PAGE_SIZE = 1000;
    let allRecords: any[] = [];
    let page = 0;
    let hasMoreData = true;
    while (hasMoreData) {
      const query = supabase.from(table).select('*') as any;
      if (columnFilter) {
        query.eq(columnFilter.column, columnFilter.value);
      }
      const {
        data,
        error
      } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        page++;
        hasMoreData = data.length === PAGE_SIZE;
      } else {
        hasMoreData = false;
      }
    }

    // Filter by selected departments
    if (!includeRetail || !includeReva || !includeWholesale) {
      allRecords = allRecords.filter(item => {
        const department = item.Department || item.department || '';
        if (!includeRetail && department.toUpperCase() === 'RETAIL') return false;
        if (!includeReva && department.toUpperCase() === 'REVA') return false;
        if (!includeWholesale && (department.toUpperCase() === 'WHOLESALE' || department.toUpperCase() === 'TRADE')) return false;
        return true;
      });
    }

    // If "All Data" is selected, return all records (no filtering)
    if (selectedUserId === "all") {
      console.log(`Returning all data (${allRecords.length} records)`);
      return allRecords;
    }

    // If a specific user is selected (not "all")
    // This is the case for both "My Data" and specific other user selection
    if (selectedUserId !== "all") {
      console.log(`Filtering for user: ${selectedUserName} (${selectedUserId})`);

      // If it's "My Data", we need to get the current user's profile information
      if (selectedUserId === user?.id) {
        console.log('Getting profile for current user:', user.id);

        // Try to get the user's profile name from the profiles table
        const {
          data: profileData,
          error: profileError
        } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Continue with fallback approach
        }
        
        // IMPROVED: Create an array of possible name formats to match against
        let possibleNameFormats: string[] = [];
        
        // Add full name if profile data exists
        if (profileData) {
          const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
          console.log(`User's full name from profile: "${fullName}"`);
          
          if (fullName) {
            possibleNameFormats.push(fullName);
            
            // Also add first name only and last name only for more flexible matching
            if (profileData.first_name) possibleNameFormats.push(profileData.first_name.trim());
            if (profileData.last_name) possibleNameFormats.push(profileData.last_name.trim());
          }
        }
        
        // Add email username as a fallback option
        if (user.email) {
          const username = user.email.split('@')[0];
          const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
          possibleNameFormats.push(capitalizedUsername);
          
          // Also add the original username without capitalization
          possibleNameFormats.push(username);
        }
        
        // Remove any duplicates and empty strings
        possibleNameFormats = [...new Set(possibleNameFormats)].filter(Boolean);
        console.log('Possible name formats to match against:', possibleNameFormats);
        
        // NEW: Filter with improved logic - case insensitive and multiple possible matches
        if (possibleNameFormats.length > 0) {
          const filteredRecords = allRecords.filter(item => {
            // Get rep and sub-rep, convert to lowercase for case-insensitive comparison
            const rep = (item.Rep || item.rep_name || '').toLowerCase();
            const subRep = (item['Sub-Rep'] || item.sub_rep || '').toLowerCase();
            
            // Check if any of our possible name formats match
            return possibleNameFormats.some(name => {
              const lowerName = name.toLowerCase();
              // For "My Data", we check if the name is contained within the rep or sub-rep field
              // This is more lenient than the exact match used for other users
              return rep.includes(lowerName) || subRep.includes(lowerName);
            });
          });
          
          console.log(`Found ${filteredRecords.length} records matching user's possible names out of ${allRecords.length} total records`);
          return filteredRecords;
        }
        
        console.warn('Could not determine any valid name formats for filtering - showing all data as fallback');
        return allRecords; // Fallback: show all data if we can't determine any name formats
      }

      // For a specific user (not the current user), filter by the selected user name
      // Use more lenient matching (includes) instead of strict equality
      const filteredRecords = allRecords.filter(item => {
        const rep = (item.Rep || item.rep_name || '').toLowerCase();
        const subRep = (item['Sub-Rep'] || item.sub_rep || '').toLowerCase();
        const selectedNameLower = selectedUserName.toLowerCase();
        
        return rep.includes(selectedNameLower) || subRep.includes(selectedNameLower);
      });
      
      console.log(`Found ${filteredRecords.length} records for selected user ${selectedUserName}`);
      return filteredRecords;
    }

    // This should never happen (we've handled both "all" and specific user cases)
    // But just in case, return all records
    return allRecords;
  };
  
  const fetchComparisonData = async () => {
    setIsLoading(true);
    try {
      let currentTable: AllowedTable | any;
      let previousTable: AllowedTable | any | null;
      switch (selectedMonth) {
        case 'July':
          currentTable = "July_Data";
          previousTable = "July_Data_Comparison";
          break;
        case 'June':
          currentTable = "June_Data";
          previousTable = "June_Data_Comparison";
          break;
        case 'June 2':
          currentTable = "July_Data";
          previousTable = "July_Data_Comparison";
          break;
        case 'May':
          currentTable = "May_Data";
          previousTable = "Prior_Month_Rolling";
          break;
        case 'April':
          currentTable = "mtd_daily";
          previousTable = "sales_data";
          break;
        case 'March':
          currentTable = "sales_data";
          previousTable = "sales_data_februrary";
          break;
        case 'February':
          currentTable = "sales_data_februrary";
          previousTable = null;
          break;
        default:
          currentTable = "sales_data";
          previousTable = "sales_data_februrary";
      }
      console.log(`Fetching current month (${selectedMonth}) data from ${currentTable} and previous month data from ${previousTable || 'none'}`);
      let currentData: DataItem[] = [];
      currentData = await fetchAllRecordsFromTable(currentTable);
      console.log(`Fetched ${currentData?.length || 0} records for ${selectedMonth} from ${currentTable}`);
      if (currentData && currentData.length > 0) {
        console.log(`Sample record from ${currentTable}:`, currentData[0]);
      }
      let previousData: DataItem[] = [];
      if (previousTable) {
        previousData = await fetchAllRecordsFromTable(previousTable);
        console.log(`Fetched ${previousData?.length || 0} records for previous month from ${previousTable}`);
        if (previousData && previousData.length > 0) {
          console.log(`Sample record from ${previousTable}:`, previousData[0]);
        }
      }

      // Set state with fetched data
      setCurrentMonthRawData(currentData || []);
      setPreviousMonthRawData(previousData);

      // Calculate active accounts
      const currentActiveAccounts = new Set(currentData?.map((item: DataItem) => {
        return item["Account Name"] || item.account_name;
      }).filter(Boolean)).size || 0;
      const previousActiveAccounts = new Set(previousData?.map((item: DataItem) => {
        return item["Account Name"] || item.account_name;
      }).filter(Boolean)).size || 0;
      setActiveAccounts({
        current: currentActiveAccounts,
        previous: previousActiveAccounts
      });

      // Calculate increasing and decreasing spend accounts
      if (currentData && previousData && currentData.length > 0 && previousData.length > 0) {
        // Create maps for current and previous data to easily compare accounts
        const currentAccountMap = new Map();
        const previousAccountMap = new Map();

        // Helper function to create account key with fallback for June, July, and June 2 data
        const createAccountKey = (item: DataItem) => {
          const accountRef = item["Account Ref"] || item.account_ref || '';
          const accountName = item["Account Name"] || item.account_name || '';
          
          // For June, July, July MTD, and June 2 data, use name as fallback when ref is missing or empty
          if (selectedMonth === 'June' || selectedMonth === 'July' || selectedMonth === 'July MTD' || selectedMonth === 'June 2') {
            return accountRef && accountRef.trim() ? accountRef : accountName.trim().toLowerCase();
          }
          
          // For other months, use existing logic
          return accountRef;
        };

        // Build maps with account key and spend as value
        currentData.forEach((item: DataItem) => {
          const accountKey = createAccountKey(item);
          const spend = typeof item.Spend === 'number' ? item.Spend : typeof item.spend === 'number' ? item.spend : 0;
          if (accountKey) {
            currentAccountMap.set(accountKey, spend);
          }
        });
        previousData.forEach((item: DataItem) => {
          const accountKey = createAccountKey(item);
          const spend = typeof item.Spend === 'number' ? item.Spend : typeof item.spend === 'number' ? item.spend : 0;
          if (accountKey) {
            previousAccountMap.set(accountKey, spend);
          }
        });
        
        let increasingCount = 0;
        let decreasingCount = 0;

        // Compare the accounts that exist in both periods
        currentAccountMap.forEach((currentSpend, accountKey) => {
          const previousSpend = previousAccountMap.get(accountKey);

          // Only compare if the account existed in the previous period
          if (previousSpend !== undefined && previousSpend > 0) {
            if (currentSpend > previousSpend) {
              increasingCount++;
            } else if (currentSpend < previousSpend) {
              decreasingCount++;
            }
          }
        });
        
        setAccountsTrendData({
          increasing: increasingCount,
          decreasing: decreasingCount
        });
      } else {
        // Reset to zero if no data for comparison
        setAccountsTrendData({
          increasing: 0,
          decreasing: 0
        });
      }

      // Calculate top rep
      if (currentData && currentData.length > 0) {
        const repProfits = new Map();
        currentData.forEach((item: DataItem) => {
          const repName = item.Rep || item.rep_name || '';
          const profit = typeof item.Profit === 'number' ? item.Profit : typeof item.profit === 'number' ? item.profit : 0;
          if (repName) {
            const currentProfit = repProfits.get(repName) || 0;
            repProfits.set(repName, currentProfit + profit);
          }
        });
        let maxProfit = 0;
        let topRepName = '';
        repProfits.forEach((profit, rep) => {
          if (profit > maxProfit) {
            maxProfit = profit;
            topRepName = rep;
          }
        });
        setTopRep({
          name: topRepName,
          profit: maxProfit
        });
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate heading with white text username
  const renderPageHeading = () => {
    if (selectedUserId === "all") {
      return (
        <>
          Aver's Accounts
        </>
      );
    } else {
      // Extract first name
      const firstName = selectedUserName === 'My Data' ? 'My' : selectedUserName.split(' ')[0];

      // Add apostrophe only if it's not "My"
      const displayName = firstName === 'My' ? 'My' : `${firstName}'s`;
      return (
        <>
          {displayName} Accounts
        </>
      );
    }
  };
  
  const getPageDescription = () => {
    return selectedUserId === "all" 
      ? "Compare Aver's accounts performance between months to identify declining or improving accounts." 
      : selectedUserName && selectedUserName !== 'My Data' 
        ? `Compare ${selectedUserName.split(' ')[0]}'s accounts performance between months to identify declining or improving accounts.` 
        : "Compare your accounts performance between months to identify declining or improving accounts.";
  };
  
  // Use a div instead of AppLayout
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent overflow-x-hidden">
      {/* Add PerformanceFilters component - keep this as it contains the month selector */}
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
      
      {/* Update Card - remove the p-0 and fix the padding in CardContent */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 mb-6">
        <CardContent className="p-0"> {/* Remove padding from CardContent */}
          <AccountSummaryCards currentMonthData={currentMonthRawData} previousMonthData={previousMonthRawData} isLoading={isLoading} selectedUser={selectedUserId !== "all" ? selectedUserName : undefined} accountsTrendData={accountsTrendData} />
        </CardContent>
      </Card>
      
      <div className="mb-12">
        <AccountPerformanceComparison currentMonthData={currentMonthRawData} previousMonthData={previousMonthRawData} isLoading={isLoading} selectedMonth={selectedMonth} formatCurrency={formatCurrency} selectedUser={selectedUserId !== "all" ? selectedUserName : undefined} />
      </div>
    </div>
  );
};

export default AccountPerformance;
