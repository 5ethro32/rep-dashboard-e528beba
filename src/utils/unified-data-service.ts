import { supabase } from '@/integrations/supabase/client';

// Standardized interface matching the unified sales data table structure
interface UnifiedSalesData {
  id: string;
  source_id?: string;
  source_table?: string;
  reporting_year?: number;
  reporting_month: string;
  reporting_period?: string;
  rep_name: string;
  sub_rep?: string;
  account_ref?: string;
  account_name?: string;
  department?: string;
  spend: number;
  profit: number;
  margin?: number;
  packs: number;
  cost?: number;
  credit?: number;
  import_date?: string;
  data_month?: string;
}

// Interface for department metrics
interface DepartmentMetric {
  department: string;
  recordCount: number;
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
  totalAccounts: number;
  repCount: number;
  averageMargin: number;
}

/**
 * Fetches all data for a specific month from the unified sales data table
 * @param month - Month name (e.g., 'February', 'March')
 * @returns Array of sales data records
 */
export const getMonthData = async (month: string): Promise<UnifiedSalesData[]> => {
  console.log(`Fetching data for month: ${month}`);
  
  try {
    // Use pagination to fetch all records, even beyond the 1000 limit
    let allData: UnifiedSalesData[] = [];
    let hasMoreData = true;
    let pageNumber = 0;
    const pageSize = 1000;
    
    while (hasMoreData) {
      // Calculate the offset for the current page
      const offset = pageNumber * pageSize;
      
      // Direct SQL query approach with pagination
      const query = `SELECT * FROM unified_sales_data 
                     WHERE reporting_month = '${month}' 
                     LIMIT ${pageSize} OFFSET ${offset}`;
      
      console.log(`Fetching page ${pageNumber + 1} (offset ${offset})`);
      const { data, error } = await (supabase as any).rpc('select', { query });
      
      if (error) {
        console.error('Error fetching data:', error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} records in page ${pageNumber + 1}`);
      
      // Add the current page data to our accumulated results
      if (data && data.length > 0) {
        allData = [...allData, ...data];
      }
      
      // Check if we've reached the end of the data
      if (!data || data.length < pageSize) {
        hasMoreData = false;
      } else {
        pageNumber++;
      }
    }
    
    console.log(`Total records fetched for ${month}: ${allData.length}`);
    return allData;
  } catch (error) {
    console.error('Error fetching month data:', error);
    throw error;
  }
};

/**
 * Fetches data for comparison between two months
 * @param currentMonth - The primary month to analyze
 * @param previousMonth - The month to compare against
 * @returns Object containing both current and previous month data
 */
export const getComparisonData = async (currentMonth: string, previousMonth: string) => {
  try {
    const current = await getMonthData(currentMonth);
    const previous = await getMonthData(previousMonth);
    
    return { current, previous };
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    throw error;
  }
};

/**
 * Fetches aggregated metrics for a specific month
 * @param month - Month name (e.g., 'February', 'March')
 * @returns Aggregated metrics for the month
 */
export const getMonthlyMetrics = async (month: string) => {
  try {
    // Direct SQL approach  
    const query = `
      SELECT 
        '${month}' as reporting_month,
        COUNT(*) AS record_count,
        SUM(spend) AS total_spend,
        SUM(profit) AS total_profit,
        COUNT(DISTINCT rep_name) AS unique_reps,
        COUNT(DISTINCT account_ref) AS unique_accounts
      FROM unified_sales_data
      WHERE reporting_month = '${month}'
      GROUP BY reporting_month
    `;
    
    const { data, error } = await (supabase as any).rpc('select', { query });
    
    if (error) {
      console.error('Error fetching monthly metrics:', error);
      
      // Fallback to calculating from raw data
      const monthData = await getMonthData(month);
      
      if (monthData.length > 0) {
        const totalSpend = monthData.reduce((sum, row) => sum + Number(row.spend || 0), 0);
        const totalProfit = monthData.reduce((sum, row) => sum + Number(row.profit || 0), 0);
        
        // Get unique reps and accounts
        const uniqueReps = new Set<string>();
        const uniqueAccounts = new Set<string>();
        monthData.forEach(row => {
          if (row.rep_name) uniqueReps.add(row.rep_name);
          if (row.account_ref) uniqueAccounts.add(row.account_ref);
        });
        
        return {
          reporting_month: month,
          record_count: monthData.length,
          total_spend: totalSpend,
          total_profit: totalProfit,
          unique_reps: uniqueReps.size,
          unique_accounts: uniqueAccounts.size
        };
      }
      
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in getMonthlyMetrics:', error);
    return null;
  }
};

/**
 * Fetches all monthly metrics for trend analysis
 * @returns Array of monthly metrics
 */
export const getAllMonthlyMetrics = async () => {
  try {
    // We need to get all the months first
    const months = await getAvailableMonths();
    
    // Then get metrics for each month
    const metricsPromises = months.map(month => getMonthlyMetrics(month));
    const allMetrics = await Promise.all(metricsPromises);
    
    // Order the months properly
    const monthOrder = {
      'February': 1,
      'March': 2,
      'April': 3,
      'May': 4
    };
    
    // Filter out nulls and sort by month
    return allMetrics
      .filter(Boolean)
      .sort((a, b) => {
        const aOrder = monthOrder[a!.reporting_month as keyof typeof monthOrder] || 999;
        const bOrder = monthOrder[b!.reporting_month as keyof typeof monthOrder] || 999;
        return aOrder - bOrder;
      });
  } catch (error) {
    console.error('Error in getAllMonthlyMetrics:', error);
    return [];
  }
};

/**
 * Fetches available months in the unified data table
 * @returns Array of month names
 */
export const getAvailableMonths = async () => {
  try {
    // Direct SQL approach
    const query = `
      SELECT DISTINCT reporting_month
      FROM unified_sales_data
      ORDER BY 
        CASE 
          WHEN reporting_month = 'February' THEN 1
          WHEN reporting_month = 'March' THEN 2
          WHEN reporting_month = 'April' THEN 3
          WHEN reporting_month = 'May' THEN 4
          ELSE 5
        END DESC
    `;
    
    const { data, error } = await (supabase as any).rpc('select', { query });
    
    if (error) {
      console.error('Error fetching available months:', error);
      // Fallback to hardcoded months
      return ['May', 'April', 'March', 'February'];
    }
    
    // Extract month names from the result
    if (data && Array.isArray(data)) {
      return data.map((item: any) => item.reporting_month);
    }
    
    // Fallback
    return ['May', 'April', 'March', 'February'];
  } catch (error) {
    console.error('Error in getAvailableMonths:', error);
    // Return default months as fallback
    return ['May', 'April', 'March', 'February'];
  }
};

/**
 * Gets a list of all departments in the data
 * @returns Array of unique department names
 */
export const getAllDepartments = async () => {
  try {
    // Direct SQL approach
    const query = `
      SELECT DISTINCT LOWER(department) AS department
      FROM unified_sales_data
      WHERE department IS NOT NULL
      ORDER BY department
    `;
    
    const { data, error } = await (supabase as any).rpc('select', { query });
    
    if (error) {
      console.error('Error fetching departments:', error);
      // Return default departments as fallback
      return ['retail', 'wholesale', 'reva'];
    }
    
    // Extract department names from the result
    if (data && Array.isArray(data)) {
      return data.map((item: any) => item.department);
    }
    
    // Fallback
    return ['retail', 'wholesale', 'reva'];
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    // Return default departments as fallback
    return ['retail', 'wholesale', 'reva'];
  }
};

/**
 * Fetches department-aggregated metrics for a specific month
 * @param month - Month name (e.g., 'February', 'March')
 * @returns Array of department metrics
 */
export const getMonthlyMetricsByDept = async (month: string): Promise<DepartmentMetric[]> => {
  try {
    // Direct SQL approach
    const query = `
      SELECT 
        LOWER(department) AS department,
        COUNT(*) AS record_count,
        SUM(spend) AS total_spend,
        SUM(profit) AS total_profit,
        SUM(packs) AS total_packs,
        COUNT(DISTINCT account_ref) AS total_accounts,
        COUNT(DISTINCT rep_name) AS rep_count
      FROM 
        unified_sales_data
      WHERE 
        reporting_month = '${month}'
      GROUP BY 
        LOWER(department)
    `;
    
    const { data, error } = await (supabase as any).rpc('select', { query });
    
    if (error) {
      console.error('Error fetching department metrics:', error);
      // Fall back to the JavaScript implementation
      return getMonthlyMetricsByDeptJS(month);
    }
    
    // Process the department metrics with consistent naming
    if (data && Array.isArray(data) && data.length > 0) {
      return data.map((dept: any) => {
        // Normalize department names
        let normalizedDept = dept.department.toLowerCase();
        if (normalizedDept.includes('reva')) normalizedDept = 'reva';
        else if (normalizedDept.includes('wholesale')) normalizedDept = 'wholesale';
        else if (normalizedDept.includes('retail')) normalizedDept = 'retail';
        
        // Calculate margin
        const totalSpend = Number(dept.total_spend) || 0;
        const totalProfit = Number(dept.total_profit) || 0;
        const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
        
        return {
          department: normalizedDept,
          recordCount: Number(dept.record_count) || 0,
          totalSpend: totalSpend,
          totalProfit: totalProfit,
          totalPacks: Number(dept.total_packs) || 0,
          totalAccounts: Number(dept.total_accounts) || 0,
          repCount: Number(dept.rep_count) || 0,
          averageMargin: averageMargin
        };
      });
    }
    
    // Fall back to the JavaScript implementation if no data
    return getMonthlyMetricsByDeptJS(month);
  } catch (error) {
    console.error('Error in getMonthlyMetricsByDept:', error);
    // Fall back to the JavaScript implementation on error
    return getMonthlyMetricsByDeptJS(month);
  }
};

/**
 * JavaScript implementation of department metrics aggregation
 * @param month - Month name
 * @returns Array of department metrics
 */
const getMonthlyMetricsByDeptJS = async (month: string): Promise<DepartmentMetric[]> => {
  try {
    // Get all data for the month and aggregate in JavaScript
    const monthData = await getMonthData(month);
    
    // Group by department
    const departmentGroups: Record<string, any> = {};
    const uniqueAccounts: Record<string, Set<string>> = {};
    const uniqueReps: Record<string, Set<string>> = {};
    
    // Process each record
    monthData.forEach(row => {
      // Normalize department name
      let dept = (row.department || '').toLowerCase();
      if (dept.includes('reva')) dept = 'reva';
      else if (dept.includes('wholesale')) dept = 'wholesale';
      else dept = 'retail';
      
      // Initialize department if needed
      if (!departmentGroups[dept]) {
        departmentGroups[dept] = {
          department: dept,
          recordCount: 0,
          totalSpend: 0,
          totalProfit: 0,
          totalPacks: 0
        };
        uniqueAccounts[dept] = new Set();
        uniqueReps[dept] = new Set();
      }
      
      // Aggregate values
      departmentGroups[dept].recordCount += 1;
      departmentGroups[dept].totalSpend += Number(row.spend) || 0;
      departmentGroups[dept].totalProfit += Number(row.profit) || 0;
      departmentGroups[dept].totalPacks += Number(row.packs) || 0;
      
      // Track unique items
      if (row.account_ref) uniqueAccounts[dept].add(row.account_ref);
      if (row.rep_name) uniqueReps[dept].add(row.rep_name);
    });
    
    // Create the final metrics
    return Object.keys(departmentGroups).map(deptKey => {
      const metrics = departmentGroups[deptKey];
      
      // Calculate average margin
      const totalSpend = metrics.totalSpend;
      const totalProfit = metrics.totalProfit;
      const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
      
      return {
        department: deptKey,
        recordCount: metrics.recordCount,
        totalSpend: totalSpend,
        totalProfit: totalProfit,
        totalPacks: metrics.totalPacks,
        totalAccounts: uniqueAccounts[deptKey].size,
        repCount: uniqueReps[deptKey].size,
        averageMargin: averageMargin
      };
    });
  } catch (error) {
    console.error('Error in JavaScript implementation for department metrics:', error);
    return [];
  }
};

/**
 * Gets comparison data between current and previous month metrics
 * @param currentMonth - Current month (e.g., 'March')
 * @returns Object containing metrics and calculated changes
 */
export const getMonthlyComparison = async (currentMonth: string) => {
  // Determine previous month
  const monthOrder = ['February', 'March', 'April', 'May'];
  const currentIndex = monthOrder.indexOf(currentMonth);
  
  // If February or invalid month, return with no comparison
  if (currentIndex <= 0) {
    const currentMetrics = await getMonthlyMetricsByDept(currentMonth);
    return { 
      current: currentMetrics,
      previous: [],
      changes: {},
      previousMonthName: null
    };
  }
  
  const previousMonth = monthOrder[currentIndex - 1];
  
  // Get metrics for both months
  const [currentMetrics, previousMetrics] = await Promise.all([
    getMonthlyMetricsByDept(currentMonth),
    getMonthlyMetricsByDept(previousMonth)
  ]);
  
  // Create department map for easier access to previous month data
  const previousByDept: Record<string, DepartmentMetric> = {};
  previousMetrics.forEach(metric => {
    previousByDept[metric.department] = metric;
  });
  
  // Calculate percentage changes for each department
  const changes: Record<string, Record<string, number>> = {};
  
  // Helper for calculating percentage change
  const percentChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Process each department in current metrics
  currentMetrics.forEach(current => {
    // Find matching department in previous month
    const previous = previousMetrics.find(p => p.department === current.department);
    
    if (previous) {
      changes[current.department] = {
        totalSpend: percentChange(current.totalSpend, previous.totalSpend),
        totalProfit: percentChange(current.totalProfit, previous.totalProfit),
        totalPacks: percentChange(current.totalPacks, previous.totalPacks),
        averageMargin: current.averageMargin - previous.averageMargin,
        totalAccounts: percentChange(current.totalAccounts, previous.totalAccounts)
      };
    }
  });
  
  return {
    current: currentMetrics,
    previous: previousMetrics,
    previousByDept,
    changes,
    previousMonthName: previousMonth
  };
}; 