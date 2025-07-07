import { 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  subMonths, 
  differenceInDays, 
  isSameDay, 
  format,
  startOfWeek,
  endOfWeek,
  subWeeks
} from 'date-fns';
import { 
  ComparisonPeriod, 
  DateRange, 
  DateRangeShortcut, 
  FormattedDateRange 
} from '@/types/daily-rep-performance.types';

/**
 * Get default date range (Month-to-Date)
 * This matches the user's requirement for default MTD view
 */
export const getDefaultDateRange = (): DateRange => {
  const today = new Date();
  const startOfCurrentMonth = startOfMonth(today);
  
  return {
    startDate: startOfCurrentMonth,
    endDate: today
  };
};

/**
 * Calculate comparison period based on current selection
 * Industry best practice: compare like-for-like periods
 * 
 * Examples:
 * - MTD Jan 1-15 → Previous MTD Dec 1-15
 * - Single Day Jan 15 → Previous Day Jan 14
 * - Full Month Jan → Previous Month Dec
 * - Custom Range 7 days → Previous 7 days
 */
export const getComparisonPeriod = (startDate: Date, endDate: Date): ComparisonPeriod => {
  const diffDays = differenceInDays(endDate, startDate);
  
  // Single day - compare with previous day
  if (isSameDay(startDate, endDate)) {
    return {
      current: { start: startDate, end: endDate },
      comparison: { 
        start: subDays(startDate, 1), 
        end: subDays(endDate, 1) 
      },
      type: 'Day',
      label: format(subDays(startDate, 1), 'MMM d')
    };
  }
  
  // Month-to-date - compare with same period in previous month
  if (isMonthToDate(startDate, endDate)) {
    const prevMonthStart = subMonths(startDate, 1);
    const prevMonthEnd = subMonths(endDate, 1);
    return {
      current: { start: startDate, end: endDate },
      comparison: { start: prevMonthStart, end: prevMonthEnd },
      type: 'MTD',
      label: `${format(prevMonthStart, 'MMM')} ${format(prevMonthStart, 'd')}-${format(prevMonthEnd, 'd')}`
    };
  }
  
  // Full month - compare with previous month
  if (isFullMonth(startDate, endDate)) {
    const prevMonthStart = startOfMonth(subMonths(startDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(startDate, 1));
    return {
      current: { start: startDate, end: endDate },
      comparison: { start: prevMonthStart, end: prevMonthEnd },
      type: 'Month',
      label: format(prevMonthStart, 'MMM yyyy')
    };
  }
  
  // Week - compare with previous week
  if (isFullWeek(startDate, endDate)) {
    const prevWeekStart = startOfWeek(subWeeks(startDate, 1));
    const prevWeekEnd = endOfWeek(subWeeks(startDate, 1));
    return {
      current: { start: startDate, end: endDate },
      comparison: { start: prevWeekStart, end: prevWeekEnd },
      type: 'Week',
      label: `${format(prevWeekStart, 'MMM d')} - ${format(prevWeekEnd, 'MMM d')}`
    };
  }
  
  // Custom range - shift back by range length + 1 day (to avoid overlap)
  const comparisonStart = subDays(startDate, diffDays + 1);
  const comparisonEnd = subDays(startDate, 1);
  
  return {
    current: { start: startDate, end: endDate },
    comparison: { start: comparisonStart, end: comparisonEnd },
    type: 'Custom',
    label: `${format(comparisonStart, 'MMM d')} - ${format(comparisonEnd, 'MMM d')}`
  };
};

/**
 * Check if date range is month-to-date
 */
const isMonthToDate = (startDate: Date, endDate: Date): boolean => {
  const monthStart = startOfMonth(startDate);
  return isSameDay(startDate, monthStart) && endDate <= endOfMonth(startDate);
};

/**
 * Check if date range is a full month
 */
const isFullMonth = (startDate: Date, endDate: Date): boolean => {
  const monthStart = startOfMonth(startDate);
  const monthEnd = endOfMonth(startDate);
  return isSameDay(startDate, monthStart) && isSameDay(endDate, monthEnd);
};

/**
 * Check if date range is a full week
 */
const isFullWeek = (startDate: Date, endDate: Date): boolean => {
  const weekStart = startOfWeek(startDate);
  const weekEnd = endOfWeek(startDate);
  return isSameDay(startDate, weekStart) && isSameDay(endDate, weekEnd);
};

/**
 * Format date range for display in UI
 */
export const formatDateRange = (startDate: Date, endDate: Date): FormattedDateRange => {
  let display: string;
  let period: string;
  
  if (isSameDay(startDate, endDate)) {
    display = format(startDate, 'MMM d, yyyy');
    period = 'Day';
  } else if (startDate.getFullYear() === endDate.getFullYear()) {
    if (startDate.getMonth() === endDate.getMonth()) {
      display = `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
      period = isMonthToDate(startDate, endDate) ? 'MTD' : 'Range';
    } else {
      display = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
      period = 'Range';
    }
  } else {
    display = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    period = 'Range';
  }
  
  const comparison = getComparisonPeriod(startDate, endDate);
  
  return {
    display,
    period,
    comparison: comparison.label
  };
};

/**
 * Predefined date range shortcuts for the picker
 * Industry standard shortcuts that users expect
 */
export const getDateRangeShortcuts = (): DateRangeShortcut[] => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const weekAgo = subDays(today, 6); // Last 7 days including today
  const monthAgo = subDays(today, 29); // Last 30 days including today
  const monthStart = startOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));
  const weekStart = startOfWeek(today);
  const lastWeekStart = startOfWeek(subWeeks(today, 1));
  const lastWeekEnd = endOfWeek(subWeeks(today, 1));
  
  return [
    {
      label: 'Today',
      value: { startDate: today, endDate: today }
    },
    {
      label: 'Yesterday', 
      value: { startDate: yesterday, endDate: yesterday }
    },
    {
      label: 'This Week',
      value: { startDate: weekStart, endDate: today }
    },
    {
      label: 'Last Week',
      value: { startDate: lastWeekStart, endDate: lastWeekEnd }
    },
    {
      label: 'Last 7 days',
      value: { startDate: weekAgo, endDate: today }
    },
    {
      label: 'Last 30 days',
      value: { startDate: monthAgo, endDate: today }
    },
    {
      label: 'Month to Date',
      value: { startDate: monthStart, endDate: today }
    },
    {
      label: 'Last Month',
      value: { startDate: lastMonthStart, endDate: lastMonthEnd }
    }
  ];
};

/**
 * Convert date range to SQL-friendly format for Supabase queries
 */
export const formatDateRangeForQuery = (startDate: Date, endDate: Date) => {
  return {
    startDate: format(startDate, 'yyyy-MM-dd 00:00:00'),
    endDate: format(endDate, 'yyyy-MM-dd 23:59:59')
  };
};

/**
 * Validate if a date range is reasonable for performance
 * Prevents users from selecting massive ranges that could impact performance
 */
export const validateDateRange = (startDate: Date, endDate: Date): { valid: boolean; message?: string } => {
  const diffDays = differenceInDays(endDate, startDate);
  
  // Check if end date is before start date
  if (diffDays < 0) {
    return { valid: false, message: 'End date must be after start date' };
  }
  
  // Check if range is too large (more than 1 year)
  if (diffDays > 365) {
    return { valid: false, message: 'Date range cannot exceed 1 year' };
  }
  
  // Check if dates are in the future (beyond today)
  const today = new Date();
  if (startDate > today || endDate > today) {
    return { valid: false, message: 'Future dates are not allowed' };
  }
  
  return { valid: true };
};

/**
 * Get relative date description for UI
 * Examples: "2 days ago", "1 week ago", "Last month"
 */
export const getRelativeDateDescription = (date: Date): string => {
  const today = new Date();
  const diffDays = differenceInDays(today, date);
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
};

/**
 * Check if a date range represents "recent" data (within last 30 days)
 * Used for performance optimizations and UI hints
 */
export const isRecentData = (startDate: Date, endDate: Date): boolean => {
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  return startDate >= thirtyDaysAgo;
}; 