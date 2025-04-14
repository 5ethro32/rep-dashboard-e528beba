
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
import { Button } from '@/components/ui/button';
import { BarChart3, MessageCircle } from 'lucide-react';
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
    setSelectedMonth
  } = useRepPerformanceData();
  
  const activeData = getActiveData('overall');
  const isMobile = useIsMobile();
  
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
          
          <div className="flex gap-2">
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
            
            <Link to="/vera-ai">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/80 hover:text-white hover:bg-white/10 flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                VeraAI Chat
              </Button>
            </Link>
          </div>
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
      <ChatInterface selectedMonth={selectedMonth} />
    </div>
  );
};

export default RepPerformance;
