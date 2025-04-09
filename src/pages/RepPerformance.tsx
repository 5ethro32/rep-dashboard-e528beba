
import React from 'react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import SummaryMetrics from '@/components/rep-performance/SummaryMetrics';
import PerformanceContent from '@/components/rep-performance/PerformanceContent';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import { RenderChangeIndicator } from '@/components/rep-performance/ChangeIndicators';
import ChatInterface from '@/components/chat/ChatInterface';
import AccountPerformanceComparison from '@/components/rep-performance/AccountPerformanceComparison';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

const RepPerformance = () => {
  const {
    includeRetail,
    setIncludeRetail,
    includeReva,
    setIncludeReva,
    includeWholesale, 
    setIncludeWholesale,
    sortBy,
    sortOrder,
    summary,
    summaryChanges,
    repChanges,
    getActiveData,
    sortData,
    handleSort,
    isLoading,
    loadDataFromSupabase,
    getFebValue,
    selectedMonth,
    setSelectedMonth
  } = useRepPerformanceData();
  
  const [currentMonthRawData, setCurrentMonthRawData] = useState<any[]>([]);
  const [previousMonthRawData, setPreviousMonthRawData] = useState<any[]>([]);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);
  
  useEffect(() => {
    const fetchComparisonData = async () => {
      setIsComparisonLoading(true);
      try {
        // Determine which tables to fetch from based on the selected month
        let currentTable = '';
        let previousTable = '';
        
        switch (selectedMonth) {
          case 'April':
            currentTable = 'mtd_daily';
            previousTable = 'sales_data_daily'; // March data
            break;
          case 'March':
            currentTable = 'sales_data_daily';
            previousTable = 'sales_data_februrary'; // February data
            break;
          case 'February':
            currentTable = 'sales_data_februrary';
            previousTable = 'sales_data_februrary'; // No January data, use Feb as placeholder
            break;
          default:
            currentTable = 'sales_data_daily';
            previousTable = 'sales_data_februrary';
        }
        
        // Fetch current month data
        const { data: currentData, error: currentError } = await supabase
          .from(currentTable)
          .select('*');
        
        if (currentError) throw currentError;
        
        // Fetch previous month data
        const { data: previousData, error: previousError } = await supabase
          .from(previousTable)
          .select('*');
        
        if (previousError) throw previousError;
        
        setCurrentMonthRawData(currentData || []);
        setPreviousMonthRawData(previousData || []);
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      } finally {
        setIsComparisonLoading(false);
      }
    };
    
    fetchComparisonData();
  }, [selectedMonth]);
  
  const activeData = getActiveData('overall');
  
  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
        <PerformanceHeader 
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
        
        <ActionsHeader 
          onRefresh={loadDataFromSupabase}
          isLoading={isLoading} 
        />

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

        <SummaryMetrics 
          summary={summary}
          summaryChanges={summaryChanges}
          isLoading={isLoading}
          includeRetail={includeRetail}
          includeReva={includeReva}
          includeWholesale={includeWholesale}
          selectedMonth={selectedMonth}
        />
        
        <PerformanceContent
          tabValues={['overall', 'rep', 'reva', 'wholesale']}
          getActiveData={getActiveData}
          sortData={sortData}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSort={handleSort}
          repChanges={repChanges}
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
          formatNumber={formatNumber}
          renderChangeIndicator={(changeValue, size, metricType, repName, metricValue) => {
            const previousValue = getFebValue(repName, metricType, metricValue, changeValue);
            return (
              <RenderChangeIndicator 
                changeValue={changeValue} 
                size={size === "small" ? "small" : "large"}
                previousValue={previousValue}
              />
            );
          }}
          isLoading={isLoading}
          getFebValue={getFebValue}
          selectedMonth={selectedMonth}
        />
        
        {/* New Account Performance Comparison Section */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-white/90">
            Account Performance Analysis
          </h2>
          <AccountPerformanceComparison 
            currentMonthData={currentMonthRawData}
            previousMonthData={previousMonthRawData}
            isLoading={isComparisonLoading}
            selectedMonth={selectedMonth}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
      <ChatInterface selectedMonth={selectedMonth} />
    </div>
  );
};

export default RepPerformance;
