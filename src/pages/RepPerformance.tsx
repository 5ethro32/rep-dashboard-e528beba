
import React, { useEffect } from 'react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import SummaryMetrics from '@/components/rep-performance/SummaryMetrics';
import PerformanceContent from '@/components/rep-performance/PerformanceContent';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import { RenderChangeIndicator } from '@/components/rep-performance/ChangeIndicators';
import ChatInterface from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { BarChart3, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useIsMobile } from '@/hooks/use-mobile';

const RepPerformance = () => {
  const {
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
    selectedMonth,
    setSelectedMonth,
    baseSummary,
    revaValues,
    wholesaleValues,
    getFebValue,
    aprRepData,
    marchRepData,
    febRepData,
    aprRevaRepData,
    marchRevaRepData,
    febRevaRepData,
    aprWholesaleRepData,
    marchWholesaleRepData,
    febWholesaleRepData,
    marchBaseSummary,
    febBaseSummary,
    febDirectSummary,
    rawFebSummary  
  } = useRepPerformanceData();
  
  const activeData = getActiveData('overall');
  const isMobile = useIsMobile();
  
  useEffect(() => {
    console.log('RepPerformance: Initial data load starting');
    loadDataFromSupabase();
  }, []);
  
  const includeRetail = true;
  const includeReva = true;
  const includeWholesale = true;
  
  // IMPROVED: More robust previous month summary selection with better logging
  const getPreviousMonthSummary = () => {
    if (selectedMonth === 'April') {
      console.log("Using March data as previous month for April view:", marchBaseSummary);
      return marchBaseSummary;
    } else if (selectedMonth === 'March') {
      // CRITICAL FIX: Always use rawFebSummary for February data in March comparisons
      // This ensures we use the exact same raw data regardless of column naming differences
      console.log("Using raw February summary for March comparison:", rawFebSummary);
      
      // Additional validation to ensure we have valid data
      if (!rawFebSummary || typeof rawFebSummary !== 'object') {
        console.warn("Invalid rawFebSummary data for March comparison, fallback to febBaseSummary:", febBaseSummary);
        return febBaseSummary;
      }
      
      // Log all values to help with debugging
      console.log("February comparison metrics:", {
        rawFebSummary: {
          totalSpend: rawFebSummary.totalSpend,
          totalProfit: rawFebSummary.totalProfit,
          averageMargin: rawFebSummary.averageMargin,
          totalPacks: rawFebSummary.totalPacks
        },
        febBaseSummary: {
          totalSpend: febBaseSummary.totalSpend,
          totalProfit: febBaseSummary.totalProfit,
          averageMargin: febBaseSummary.averageMargin,
          totalPacks: febBaseSummary.totalPacks
        }
      });
      
      return rawFebSummary;
    }
    
    console.log("No previous month data available for", selectedMonth);
    return undefined;
  };
  
  // Log the previous month summary for debugging
  const previousMonthSummary = getPreviousMonthSummary();
  console.log("Previous month summary for", selectedMonth, ":", previousMonthSummary);
  
  const renderChangeIndicator = (
    changeValue: number, 
    size?: string, 
    metricType?: string, 
    repName?: string, 
    metricValue?: number
  ) => {
    return RenderChangeIndicator({ 
      changeValue, 
      size: size as "small" | "large" | undefined 
    });
  };
  
  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
        <div className="flex justify-end pt-4">
          <UserProfileButton />
        </div>
        
        <PerformanceHeader 
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
          <ActionsHeader 
            onRefresh={loadDataFromSupabase}
            isLoading={isLoading} 
          />
          
          <div className="flex space-x-2">
            <Link to="/account-performance">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/80 hover:text-white hover:bg-white/10 flex items-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Account Analysis
              </Button>
            </Link>
            
            <Link to="/rep-tracker">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/80 hover:text-white hover:bg-white/10 flex items-center"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Rep Tracker
              </Button>
            </Link>
          </div>
        </div>

        <SummaryMetrics 
          summary={summary}
          summaryChanges={summaryChanges}
          previousMonthSummary={previousMonthSummary}
          isLoading={isLoading}
          selectedMonth={selectedMonth}
          includeRetail={includeRetail}
          includeReva={includeReva}
          includeWholesale={includeWholesale}
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
          renderChangeIndicator={renderChangeIndicator}
          isLoading={isLoading}
          selectedMonth={selectedMonth}
          summary={summary}
          baseSummary={baseSummary}
          revaValues={revaValues}
          wholesaleValues={wholesaleValues}
          includeRetail={includeRetail}
          includeReva={includeReva}
          includeWholesale={includeWholesale}
          getFebValue={getFebValue}
          aprRepData={aprRepData}
          marchRepData={marchRepData}
          febRepData={febRepData}
          aprRevaRepData={aprRevaRepData}
          marchRevaRepData={marchRevaRepData}
          febRevaRepData={febRevaRepData}
          aprWholesaleRepData={aprWholesaleRepData}
          marchWholesaleRepData={marchWholesaleRepData}
          febWholesaleRepData={febWholesaleRepData}
        />
      </div>
      <ChatInterface selectedMonth={selectedMonth} />
    </div>
  );
};

export default RepPerformance;
