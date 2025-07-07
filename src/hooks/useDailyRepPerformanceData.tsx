import { useState, useEffect, useCallback } from 'react';
import { 
  DateRange,
  DailyDataRow,
  DailySummaryData,
  DailySummaryChanges,
  DailyRepData,
  DailyRepChanges,
  DailyFilterOptions,
  ComparisonPeriod,
  DailyPerformanceState,
  DailySortConfig,
  DailyLoadingState,
  DailyRepTableData,
  DailyRepTableComparisonData,
  DailyRepTableSortConfig
} from '@/types/daily-rep-performance.types';
import {
  validateDailyData,
  saveDailyPerformanceData,
  loadCachedDailyPerformanceData
} from '@/services/daily-rep-performance-service';
import { dailyRepPerformanceServiceV2 } from '@/services/daily-rep-performance-service-v2';
import {
  getDefaultDateRange,
  getComparisonPeriod,
  formatDateRangeForQuery
} from '@/utils/daily-date-utils';

// Default states
const defaultSummary: DailySummaryData = {
  totalSpend: 0,
  totalProfit: 0,
  averageMargin: 0,
  ediProfit: 0,
  totalAccounts: 0,
  activeAccounts: 0
};

const defaultSummaryChanges: DailySummaryChanges = {
  totalSpend: 0,
  totalProfit: 0,
  averageMargin: 0,
  ediProfit: 0,
  totalAccounts: 0,
  activeAccounts: 0
};

const defaultFilters: DailyFilterOptions = {
  includeRetail: true,
  includeReva: true,
  includeWholesale: true,
  includeEdi: true,
  includeTelesales: true
};

export const useDailyRepPerformanceData = () => {
  // Date selection
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod | null>(null);

  // Data states
  const [rawData, setRawData] = useState<DailyDataRow[]>([]);
  const [comparisonData, setComparisonData] = useState<DailyDataRow[]>([]);
  const [summary, setSummary] = useState<DailySummaryData>(defaultSummary);
  const [summaryChanges, setSummaryChanges] = useState<DailySummaryChanges>(defaultSummaryChanges);
  const [repData, setRepData] = useState<DailyRepData[]>([]);
  const [repChanges, setRepChanges] = useState<DailyRepChanges>({});
  
  // Rep table data states  
  const [repTableData, setRepTableData] = useState<DailyRepTableData[]>([]);
  const [repTableComparison, setRepTableComparison] = useState<DailyRepTableComparisonData[]>([]);

  // Filter states
  const [filters, setFilters] = useState<DailyFilterOptions>(defaultFilters);

  // UI states
  const [sorting, setSorting] = useState<DailySortConfig>({ sortBy: 'profit', sortOrder: 'desc' });
  const [repTableSorting, setRepTableSorting] = useState<DailyRepTableSortConfig>({ sortBy: 'profit', sortOrder: 'desc' });
  const [loading, setLoading] = useState<DailyLoadingState>({
    isLoading: false,
    isRefreshing: false,
    error: null
  });

  // Cache key for localStorage
  const getCacheKey = useCallback((startDate: Date, endDate: Date) => {
    return `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
  }, []);

  /**
   * Convert filter options to new service format
   */
  const convertFilters = useCallback((filters: DailyFilterOptions) => {
    let department: 'all' | string[] = 'all';
    let method: 'all' | 'edi' | 'telesales' = 'all';
    
    // Convert department filters - using actual database values
    const activeDepts = [];
    if (filters.includeRetail) {
      activeDepts.push('RETAIL'); // Database uses RETAIL (uppercase)
    }
    if (filters.includeReva) {
      activeDepts.push('REVA'); // Database uses REVA (uppercase)
    }
    if (filters.includeWholesale) {
      // Database contains BOTH 'Wholesale' and 'WHOLESALE' - include both!
      activeDepts.push('Wholesale', 'WHOLESALE');
    }
    
    // If not all 3 department checkboxes are selected, apply the filter
    if (!(filters.includeRetail && filters.includeReva && filters.includeWholesale)) {
      // If no departments selected, use empty array (will return no data)
      department = activeDepts.length > 0 ? activeDepts : [];
    }
    
    // Convert method filters
    const activeMethods = [];
    if (filters.includeEdi) activeMethods.push('edi');
    if (filters.includeTelesales) activeMethods.push('telesales');
    
    if (activeMethods.length === 1) {
      method = activeMethods[0] as 'edi' | 'telesales';
    }
    
    return { department, method };
  }, []);

  /**
   * Fetch summary metrics using new server-side functions
   */
  const fetchSummaryMetrics = useCallback(async (
    startDate: Date, 
    endDate: Date,
    currentFilters: DailyFilterOptions
  ) => {
    console.log('📊 Fetching summary metrics with server-side aggregation');
    
    try {
      const filters = convertFilters(currentFilters);
      const metrics = await dailyRepPerformanceServiceV2.getSummaryMetrics(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        filters
      );
      
      // Convert to legacy format for compatibility
      const summary: DailySummaryData = {
        totalSpend: metrics.revenue,
        totalProfit: metrics.profit,
        averageMargin: metrics.margin,
        ediProfit: metrics.profit, // Using total profit for now
        totalAccounts: 0, // Not needed for active accounts display
        activeAccounts: metrics.activeAccounts
      };
      
      console.log('✅ Summary metrics fetched:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Error fetching summary metrics:', error);
      throw error;
    }
  }, [convertFilters]);

  /**
   * Fetch comparison data using new server-side functions
   */
  const fetchComparisonMetrics = useCallback(async (
    period: ComparisonPeriod,
    currentFilters: DailyFilterOptions
  ) => {
    console.log('🔄 Fetching comparison data with server-side aggregation');
    
    try {
      const filters = convertFilters(currentFilters);
      const comparison = await dailyRepPerformanceServiceV2.getComparisonData(
        period.current.start.toISOString().split('T')[0],
        period.current.end.toISOString().split('T')[0],
        period.comparison.start.toISOString().split('T')[0],
        period.comparison.end.toISOString().split('T')[0],
        filters
      );
      
      // Convert to legacy format for compatibility
      const summaryChanges: DailySummaryChanges = {
        totalSpend: comparison.current.revenue > 0 ? 
          ((comparison.changes.revenue / comparison.current.revenue) * 100) : 0,
        totalProfit: comparison.current.profit > 0 ? 
          ((comparison.changes.profit / comparison.current.profit) * 100) : 0,
        averageMargin: comparison.changes.margin,
        ediProfit: comparison.current.profit > 0 ? 
          ((comparison.changes.profit / comparison.current.profit) * 100) : 0,
        totalAccounts: comparison.current.activeAccounts > 0 ? 
          ((comparison.changes.activeAccounts / comparison.current.activeAccounts) * 100) : 0,
        activeAccounts: comparison.current.activeAccounts > 0 ? 
          ((comparison.changes.activeAccounts / comparison.current.activeAccounts) * 100) : 0
      };
      
      console.log('✅ Comparison metrics fetched:', summaryChanges);
      return summaryChanges;
    } catch (error) {
      console.error('❌ Error fetching comparison metrics:', error);
      throw error;
    }
  }, [convertFilters]);

  /**
   * Process data using server-side aggregation (new approach)
   */
  const processDataServerSide = useCallback(async (
    startDate: Date,
    endDate: Date,
    currentFilters: DailyFilterOptions,
    period: ComparisonPeriod | null
  ) => {
    console.log('📊 Processing data with server-side aggregation');

    try {
      const filters = convertFilters(currentFilters);
      
      // Fetch summary metrics from server
      const summary = await fetchSummaryMetrics(startDate, endDate, currentFilters);
      setSummary(summary);

      // Fetch comparison data if period is available
      let changes: DailySummaryChanges = defaultSummaryChanges;
      if (period) {
        changes = await fetchComparisonMetrics(period, currentFilters);
        setSummaryChanges(changes);
      } else {
        setSummaryChanges(defaultSummaryChanges);
      }

      // Fetch rep table data
      try {
        if (period) {
          console.log('👥 Fetching rep comparison data...');
          // Fetch comparison data for rep table
          const repComparison = await dailyRepPerformanceServiceV2.getRepPerformanceComparisonData(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            period.comparison.start.toISOString().split('T')[0],
            period.comparison.end.toISOString().split('T')[0],
            filters
          );
          console.log('✅ Rep comparison data fetched:', repComparison.length, 'reps');
          setRepTableComparison(repComparison);
          
          // Extract current period data for simple rep table view
          const repTableCurrent = repComparison.map(rep => ({
            rep: rep.rep,
            spend: rep.current.spend,
            profit: rep.current.profit,
            margin: rep.current.margin,
            activeAccounts: rep.current.activeAccounts,
            totalAccounts: rep.current.totalAccounts,
            telesalesPercentage: rep.current.telesalesPercentage,
            telesalesProfit: rep.current.telesalesProfit
          }));
          console.log('✅ Rep table current data prepared:', repTableCurrent.length, 'reps');
          
          // Debug: Check account data being set
          if (repTableCurrent.length > 0) {
            console.log('🔍 Hook setting rep data:', {
              rep: repTableCurrent[0].rep,
              active: repTableCurrent[0].activeAccounts,
              total: repTableCurrent[0].totalAccounts
            });
            console.log('🔍 FULL first rep data:', repTableCurrent[0]);
            console.log('🔍 All rep active accounts:', repTableCurrent.map(r => ({ rep: r.rep, active: r.activeAccounts })));
          }
          
          setRepTableData(repTableCurrent);
        } else {
          console.log('👥 Fetching rep current data only...');
          // No comparison period - fetch current data only
          const repTableCurrent = await dailyRepPerformanceServiceV2.getRepPerformanceData(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            filters
          );
          console.log('✅ Rep current data fetched:', repTableCurrent.length, 'reps');
          
          // Debug: Check direct rep data
          if (repTableCurrent.length > 0) {
            console.log('🔍 Hook setting direct rep data:', {
              rep: repTableCurrent[0].rep,
              active: repTableCurrent[0].activeAccounts,
              total: repTableCurrent[0].totalAccounts
            });
            console.log('🔍 FULL direct rep data:', repTableCurrent[0]);
            console.log('🔍 All direct rep active accounts:', repTableCurrent.map(r => ({ rep: r.rep, active: r.activeAccounts })));
          }
          
          setRepTableData(repTableCurrent);
          setRepTableComparison([]);
        }
      } catch (repError) {
        console.error('❌ Error fetching rep table data:', repError);
        // Continue without rep data - don't fail the entire process
        setRepTableData([]);
        setRepTableComparison([]);
      }

      // For legacy compatibility, set empty rep data (old structure)
      setRepData([]);
      setRepChanges({});

      console.log('📊 Server-side data processing complete:', {
        summary,
        hasComparison: !!period
      });
    } catch (error) {
      console.error('❌ Error in server-side data processing:', error);
      throw error;
    }
  }, [fetchSummaryMetrics, fetchComparisonMetrics, convertFilters]);

  /**
   * Main data loading function
   */
  const loadData = useCallback(async (
    startDate: Date | null, 
    endDate: Date | null,
    forceRefresh = false,
    customFilters?: DailyFilterOptions // Allow passing custom filters to avoid stale state
  ) => {
    if (!startDate || !endDate) {
      console.warn('⚠️ Invalid date range provided to loadData');
      return;
    }

    // Use provided filters or fall back to state filters
    const activeFilters = customFilters || filters;

    console.log('🚀 Loading daily performance data:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      forceRefresh,
      activeFilters
    });

    setLoading(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Calculate comparison period
      const period = getComparisonPeriod(startDate, endDate);
      setComparisonPeriod(period);

      console.log('🔍 Using server-side aggregation for:', { 
        current: `${startDate.toISOString()} to ${endDate.toISOString()}`, 
        comparison: period ? `${period.comparison.start.toISOString()} to ${period.comparison.end.toISOString()}` : 'None'
      });

      // Process data using server-side aggregation (bypasses 1000-record limit)
      await processDataServerSide(startDate, endDate, activeFilters, period);

      // Clear raw data arrays since we're using server-side aggregation
      setRawData([]);
      setComparisonData([]);

      setLoading(prev => ({ ...prev, isLoading: false, error: null }));
      console.log('✅ Server-side data loading complete');

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setLoading(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  }, [filters, processDataServerSide]);

  /**
   * Handle date range change
   */
  const handleDateRangeChange = useCallback((newDateRange: DateRange) => {
    console.log('📅 Date range changed:', newDateRange);
    setDateRange(newDateRange);
  }, []);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters: Partial<DailyFilterOptions>) => {
    console.log('🔧 Filters changed:', newFilters);
    const updatedFilters = { ...filters, ...newFilters };
    console.log('📋 Updated filters state:', updatedFilters);
    
    // Log the converted filter values for debugging
    const convertedFilters = convertFilters(updatedFilters);
    console.log('🔄 Converted to service filters:', convertedFilters);
    
    setFilters(updatedFilters);
    
    // Reload data with new filters using server-side aggregation
    // Pass updatedFilters directly to avoid stale state issues
    if (dateRange.startDate && dateRange.endDate) {
      loadData(dateRange.startDate, dateRange.endDate, true, updatedFilters);
    }
  }, [filters, dateRange, loadData]);

  /**
   * Handle sorting changes
   */
  const handleSortChange = useCallback((sortBy: string, sortOrder?: 'asc' | 'desc') => {
    const newSortOrder = sortOrder || (sorting.sortBy === sortBy && sorting.sortOrder === 'desc' ? 'asc' : 'desc');
    setSorting({ sortBy, sortOrder: newSortOrder });
  }, [sorting]);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async () => {
    console.log('🔄 Refreshing data...');
    setLoading(prev => ({ ...prev, isRefreshing: true }));
    await loadData(dateRange.startDate, dateRange.endDate, true);
    setLoading(prev => ({ ...prev, isRefreshing: false }));
  }, [dateRange, loadData]);

  /**
   * Clear cache manually
   */
  const clearCache = useCallback(() => {
    console.log('🧹 Manual cache clear triggered');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('daily_performance_')) {
        localStorage.removeItem(key);
      }
    });
    // Force reload data
    if (dateRange.startDate && dateRange.endDate) {
      loadData(dateRange.startDate, dateRange.endDate, true);
    }
  }, [dateRange, loadData]);

  /**
   * Get sorted rep data
   */
  const getSortedRepData = useCallback((): DailyRepData[] => {
    if (!repData.length) return [];

    return [...repData].sort((a, b) => {
      const aValue = a[sorting.sortBy as keyof DailyRepData] as number;
      const bValue = b[sorting.sortBy as keyof DailyRepData] as number;
      
      return sorting.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [repData, sorting]);

  /**
   * Get sorted rep table data
   */
  const getSortedRepTableData = useCallback((): DailyRepTableData[] => {
    if (!repTableData.length) {
      console.log('🔍 SORTING: No repTableData to sort');
      return [];
    }

    console.log('🔍 SORTING: Input data first rep:', {
      rep: repTableData[0].rep,
      active: repTableData[0].activeAccounts,
      sortBy: repTableSorting.sortBy,
      sortOrder: repTableSorting.sortOrder
    });

    const sorted = [...repTableData].sort((a, b) => {
      const aValue = a[repTableSorting.sortBy as keyof DailyRepTableData] as number;
      const bValue = b[repTableSorting.sortBy as keyof DailyRepTableData] as number;
      
      return repTableSorting.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    console.log('🔍 SORTING: Output data first rep:', {
      rep: sorted[0].rep,
      active: sorted[0].activeAccounts,
      inputLength: repTableData.length,
      outputLength: sorted.length
    });

    return sorted;
  }, [repTableData, repTableSorting]);

  /**
   * Handle rep table sorting changes
   */
  const handleRepTableSortChange = useCallback((sortBy: DailyRepTableSortConfig['sortBy'], sortOrder?: 'asc' | 'desc') => {
    const newSortOrder = sortOrder || (repTableSorting.sortBy === sortBy && repTableSorting.sortOrder === 'desc' ? 'asc' : 'desc');
    setRepTableSorting({ sortBy, sortOrder: newSortOrder });
  }, [repTableSorting]);

  /**
   * Fetch rep data for a specific department (for tabbed interface)
   */
  const fetchRepDataForDepartment = useCallback(async (department: string) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      console.warn('⚠️ Invalid date range for department-specific rep data');
      return { data: [], comparison: [] };
    }

    console.log('🏢 Fetching rep data for department:', department);
    
    try {
      const convertedFilters = convertFilters(filters);
      
      if (comparisonPeriod) {
        // Fetch comparison data for the specific department
        const repComparison = await dailyRepPerformanceServiceV2.getRepPerformanceComparisonData(
          dateRange.startDate.toISOString().split('T')[0],
          dateRange.endDate.toISOString().split('T')[0],
          comparisonPeriod.comparison.start.toISOString().split('T')[0],
          comparisonPeriod.comparison.end.toISOString().split('T')[0],
          convertedFilters,
          department
        );
        
        // Extract current period data for simple rep table view
        const repTableCurrent = repComparison.map(rep => ({
          rep: rep.rep,
          spend: rep.current.spend,
          profit: rep.current.profit,
          margin: rep.current.margin,
          activeAccounts: rep.current.activeAccounts,
          totalAccounts: rep.current.totalAccounts,
          telesalesPercentage: rep.current.telesalesPercentage,
          telesalesProfit: rep.current.telesalesProfit
        }));
        
        console.log('✅ Department-specific rep data fetched:', repTableCurrent.length, 'reps');
        return { data: repTableCurrent, comparison: repComparison };
      } else {
        // No comparison period - fetch current data only
        const repTableCurrent = await dailyRepPerformanceServiceV2.getRepPerformanceData(
          dateRange.startDate.toISOString().split('T')[0],
          dateRange.endDate.toISOString().split('T')[0],
          convertedFilters,
          department
        );
        
        console.log('✅ Department-specific rep data fetched:', repTableCurrent.length, 'reps');
        return { data: repTableCurrent, comparison: [] };
      }
    } catch (error) {
      console.error('❌ Error fetching department-specific rep data:', error);
      return { data: [], comparison: [] };
    }
  }, [dateRange, comparisonPeriod, filters, convertFilters]);

  // Load data when date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      loadData(dateRange.startDate, dateRange.endDate);
    }
  }, [dateRange, loadData]);

  // Debug logging for hasComparison
  const hasComparison = repTableComparison.length > 0 || comparisonData.length > 0;
  console.log('🔍 hasComparison check:', {
    repTableComparison: repTableComparison.length,
    comparisonData: comparisonData.length,
    hasComparison
  });

  // Return the hook interface
  return {
    // Date selection
    dateRange,
    setDateRange: handleDateRangeChange,
    comparisonPeriod,

    // Data
    rawData,
    comparisonData,
    summary,
    summaryChanges,
    repData: getSortedRepData(),
    repChanges,

    // Rep table data (NEW)
    repTableData: getSortedRepTableData(),
    repTableComparison,
    repTableSorting,
    setRepTableSorting: handleRepTableSortChange,

    // Filters
    filters,
    setFilters: handleFiltersChange,

    // UI state
    sorting,
    setSorting: handleSortChange,
    loading,

    // Actions
    loadData,
    refreshData,
    clearCache,
    fetchRepDataForDepartment,

    // Computed properties
    hasData: summary.totalSpend > 0 || summary.totalProfit > 0,
    hasComparison,
    hasRepTableData: repTableData.length > 0,
    totalRecords: rawData.length,
    
    // Utility functions
    validateData: () => validateDailyData(rawData)
  };
}; 