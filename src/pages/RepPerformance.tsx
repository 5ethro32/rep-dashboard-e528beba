
import React, { useEffect } from 'react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import SummaryMetrics from '@/components/rep-performance/SummaryMetrics';
import PerformanceContent from '@/components/rep-performance/PerformanceContent';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { useRepPerformanceData } from '@/hooks/useRepPerformanceData';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import { RenderChangeIndicator } from '@/components/rep-performance/ChangeIndicators';
import ChatInterface from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { BarChart3, ClipboardList, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useIsMobile } from '@/hooks/use-mobile';

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
    setSelectedMonth,
    baseSummary,
    revaValues,
    wholesaleValues,
    aprBaseSummary,
    aprRevaValues,
    aprWholesaleValues,
  } = useRepPerformanceData();
  
  const activeData = getActiveData('overall');
  const isMobile = useIsMobile();
  
  const currentBaseSummary = selectedMonth === 'April' ? (aprBaseSummary || baseSummary) : baseSummary;
  const currentRevaValues = selectedMonth === 'April' ? (aprRevaValues || revaValues) : revaValues;
  const currentWholesaleValues = selectedMonth === 'April' ? (aprWholesaleValues || wholesaleValues) : wholesaleValues;
  
  // Initial data loading - ensure all data is loaded without pagination
  useEffect(() => {
    console.log('RepPerformance: Initial data load starting');
    loadDataFromSupabase();
  }, []);
  
  useEffect(() => {
    // Debug data availability for April
    if (selectedMonth === 'April') {
      console.log('RepPerformance: April data check', { 
        aprBaseSummary: !!aprBaseSummary, 
        aprRevaValues: !!aprRevaValues, 
        aprWholesaleValues: !!aprWholesaleValues,
        summary: summary,
        activeDataLength: activeData?.length || 0
      });
    }
  }, [selectedMonth, aprBaseSummary, aprRevaValues, aprWholesaleValues, activeData, summary]);
  
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
        
        {selectedMonth === 'April' && (
          <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
            <p className="text-xs text-yellow-200">
              Working to bypass the 1000 record limit in Supabase. Your data may be incomplete until this is resolved. We're implementing direct SQL queries as a workaround.
            </p>
          </div>
        )}

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
            // Convert to number before passing since getFebValue now returns string
            const previousValue = repName && metricType && metricValue !== undefined && changeValue !== undefined 
              ? parseFloat(getFebValue(repName, metricType, metricValue, changeValue))
              : 0;
              
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
          baseSummary={currentBaseSummary}
          revaValues={currentRevaValues}
          wholesaleValues={currentWholesaleValues}
        />
      </div>
      <ChatInterface selectedMonth={selectedMonth} />
    </div>
  );
};

export default RepPerformance;
