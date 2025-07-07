import { supabase } from '@/integrations/supabase/client';
import { 
  DailyDataRow, 
  DailySummaryData, 
  DailyRepData, 
  DailySummaryChanges,
  DailyRepChanges,
  DailyFilterOptions,
  Department,
  TransactionMethod
} from '@/types/daily-rep-performance.types';
import { formatDateRangeForQuery } from '@/utils/daily-date-utils';

/**
 * Fetch daily data for a specific date range with optional filters
 * Uses optimized queries with existing database indices
 */
export async function fetchDailyData(
  startDate: Date, 
  endDate: Date,
  filters?: Partial<DailyFilterOptions>
): Promise<DailyDataRow[]> {
  console.log('🔍 Fetching daily data:', { 
    startDate: startDate.toISOString(), 
    endDate: endDate.toISOString(), 
    filters 
  });
  
  const { startDate: sqlStart, endDate: sqlEnd } = formatDateRangeForQuery(startDate, endDate);
  
  let query = supabase
    .from('Daily_Data')
    .select('*')
    .gte('Date_Time', sqlStart)
    .lte('Date_Time', sqlEnd)
    .order('Date_Time', { ascending: false })
    .range(0, 99999); // Use range instead of limit to fetch up to 100,000 records

  // Apply department filters if specified
  if (filters) {
    const { includeRetail = true, includeReva = true, includeWholesale = true } = filters;
    const departments: Department[] = [];
    
    if (includeRetail) departments.push('Retail');
    if (includeReva) departments.push('REVA');
    if (includeWholesale) departments.push('Wholesale');
    
    // Only apply filter if not all departments are included
    if (departments.length > 0 && departments.length < 3) {
      query = query.in('Department', departments);
    }
    
    // Apply method filters if specified
    if (filters.includeEdi !== undefined || filters.includeTelesales !== undefined) {
      const { includeEdi = true, includeTelesales = true } = filters;
      const methods: TransactionMethod[] = [];
      
      if (includeEdi) methods.push('edi');
      if (includeTelesales) methods.push('telesales');
      
      if (methods.length > 0 && methods.length < 2) {
        query = query.in('Method', methods);
      }
    }
  }

  // Debug: Log the query details
  console.log('📋 Query details:', {
    table: 'Daily_Data',
    startDate: sqlStart,
    endDate: sqlEnd,
    range: '0-99999 (up to 100,000 records)',
    filters: filters
  });

  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching daily data:', error);
    throw new Error(`Failed to fetch daily data: ${error.message}`);
  }
  
  console.log(`✅ Fetched ${data?.length || 0} daily records from Daily_Data table`);
  
  // Check if we hit any limits
  if (data && data.length === 1000) {
    console.warn('⚠️ Fetched exactly 1000 records - may be hitting default Supabase limit!');
  }
  if (data && data.length === 100000) {
    console.warn('⚠️ Fetched exactly 100,000 records - may be hitting our custom range limit!');
  }
  
  return data || [];
}

/**
 * Aggregate daily data into summary metrics
 * Performs client-side aggregation for flexibility with filtering
 */
export function aggregateDailySummary(
  data: DailyDataRow[],
  filters: DailyFilterOptions
): DailySummaryData {
  console.log('📊 Aggregating daily summary from', data.length, 'records');
  
  // Apply client-side filters for granular control
  const filteredData = applyClientSideFilters(data, filters);
  
  const totalSpend = filteredData.reduce((sum, row) => sum + (row.Spend || 0), 0);
  const totalProfit = filteredData.reduce((sum, row) => sum + (row.Profit || 0), 0);
  
  // NEW: EDI Profit calculation - profit from telesales method
  const ediProfit = filteredData
    .filter(row => row.Method === 'telesales')
    .reduce((sum, row) => sum + (row.Profit || 0), 0);
  
  // Account calculations using Set for uniqueness
  const uniqueAccounts = new Set(
    filteredData
      .filter(row => row['Account Ref']) // Only count rows with account refs
      .map(row => row['Account Ref'])
  ).size;
  
  const activeAccounts = new Set(
    filteredData
      .filter(row => row['Account Ref'] && (row.Spend || 0) > 0) // Active = has spend
      .map(row => row['Account Ref'])
  ).size;
  
  // Calculate average margin
  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;

  const result = {
    totalSpend,
    totalProfit,
    averageMargin,
    ediProfit,
    totalAccounts: uniqueAccounts,
    activeAccounts
  };
  
  console.log('📊 Summary aggregation result:', result);
  return result;
}

