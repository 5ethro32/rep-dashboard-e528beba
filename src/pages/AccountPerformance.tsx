
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { formatCurrency } from '@/utils/rep-performance-utils';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import ChatInterface from '@/components/chat/ChatInterface';
import AccountSummaryCards from '@/components/rep-performance/AccountSummaryCards';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Create a type for our available tables to ensure type safety
type AllowedTable = 'mtd_daily' | 'sales_data_daily' | 'sales_data_februrary' | 'sales_data' | 'sales_data_feb';

const AccountPerformance = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('April');
  const [currentMonthRawData, setCurrentMonthRawData] = useState<any[]>([]);
  const [previousMonthRawData, setPreviousMonthRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState({ current: 0, previous: 0 });
  const [topRep, setTopRep] = useState({ name: '', profit: 0 });
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchComparisonData = async () => {
      setIsLoading(true);
      try {
        // Determine which tables to fetch from based on the selected month
        let currentTable: AllowedTable;
        let previousTable: AllowedTable | null;
        
        switch (selectedMonth) {
          case 'April':
            currentTable = "mtd_daily"; // April data
            previousTable = "sales_data"; // March data
            break;
          case 'March':
            currentTable = "sales_data"; // March data
            previousTable = "sales_data_februrary"; // February data
            break;
          case 'February':
            currentTable = "sales_data_februrary"; // February data
            previousTable = null; // No January data available
            break;
          default:
            currentTable = "sales_data"; // Default to March
            previousTable = "sales_data_februrary"; // Default to February
        }
        
        console.log(`Fetching current month (${selectedMonth}) data from ${currentTable} and previous month data from ${previousTable || 'none'}`);
        
        // Fetch current month data using the exact table name
        const { data: currentData, error: currentError } = await supabase
          .from(currentTable)
          .select('*');
        
        if (currentError) throw currentError;
        
        // Fetch previous month data if available
        let previousData = [];
        if (previousTable) {
          const { data: prevData, error: previousError } = await supabase
            .from(previousTable)
            .select('*');
          
          if (previousError) throw previousError;
          previousData = prevData || [];
        }
        
        console.log(`Fetched ${currentData?.length || 0} records for ${selectedMonth} and ${previousData?.length || 0} for previous month`);
        
        setCurrentMonthRawData(currentData || []);
        setPreviousMonthRawData(previousData);
        
        // Calculate active accounts
        const currentActiveAccounts = new Set(currentData?.map(item => {
          // Handle different column naming between tables
          return item["Account Name"] || item.account_name;
        }).filter(Boolean)).size || 0;
        
        const previousActiveAccounts = new Set(previousData?.map(item => {
          // Handle different column naming between tables
          return item["Account Name"] || item.account_name;
        }).filter(Boolean)).size || 0;
        
        setActiveAccounts({
          current: currentActiveAccounts,
          previous: previousActiveAccounts
        });
        
        // Calculate top rep by profit
        if (currentData && currentData.length > 0) {
          // Group by rep and sum profits
          const repProfits = new Map();
          
          currentData.forEach(item => {
            // Handle different column naming conventions between tables
            const repName = item.Rep || item.rep_name || '';
            const profit = typeof item.Profit === 'number' ? item.Profit : 
                           (typeof item.profit === 'number' ? item.profit : 0);
            
            if (repName) {
              const currentProfit = repProfits.get(repName) || 0;
              repProfits.set(repName, currentProfit + profit);
            }
          });
          
          // Find rep with highest profit
          let maxProfit = 0;
          repProfits.forEach((profit, rep) => {
            if (profit > maxProfit) {
              maxProfit = profit;
              topRep = { name: rep, profit: maxProfit };
            }
          });
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
    
    fetchComparisonData();
  }, [selectedMonth]);

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <Users className="h-5 w-5 mr-2 text-finance-red" />
                Active Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeAccounts.current}</div>
              {activeAccounts.previous > 0 && (
                <div className={`text-sm ${activeAccounts.current >= activeAccounts.previous ? 'text-green-500' : 'text-finance-red'}`}>
                  {activeAccounts.current > activeAccounts.previous 
                    ? `+${activeAccounts.current - activeAccounts.previous} from previous month` 
                    : activeAccounts.current < activeAccounts.previous 
                      ? `-${activeAccounts.previous - activeAccounts.current} from previous month`
                      : "No change from previous month"}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">
                <Award className="h-5 w-5 mr-2 text-finance-red" />
                Top Rep by Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{topRep.name}</div>
              <div className="text-sm text-white/70">{formatCurrency(topRep.profit)} in {selectedMonth}</div>
            </CardContent>
          </Card>
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
