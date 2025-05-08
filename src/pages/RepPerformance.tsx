import React, { useState, useEffect } from 'react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import SummaryMetrics from '@/components/rep-performance/SummaryMetrics';
import PerformanceContent from '@/components/rep-performance/PerformanceContent';
import { formatCurrency, formatPercent, formatNumber, calculateSummary } from '@/utils/rep-performance-utils';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';
import { RenderChangeIndicator } from '@/components/rep-performance/ChangeIndicators';
import { useIsMobile } from '@/hooks/use-mobile';
import TrendLineChart from '@/components/rep-performance/TrendLineChart';
import { SummaryData } from '@/types/rep-performance.types';
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const RepPerformance = () => {
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
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
    setSelectedMonth,
    baseSummary,
    revaValues,
    wholesaleValues,
    aprBaseSummary,
    aprRevaValues,
    aprWholesaleValues,
    febBaseSummary,
    febRevaValues,
    febWholesaleValues,
    mayBaseSummary,
    mayRevaValues,
    mayWholesaleValues
  } = useRepPerformanceData();

  // Clear auto-refreshed status after a delay
  useEffect(() => {
    if (autoRefreshed) {
      const timer = setTimeout(() => {
        setAutoRefreshed(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoRefreshed]);

  // Handle month selection with proper data refresh
  const handleMonthSelection = async (month: string) => {
    // Set month first to avoid UI flicker
    setSelectedMonth(month);
    // Then refresh data completely
    await loadDataFromSupabase();
    setAutoRefreshed(true);
  };

  // Add specific handling for refresh from header
  const handleRefresh = async () => {
    console.log('RepPerformance: Refresh triggered from header');
    try {
      // Force a complete data reload but preserve the current month
      await loadDataFromSupabase();
      toast({
        title: "Data refreshed",
        description: `Refreshed data for ${selectedMonth}`,
        duration: 3000
      });
      setAutoRefreshed(true);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh failed",
        description: "There was a problem refreshing the data",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  // Connect to the global app layout - make the header refresh button use our local refresh handler
  useLayoutEffect(() => {
    // Expose refresh handler to window for the AppHeader to access
    if (location.pathname === '/rep-performance') {
      console.log('Setting up global refresh handler for RepPerformance');
      window.repPerformanceRefresh = handleRefresh;
    }
    return () => {
      // Cleanup when component unmounts
      if (window.repPerformanceRefresh) {
        console.log('Cleaning up global refresh handler');
        delete window.repPerformanceRefresh;
      }
    };
  }, [location.pathname, selectedMonth]); // Add selectedMonth as dependency

  const activeData = getActiveData('overall');

  // Calculate filtered summary data for each month using the same calculation as metric cards
  const filteredFebSummary: SummaryData = calculateSummary(febBaseSummary, febRevaValues, febWholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredMarSummary: SummaryData = calculateSummary(baseSummary, revaValues, wholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredAprSummary: SummaryData = calculateSummary(aprBaseSummary, aprRevaValues, aprWholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredMaySummary: SummaryData = calculateSummary(mayBaseSummary, mayRevaValues, mayWholesaleValues, includeRetail, includeReva, includeWholesale);

  // Create the rep data object for the chart with month-specific data
  const repData = {
    february: getActiveData('rep', 'February'),
    march: getActiveData('rep', 'March'),
    april: getActiveData('rep', 'April'),
    may: getActiveData('rep', 'May')
  };

  // Add debugging logs to verify we're getting different data for each month
  console.log('February rep data count:', repData.february.length);
  console.log('March rep data count:', repData.march.length);
  console.log('April rep data count:', repData.april.length);
  console.log('May rep data count:', repData.may.length);

  // Sample rep for debugging - show first rep's data across months if available
  if (repData.february.length > 0 && repData.march.length > 0 && repData.april.length > 0 && repData.may.length > 0) {
    const sampleRep = repData.february[0].rep;
    console.log(`Sample rep "${sampleRep}" data:`, {
      february: repData.february.find(r => r.rep === sampleRep)?.profit,
      march: repData.march.find(r => r.rep === sampleRep)?.profit,
      april: repData.april.find(r => r.rep === sampleRep)?.profit,
      may: repData.may.find(r => r.rep === sampleRep)?.profit
    });
  }
  return <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      <PerformanceHeader hideTitle={false} />
      
      <PerformanceFilters 
        includeRetail={includeRetail} 
        setIncludeRetail={setIncludeRetail} 
        includeReva={includeReva} 
        setIncludeReva={setIncludeReva} 
        includeWholesale={includeWholesale} 
        setIncludeWholesale={setIncludeWholesale} 
        selectedMonth={selectedMonth} 
        setSelectedMonth={handleMonthSelection} 
      />

      {/* Wrap the SummaryMetrics in a Card */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-0 mb-8">
        <CardContent className="pt-4 py-[19px]">
          <SummaryMetrics summary={summary} summaryChanges={summaryChanges} isLoading={isLoading} includeRetail={includeRetail} includeReva={includeReva} includeWholesale={includeWholesale} selectedMonth={selectedMonth} />
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <TrendLineChart febSummary={filteredFebSummary} marchSummary={filteredMarSummary} aprilSummary={filteredAprSummary} maySummary={filteredMaySummary} isLoading={isLoading} repDataProp={repData} includeRetail={includeRetail} includeReva={includeReva} includeWholesale={includeWholesale} />
      </div>

      <PerformanceContent tabValues={['overall', 'rep', 'reva', 'wholesale']} getActiveData={getActiveData} sortData={sortData} sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} repChanges={repChanges} formatCurrency={formatCurrency} formatPercent={formatPercent} formatNumber={formatNumber} renderChangeIndicator={(changeValue, size, metricType, repName, metricValue) => {
      const previousValue = getFebValue(repName, metricType, metricValue, changeValue);
      return <RenderChangeIndicator changeValue={changeValue} size={size === "small" ? "small" : "large"} previousValue={previousValue} />;
    }} isLoading={isLoading} getFebValue={getFebValue} selectedMonth={selectedMonth} summary={summary} includeRetail={includeRetail} includeReva={includeReva} includeWholesale={includeWholesale} baseSummary={selectedMonth === 'March' ? baseSummary : selectedMonth === 'February' ? febBaseSummary : selectedMonth === 'April' ? aprBaseSummary : mayBaseSummary} revaValues={selectedMonth === 'March' ? revaValues : selectedMonth === 'February' ? febRevaValues : selectedMonth === 'April' ? aprRevaValues : mayRevaValues} wholesaleValues={selectedMonth === 'March' ? wholesaleValues : selectedMonth === 'February' ? febWholesaleValues : selectedMonth === 'April' ? aprWholesaleValues : mayWholesaleValues} />
    </div>;
};

// Add the global window type declaration
declare global {
  interface Window {
    repPerformanceRefresh?: () => Promise<void>;
  }
}
export default RepPerformance;
