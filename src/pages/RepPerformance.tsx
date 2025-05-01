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
import RepSelector from '@/components/rep-performance/RepSelector';

const RepPerformance = () => {
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const isMobile = useIsMobile();
  const [compareRepsEnabled, setCompareRepsEnabled] = useState(false);
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  
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
  };

  // Handle month selection with proper data refresh
  const handleMonthSelection = async (month: string) => {
    // Set month first to avoid UI flicker
    setSelectedMonth(month);
    // Then refresh data completely
    await loadDataFromSupabase();
    setAutoRefreshed(true);
  };
  
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
  
  // Get all unique rep names from the data
  const getAllUniqueReps = () => {
    // Get data for all months - fix by removing the extra arguments
    const febData = getActiveData('rep');
    const marchData = getActiveData('rep');
    const aprilData = getActiveData('rep');
    
    // Get all unique rep names
    const uniqueReps = new Set<string>();
    
    // Add rep names from each month's data
    febData.forEach(rep => uniqueReps.add(rep.rep));
    marchData.forEach(rep => uniqueReps.add(rep.rep));
    aprilData.forEach(rep => uniqueReps.add(rep.rep));
    
    return Array.from(uniqueReps);
  };
  
  const handleToggleCompareReps = () => {
    setCompareRepsEnabled(prev => !prev);
    if (compareRepsEnabled) {
      setSelectedReps([]);
    }
  };
  
  const handleSelectRep = (rep: string) => {
    setSelectedReps(prevSelected => {
      if (prevSelected.includes(rep)) {
        return prevSelected.filter(selectedRep => selectedRep !== rep);
      } else {
        return [...prevSelected, rep];
      }
    });
  };
  
  const handleClearSelection = () => {
    setSelectedReps([]);
  };
  
  // Create the rep data object for the chart - fix by removing the extra arguments
  const repData = {
    february: getActiveData('rep'),
    march: getActiveData('rep'),
    april: getActiveData('rep')
  };
  
  // Get available reps for the selector
  const availableReps = getAllUniqueReps();
  
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
      
      {/* Chart controls section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 mt-4">
        <div className="mb-2 sm:mb-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToggleCompareReps}
            className={`mr-2 ${compareRepsEnabled ? 'bg-white/20' : 'bg-white/5'} text-white border-white/20`}
          >
            {compareRepsEnabled ? "Hide Rep Comparison" : "Compare Reps"}
          </Button>
        </div>
        
        {compareRepsEnabled && (
          <RepSelector
            availableReps={availableReps}
            selectedReps={selectedReps}
            onSelectRep={handleSelectRep}
            onClearSelection={handleClearSelection}
            maxSelections={5}
          />
        )}
      </div>
      
      {/* TrendLineChart positioned below SummaryMetrics, now with rep data */}
      <div className="mb-6">
        <TrendLineChart
          febSummary={filteredFebSummary}
          marchSummary={filteredMarSummary}
          aprilSummary={filteredAprSummary}
          isLoading={isLoading}
          repData={repData}
          compareRepsEnabled={compareRepsEnabled}
          selectedReps={selectedReps}
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
          selectedMonth === 'February' ? febBaseSummary : aprBaseSummary
        }
        revaValues={
          selectedMonth === 'March' ? revaValues : 
          selectedMonth === 'February' ? febRevaValues : aprRevaValues
        }
        wholesaleValues={
          selectedMonth === 'March' ? wholesaleValues : 
          selectedMonth === 'February' ? febWholesaleValues : aprWholesaleValues
        }
      />
    </div>
  );
};

export default RepPerformance;
