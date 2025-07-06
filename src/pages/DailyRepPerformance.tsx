import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { useDailyRepPerformanceData } from '@/hooks/useDailyRepPerformanceData';
import DailyProfitDistribution from '@/components/daily-rep-performance/DailyProfitDistribution';
import DailyMarginComparison from '@/components/daily-rep-performance/DailyMarginComparison';
import DailyRepProfitShare from '@/components/daily-rep-performance/DailyRepProfitShare';
import DailyDepartmentProfitShare from '@/components/daily-rep-performance/DailyDepartmentProfitShare';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DailyRepPerformance = () => {
  // Set dynamic page title
  usePageTitle('/ Daily Sales Performance');
  
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
    fetchRepDataForDepartment,
    departmentData
  } = useDailyRepPerformanceData();

  // Get data validation results
  const validation = validateData();

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      {/* Simple Header */}
      <header className="py-4 md:py-8 px-4 md:px-6 container max-w-7xl mx-auto animate-fade-in bg-transparent">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Daily Sales Performance</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Showing data for: {validation.dateRange}
            </span>
            <Button 
              onClick={refreshData} 
              disabled={loading.isLoading}
              variant="outline"
              size="sm"
            >
              {loading.isLoading ? 'Loading...' : 'Refresh Data'}
            </Button>
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

      {/* Summary Metrics Card */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 mb-8">
        <CardContent className="pt-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Revenue</p>
              <p className="text-xl font-bold text-white">
                £{(summary.revenue / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Profit</p>
              <p className="text-xl font-bold text-white">
                £{(summary.profit / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Margin</p>
              <p className="text-xl font-bold text-white">
                {summary.margin.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Orders</p>
              <p className="text-xl font-bold text-white">
                {summary.orders.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Chart Visualizations Grid */}
      {hasData && repTableData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Row - Bar Charts */}
          <div className="h-[300px] md:h-[400px]">
            <DailyProfitDistribution
              data={repTableData}
              comparisonData={repTableComparison}
              isLoading={loading.isLoading}
              showChangeIndicators={hasComparison}
            />
          </div>
          
          <div className="h-[300px] md:h-[400px]">
            <DailyMarginComparison
              data={repTableData}
              comparisonData={repTableComparison}
              isLoading={loading.isLoading}
              showChangeIndicators={hasComparison}
            />
          </div>
          
          {/* Bottom Row - Donut Charts */}
          <div className="h-[300px] md:h-[400px]">
            <DailyRepProfitShare
              data={repTableData}
              isLoading={loading.isLoading}
              totalProfit={summary.profit}
            />
          </div>
          
          <div className="h-[300px] md:h-[400px]">
            <DailyDepartmentProfitShare
              data={departmentData}
              filters={filters}
              isLoading={loading.isLoading}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading charts...</p>
        </div>
      )}

      {/* Debug Info */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 mb-4">
        <CardContent className="pt-4 py-4">
          <h3 className="text-sm font-semibold text-white mb-2">Debug Info:</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Has Data: {hasData ? 'Yes' : 'No'}</p>
            <p>Rep Table Data Count: {repTableData.length}</p>
            <p>Department Data Count: {departmentData.length}</p>
            <p>Total Records: {totalRecords}</p>
            <p>Loading: {loading.isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {loading.error || 'None'}</p>
          </div>
        </CardContent>
      </Card>

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
            <h3 className="text-lg font-semibold text-emerald-200">Chart Implementation Complete! 🎉</h3>
          </div>
          <div className="text-emerald-200 text-sm space-y-2">
            <p><strong>✅ New Charts Implemented:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Profit Distribution</strong> - Bar chart showing profit by rep</li>
              <li><strong>Margin Comparison</strong> - Bar chart showing margin percentages</li>
              <li><strong>Profit Share by Rep</strong> - Donut chart with rep profit percentages</li>
              <li><strong>Profit Share by Department</strong> - Donut chart with department breakdown</li>
            </ul>
            <p className="mt-3 text-emerald-300">
              These charts are adapted from the RepPerformance page to work with daily data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyRepPerformance;