
import React, { useState, useEffect } from 'react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import SummaryMetrics from '@/components/rep-performance/SummaryMetrics';
import PerformanceContent from '@/components/rep-performance/PerformanceContent';
import { formatCurrency, formatPercent, formatNumber, calculateSummary } from '@/utils/rep-performance-utils';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import { RenderChangeIndicator } from '@/components/rep-performance/ChangeIndicators';
import { Button } from '@/components/ui/button';
import { BarChart3, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useIsMobile } from '@/hooks/use-mobile';
import TrendLineChart from '@/components/rep-performance/TrendLineChart';
import { SummaryData } from '@/types/rep-performance.types';
import { toast } from '@/components/ui/use-toast';

const RepPerformance = () => {
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const isMobile = useIsMobile();
  
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
  
  // Custom refresh handler to track if it's an auto refresh
  const handleRefresh = async () => {
    await loadDataFromSupabase();
    setAutoRefreshed(true);
    toast({
      title: "Data refreshed",
      description: "The latest performance data has been loaded.",
      duration: 3000
    });
  };

  // Enhanced month selection handler that updates all components
  const handleMonthSelection = async (month: string) => {
    console.log(`Changing month to ${month}...`);
    
    // Set month first to avoid UI flicker
    setSelectedMonth(month);
    
    try {
      // Then refresh data completely for the selected month
      await loadDataFromSupabase();
      setAutoRefreshed(true);
      
      console.log(`Month successfully changed to ${month}`);
      toast({
        title: `${month} data loaded`,
        description: `Performance data for ${month} 2025 has been loaded.`,
        duration: 3000
      });
    } catch (error) {
      console.error(`Error loading data for ${month}:`, error);
      toast({
        title: "Error loading data",
        description: `Could not load data for ${month}. Please try again.`,
        variant: "destructive",
        duration: 5000
      });
    }
  };
  
  // Calculate filtered summary data for each month using the same calculation as metric cards
  const filteredFebSummary: SummaryData = calculateSummary(
    febBaseSummary,
    febRevaValues,
    febWholesaleValues,
    includeRetail,
    includeReva,
    includeWholesale
  );
  
  const filteredMarSummary: SummaryData = calculateSummary(
    baseSummary,
    revaValues,
    wholesaleValues,
    includeRetail,
    includeReva,
    includeWholesale
  );
  
  const filteredAprSummary: SummaryData = calculateSummary(
    aprBaseSummary,
    aprRevaValues,
    aprWholesaleValues,
    includeRetail,
    includeReva,
    includeWholesale
  );
  
  const filteredMaySummary: SummaryData = calculateSummary(
    mayBaseSummary,
    mayRevaValues,
    mayWholesaleValues,
    includeRetail,
    includeReva,
    includeWholesale
  );
  
  // Create the rep data object for the chart with month-specific data
  // Memoize this to avoid recalculating on every render
  const repData = React.useMemo(() => ({
    february: getActiveData('rep', 'February'),
    march: getActiveData('rep', 'March'),
    april: getActiveData('rep', 'April'),
    may: getActiveData('rep', 'May')
  }), [
    selectedMonth, 
    includeRetail, 
    includeReva, 
    includeWholesale,
    // Include all data dependencies
    febBaseSummary, febRevaValues, febWholesaleValues,
    baseSummary, revaValues, wholesaleValues,
    aprBaseSummary, aprRevaValues, aprWholesaleValues,
    mayBaseSummary, mayRevaValues, mayWholesaleValues,
    getActiveData
  ]);
  
  // Effect to monitor data changes
  useEffect(() => {
    console.log('RepPerformance: Data or filters changed. Current month:', selectedMonth);
    console.log('Summary data for current month:', summary);
  }, [
    selectedMonth, 
    includeRetail, 
    includeReva, 
    includeWholesale, 
    summary, 
    repData
  ]);
  
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      <div className="flex justify-end pt-4">
        <UserProfileButton />
      </div>
      
      <PerformanceHeader 
        selectedMonth={selectedMonth}
        setSelectedMonth={handleMonthSelection}
      />
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <ActionsHeader 
          onRefresh={handleRefresh}
          isLoading={isLoading}
          autoRefreshed={autoRefreshed}
        />
        
        {/* Only show these buttons on non-mobile devices */}
        {!isMobile && (
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
        )}
      </div>

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

      <SummaryMetrics 
        summary={summary}
        summaryChanges={summaryChanges}
        isLoading={isLoading}
        includeRetail={includeRetail}
        includeReva={includeReva}
        includeWholesale={includeWholesale}
        selectedMonth={selectedMonth}
      />
      
      {/* TrendLineChart with enhanced capabilities */}
      <div className="mb-6">
        <TrendLineChart
          febSummary={filteredFebSummary}
          marchSummary={filteredMarSummary}
          aprilSummary={filteredAprSummary}
          maySummary={filteredMaySummary}
          isLoading={isLoading}
          repDataProp={repData}
          includeRetail={includeRetail}
          includeReva={includeReva}
          includeWholesale={includeWholesale}
        />
      </div>

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
        summary={summary}
        includeRetail={includeRetail}
        includeReva={includeReva}
        includeWholesale={includeWholesale}
        baseSummary={
          selectedMonth === 'March' ? baseSummary : 
          selectedMonth === 'February' ? febBaseSummary : 
          selectedMonth === 'April' ? aprBaseSummary : mayBaseSummary
        }
        revaValues={
          selectedMonth === 'March' ? revaValues : 
          selectedMonth === 'February' ? febRevaValues : 
          selectedMonth === 'April' ? aprRevaValues : mayRevaValues
        }
        wholesaleValues={
          selectedMonth === 'March' ? wholesaleValues : 
          selectedMonth === 'February' ? febWholesaleValues : 
          selectedMonth === 'April' ? aprWholesaleValues : mayWholesaleValues
        }
      />
    </div>
  );
};

export default RepPerformance;
