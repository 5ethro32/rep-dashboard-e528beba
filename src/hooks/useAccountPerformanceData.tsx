
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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

interface UseAccountPerformanceDataProps {
  selectedMonth: string;
  selectedUserId: string | null;
  user: any;
  selectedUserName: string;
}

export const useAccountPerformanceData = ({
  selectedMonth,
  selectedUserId,
  user,
  selectedUserName
}: UseAccountPerformanceDataProps) => {
  const [currentMonthRawData, setCurrentMonthRawData] = useState<DataItem[]>([]);
  const [previousMonthRawData, setPreviousMonthRawData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState({ current: 0, previous: 0 });
  const [topRep, setTopRep] = useState({ name: '', profit: 0 });

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

  useEffect(() => {
    fetchComparisonData();
  }, [selectedMonth, selectedUserId, selectedUserName]);

  return {
    currentMonthRawData,
    previousMonthRawData,
    isLoading,
    activeAccounts,
    topRep,
    fetchComparisonData
  };
};
