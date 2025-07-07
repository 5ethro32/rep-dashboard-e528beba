import { supabase } from '@/integrations/supabase/client';
import { getWorkingDayPercentage, projectMonthlyValue } from '@/utils/date-utils';
import { 
  TimeRangeType, 
  MonthlyTrendsChartData,
  DailyFilterOptions,
  MonthlyTrendsDataRequest
} from '@/types/daily-rep-performance.types';

/**
 * Convert DailyFilterOptions to SQL function parameters
 */
function convertFilters(filters: DailyFilterOptions): {
  department_filter: string[] | null;
  method_filter: string | null;
} {
  // Convert department filters - using correct database values
  let department_filter: string[] | null = null;
  const departments = [];
  
  if (filters.includeRetail) {
    departments.push('RETAIL'); // Database uses RETAIL (uppercase)
  }
  if (filters.includeReva) {
    departments.push('REVA'); // Database uses REVA (uppercase)
  }
  if (filters.includeWholesale) {
    // Database contains BOTH 'Wholesale' and 'WHOLESALE' - include both!
    departments.push('Wholesale', 'WHOLESALE');
  }
  
  // If not all 3 department checkboxes are selected, apply the filter
  if (!(filters.includeRetail && filters.includeReva && filters.includeWholesale)) {
    department_filter = departments.length > 0 ? departments : [];
  }
  
  // Convert method filters
  let method_filter: string | null = null;
  const methods = [];
  
  if (filters.includeEdi) methods.push('edi');
  if (filters.includeTelesales) methods.push('telesales');
  
  // Only apply filter if not all methods are included
  if (methods.length > 0 && methods.length < 2) {
    method_filter = methods[0]; // SQL function takes single method
  }
  
  return { department_filter, method_filter };
}

/**
 * Convert SQL result to chart data format
 */
function convertToChartData(sqlData: any[]): MonthlyTrendsChartData[] {
  return sqlData.map(row => ({
    period: row.period_label,
    fullPeriod: row.full_period_label,
    profit: Number(row.total_profit) || 0,
    spend: Number(row.total_spend) || 0,
    margin: Number(row.avg_margin) || 0,
    activeAccounts: Number(row.unique_accounts) || 0,
    isProjected: Boolean(row.is_projected),
    isPartial: Boolean(row.is_partial),
    date: new Date(row.period_date)
  }));
}

/**
 * Get time range options for the chart buttons
 */
export function getTimeRangeOptions() {
  return [
    { value: '5D' as TimeRangeType, label: '5D', days: 5 },
    { value: '1M' as TimeRangeType, label: '1M', days: 30 },
    { value: '3M' as TimeRangeType, label: '3M', days: 90 },
    { value: 'MTD' as TimeRangeType, label: 'MTD' },
    { value: 'YTD' as TimeRangeType, label: 'YTD' },
    { value: 'ALL' as TimeRangeType, label: 'ALL' }
  ];
}

/**
 * Add projection for current month in YTD/ALL views (like original TrendLineChart)
 */
function addProjectionsForMonthlyData(
  chartData: MonthlyTrendsChartData[],
  timeRange: TimeRangeType
): MonthlyTrendsChartData[] {
  // Only add projections for YTD and ALL (showing historical months + current month projection)
  // MTD doesn't need projections as it's just current month data
  if (timeRange !== 'YTD' && timeRange !== 'ALL') {
    return chartData;
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Calculate working day percentage for projection
  const workingDayPercentage = getWorkingDayPercentage(currentDate, true);

  // Find current month data to project
  const currentMonthData = chartData.find(item => {
    const itemDate = item.date;
    return itemDate.getMonth() === currentMonth && 
           itemDate.getFullYear() === currentYear &&
           !item.isProjected;
  });

  if (!currentMonthData) {
    console.log('🔍 No current month data found for projection');
    return chartData;
  }

  // Remove the current month from actual data (since we'll replace it with projected version)
  const actualDataWithoutCurrentMonth = chartData.filter(item => {
    const itemDate = item.date;
    return !(itemDate.getMonth() === currentMonth && 
             itemDate.getFullYear() === currentYear &&
             !item.isProjected);
  });

  // Create projected version of current month (like original TrendLineChart's julyTrajectoryPoint)
  const projectedCurrentMonth: MonthlyTrendsChartData = {
    ...currentMonthData,
    profit: projectMonthlyValue(currentMonthData.profit, workingDayPercentage),
    spend: projectMonthlyValue(currentMonthData.spend, workingDayPercentage),
    activeAccounts: projectMonthlyValue(currentMonthData.activeAccounts, workingDayPercentage),
    // Margin doesn't need projection as it's a ratio (same as original)
    margin: currentMonthData.margin,
    isProjected: true,
    fullPeriod: `${currentMonthData.fullPeriod} (Projected)`
  };

  console.log(`📊 Added projection for ${currentMonthData.period}: ${workingDayPercentage.toFixed(1)}% complete`);
  console.log(`📊 Projection logic matches original TrendLineChart approach`);
  console.log(`📊 Current month data:`, currentMonthData);
  console.log(`📊 Projected data:`, projectedCurrentMonth);
  console.log(`📊 Chart data length before projection:`, chartData.length);
  console.log(`📊 Chart data length after projection:`, [...actualDataWithoutCurrentMonth, projectedCurrentMonth].length);

  // Return actual data (without current month) + projected current month
  // This way trajectory lines can connect from last actual month to projected current month
  return [...actualDataWithoutCurrentMonth, projectedCurrentMonth];
}

/**
 * Fetch monthly trends data based on time range
 */
export async function fetchMonthlyTrendsData(
  request: MonthlyTrendsDataRequest
): Promise<MonthlyTrendsChartData[]> {
  console.log('🔍 Fetching monthly trends data:', request);
  
  const { department_filter, method_filter } = convertFilters(request.filters);
  const endDate = request.endDate || new Date();
  
  try {
    const { data, error } = await supabase.rpc('get_monthly_trends_data', {
      time_range_type: request.timeRange,
      department_filter,
      method_filter,
      end_date: endDate.toISOString().split('T')[0] // Convert to DATE format
    });
    
    if (error) {
      console.error('❌ Error fetching monthly trends data:', error);
      throw new Error(`Failed to fetch monthly trends data: ${error.message}`);
    }
    
    const chartData = convertToChartData(data || []);
    
    // Add projections for YTD/MTD views
    const dataWithProjections = addProjectionsForMonthlyData(chartData, request.timeRange);
    
    console.log(`✅ Fetched ${chartData.length} actual + ${dataWithProjections.length - chartData.length} projected data points`);
    
    return dataWithProjections;
  } catch (error) {
    console.error('❌ Error in fetchMonthlyTrendsData:', error);
    throw error;
  }
}



/**
 * Calculate suitable data aggregation for the chart
 * Returns the best aggregation type based on the number of data points
 */
export function getOptimalAggregation(timeRange: TimeRangeType): string {
  switch (timeRange) {
    case '5D':
      return 'daily'; // 5 points max
    case '1M':
      return 'daily'; // ~30 points max
    case '3M':
      return 'weekly'; // ~12 points max
    case 'MTD':
      return 'daily'; // ~30 points max
    case 'YTD':
      return 'monthly'; // ~12 points max
    case 'ALL':
      return 'monthly'; // Depends on data range
    default:
      return 'daily';
  }
} 