import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { useDailyRepPerformanceData } from '@/hooks/useDailyRepPerformanceData';
import DailyPerformanceFilters from '@/components/daily-rep-performance/DailyPerformanceFilters';
import DailySummaryMetrics from '@/components/daily-rep-performance/DailySummaryMetrics';
import DailyMonthlyTrendsChart from '@/components/daily-rep-performance/DailyMonthlyTrendsChart';
import DailyRepTableWithTabs from '@/components/daily-rep-performance/DailyRepTableWithTabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

const DailyRepPerformance = () => {
  // Set dynamic page title
  usePageTitle('/ Sales Performance');
  
  // Use the daily performance data hook
  const {
    dateRange,
    setDateRange,
    comparisonPeriod,
    summary,
    summaryChanges,
    repTableData,
    repTableComparison,
    repTableSorting,
    setRepTableSorting,
    filters,
    setFilters,
    loading,
    refreshData,
    hasData,
    hasComparison,
    hasRepTableData,
    totalRecords,
    validateData,
    fetchRepDataForDepartment
  } = useDailyRepPerformanceData();

  // Get data validation results
  const validation = validateData();

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      {/* Header with Filters */}
      <header className="py-4 md:py-8 px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent">
        <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-6">
          {/* Filters Section */}
          <div className="flex-shrink-0 lg:ml-auto">
            <DailyPerformanceFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              filters={filters}
              onFiltersChange={setFilters}
              onRefresh={refreshData}
              isLoading={loading.isLoading}
              isRefreshing={loading.isRefreshing}
              totalRecords={totalRecords}
            />
          </div>
        </div>
      </header>

      {/* Error Display */}
      {loading.error && (
        <Alert className="mb-6 bg-red-900/20 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            {loading.error}
          </AlertDescription>
        </Alert>
      )}



      {/* Metric Cards */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 p-0 mb-8">
        <CardContent className="pt-4 py-[19px]">
          <DailySummaryMetrics
            summary={summary}
            summaryChanges={summaryChanges}
            comparisonPeriod={comparisonPeriod}
            isLoading={loading.isLoading}
            hideRankings={true}
          />
        </CardContent>
      </Card>

      {/* Monthly Performance Trends Chart */}
      {hasData && (
        <div className="mb-8">
          <DailyMonthlyTrendsChart
            filters={filters}
            loading={loading.isLoading}
          />
        </div>
      )}

      {/* Rep Performance Table with Tabs */}
      {hasRepTableData && (
        <div className="mb-8">
          <DailyRepTableWithTabs
            data={repTableData}
            comparisonData={repTableComparison}
            sorting={repTableSorting}
            onSort={setRepTableSorting}
            isLoading={loading.isLoading}
            showChangeIndicators={hasComparison}
            filters={filters}
            dateRange="July MTD 2025"
            fetchRepDataForDepartment={fetchRepDataForDepartment}
          />
        </div>
      )}

      {/* No Data State */}
      {!hasData && !loading.isLoading && !loading.error && (
        <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <TrendingUp className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
            <p className="text-gray-400 mb-4">
              No records found for the selected date range and filters.
            </p>
            <p className="text-sm text-gray-500">
              Try adjusting your date range or filter settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Development Status */}
      <Card className="bg-emerald-900/20 border-emerald-500/20 mt-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-emerald-200">Phase 4 Complete! 🎉</h3>
          </div>
          <div className="text-emerald-200 text-sm space-y-2">
            <p><strong>✅ Implemented:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Calendar date picker with intelligent shortcuts</li>
              <li>Real-time data fetching from Daily_Data table</li>
              <li>Four metric cards with period-over-period comparisons</li>
              <li>Department filtering (Retail, REVA, Wholesale)</li>
              <li>Method filtering (EDI, Telesales) fixed and working properly</li>
              <li>Monthly trends chart with projection support</li>
              <li><strong>NEW: Rep performance table with telesales profit percentage</strong></li>
              <li><strong>NEW: Sortable columns with trend indicators and comparisons</strong></li>
              <li>Smart caching and performance optimization</li>
              <li>Data quality validation and insights</li>
            </ul>
            <p className="mt-3 text-emerald-300">
              <strong>🚀 Next Phase:</strong> Export functionality, advanced analytics, and mobile optimization
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyRepPerformance; 