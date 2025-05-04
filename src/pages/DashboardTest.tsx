import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MetricCard from '@/components/MetricCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import useRealDataForTest from '@/hooks/useRealDataForTest';
import PerformanceTable from '@/components/test-dashboard/PerformanceTable';
import { RefreshCw, Bug, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { supabase } from '@/integrations/supabase/client';

const DashboardTest: React.FC = () => {
  // Start with April which had the most data in our test
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const [directData, setDirectData] = useState<any>(null);
  const isMobile = useIsMobile();
  
  // Use our real data hook instead of dummy data
  const {
    combinedMetrics: metrics,
    combinedChanges: changes,
    combinedRepData,
    repData,
    revaData,
    wholesaleData,
    isLoading,
    includeRetail,
    includeReva,
    includeWholesale,
    setIncludeRetail,
    setIncludeReva,
    setIncludeWholesale,
    availableMonths,
    sortBy,
    sortOrder,
    handleSort,
    getPreviousValue: getRepPreviousValue,
    previousMonthMetrics
  } = useRealDataForTest(selectedMonth);
  
  // Directly query the database for the current month to verify data
  const fetchDirectData = async () => {
    try {
      console.log('Starting paginated direct data fetch');
      let allData: any[] = [];
      let hasMoreData = true;
      let offset = 0;
      const pageSize = 1000;  // Supabase default page size
      
      // Fetch data in chunks until we've got everything
      while (hasMoreData) {
        // Use manual fetch to avoid TypeScript issues, with pagination parameters
        const response = await fetch(
          `https://ukshnjjmsrhgvkwrzoah.supabase.co/rest/v1/unified_sales_data?reporting_month=eq.${selectedMonth}&limit=${pageSize}&offset=${offset}`, 
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI`,
              'Content-Type': 'application/json',
              'Content-Range': 'items=0-999'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const pageData = await response.json();
        console.log(`Fetched page ${offset/pageSize + 1} with ${pageData.length} records`);
        
        // Add this page's data to our accumulated result
        allData = [...allData, ...pageData];
        
        // Check if we've reached the end of the data
        if (pageData.length < pageSize) {
          hasMoreData = false;
        } else {
          // Move to the next page
          offset += pageSize;
        }
      }
      
      console.log(`Total records fetched: ${allData.length}`);
      
      // Calculate total spend and profit directly
      const totalSpend = allData.reduce((sum: number, record: any) => 
        sum + Number(record.spend || 0), 0) || 0;
      const totalProfit = allData.reduce((sum: number, record: any) => 
        sum + Number(record.profit || 0), 0) || 0;
      const totalPacks = allData.reduce((sum: number, record: any) => 
        sum + Number(record.packs || 0), 0) || 0;
        
      console.log('Paginated direct DB query results:', {
        recordCount: allData.length || 0,
        totalSpend,
        totalProfit,
        totalPacks,
        sampleRecord: allData[0]
      });
      
      setDirectData({
        count: allData.length || 0,
        totalSpend,
        totalProfit,
        totalPacks,
        margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
        sample: allData[0]
      });
    } catch (err) {
      console.error('Error in direct query:', err);
    }
  };
  
  // Directly query the database for the current month to verify data
  useEffect(() => {
    fetchDirectData();
  }, [selectedMonth]);
  
  // Direct metrics calculation that bypasses complex state management
  const fetchDirectMetrics = async () => {
    try {
      console.log(`Starting paginated metrics fetch for ${selectedMonth}...`);
      
      // Pagination setup
      let allData: any[] = [];
      let hasMoreData = true;
      let offset = 0;
      const pageSize = 1000;
      
      // Fetch all pages
      while (hasMoreData) {
        console.log(`Fetching metrics page ${offset/pageSize + 1}...`);
        
        // Use fetch API directly to avoid TypeScript issues
        const response = await fetch(
          `https://ukshnjjmsrhgvkwrzoah.supabase.co/rest/v1/unified_sales_data?reporting_month=eq.${selectedMonth}&limit=${pageSize}&offset=${offset}`, 
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const pageData = await response.json();
        console.log(`Got metrics page with ${pageData.length} records`);
        
        // Add this page to our results
        allData = [...allData, ...pageData];
        
        // Check if we've reached the end
        if (pageData.length < pageSize) {
          hasMoreData = false;
        } else {
          offset += pageSize;
        }
      }
      
      console.log(`Total metrics records: ${allData.length}`);
      
      // Filter by selected departments
      let filteredData = [...allData];
      
      if (!includeRetail) {
        filteredData = filteredData.filter(item => 
          !(item.department || '').toLowerCase().includes('retail'));
      }
      
      if (!includeReva) {
        filteredData = filteredData.filter(item => 
          !(item.department || '').toLowerCase().includes('reva'));
      }
      
      if (!includeWholesale) {
        filteredData = filteredData.filter(item => 
          !(item.department || '').toLowerCase().includes('wholesale'));
      }
      
      console.log(`After department filtering: ${filteredData.length} records`);
      
      // Calculate metrics directly from filtered data
      const directTotalSpend = filteredData.reduce((sum, item) => 
        sum + Number(item.spend || 0), 0);
        
      const directTotalProfit = filteredData.reduce((sum, item) => 
        sum + Number(item.profit || 0), 0);
        
      const directTotalPacks = filteredData.reduce((sum, item) => 
        sum + Number(item.packs || 0), 0);
        
      const directMargin = directTotalSpend > 0 ? 
        (directTotalProfit / directTotalSpend) * 100 : 0;
      
      console.log('Direct calculation results:', {
        totalSpend: directTotalSpend,
        totalProfit: directTotalProfit,
        totalPacks: directTotalPacks,
        margin: directMargin,
        recordCount: filteredData.length
      });
      
      // Update direct data state with more comprehensive info
      setDirectData({
        count: filteredData.length,
        totalSpend: directTotalSpend,
        totalProfit: directTotalProfit,
        totalPacks: directTotalPacks,
        margin: directMargin,
        filterInfo: {
          includeRetail,
          includeReva,
          includeWholesale
        },
        sample: filteredData[0]
      });
      
    } catch (err) {
      console.error('Error in direct metrics calculation:', err);
    }
  };
  
  // Call the direct metrics function when departments or month changes
  useEffect(() => {
    fetchDirectMetrics();
  }, [selectedMonth, includeRetail, includeReva, includeWholesale]);
  
  // Only show change indicators if we're viewing a month other than February
  const showChangeIndicators = selectedMonth !== 'February';
  
  // Create a change indicator for the KPI cards
  const renderChangeIndicator = (changeValue: number) => {
    if (!showChangeIndicators || Math.abs(changeValue) < 0.1) return undefined;
    
    return {
      value: `${Math.abs(changeValue).toFixed(1)}%`,
      type: changeValue > 0 ? 'increase' as const : 'decrease' as const
    };
  };
  
  // Get the actual previous month value for a metric
  const getPreviousMetricValue = (metricType: string, departmentType: string) => {
    // If we're on February or no comparison is needed, return 0
    if (!showChangeIndicators || !previousMonthMetrics) return 0;
    
    // Get the correct department metrics
    const deptMetrics = 
      departmentType === 'retail' ? previousMonthMetrics.retail :
      departmentType === 'reva' ? previousMonthMetrics.reva :
      departmentType === 'wholesale' ? previousMonthMetrics.wholesale : null;
    
    // If no metrics or the department isn't included, return 0
    if (!deptMetrics) return 0;
    
    // Return the actual value from previous month
    switch (metricType) {
      case 'spend': return deptMetrics.totalSpend || 0;
      case 'profit': return deptMetrics.totalProfit || 0;
      case 'packs': return deptMetrics.totalPacks || 0;
      case 'margin': return deptMetrics.averageMargin || 0;
      default: return 0;
    }
  };
  
  // Get combined previous values based on department toggles
  const getCombinedPreviousValue = (metricType: string) => {
    if (!showChangeIndicators) return 0;
    
    let total = 0;
    let metricCount = 0;
    
    if (includeRetail && previousMonthMetrics.retail) {
      metricCount++;
      switch (metricType) {
        case 'spend': total += previousMonthMetrics.retail.totalSpend || 0; break;
        case 'profit': total += previousMonthMetrics.retail.totalProfit || 0; break;
        case 'packs': total += previousMonthMetrics.retail.totalPacks || 0; break;
        case 'margin': total += previousMonthMetrics.retail.averageMargin || 0; break;
      }
    }
    
    if (includeReva && previousMonthMetrics.reva) {
      metricCount++;
      switch (metricType) {
        case 'spend': total += previousMonthMetrics.reva.totalSpend || 0; break;
        case 'profit': total += previousMonthMetrics.reva.totalProfit || 0; break;
        case 'packs': total += previousMonthMetrics.reva.totalPacks || 0; break;
        case 'margin': total += previousMonthMetrics.reva.averageMargin || 0; break;
      }
    }
    
    if (includeWholesale && previousMonthMetrics.wholesale) {
      metricCount++;
      switch (metricType) {
        case 'spend': total += previousMonthMetrics.wholesale.totalSpend || 0; break;
        case 'profit': total += previousMonthMetrics.wholesale.totalProfit || 0; break;
        case 'packs': total += previousMonthMetrics.wholesale.totalPacks || 0; break;
        case 'margin': total += previousMonthMetrics.wholesale.averageMargin || 0; break;
      }
    }
    
    // For margin, we need to average the values
    if (metricType === 'margin' && metricCount > 0) {
      return total / metricCount;
    }
    
    return total;
  };
  
  // Calculate comparison month for subtitle
  const getComparisonMonthText = () => {
    if (selectedMonth === 'March') return 'February';
    if (selectedMonth === 'April') return 'March';
    if (selectedMonth === 'May') return 'April';
    return '';
  };
  
  // Handle refresh with a reload of data
  const handleRefresh = () => {
    setAutoRefreshed(false);
    
    // Clear direct data to force a fresh fetch
    setDirectData(null);
    
    // Force data refresh by resetting month and setting it back
    const currentMonth = selectedMonth;
    
    // First set to empty to trigger cleanup
    setSelectedMonth('');
    
    // Small delay to ensure state updates cleanly
    setTimeout(() => {
      // Set back to original month to trigger new fetches
      setSelectedMonth(currentMonth);
      
      // Manually trigger the direct data fetches again
      fetchDirectData();
      fetchDirectMetrics();
      
      // Show refresh indicator
      setAutoRefreshed(true);
      
      // Hide the indicator after a delay
      setTimeout(() => setAutoRefreshed(false), 3000);
    }, 200);
  };
  
  // Simulated month selection handling
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };
  
  // For debugging - log the metrics when they change
  console.log('Dashboard metrics:', {
    totalSpend: metrics.totalSpend,
    totalProfit: metrics.totalProfit,
    totalPacks: metrics.totalPacks,
    averageMargin: metrics.averageMargin,
    previousMetrics: previousMonthMetrics,
    selectedMonth
  });
  
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-6 bg-transparent">
      {/* Header with title and back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center">
            Test Dashboard
            <Bug className="ml-2 h-5 w-5 text-yellow-500" />
          </h1>
        </div>
        
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="mr-2"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {autoRefreshed && (
            <span className="text-xs text-green-500">Data refreshed!</span>
          )}
        </div>
      </div>
      
      {/* Information alert */}
      {directData && directData.count === 1000 && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-md text-sm">
          <div className="flex items-start">
            <span className="text-yellow-500 mr-2 mt-0.5">⚠️</span>
            <div>
              <p className="font-medium text-white">Important: Possible Data Limitation</p>
              <p className="text-white/80 text-xs mt-1">
                Some queries are returning exactly 1000 records, which might indicate a limitation in the API. 
                Click the "Refresh All Data" button in the Debug Information section to ensure all data is loaded properly.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Month selector */}
      <Card className="mb-4 bg-gray-900/40 border-white/10">
        <CardContent className="p-4">
          <h2 className="text-sm font-medium mb-2">Select Month</h2>
          <div className="flex flex-wrap gap-2">
            {availableMonths.map(month => (
              <Button
                key={month}
                variant={month === selectedMonth ? "default" : "outline"}
                size="sm"
                onClick={() => handleMonthChange(month)}
              >
                {month}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Department filters */}
      <Card className="mb-6 bg-gray-900/40 border-white/10">
        <CardContent className="p-4">
          <h2 className="text-sm font-medium mb-2">Department Filters</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeRetail} 
                onChange={e => setIncludeRetail(e.target.checked)}
                className="form-checkbox h-4 w-4 text-green-600"
              />
              <span>Retail</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeReva} 
                onChange={e => setIncludeReva(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600" 
              />
              <span>REVA</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeWholesale} 
                onChange={e => setIncludeWholesale(e.target.checked)}
                className="form-checkbox h-4 w-4 text-purple-600" 
              />
              <span>Wholesale</span>
            </label>
          </div>
        </CardContent>
      </Card>
      
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up">
        {/* Revenue Card */}
        <MetricCard
          title="Revenue"
          value={formatCurrency(metrics.totalSpend || 0, 0)}
          change={renderChangeIndicator(changes.totalSpend)}
          subtitle={showChangeIndicators ? 
            `${getComparisonMonthText()}: ${formatCurrency(getCombinedPreviousValue('spend'), 0)}` : 
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
        
        {/* Profit Card */}
        <MetricCard
          title="Profit"
          value={formatCurrency(metrics.totalProfit || 0, 0)}
          change={renderChangeIndicator(changes.totalProfit)}
          subtitle={showChangeIndicators ? 
            `${getComparisonMonthText()}: ${formatCurrency(getCombinedPreviousValue('profit'), 0)}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        {/* Margin Card */}
        <MetricCard
          title="Margin"
          value={formatPercent(metrics.averageMargin || 0)}
          change={renderChangeIndicator(changes.averageMargin)}
          subtitle={showChangeIndicators ? 
            `${getComparisonMonthText()}: ${formatPercent(getCombinedPreviousValue('margin'))}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
        
        {/* Packs Card */}
        <MetricCard
          title="Packs"
          value={formatNumber(metrics.totalPacks || 0)}
          change={renderChangeIndicator(changes.totalPacks)}
          subtitle={showChangeIndicators ? 
            `${getComparisonMonthText()}: ${formatNumber(getCombinedPreviousValue('packs'))}` :
            selectedMonth === 'February' ? 'No comparison data available' : undefined
          }
          isLoading={isLoading}
        />
      </div>
      
      {/* Debug info for metrics */}
      <Card className="mb-6 bg-gray-900/40 border-white/10">
        <CardContent className="p-4">
          <h2 className="text-sm font-medium mb-2">Metrics Debug</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="font-bold">Raw Revenue</div>
              <div>{metrics.totalSpend}</div>
              <div>Formatted: {formatCurrency(metrics.totalSpend || 0, 0)}</div>
            </div>
            <div>
              <div className="font-bold">Raw Profit</div>
              <div>{metrics.totalProfit}</div>
              <div>Formatted: {formatCurrency(metrics.totalProfit || 0, 0)}</div>
            </div>
            <div>
              <div className="font-bold">Raw Margin</div>
              <div>{metrics.averageMargin}</div>
              <div>Formatted: {formatPercent(metrics.averageMargin || 0)}</div>
            </div>
            <div>
              <div className="font-bold">Raw Packs</div>
              <div>{metrics.totalPacks}</div>
              <div>Formatted: {formatNumber(metrics.totalPacks || 0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rep performance table with tabs */}
      <div className="mb-8">
        <Tabs defaultValue="overall" className="w-full">
          <TabsList className={`${isMobile ? 'flex flex-wrap' : 'grid grid-cols-4'} mb-6 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/5 shadow-lg p-1`}>
            <TabsTrigger value="overall" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs py-1 md:py-2">
              Overall
            </TabsTrigger>
            <TabsTrigger value="retail" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs py-1 md:py-2">
              Retail
            </TabsTrigger>
            <TabsTrigger value="reva" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs py-1 md:py-2">
              REVA
            </TabsTrigger>
            <TabsTrigger value="wholesale" className="data-[state=active]:text-white data-[state=active]:shadow-md text-xs py-1 md:py-2">
              Wholesale
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overall" className="mt-0">
            <Card className="bg-gray-900/40 border-white/10 mb-4 overflow-hidden">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-white/90">Overall Rep Performance</h3>
                <p className="text-xs mb-4 text-white/60">
                  Showing combined retail, REVA, and wholesale data for each rep based on selected filters.
                </p>
                <PerformanceTable
                  data={combinedRepData}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  isLoading={isLoading}
                  showChangeIndicators={showChangeIndicators}
                  getPreviousValue={getRepPreviousValue}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="retail" className="mt-0">
            <Card className="bg-gray-900/40 border-white/10 mb-4 overflow-hidden">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-white/90">Retail Rep Performance</h3>
                <p className="text-xs mb-4 text-white/60">
                  Showing retail data only, excluding REVA and wholesale.
                </p>
                <PerformanceTable
                  data={repData}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  isLoading={isLoading}
                  showChangeIndicators={showChangeIndicators}
                  getPreviousValue={getRepPreviousValue}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reva" className="mt-0">
            <Card className="bg-gray-900/40 border-white/10 mb-4 overflow-hidden">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-white/90">REVA Rep Performance</h3>
                <p className="text-xs mb-4 text-white/60">
                  Showing REVA data only.
                </p>
                <PerformanceTable
                  data={revaData}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  isLoading={isLoading}
                  showChangeIndicators={showChangeIndicators}
                  getPreviousValue={getRepPreviousValue}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="wholesale" className="mt-0">
            <Card className="bg-gray-900/40 border-white/10 mb-4 overflow-hidden">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-white/90">Wholesale Rep Performance</h3>
                <p className="text-xs mb-4 text-white/60">
                  Showing wholesale data only.
                </p>
                <PerformanceTable
                  data={wholesaleData}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  isLoading={isLoading}
                  showChangeIndicators={showChangeIndicators}
                  getPreviousValue={getRepPreviousValue}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Debug information */}
      <Card className="mb-6 bg-gray-900/40 border-white/10">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium">Debug Information</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="mr-2 text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All Data
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-xs font-semibold mb-1">Hook Data</h3>
              <div className="text-xs">
                <div><span className="font-bold">Revenue:</span> {metrics.totalSpend}</div>
                <div><span className="font-bold">Profit:</span> {metrics.totalProfit}</div>
                <div><span className="font-bold">Month:</span> {selectedMonth}</div>
                <div><span className="font-bold">Departments:</span> {[
                  includeRetail && 'Retail',
                  includeReva && 'REVA',
                  includeWholesale && 'Wholesale'
                ].filter(Boolean).join(', ')}</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold mb-1">Direct Database Query</h3>
              <div className="text-xs">
                {directData ? (
                  <>
                    <div><span className="font-bold">Records:</span> {directData.count}</div>
                    <div><span className="font-bold">Direct Revenue:</span> {directData.totalSpend}</div>
                    <div><span className="font-bold">Direct Profit:</span> {directData.totalProfit}</div>
                    <div><span className="font-bold">Direct Packs:</span> {directData.totalPacks}</div>
                    <div><span className="font-bold">Direct Margin:</span> {formatPercent(directData.margin || 0)}</div>
                    <div><span className="font-bold">Sample Record Type:</span> {directData.sample ? typeof directData.sample.spend : 'N/A'}</div>
                    {autoRefreshed && (
                      <div className="mt-2 text-green-500 font-semibold">
                        Data refreshed! {new Date().toLocaleTimeString()}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center">
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin text-blue-400" />
                    <span>Loading direct data...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <pre className="text-xs overflow-auto max-h-60 p-2 bg-gray-800 rounded-md">
            {JSON.stringify({
              selectedMonth,
              metrics,
              changes,
              includeRetail,
              includeReva,
              includeWholesale,
              repCount: combinedRepData.length
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      {/* Simple metrics query and display */}
      <Card className="mb-6 bg-gray-900/40 border-white/10">
        <CardContent className="p-4">
          <h2 className="text-sm font-medium mb-2">Direct Metrics Calculation</h2>
          <SimpleMetricsDisplay 
            month={selectedMonth} 
            includeRetail={includeRetail}
            includeReva={includeReva}
            includeWholesale={includeWholesale}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Simple component to directly fetch and calculate metrics
const SimpleMetricsDisplay: React.FC<{
  month: string;
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
}> = ({ month, includeRetail, includeReva, includeWholesale }) => {
  const [metrics, setMetrics] = useState<{
    totalSpend: number;
    totalProfit: number;
    totalPacks: number;
    margin: number;
    recordCount: number;
  }>({
    totalSpend: 0,
    totalProfit: 0,
    totalPacks: 0,
    margin: 0,
    recordCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchAndCalculate() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Implement pagination for complete data retrieval
        console.log(`Starting paginated data fetch for ${month}...`);
        let allData: any[] = [];
        let hasMoreData = true;
        let offset = 0;
        const pageSize = 1000;
        
        // Fetch all data pages
        while (hasMoreData) {
          // Directly fetch data for the selected month
          const response = await fetch(
            `https://ukshnjjmsrhgvkwrzoah.supabase.co/rest/v1/unified_sales_data?reporting_month=eq.${month}&limit=${pageSize}&offset=${offset}`, 
            {
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const pageData = await response.json();
          console.log(`SimpleMetricsDisplay: Fetched page ${offset/pageSize+1} with ${pageData.length} records`);
          
          // Add this page to our accumulated data
          allData = [...allData, ...pageData];
          
          // Check if we've reached the end
          if (pageData.length < pageSize) {
            hasMoreData = false;
          } else {
            offset += pageSize;
          }
        }
        
        console.log(`SimpleMetricsDisplay: Total records fetched: ${allData.length}`);
        
        // Filter by department based on selected filters
        let filteredData = allData;
        
        if (!includeRetail) {
          filteredData = filteredData.filter((item: any) => 
            !(item.department || '').toLowerCase().includes('retail'));
        }
        
        if (!includeReva) {
          filteredData = filteredData.filter((item: any) => 
            !(item.department || '').toLowerCase().includes('reva'));
        }
        
        if (!includeWholesale) {
          filteredData = filteredData.filter((item: any) => 
            !(item.department || '').toLowerCase().includes('wholesale'));
        }
        
        // Calculate metrics directly from data
        const totalSpend = filteredData.reduce((sum: number, item: any) => 
          sum + Number(item.spend || 0), 0);
          
        const totalProfit = filteredData.reduce((sum: number, item: any) => 
          sum + Number(item.profit || 0), 0);
          
        const totalPacks = filteredData.reduce((sum: number, item: any) => 
          sum + Number(item.packs || 0), 0);
          
        const margin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
        
        setMetrics({
          totalSpend,
          totalProfit,
          totalPacks,
          margin,
          recordCount: filteredData.length
        });
      } catch (err) {
        console.error('Error in SimpleMetricsDisplay:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAndCalculate();
  }, [month, includeRetail, includeReva, includeWholesale]);
  
  if (isLoading) {
    return <div className="text-sm">Loading direct metrics...</div>;
  }
  
  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="text-sm">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-gray-800/50 p-3 rounded-md">
          <div className="font-semibold text-xs text-gray-400">Records</div>
          <div className="text-lg">{metrics.recordCount}</div>
          {metrics.recordCount === 1000 && (
            <div className="text-xs text-yellow-500 mt-1">
              Warning: Exactly 1000 records - may be limited!
            </div>
          )}
        </div>
        <div className="bg-gray-800/50 p-3 rounded-md">
          <div className="font-semibold text-xs text-gray-400">Revenue</div>
          <div className="text-lg">{formatCurrency(metrics.totalSpend, 0)}</div>
        </div>
        <div className="bg-gray-800/50 p-3 rounded-md">
          <div className="font-semibold text-xs text-gray-400">Profit</div>
          <div className="text-lg text-finance-red">{formatCurrency(metrics.totalProfit, 0)}</div>
        </div>
        <div className="bg-gray-800/50 p-3 rounded-md">
          <div className="font-semibold text-xs text-gray-400">Margin</div>
          <div className="text-lg">{formatPercent(metrics.margin)}</div>
        </div>
        <div className="bg-gray-800/50 p-3 rounded-md">
          <div className="font-semibold text-xs text-gray-400">Packs</div>
          <div className="text-lg">{formatNumber(metrics.totalPacks)}</div>
        </div>
      </div>
      <div className="text-xs">
        <p>These metrics are calculated directly by querying the database and summing the values, bypassing the complex state management.</p>
      </div>
    </div>
  );
};

export default DashboardTest; 