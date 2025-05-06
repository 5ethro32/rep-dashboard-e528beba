import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches department breakdown from the unified_sales_data table
 */
export const getDepartmentBreakdown = async () => {
  try {
    const { data, error } = await supabase
      .from('unified_sales_data')
      .select('reporting_month, department, count(*)')
      .order('reporting_month, department');
      
    if (error) throw error;
    
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error('Error getting department breakdown:', error);
    return {
      success: false,
      data: null,
      error
    };
  }
};

/**
 * Fetches summary data for all months
 */
export const getMonthSummaries = async () => {
  try {
    // Fetch data for all months
    const { data: monthData, error: monthError } = await supabase
      .from('unified_sales_data')
      .select('reporting_month');
      
    if (monthError) throw monthError;
    
    // Get unique months
    const months = [...new Set(monthData.map(item => item.reporting_month))];
    const summaries = [];
    
    // Get summary for each month
    for (const month of months) {
      const { data: monthSummary, error: summaryError } = await supabase
        .from('unified_sales_data')
        .select('*')
        .eq('reporting_month', month);
        
      if (summaryError) {
        console.error(`Error fetching data for ${month}:`, summaryError);
        continue;
      }
      
      // Calculate summary values
      let totalSpend = 0;
      let totalProfit = 0;
      let totalPacks = 0;
      let uniqueReps = new Set();
      let uniqueAccounts = new Set();
      
      monthSummary.forEach(record => {
        totalSpend += record.spend || 0;
        totalProfit += record.profit || 0;
        totalPacks += record.packs || 0;
        if (record.rep_name) uniqueReps.add(record.rep_name);
        if (record.account_ref) uniqueAccounts.add(record.account_ref);
      });
      
      summaries.push({
        month,
        recordCount: monthSummary.length,
        totalSpend,
        totalProfit,
        totalPacks,
        uniqueReps: uniqueReps.size,
        uniqueAccounts: uniqueAccounts.size,
      });
    }
    
    return {
      success: true,
      data: summaries,
      error: null
    };
  } catch (error) {
    console.error('Error getting month summaries:', error);
    return {
      success: false,
      data: null,
      error
    };
  }
};

/**
 * Verifies a specific month's data in the unified table vs. original table
 */
export const verifyMonthData = async (month: string) => {
  try {
    const monthToTableMap: Record<string, string> = {
      'February': 'sales_data_februrary',
      'March': 'sales_data',
      'April': 'mtd_daily',
      'May': 'May_Data'
    };
    
    const originalTable = monthToTableMap[month];
    if (!originalTable) {
      throw new Error(`Invalid month: ${month}`);
    }
    
    // Get data from unified table
    const { data: unifiedData, error: unifiedError } = await supabase
      .from('unified_sales_data')
      .select('*')
      .eq('reporting_month', month);
      
    if (unifiedError) throw unifiedError;
    
    // Get data from original table
    const { data: originalData, error: originalError } = await supabase
      .from(originalTable)
      .select('*');
      
    if (originalError) throw originalError;
    
    // Calculate summary for unified data
    let unifiedSpend = 0;
    let unifiedProfit = 0;
    let unifiedPacks = 0;
    let unifiedReps = new Set();
    
    unifiedData.forEach(record => {
      unifiedSpend += record.spend || 0;
      unifiedProfit += record.profit || 0;
      unifiedPacks += record.packs || 0;
      if (record.rep_name) unifiedReps.add(record.rep_name);
    });
    
    // Calculate summary for original data
    let originalSpend = 0;
    let originalProfit = 0;
    let originalPacks = 0;
    let originalReps = new Set();
    
    // Handle different field naming conventions
    if (month === 'March') {
      originalData.forEach((record: any) => {
        originalSpend += record.spend || 0;
        originalProfit += record.profit || 0;
        originalPacks += record.packs || 0;
        if (record.rep_name) originalReps.add(record.rep_name);
      });
    } else {
      originalData.forEach((record: any) => {
        originalSpend += record.Spend || 0;
        originalProfit += record.Profit || 0;
        originalPacks += record.Packs || 0;
        if (record.Rep) originalReps.add(record.Rep);
      });
    }
    
    return {
      success: true,
      data: {
        month,
        originalTable,
        unified: {
          recordCount: unifiedData.length,
          totalSpend: unifiedSpend,
          totalProfit: unifiedProfit,
          totalPacks: unifiedPacks,
          uniqueReps: unifiedReps.size,
          repNames: Array.from(unifiedReps)
        },
        original: {
          recordCount: originalData.length,
          totalSpend: originalSpend,
          totalProfit: originalProfit,
          totalPacks: originalPacks,
          uniqueReps: originalReps.size,
          repNames: Array.from(originalReps)
        }
      },
      error: null
    };
  } catch (error) {
    console.error(`Error verifying data for ${month}:`, error);
    return {
      success: false,
      data: null,
      error
    };
  }
};