/**
 * Aggregate daily data by rep
 * Groups data by rep and calculates metrics for each
 */
export function aggregateDailyRepData(
  data: DailyDataRow[],
  filters: DailyFilterOptions
): DailyRepData[] {
  console.log('👥 Aggregating rep data from', data.length, 'records');
  
  const filteredData = applyClientSideFilters(data, filters);
  
  // Group by rep
  const repGroups = filteredData.reduce((groups, row) => {
    const rep = row.Rep || 'Unknown';
    if (!groups[rep]) groups[rep] = [];
    groups[rep].push(row);
    return groups;
  }, {} as Record<string, DailyDataRow[]>);

  // Aggregate each rep's data
  const repData = Object.entries(repGroups).map(([rep, repData]) => {
    const spend = repData.reduce((sum, row) => sum + (row.Spend || 0), 0);
    const profit = repData.reduce((sum, row) => sum + (row.Profit || 0), 0);
    
    // NEW: EDI Profit for this rep
    const ediProfit = repData
      .filter(row => row.Method === 'telesales')
      .reduce((sum, row) => sum + (row.Profit || 0), 0);
    
    const accounts = new Set(
      repData
        .filter(row => row['Account Ref'])
        .map(row => row['Account Ref'])
    ).size;
    
    const activeAccounts = new Set(
      repData
        .filter(row => row['Account Ref'] && (row.Spend || 0) > 0)
        .map(row => row['Account Ref'])
    ).size;
    
    const margin = spend > 0 ? (profit / spend) * 100 : 0;
    
    // Determine primary department for this rep
    const departmentCounts = repData.reduce((counts, row) => {
      const dept = row.Department || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const primaryDepartment = Object.entries(departmentCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    return {
      rep,
      department: primaryDepartment,
      spend,
      profit,
      margin,
      ediProfit,
      accounts,
      activeAccounts
    };
  });

  console.log(`👥 Aggregated data for ${repData.length} reps`);
  return repData.sort((a, b) => b.profit - a.profit); // Sort by profit desc
}

/**
 * Calculate comparison changes between current and comparison data
 * Returns percentage changes for all metrics
 */
export function calculateSummaryChanges(
  currentSummary: DailySummaryData,
  comparisonSummary: DailySummaryData
): DailySummaryChanges {
  console.log('📈 Calculating summary changes');
  
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  const calculateAbsoluteChange = (current: number, previous: number): number => {
    return current - previous;
  };

  return {
    totalSpend: calculatePercentageChange(currentSummary.totalSpend, comparisonSummary.totalSpend),
    totalProfit: calculatePercentageChange(currentSummary.totalProfit, comparisonSummary.totalProfit),
    averageMargin: calculateAbsoluteChange(currentSummary.averageMargin, comparisonSummary.averageMargin),
    ediProfit: calculatePercentageChange(currentSummary.ediProfit, comparisonSummary.ediProfit),
    totalAccounts: calculatePercentageChange(currentSummary.totalAccounts, comparisonSummary.totalAccounts),
    activeAccounts: calculatePercentageChange(currentSummary.activeAccounts, comparisonSummary.activeAccounts)
  };
}

/**
 * Calculate rep-level changes between current and comparison periods
 */
export function calculateRepChanges(
  currentRepData: DailyRepData[],
  comparisonRepData: DailyRepData[]
): DailyRepChanges {
  console.log('👥 Calculating rep changes');
  
  const changes: DailyRepChanges = {};
  
  // Create lookup map for comparison data
  const comparisonMap = comparisonRepData.reduce((map, rep) => {
    map[rep.rep] = rep;
    return map;
  }, {} as Record<string, DailyRepData>);
  
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  const calculateAbsoluteChange = (current: number, previous: number): number => {
    return current - previous;
  };
  
  currentRepData.forEach(currentRep => {
    const comparisonRep = comparisonMap[currentRep.rep];
    
    if (comparisonRep) {
      changes[currentRep.rep] = {
        spend: calculatePercentageChange(currentRep.spend, comparisonRep.spend),
        profit: calculatePercentageChange(currentRep.profit, comparisonRep.profit),
        margin: calculateAbsoluteChange(currentRep.margin, comparisonRep.margin),
        ediProfit: calculatePercentageChange(currentRep.ediProfit, comparisonRep.ediProfit),
        accounts: calculatePercentageChange(currentRep.accounts, comparisonRep.accounts),
        activeAccounts: calculatePercentageChange(currentRep.activeAccounts, comparisonRep.activeAccounts)
      };
    } else {
      // New rep in current period
      changes[currentRep.rep] = {
        spend: currentRep.spend > 0 ? 100 : 0,
        profit: currentRep.profit > 0 ? 100 : 0,
        margin: currentRep.margin,
        ediProfit: currentRep.ediProfit > 0 ? 100 : 0,
        accounts: currentRep.accounts > 0 ? 100 : 0,
        activeAccounts: currentRep.activeAccounts > 0 ? 100 : 0
      };
    }
  });
  
  return changes;
}

/**
 * Apply client-side filters to data array
 * Used for granular filtering control
 */
function applyClientSideFilters(
  data: DailyDataRow[],
  filters: DailyFilterOptions
): DailyDataRow[] {
  return data.filter(row => {
    // Department filter
    if (!filters.includeRetail && row.Department === 'Retail') return false;
    if (!filters.includeReva && row.Department === 'REVA') return false;
    if (!filters.includeWholesale && row.Department === 'Wholesale') return false;
    
    // Method filter (if specified)
    if (filters.includeEdi !== undefined || filters.includeTelesales !== undefined) {
      if (!filters.includeEdi && row.Method === 'edi') return false;
      if (!filters.includeTelesales && row.Method === 'telesales') return false;
    }
    
    return true;
  });
}

/**
 * Get data validation summary
 * Helps identify data quality issues
 */
export function validateDailyData(data: DailyDataRow[]): {
  totalRecords: number;
  missingReps: number;
  missingAccounts: number;
  missingMethods: number;
  missingDates: number;
  dateRange: { earliest: string | null; latest: string | null };
} {
  const missingReps = data.filter(row => !row.Rep).length;
  const missingAccounts = data.filter(row => !row['Account Ref']).length;
  const missingMethods = data.filter(row => !row.Method).length;
  const missingDates = data.filter(row => !row.Date_Time).length;
  
  const dates = data
    .filter(row => row.Date_Time)
    .map(row => new Date(row.Date_Time!))
    .sort((a, b) => a.getTime() - b.getTime());
  
  return {
    totalRecords: data.length,
    missingReps,
    missingAccounts,
    missingMethods,
    missingDates,
    dateRange: {
      earliest: dates[0]?.toISOString() || null,
      latest: dates[dates.length - 1]?.toISOString() || null
    }
  };
}

/**
 * Save/cache daily performance data to localStorage for offline access
 * Useful for performance optimization
 */
export function saveDailyPerformanceData(
  key: string,
  data: {
    timestamp: number;
    dateRange: { startDate: Date; endDate: Date };
    data: DailyDataRow[];
    summary: DailySummaryData;
    repData: DailyRepData[];
  }
): void {
  try {
    localStorage.setItem(`daily_performance_${key}`, JSON.stringify(data));
    console.log('💾 Saved daily performance data to cache');
  } catch (error) {
    console.warn('⚠️ Failed to save data to localStorage:', error);
  }
}

/**
 * Load cached daily performance data from localStorage
 */
export function loadCachedDailyPerformanceData(key: string): any | null {
  try {
    const cached = localStorage.getItem(`daily_performance_${key}`);
    if (cached) {
      const data = JSON.parse(cached);
      console.log('📱 Loaded cached daily performance data');
      return data;
    }
  } catch (error) {
    console.warn('⚠️ Failed to load cached data:', error);
  }
  return null;
} 