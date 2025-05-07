
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { formatCurrency } from '@/utils/rep-performance-utils';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AccountSummaryCards from '@/components/rep-performance/AccountSummaryCards';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

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

const AccountPerformance = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('May');
  const [currentMonthRawData, setCurrentMonthRawData] = useState<DataItem[]>([]);
  const [previousMonthRawData, setPreviousMonthRawData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState({ current: 0, previous: 0 });
  const [topRep, setTopRep] = useState({ name: '', profit: 0 });
  const isMobile = useIsMobile();
  const { user, isAdmin } = useAuth();
  
  // Add state for user selection, with "all" as default
  const [selectedUserId, setSelectedUserId] = useState<string | null>("all");
  const [selectedUserName, setSelectedUserName] = useState<string>('All Data');
  
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
  
  const fetchAllRecordsFromTable = async (table: AllowedTable, columnFilter?: { column: string, value: string }) => {
    console.log(`Fetching data from ${table} with filter:`, columnFilter);
    console.log(`Selected user: ${selectedUserName} (${selectedUserId})`);
    
    const PAGE_SIZE = 1000;
    let allRecords: any[] = [];
    let page = 0;
    let hasMoreData = true;
    
    while (hasMoreData) {
      const query = supabase
        .from(table)
        .select('*') as any;
      
      if (columnFilter) {
        query.eq(columnFilter.column, columnFilter.value);
      }
      
      const { data, error } = await query
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
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
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
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
      
      // Calculate top rep
      if (currentData && currentData.length > 0) {
        const repProfits = new Map();
        
        currentData.forEach((item: DataItem) => {
          const repName = item.Rep || item.rep_name || '';
          const profit = typeof item.Profit === 'number' ? item.Profit : 
                        (typeof item.profit === 'number' ? item.profit : 0);
          
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
        
        setTopRep({ name: topRepName, profit: maxProfit });
      }
      
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate heading with gradient username
  const renderPageHeading = () => {
    if (selectedUserId === "all") {
      return (
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">
            All
          </span>{' '}
          Account Performance
        </h1>
      );
    } else {
      // If it's "My Data", just use "My", otherwise use the name with apostrophe
      const nameToShow = selectedUserName === 'My Data' ? 'My' : `${selectedUserName}'s`;
      
      return (
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">
            {nameToShow}
          </span>{' '}
          Account Performance
        </h1>
      );
    }
  };

  return (
    <AppLayout 
      showChatInterface={!isMobile}
      selectedUserId={selectedUserId}
      onSelectUser={handleUserChange}
    >
      <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
        {/* Moved the month picker to the header section */}
        <div className="flex justify-between items-center mb-6">
          <div className="mb-6">
            {renderPageHeading()}
            <p className="text-white/60">
              {selectedUserId === "all"
                ? "Compare all accounts performance between months to identify declining or improving accounts."
                : selectedUserName && selectedUserName !== 'My Data' 
                  ? `Compare ${selectedUserName}'s accounts performance between months to identify declining or improving accounts.`
                  : "Compare your accounts performance between months to identify declining or improving accounts."}
            </p>
          </div>
          <div className="flex-shrink-0">
            <PerformanceHeader 
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              hideTitle={true}
            />
          </div>
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <Button 
            onClick={fetchComparisonData} 
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
        
        <AccountSummaryCards
          currentMonthData={currentMonthRawData}
          previousMonthData={previousMonthRawData}
          isLoading={isLoading}
          selectedUser={selectedUserId !== "all" ? selectedUserName : undefined}
        />
        
        <div className="mb-12">
          <AccountPerformanceComparison 
            currentMonthData={currentMonthRawData}
            previousMonthData={previousMonthRawData}
            isLoading={isLoading}
            selectedMonth={selectedMonth}
            formatCurrency={formatCurrency}
            selectedUser={selectedUserId !== "all" ? selectedUserName : undefined}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default AccountPerformance;
