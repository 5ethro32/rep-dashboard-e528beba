
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { formatCurrency } from '@/utils/rep-performance-utils';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import ChatInterface from '@/components/chat/ChatInterface';
import AccountSummaryCards from '@/components/rep-performance/AccountSummaryCards';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useIsMobile } from '@/hooks/use-mobile';

// Update the type to only include valid table names from Supabase
type AllowedTable = 'mtd_daily' | 'sales_data' | 'sales_data_februrary';

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
  const [selectedMonth, setSelectedMonth] = useState<string>('April');
  const [currentMonthRawData, setCurrentMonthRawData] = useState<DataItem[]>([]);
  const [previousMonthRawData, setPreviousMonthRawData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState({ current: 0, previous: 0 });
  const [topRep, setTopRep] = useState({ name: '', profit: 0 });
  const isMobile = useIsMobile();
  
  useEffect(() => {
    fetchComparisonData();
  }, [selectedMonth]);
  
  const fetchComparisonData = async () => {
    setIsLoading(true);
    try {
      let currentTable: AllowedTable;
      let previousTable: AllowedTable | null;
      
      switch (selectedMonth) {
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
      
      // Fetch current month data
      let currentData: DataItem[] = [];
      if (currentTable === "sales_data") {
        // For March data in sales_data
        const { data, error } = await supabase
          .from(currentTable)
          .select('*');
        
        if (error) throw error;
        
        // Transform to match expected format
        currentData = data?.map((item: any) => ({
          "Account Name": item.account_name,
          "Account Ref": item.account_ref,
          "Rep": item.rep_name,
          "Sub-Rep": item.sub_rep,
          "Profit": item.profit,
          "Spend": item.spend,
          "Margin": item.margin,
          "Packs": item.packs,
          "Department": item.rep_type
        })) || [];
      } else {
        // For April (mtd_daily) or February data
        const { data, error } = await supabase
          .from(currentTable)
          .select('*');
        
        if (error) throw error;
        currentData = data || [];
      }
      
      // Fetch previous month data if applicable
      let previousData: DataItem[] = [];
      if (previousTable) {
        if (previousTable === "sales_data") {
          // For March data as previous month
          const { data, error } = await supabase
            .from(previousTable)
            .select('*');
          
          if (error) throw error;
          
          // Transform to match expected format
          previousData = data?.map((item: any) => ({
            "Account Name": item.account_name,
            "Account Ref": item.account_ref,
            "Rep": item.rep_name,
            "Sub-Rep": item.sub_rep,
            "Profit": item.profit,
            "Spend": item.spend,
            "Margin": item.margin,
            "Packs": item.packs,
            "Department": item.rep_type
          })) || [];
        } else {
          // For February data as previous month
          const { data, error } = await supabase
            .from(previousTable)
            .select('*');
          
          if (error) throw error;
          previousData = data || [];
        }
      }
      
      console.log(`Fetched ${currentData?.length || 0} records for ${selectedMonth} and ${previousData?.length || 0} for previous month`);
      
      setCurrentMonthRawData(currentData || []);
      setPreviousMonthRawData(previousData);
      
      // Calculate active accounts for current month
      const currentActiveAccounts = new Set(currentData?.map((item: DataItem) => {
        return item["Account Name"] || item.account_name;
      }).filter(Boolean)).size || 0;
      
      // Calculate active accounts for previous month
      const previousActiveAccounts = new Set(previousData?.map((item: DataItem) => {
        return item["Account Name"] || item.account_name;
      }).filter(Boolean)).size || 0;
      
      setActiveAccounts({
        current: currentActiveAccounts,
        previous: previousActiveAccounts
      });
      
      // Find top rep for current month
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
      
      toast({
        title: "Data loaded successfully",
        description: `Loaded ${currentData?.length || 0} records for ${selectedMonth}`,
      });
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
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
        <div className="flex justify-between items-center mb-6 pt-4">
          <Link to="/rep-performance">
            <Button variant="ghost" className="text-white hover:bg-white/10 ml-0 pl-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <UserProfileButton />
        </div>
        
        <PerformanceHeader 
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
        
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Account Performance Analysis</h1>
          <p className="text-white/60">
            Compare all accounts performance between months to identify declining or improving accounts.
          </p>
        </div>
        
        <div className="mb-4">
          <Button 
            onClick={fetchComparisonData} 
            disabled={isLoading}
            variant="default"
            className="bg-finance-red hover:bg-finance-red/80"
          >
            {isLoading ? "Loading data..." : "Refresh Data"}
          </Button>
        </div>
        
        <AccountSummaryCards
          currentMonthData={currentMonthRawData}
          previousMonthData={previousMonthRawData}
          isLoading={isLoading}
        />
        
        <div className="mb-12">
          <AccountPerformanceComparison 
            currentMonthData={currentMonthRawData}
            previousMonthData={previousMonthRawData}
            isLoading={isLoading}
            selectedMonth={selectedMonth}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
      <ChatInterface selectedMonth={selectedMonth} />
    </div>
  );
};

export default AccountPerformance;
