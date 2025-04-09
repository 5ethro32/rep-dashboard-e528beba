
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

const AccountPerformance = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('April');
  const [currentMonthRawData, setCurrentMonthRawData] = useState<any[]>([]);
  const [previousMonthRawData, setPreviousMonthRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchComparisonData = async () => {
      setIsLoading(true);
      try {
        // Determine which tables to fetch from based on the selected month
        // We need to use exact table names that match Supabase types
        let currentTable: "mtd_daily" | "sales_data_daily" | "sales_data_februrary";
        let previousTable: "mtd_daily" | "sales_data_daily" | "sales_data_februrary" | null;
        
        switch (selectedMonth) {
          case 'April':
            currentTable = "mtd_daily"; // April data
            previousTable = "sales_data_daily"; // March data
            break;
          case 'March':
            currentTable = "sales_data_daily"; // March data
            previousTable = "sales_data_februrary"; // February data
            break;
          case 'February':
            currentTable = "sales_data_februrary"; // February data
            previousTable = null; // No January data available
            break;
          default:
            currentTable = "sales_data_daily"; // Default to March
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
        <div className="flex justify-between items-center mb-6">
          <Link to="/rep-performance">
            <Button variant="ghost" className="text-white hover:bg-white/10 ml-0 pl-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
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