/**
 * Remaps department values in unified_sales_data table to standardize them
 */
export const fixDepartmentValues = async () => {
  try {
    // First get all unique departments
    const { data: depts, error: deptsError } = await supabase
      .from('unified_sales_data')
      .select('department')
      .order('department');
      
    if (deptsError) throw deptsError;
    
    const uniqueDepts = [...new Set(depts.map(d => d.department))];
    console.log('Current unique departments:', uniqueDepts);
    
    // Define mapping rules
    const departmentMapping: Record<string, string> = {
      'retail': 'RETAIL',
      'Retail': 'RETAIL',
      'REVA': 'REVA',
      'reva': 'REVA',
      'Reva': 'REVA',
      'wholesale': 'WHOLESALE',
      'Wholesale': 'WHOLESALE',
      'WHOLESALE': 'WHOLESALE'
    };
    
    // Apply fixes for each department value
    const updatePromises = uniqueDepts.map(async (dept) => {
      if (!dept) return { dept, updatedCount: 0 };
      
      const targetValue = departmentMapping[dept];
      if (!targetValue || targetValue === dept) {
        return { dept, updatedCount: 0 };
      }
      
      const { data, error, count } = await supabase
        .from('unified_sales_data')
        .update({ department: targetValue })
        .eq('department', dept);
        
      if (error) {
        console.error(`Error updating department ${dept}:`, error);
        return { dept, updatedCount: 0, error };
      }
      
      return { dept, updatedCount: count || 0 };
    });
    
    const results = await Promise.all(updatePromises);
    
    return {
      success: true,
      data: results,
      error: null
    };
  } catch (error) {
    console.error('Error fixing department values:', error);
    return {
      success: false,
      data: null,
      error
    };
  }
};

/**
 * Runs a manual calculation of metrics for a specific month
 * to cross-check against what the app is displaying
 */
export const calculateMonthMetricsManually = async (month: string) => {
  try {
    // Get data from unified table
    const { data, error } = await supabase
      .from('unified_sales_data')
      .select('*')
      .eq('reporting_month', month);
      
    if (error) throw error;
    
    // Calculate metrics by department
    const departments = ['RETAIL', 'REVA', 'WHOLESALE'];
    const results: Record<string, any> = {
      month,
      recordCount: data.length,
      departments: {}
    };
    
    // Calculate totals for all data
    let totalSpend = 0;
    let totalProfit = 0;
    let totalPacks = 0;
    let uniqueReps = new Set();
    let uniqueAccounts = new Set();
    
    data.forEach(record => {
      totalSpend += record.spend || 0;
      totalProfit += record.profit || 0;
      totalPacks += record.packs || 0;
      if (record.rep_name) uniqueReps.add(record.rep_name);
      if (record.account_ref) uniqueAccounts.add(record.account_ref);
    });
    
    results.total = {
      spend: totalSpend,
      profit: totalProfit,
      margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
      packs: totalPacks,
      uniqueReps: uniqueReps.size,
      uniqueAccounts: uniqueAccounts.size
    };
    
    // Calculate metrics for each department
    for (const dept of departments) {
      const deptData = data.filter(record => 
        record.department?.toUpperCase() === dept.toUpperCase()
      );
      
      let deptSpend = 0;
      let deptProfit = 0;
      let deptPacks = 0;
      let deptReps = new Set();
      let deptAccounts = new Set();
      
      deptData.forEach(record => {
        deptSpend += record.spend || 0;
        deptProfit += record.profit || 0;
        deptPacks += record.packs || 0;
        if (record.rep_name) deptReps.add(record.rep_name);
        if (record.account_ref) deptAccounts.add(record.account_ref);
      });
      
      results.departments[dept] = {
        recordCount: deptData.length,
        spend: deptSpend,
        profit: deptProfit,
        margin: deptSpend > 0 ? (deptProfit / deptSpend) * 100 : 0,
        packs: deptPacks,
        uniqueReps: deptReps.size,
        uniqueAccounts: deptAccounts.size,
        repNames: Array.from(deptReps)
      };
    }
    
    return {
      success: true,
      data: results,
      error: null
    };
  } catch (error) {
    console.error(`Error calculating metrics for ${month}:`, error);
    return {
      success: false,
      data: null,
      error
    };
  }
}; 