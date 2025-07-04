import React, { useState, useEffect } from 'react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import SummaryMetrics from '@/components/rep-performance/SummaryMetrics';
import PerformanceContent from '@/components/rep-performance/PerformanceContent';
import { formatCurrency, formatPercent, formatNumber, calculateSummary } from '@/utils/rep-performance-utils';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';
import { RenderChangeIndicator } from '@/components/rep-performance/ChangeIndicators';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePageTitle } from '@/hooks/usePageTitle';
import TrendLineChart from '@/components/rep-performance/TrendLineChart';
import { SummaryData } from '@/types/rep-performance.types';
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const RepPerformance = () => {
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Set dynamic page title
  usePageTitle();
  
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
    mayWholesaleValues,
    junBaseSummary,
    junRevaValues,
    junWholesaleValues,
    jun2BaseSummary,
    jun2RevaValues,
    jun2WholesaleValues,
    julBaseSummary,
    julRevaValues,
    julWholesaleValues,
    comparisonSummary,
    debugJuneData,
    debugMayDataTable,
    queryJulyComparisonTable,
    juneRepChanges,
    june2RepChanges,
    june2SummaryChanges,
    june2ComparisonSummary,
    julyRepChanges,
    clearJulyDataAndRecalculate,
    clearJulyDataAndRefresh,
    testJulyDataConsistency,
    verifyJulyComparisonDataSource,
    loadJulyComparisonDataProperly
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
      
      // Also expose rep changes data for the announcement banner
      // Use month-specific rep changes when June or July is selected for accurate comparison data
      const monthSpecificRepChanges = selectedMonth === 'June' ? juneRepChanges : (selectedMonth === 'June 2' || selectedMonth === 'July MTD') ? june2RepChanges : selectedMonth === 'July' ? julyRepChanges : repChanges;
      
      console.log('Exposing rep changes data for announcement banner:', {
        selectedMonth,
        usingJuneSpecificData: selectedMonth === 'June',
        usingJulySpecificData: selectedMonth === 'July',
        repChangesCount: Object.keys(monthSpecificRepChanges).length
      });
      
      // Add specific debugging for Michael McKay
      if (selectedMonth === 'June') {
        console.log('🔍 MICHAEL MCKAY DEBUGGING (JUNE):');
        console.log('June rep changes data for Michael McKay:', juneRepChanges['Michael McKay']);
        console.log('Regular rep changes data for Michael McKay:', repChanges['Michael McKay']);
        console.log('Full juneRepChanges object keys:', Object.keys(juneRepChanges));
        console.log('Full repChanges object keys:', Object.keys(repChanges));
        
        // Check if we're using default data
        if (Object.keys(juneRepChanges).length === 0) {
          console.log('⚠️ WARNING: juneRepChanges is empty! This might cause fallback to default data.');
        }
        
        // Show what data is actually being passed to announcement banner
        const actualDataToUse = Object.keys(monthSpecificRepChanges).length > 0 ? monthSpecificRepChanges : repChanges;
        console.log('Actual data being exposed to announcement banner:', actualDataToUse['Michael McKay']);
      }
      
      if (selectedMonth === 'July') {
        console.log('🔍 MICHAEL MCKAY DEBUGGING (JULY):');
        console.log('July rep changes data for Michael McKay:', julyRepChanges['Michael McKay']);
        console.log('Regular rep changes data for Michael McKay:', repChanges['Michael McKay']);
        console.log('Full julyRepChanges object keys:', Object.keys(julyRepChanges));
        console.log('Full repChanges object keys:', Object.keys(repChanges));
        
        // Check if we're using default data
        if (Object.keys(julyRepChanges).length === 0) {
          console.log('⚠️ WARNING: julyRepChanges is empty! This might cause fallback to default data.');
        }
        
        // Show what data is actually being passed to announcement banner
        const actualDataToUse = Object.keys(monthSpecificRepChanges).length > 0 ? monthSpecificRepChanges : repChanges;
        console.log('Actual data being exposed to announcement banner:', actualDataToUse['Michael McKay']);
      }
      
      window.repPerformanceData = {
        repChanges: monthSpecificRepChanges,
        selectedMonth: selectedMonth
      };
      
      // Expose debug functions for July investigation
      window.queryJulyComparisonTable = queryJulyComparisonTable;
      window.clearJulyDataAndRecalculate = clearJulyDataAndRecalculate;
      window.clearJulyDataAndRefresh = clearJulyDataAndRefresh;
      window.testJulyDataConsistency = testJulyDataConsistency;
      window.verifyJulyComparisonDataSource = verifyJulyComparisonDataSource;
      window.loadJulyComparisonDataProperly = loadJulyComparisonDataProperly;
    }
    return () => {
      // Cleanup when component unmounts
      if (window.repPerformanceRefresh) {
        console.log('Cleaning up global refresh handler');
        delete window.repPerformanceRefresh;
      }
      if (window.repPerformanceData) {
        delete window.repPerformanceData;
      }
    };
  }, [location.pathname, selectedMonth, repChanges, juneRepChanges, julyRepChanges, handleRefresh]); // Add handleRefresh to dependencies and make sure we update whenever data changes

  const activeData = getActiveData('overall');

  // Calculate filtered summary data for each month using the same calculation as metric cards
  const filteredFebSummary: SummaryData = calculateSummary(febBaseSummary, febRevaValues, febWholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredMarSummary: SummaryData = calculateSummary(baseSummary, revaValues, wholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredAprSummary: SummaryData = calculateSummary(aprBaseSummary, aprRevaValues, aprWholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredMaySummary: SummaryData = calculateSummary(mayBaseSummary, mayRevaValues, mayWholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredJunSummary: SummaryData = calculateSummary(junBaseSummary, junRevaValues, junWholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredJun2Summary: SummaryData = calculateSummary(jun2BaseSummary, jun2RevaValues, jun2WholesaleValues, includeRetail, includeReva, includeWholesale);
  const filteredJulSummary: SummaryData = calculateSummary(julBaseSummary, julRevaValues, julWholesaleValues, includeRetail, includeReva, includeWholesale);

  // Create the rep data object for the chart with month-specific data
  const repData = {
      february: getActiveData('rep', 'February'),
      march: getActiveData('rep', 'March'),
      april: getActiveData('rep', 'April'),
      may: getActiveData('rep', 'May'),
      june: getActiveData('rep', 'June'),
      june2: getActiveData('rep', 'June 2'),
      july: getActiveData('rep', 'July')
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

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      <PerformanceHeader 
        selectedMonth={selectedMonth} 
        setSelectedMonth={handleMonthSelection}
      />
      
      <PerformanceFilters 
        includeRetail={includeRetail} 
        setIncludeRetail={setIncludeRetail} 
        includeReva={includeReva} 
        setIncludeReva={setIncludeReva} 
        includeWholesale={includeWholesale} 
        setIncludeWholesale={setIncludeWholesale} 
        selectedMonth={selectedMonth} 
        setSelectedMonth={handleMonthSelection}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Wrap the SummaryMetrics in a Card */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-0 mb-8">
        <CardContent className="pt-4 py-[19px]">
          <SummaryMetrics 
            summary={summary} 
            summaryChanges={summaryChanges} 
            isLoading={isLoading} 
            includeRetail={includeRetail} 
            includeReva={includeReva} 
            includeWholesale={includeWholesale} 
            selectedMonth={selectedMonth} 
            comparisonSummary={comparisonSummary}
          />
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <TrendLineChart 
          febSummary={filteredFebSummary} 
          marchSummary={filteredMarSummary} 
          aprilSummary={filteredAprSummary} 
          maySummary={filteredMaySummary} 
          juneSummary={filteredJunSummary}
          julySummary={filteredJulSummary}
          isLoading={isLoading} 
          repDataProp={repData} 
          includeRetail={includeRetail} 
          includeReva={includeReva} 
          includeWholesale={includeWholesale} 
        />
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <div className="flex items-center gap-4 justify-end">
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <PerformanceContent 
        tabValues={['overall', 'rep', 'reva', 'wholesale']} 
        getActiveData={getActiveData} 
        sortData={sortData} 
        sortBy={sortBy} 
        sortOrder={sortOrder} 
        handleSort={handleSort} 
        repChanges={selectedMonth === 'June' ? juneRepChanges : (selectedMonth === 'June 2' || selectedMonth === 'July MTD') ? june2RepChanges : repChanges} 
        formatCurrency={formatCurrency} 
        formatPercent={formatPercent} 
        formatNumber={formatNumber} 
        renderChangeIndicator={(changeValue, size, metricType, repName, metricValue) => {
          const previousValue = getFebValue(repName, metricType, metricValue, changeValue);
          return <RenderChangeIndicator changeValue={changeValue} size={size === "small" ? "small" : "large"} previousValue={previousValue} />;
        }} 
        isLoading={isLoading} 
        getFebValue={getFebValue} 
        selectedMonth={selectedMonth} 
        summary={summary} 
        includeRetail={includeRetail} 
        includeReva={includeReva} 
        includeWholesale={includeWholesale} 
        baseSummary={selectedMonth === 'March' ? baseSummary : selectedMonth === 'February' ? febBaseSummary : selectedMonth === 'April' ? aprBaseSummary : selectedMonth === 'May' ? mayBaseSummary : selectedMonth === 'June' ? junBaseSummary : selectedMonth === 'June 2' ? jun2BaseSummary : selectedMonth === 'July' ? julBaseSummary : baseSummary} 
        revaValues={selectedMonth === 'March' ? revaValues : selectedMonth === 'February' ? febRevaValues : selectedMonth === 'April' ? aprRevaValues : selectedMonth === 'May' ? mayRevaValues : selectedMonth === 'June' ? junRevaValues : selectedMonth === 'June 2' ? jun2RevaValues : selectedMonth === 'July' ? julRevaValues : revaValues} 
        wholesaleValues={selectedMonth === 'March' ? wholesaleValues : selectedMonth === 'February' ? febWholesaleValues : selectedMonth === 'April' ? aprWholesaleValues : selectedMonth === 'May' ? mayWholesaleValues : selectedMonth === 'June' ? junWholesaleValues : selectedMonth === 'June 2' ? jun2WholesaleValues : selectedMonth === 'July' ? julWholesaleValues : wholesaleValues} 
      />
    </div>
  );
};

// Add the global window type declaration
declare global {
  interface Window {
    repPerformanceRefresh?: () => Promise<void>;
    repPerformanceData?: {
      repChanges: any;
      selectedMonth: string;
    };
    queryJulyComparisonTable?: () => Promise<void>;
    clearJulyDataAndRecalculate?: () => Promise<void>;
    clearJulyDataAndRefresh?: () => Promise<void>;
    testJulyDataConsistency?: () => Promise<void>;
    verifyJulyComparisonDataSource?: () => Promise<void>;
    loadJulyComparisonDataProperly?: () => Promise<any>;
  }
}

export default RepPerformance;
