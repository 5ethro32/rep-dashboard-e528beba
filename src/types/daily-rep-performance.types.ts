import { Database } from '@/integrations/supabase/types';

// Daily_Data table row type from Supabase
export type DailyDataRow = Database['public']['Tables']['Daily_Data']['Row'];

// Summary data for daily metrics (replaces SummaryData)
export interface DailySummaryData {
  totalSpend: number;
  totalProfit: number;
  averageMargin: number;
  ediProfit: number; // NEW: Replaces packs - profit from telesales method
  totalAccounts: number; // Legacy field - not used in summary display (activeAccounts is the primary metric)
  activeAccounts: number; // Count of accounts that had transactions in the selected period
}

// Rep-level aggregated data for daily performance
export interface DailyRepData {
  rep: string;
  department: string;
  spend: number;
  profit: number;
  margin: number;
  ediProfit: number; // NEW: profit from telesales method
  accounts: number;
  activeAccounts: number;
}

// Date range selection for the calendar picker
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Comparison period logic - industry standard period-over-period
export interface ComparisonPeriod {
  current: { start: Date; end: Date };
  comparison: { start: Date; end: Date };
  type: 'Day' | 'MTD' | 'Week' | 'Month' | 'Custom';
  label: string; // Display name for comparison period
}

// Changes/comparison data for summary metrics
export interface DailySummaryChanges {
  totalSpend: number; // % change
  totalProfit: number; // % change
  averageMargin: number; // absolute change in %
  ediProfit: number; // % change
  totalAccounts: number; // % change
  activeAccounts: number; // % change
}

// Changes/comparison data for individual reps
export interface DailyRepChanges {
  [repName: string]: {
    spend: number; // % change
    profit: number; // % change
    margin: number; // absolute change in %
    ediProfit: number; // % change
    accounts: number; // % change
    activeAccounts: number; // % change
  };
}

// Filter options for data aggregation
export interface DailyFilterOptions {
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  includeEdi: boolean; // NEW: filter by method
  includeTelesales: boolean; // NEW: filter by method
}

// Date range shortcuts for the picker
export interface DateRangeShortcut {
  label: string;
  value: DateRange;
}

// Tab values for performance content
export type DailyTabValue = 'overall' | 'rep' | 'reva' | 'wholesale' | 'edi' | 'telesales';

// Sort configuration
export interface DailySortConfig {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Loading states
export interface DailyLoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

// Combined state for the daily performance hook
export interface DailyPerformanceState {
  // Date selection
  dateRange: DateRange;
  comparisonPeriod: ComparisonPeriod | null;
  
  // Data
  rawData: DailyDataRow[];
  comparisonData: DailyDataRow[];
  summary: DailySummaryData;
  summaryChanges: DailySummaryChanges;
  repData: DailyRepData[];
  repChanges: DailyRepChanges;
  
  // Filters
  filters: DailyFilterOptions;
  
  // UI state
  sorting: DailySortConfig;
  loading: DailyLoadingState;
}

// Method type for filtering
export type TransactionMethod = 'edi' | 'telesales';

// Department type for consistency
export type Department = 'Retail' | 'REVA' | 'Wholesale';

// Export utility type for date formatting
export interface FormattedDateRange {
  display: string;
  period: string;
  comparison: string;
}

// NEW: Types for server-side aggregation functions
export interface DailyAggregatedData {
  period_start: string;
  period_end: string;
  period_label: string;
  total_spend: number;
  total_cost: number;
  total_credit: number;
  total_profit: number;
  avg_margin: number;
  total_packs: number;
  unique_accounts: number;
  record_count: number;
}

// NEW: Simplified filters for server-side functions
export interface DailyRepPerformanceFilters {
  department: 'all' | string[]; // Can be 'all', array of departments, or empty array
  method: 'all' | 'edi' | 'telesales';
}

// NEW: Simplified metrics for server-side functions
export interface DailyRepPerformanceMetrics {
  revenue: number;
  profit: number;
  margin: number;
  activeAccounts: number;
}

// NEW: Comparison data structure for server-side functions
export interface DailyRepPerformanceComparisonData {
  current: DailyRepPerformanceMetrics;
  comparison: DailyRepPerformanceMetrics;
  changes: DailyRepPerformanceMetrics;
}

// NEW: Alias for compatibility
export type DailyRepPerformanceData = DailyDataRow;

// NEW: Types for Monthly Performance Trends Chart
export type TimeRangeType = '5D' | '1M' | '3M' | 'MTD' | 'YTD' | 'ALL';

export interface TimeRangeOption {
  value: TimeRangeType;
  label: string;
  days?: number; // Number of days for the range
}

export interface MonthlyTrendsChartData {
  period: string; // Display label (e.g., "Jan 15", "Week 3", "Jan 2024")
  fullPeriod: string; // Full period label for tooltips
  profit: number;
  spend: number;
  margin: number;
  activeAccounts: number;
  isProjected?: boolean; // For projection data points
  isPartial?: boolean; // For incomplete periods (MTD, etc.)
  date: Date; // Actual date for ordering and calculations
}

export interface MonthlyTrendsMetrics {
  profit: boolean;
  spend: boolean;
  margin: boolean;
  activeAccounts: boolean;
}

export interface MonthlyTrendsChartProps {
  timeRange: TimeRangeType;
  onTimeRangeChange: (range: TimeRangeType) => void;
  filters: DailyFilterOptions;
  loading: boolean;
  data: MonthlyTrendsChartData[];
  projectionData?: MonthlyTrendsChartData[]; // For projection points
}

export interface MonthlyTrendsDataRequest {
  timeRange: TimeRangeType;
  filters: DailyFilterOptions;
  endDate?: Date; // Defaults to today
}

// NEW: Rep Table Data Structures (for rep performance table)
export interface DailyRepTableData {
  rep: string;
  spend: number;
  profit: number;
  margin: number;
  activeAccounts: number; // Accounts that transacted in the period
  totalAccounts: number; // All accounts assigned to the rep
  telesalesPercentage: number; // Percentage of profit from telesales
  telesalesProfit: number; // Total profit from telesales
}

export interface DailyRepTableChanges {
  [repName: string]: {
    spend: number; // Percentage change
    profit: number; // Percentage change
    margin: number; // Percentage point change
    accounts: number; // Percentage change
    telesalesPercentage: number; // Percentage point change
  };
}

export interface DailyRepTableComparisonData {
  rep: string;
  current: {
    spend: number;
    profit: number;
    margin: number;
    activeAccounts: number;
    totalAccounts: number;
    telesalesPercentage: number;
    telesalesProfit: number;
  };
  comparison: {
    spend: number;
    profit: number;
    margin: number;
    activeAccounts: number;
    totalAccounts: number;
    telesalesPercentage: number;
    telesalesProfit: number;
  };
  changes: {
    spend: number; // Percentage change
    profit: number; // Percentage change
    margin: number; // Percentage point change
    activeAccounts: number; // Percentage change
    totalAccounts: number; // Percentage change
    telesalesPercentage: number; // Percentage point change
  };
}

// Sorting configuration for rep table
export interface DailyRepTableSortConfig {
  sortBy: 'profit' | 'spend' | 'margin' | 'activeAccounts' | 'totalAccounts' | 'telesalesPercentage';
  sortOrder: 'asc' | 'desc';
} 