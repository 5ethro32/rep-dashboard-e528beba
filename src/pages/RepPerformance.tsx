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

const RepPerformance = () => {
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>("all");
  const [selectedUserName, setSelectedUserName] = useState("All Data");
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
  } = useRepPerformanceData(selectedUserId);

  // Handle user selection
  const handleSelectUser = (userId: string | null, displayName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(displayName);
  };
  
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
  };

  // Handle month selection with proper data refresh
  const handleMonthSelection = async (month: string) => {
    // Set month first to avoid UI flicker
    setSelectedMonth(month);
    // Then refresh data completely
    await loadDataFromSupabase();
    setAutoRefreshed(true);
  };
  
  // Get active data filtered by the selected user
  const activeData = getActiveData('overall');
  
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
  
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      <div className="flex justify-end pt-4">
        <UserProfileButton />
      </div>
      
      <PerformanceHeader 
        selectedMonth={selectedMonth}
        setSelectedMonth={handleMonthSelection}
        selectedUserId={selectedUserId}
        onSelectUser={handleSelectUser}
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
        selectedUserName={selectedUserName}
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
          selectedUserName={selectedUserName}
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
        selectedUserName={selectedUserName}
      />
    </div>
  );
};

export default RepPerformance;
