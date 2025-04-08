
import React from 'react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import SummaryMetrics from '@/components/rep-performance/SummaryMetrics';
import PerformanceContent from '@/components/rep-performance/PerformanceContent';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import { RenderChangeIndicator } from '@/components/rep-performance/ChangeIndicators';

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
  
  const activeData = getActiveData('overall');
  
  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
        <PerformanceHeader />
        
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
      </div>
    </div>
  );
};

export default RepPerformance;
