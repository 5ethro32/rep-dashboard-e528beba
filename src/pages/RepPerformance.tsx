
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
import { BarChart3, ClipboardList, Database } from 'lucide-react';
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
  } = useRepPerformanceData();
  
  const activeData = getActiveData('overall');
  const isMobile = useIsMobile();
  
  // Initial data loading - ensure all data is loaded without pagination
  useEffect(() => {
    console.log('RepPerformance: Initial data load starting');
    loadDataFromSupabase();
  }, []);
  
  // Since we've removed the toggle functionality, we always include all departments
  const includeRetail = true;
  const includeReva = true;
  const includeWholesale = true;
  
  // Create a wrapper function to make RenderChangeIndicator compatible with the expected type
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
  
  // Get data source information based on selected month
  const getDataSourceInfo = () => {
    switch (selectedMonth) {
      case 'April':
        return {
          current: 'April Data table',
          comparison: 'March Data MTD table',
          comparisonMonth: 'March (MTD)'
        };
      case 'March':
        return {
          current: 'March Data table',
          comparison: 'February Data table',
          comparisonMonth: 'February'
        };
      case 'February':
        return {
          current: 'February Data table',
          comparison: 'None - no comparison data available',
          comparisonMonth: 'None'
        };
      default:
        return {
          current: 'Unknown',
          comparison: 'Unknown',
          comparisonMonth: 'Unknown'
        };
    }
  };
  
  const dataSourceInfo = getDataSourceInfo();
  
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
        
        {/* Data Source Information Banner */}
        <div className="mb-4 p-3 bg-gray-800/40 border border-gray-700/40 rounded-lg text-xs">
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-white/90">Data Sources:</p>
              <p className="text-white/70">
                Current month ({selectedMonth} 2025): <span className="text-white/90">{dataSourceInfo.current}</span>
              </p>
              <p className="text-white/70">
                Comparison data: <span className="text-white/90">{dataSourceInfo.comparison}</span>
              </p>
              <p className="text-gray-400 italic mt-1">
                Note: April metrics are compared to March MTD data; March is compared to February.
              </p>
            </div>
          </div>
        </div>

        <SummaryMetrics 
          summary={summary}
          summaryChanges={summaryChanges}
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
        />
      </div>
      <ChatInterface selectedMonth={selectedMonth} />
    </div>
  );
};

export default RepPerformance;
