import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { formatCurrency } from '@/utils/rep-performance-utils';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import { toast } from '@/components/ui/use-toast';
import AccountSummaryCards from '@/components/rep-performance/AccountSummaryCards';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';

type AllowedTable = 'mtd_daily' | 'sales_data' | 'sales_data_februrary' | 'Prior_Month_Rolling' | 'May_Data';
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
};
interface AccountPerformanceProps {
  selectedUserId?: string | null;
  selectedUserName?: string;
}
const AccountPerformance = ({
  selectedUserId: propSelectedUserId = "all",
  selectedUserName: propSelectedUserName = "All Data"
}: AccountPerformanceProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('May');
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
  const isMobile = useIsMobile();
  const {
    user,
    isAdmin
  } = useAuth();

  // Use the props directly
  const [selectedUserId, setSelectedUserId] = useState<string | null>(propSelectedUserId);
  const [selectedUserName, setSelectedUserName] = useState<string>(propSelectedUserName);

  // Update local state when props change
  useEffect(() => {
    if (propSelectedUserId) {
      setSelectedUserId(propSelectedUserId);
    }
    if (propSelectedUserName) {
      setSelectedUserName(propSelectedUserName);
    }
  }, [propSelectedUserId, propSelectedUserName]);
  useEffect(() => {
    fetchComparisonData();
  }, [selectedMonth, selectedUserId, selectedUserName]);

  // Handle user selection change
  const handleUserChange = (userId: string | null, displayName: string) => {
    console.log(`User changed to: ${displayName} (${userId})`);
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
        if (profileData) {
          const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
          console.log(`Filtering for current user using profile name: "${fullName}"`);
          if (fullName) {
            return allRecords.filter(item => {
              const rep = item.Rep || item.rep_name || '';
              const subRep = item['Sub-Rep'] || item.sub_rep || '';
              return rep === fullName || subRep === fullName;
            });
          }
        }

        // Fallback to email username if profile name isn't available
        if (user.email) {
          const username = user.email.split('@')[0];
          const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
          console.log(`Fallback: Filtering for username: "${capitalizedUsername}"`);
          return allRecords.filter(item => {
            const rep = item.Rep || item.rep_name || '';
            const subRep = item['Sub-Rep'] || item.sub_rep || '';
            return rep.includes(capitalizedUsername) || subRep.includes(capitalizedUsername);
          });
        }
        console.warn('Could not determine user name for filtering - showing all data as fallback');
        return allRecords; // Fallback: show all data if we can't determine the user name
      }

      // For a specific user (not the current user), filter by the selected user name
      return allRecords.filter(item => {
        const rep = item.Rep || item.rep_name || '';
        const subRep = item['Sub-Rep'] || item.sub_rep || '';
        return rep === selectedUserName || subRep === selectedUserName;
      });
    }

    // This should never happen (we've handled both "all" and specific user cases)
    // But just in case, return all records
    return allRecords;
  };
  const fetchComparisonData = async () => {
    setIsLoading(true);
    try {
      let currentTable: AllowedTable;
      let previousTable: AllowedTable | null;
      switch (selectedMonth) {
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

        // Build maps with account ref as key and spend as value
        currentData.forEach((item: DataItem) => {
          const accountRef = item["Account Ref"] || item.account_ref || '';
          const spend = typeof item.Spend === 'number' ? item.Spend : typeof item.spend === 'number' ? item.spend : 0;
          if (accountRef) {
            currentAccountMap.set(accountRef, spend);
          }
        });
        previousData.forEach((item: DataItem) => {
          const accountRef = item["Account Ref"] || item.account_ref || '';
          const spend = typeof item.Spend === 'number' ? item.Spend : typeof item.spend === 'number' ? item.spend : 0;
          if (accountRef) {
            previousAccountMap.set(accountRef, spend);
          }
        });
        let increasingCount = 0;
        let decreasingCount = 0;

        // Compare the accounts that exist in both periods
        currentAccountMap.forEach((currentSpend, accountRef) => {
          const previousSpend = previousAccountMap.get(accountRef);

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

  // Helper function to generate heading with gradient username
  const renderPageHeading = () => {
    if (selectedUserId === "all") {
      return (
        <>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-700 to-finance-red">
            Aver's
          </span>{' '}
          Accounts Performance
        </>
      );
    } else {
      // Extract first name
      const firstName = selectedUserName === 'My Data' ? 'My' : selectedUserName.split(' ')[0];

      // Add apostrophe only if it's not "My"
      const displayName = firstName === 'My' ? 'My' : `${firstName}'s`;
      return (
        <>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-700 to-finance-red">
            {displayName}
          </span>{' '}
          Accounts Performance
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
  
  return <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-8 bg-transparent overflow-x-hidden">
      {/* Title and Description */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {renderPageHeading()}
        </h1>
        <p className="text-white/60">
          {getPageDescription()}
        </p>
      </div>
      
      {/* Month dropdown, now without the refresh button */}
      <div className="mb-6 flex items-center space-x-4">
        <PerformanceHeader selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} hideTitle={true} reducedPadding={true} />
      </div>
      
      {/* Large card containing account summary */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-0 mb-6">
        <CardContent>
          <AccountSummaryCards currentMonthData={currentMonthRawData} previousMonthData={previousMonthRawData} isLoading={isLoading} selectedUser={selectedUserId !== "all" ? selectedUserName : undefined} accountsTrendData={accountsTrendData} />
        </CardContent>
      </Card>
      
      <div className="mb-12">
        <AccountPerformanceComparison currentMonthData={currentMonthRawData} previousMonthData={previousMonthRawData} isLoading={isLoading} selectedMonth={selectedMonth} formatCurrency={formatCurrency} selectedUser={selectedUserId !== "all" ? selectedUserName : undefined} />
      </div>
    </div>;
};
export default AccountPerformance;
