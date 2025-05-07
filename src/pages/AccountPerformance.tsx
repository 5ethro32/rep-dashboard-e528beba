
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { formatCurrency } from '@/utils/rep-performance-utils';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import AccountSummaryCards from '@/components/rep-performance/AccountSummaryCards';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useIsMobile } from '@/hooks/use-mobile';
import UserSelector from '@/components/rep-tracker/UserSelector';
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
  
  // Add state for user selection
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('My Data');
  
  // Set current user as default on initial load
  useEffect(() => {
    if (user) {
      setSelectedUserId(user.id);
    }
  }, [user]);
  
  useEffect(() => {
    fetchComparisonData();
  }, [selectedMonth, selectedUserId]);
  
  // Handle user selection change
  const handleUserChange = (userId: string | null, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
    // Refresh data after user selection
    fetchComparisonData();
  };
  
  const fetchAllRecordsFromTable = async (table: AllowedTable, columnFilter?: { column: string, value: string }, userFilter?: string) => {
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
      
      // Add user filter if specified and not an admin
      if (userFilter && !isAdmin) {
        query.or(`Rep.eq.${userFilter},Sub-Rep.eq.${userFilter}`);
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
    
    // If an admin selects a specific user, filter data on the client side
    // This allows admins to still see all data initially but filter as needed
    if (userFilter && isAdmin && selectedUserId && selectedUserId !== user?.id) {
      return allRecords.filter(item => {
        const rep = item.Rep || item.rep_name || '';
        const subRep = item['Sub-Rep'] || item.sub_rep || '';
        return rep === selectedUserName || subRep === selectedUserName;
      });
    }
    
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
      console.log(`User filter: ${selectedUserName} (${selectedUserId})`);
      
      let currentData: DataItem[] = [];
      currentData = await fetchAllRecordsFromTable(currentTable, undefined, selectedUserName);
      
      console.log(`Fetched ${currentData?.length || 0} records for ${selectedMonth} from ${currentTable}`);

      if (currentData && currentData.length > 0) {
        // Log a sample record to help with debugging
        console.log(`Sample record from ${currentTable}:`, currentData[0]);
      }
      
      let previousData: DataItem[] = [];
      if (previousTable) {
        previousData = await fetchAllRecordsFromTable(previousTable, undefined, selectedUserName);
        console.log(`Fetched ${previousData?.length || 0} records for previous month from ${previousTable}`);

        if (previousData && previousData.length > 0) {
          // Log a sample record to help with debugging
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

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      <div className="flex justify-between items-center mb-6 pt-4">
        <Link to="/rep-performance">
          <Button variant="ghost" className="text-white hover:bg-white/10 ml-0 pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="flex items-center gap-3">
          {/* Add UserSelector component */}
          <UserSelector 
            selectedUserId={selectedUserId} 
            onSelectUser={handleUserChange}
            className="mr-2"
          />
          <UserProfileButton />
        </div>
      </div>
      
      <PerformanceHeader 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        hideTitle={true}
      />
      
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {selectedUserId && selectedUserId !== user?.id 
            ? `${selectedUserName} - Account Performance Analysis` 
            : "Account Performance Analysis"}
        </h1>
        <p className="text-white/60">
          {selectedUserId && selectedUserId !== user?.id 
            ? `Compare ${selectedUserName}'s accounts performance between months to identify declining or improving accounts.`
            : "Compare all accounts performance between months to identify declining or improving accounts."}
        </p>
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
        selectedUser={selectedUserId !== user?.id ? selectedUserName : undefined}
      />
      
      <div className="mb-12">
        <AccountPerformanceComparison 
          currentMonthData={currentMonthRawData}
          previousMonthData={previousMonthRawData}
          isLoading={isLoading}
          selectedMonth={selectedMonth}
          formatCurrency={formatCurrency}
          selectedUser={selectedUserId !== user?.id ? selectedUserName : undefined}
        />
      </div>
    </div>
  );
};

export default AccountPerformance;
