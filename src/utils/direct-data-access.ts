import { supabase } from '@/integrations/supabase/client';

/**
 * Direct access to unified sales data for a specific month
 * This bypasses all the complex transformations to diagnose issues
 */
export const getMonthDataDirect = async (month: string) => {
  console.log(`[DIRECT] Fetching data for month: ${month}`);
  
  const { data, error } = await supabase
    .from('unified_sales_data')
    .select('*')
    .eq('reporting_month', month)
    .limit(100000);
  
  if (error) {
    console.error('[DIRECT] Error fetching month data:', error);
    throw error;
  }
  
  console.log(`[DIRECT] Fetched ${data?.length || 0} records for ${month}`);
  
  // Calculate totals without any complex transformations
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  
  data?.forEach(record => {
    // Handle null values safely
    totalSpend += Number(record.spend) || 0;
    totalProfit += Number(record.profit) || 0;
    totalPacks += Number(record.packs) || 0;
  });
  
  console.log('[DIRECT] Total values:', { totalSpend, totalProfit, totalPacks });
  
  // Create department summaries
  const departments = ['RETAIL', 'REVA', 'WHOLESALE'];
  const departmentSummaries: Record<string, any> = {};
  
  for (const dept of departments) {
    const deptRecords = data?.filter(record => 
      (record.department || '').toUpperCase() === dept
    ) || [];
    
    let deptSpend = 0;
    let deptProfit = 0;
    let deptPacks = 0;
    
    deptRecords.forEach(record => {
      deptSpend += Number(record.spend) || 0;
      deptProfit += Number(record.profit) || 0;
      deptPacks += Number(record.packs) || 0;
    });
    
    departmentSummaries[dept] = {
      recordCount: deptRecords.length,
      spend: deptSpend,
      profit: deptProfit,
      margin: deptSpend > 0 ? (deptProfit / deptSpend) * 100 : 0,
      packs: deptPacks
    };
    
    console.log(`[DIRECT] ${dept} department:`, departmentSummaries[dept]);
  }
  
  return {
    rawData: data || [],
    totals: {
      recordCount: data?.length || 0,
      spend: totalSpend,
      profit: totalProfit,
      margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
      packs: totalPacks
    },
    departments: departmentSummaries
  };
};

/**
 * Get the list of reps with their metrics directly from the unified table
 */
export const getRepDataDirect = async (month: string, department?: string) => {
  console.log(`[DIRECT] Fetching rep data for month: ${month}${department ? `, department: ${department}` : ''}`);
  
  let query = supabase
    .from('unified_sales_data')
    .select('*')
    .eq('reporting_month', month);
    
  if (department) {
    query = query.ilike('department', department);
  }
  
  // Add limit to ensure we get all records
  query = query.limit(100000);
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[DIRECT] Error fetching rep data:', error);
    throw error;
  }
  
  // Group by rep_name and calculate metrics
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    accounts: Set<string>;
  }>();
  
  data?.forEach(record => {
    const repName = record.rep_name;
    if (!repName) return;
    
    if (!repMap.has(repName)) {
      repMap.set(repName, {
        rep: repName,
        spend: 0,
        profit: 0,
        packs: 0,
        accounts: new Set()
      });
    }
    
    const repData = repMap.get(repName)!;
    repData.spend += Number(record.spend) || 0;
    repData.profit += Number(record.profit) || 0;
    repData.packs += Number(record.packs) || 0;
    
    if (record.account_ref) {
      repData.accounts.add(record.account_ref);
    }
  });
  
  // Convert to array and calculate derived metrics
  const reps = Array.from(repMap.values()).map(rep => ({
    rep: rep.rep,
    spend: rep.spend,
    profit: rep.profit,
    margin: rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0,
    packs: rep.packs,
    activeAccounts: rep.accounts.size
  }));
  
  // Sort by profit (descending)
  reps.sort((a, b) => b.profit - a.profit);
  
  console.log(`[DIRECT] Found ${reps.length} reps`);
  if (reps.length > 0) {
    console.log('[DIRECT] Top rep:', reps[0]);
  }
  
  return reps;
};

/**
 * A direct approach to get unified department totals
 */
export const getUnifiedDepartmentTotals = async (month: string) => {
  // Get all data for the month
  const { data, error } = await supabase
    .from('unified_sales_data')
    .select('*')
    .eq('reporting_month', month)
    .limit(100000);
    
  if (error) {
    console.error('[DIRECT] Error fetching month data for department totals:', error);
    throw error;
  }
  
  // Define the departments we're interested in
  const departments = ['RETAIL', 'REVA', 'WHOLESALE'];
  
  // Calculate totals for each department
  const results: Record<string, {
    spend: number;
    profit: number;
    margin: number;
    packs: number;
    recordCount: number;
  }> = {};
  
  // Process each department
  for (const dept of departments) {
    // Filter records for this department (case insensitive)
    const deptRecords = data.filter(record => 
      (record.department || '').toUpperCase() === dept
    );
    
    // Calculate totals
    let totalSpend = 0;
    let totalProfit = 0;
    let totalPacks = 0;
    
    deptRecords.forEach(record => {
      totalSpend += Number(record.spend) || 0;
      totalProfit += Number(record.profit) || 0;
      totalPacks += Number(record.packs) || 0;
    });
    
    // Store results
    results[dept] = {
      spend: totalSpend,
      profit: totalProfit,
      margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
      packs: totalPacks,
      recordCount: deptRecords.length
    };
  }
  
  // Log the results for debugging
  console.log('[DIRECT] Department totals:', results);
  
  return results;
};

/**
 * Fetches data for a specific month directly from the database
 */
export async function getMonthData(month: string) {
  console.log(`Fetching direct data for month: ${month}`);
  
  try {
    // Use pagination to fetch all records
    let allData: any[] = [];
    let hasMoreData = true;
    let offset = 0;
    const pageSize = 1000;  // Supabase default limit
    
    while (hasMoreData) {
      console.log(`Fetching page ${offset/pageSize + 1}...`);
      
      // Query for the current page - use type assertion to avoid TypeScript errors
      const { data, error } = await (supabase as any)
        .from('unified_sales_data')
        .select('*')
        .eq('reporting_month', month)
        .limit(pageSize)
        .range(offset, offset + pageSize - 1);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`Got ${data.length} records for page ${offset/pageSize + 1}`);
        allData = [...allData, ...data];
      }
      
      // Check if we need to fetch more pages
      if (!data || data.length < pageSize) {
        hasMoreData = false;
      } else {
        offset += pageSize;
      }
    }
    
    console.log(`Total records fetched: ${allData.length}`);
    return allData;
  } catch (error) {
    console.error('Error fetching month data:', error);
    throw error;
  }
}

/**
 * Fetches data for a specific month and department
 */
export async function getMonthDepartmentData(month: string, department?: string) {
  console.log(`Fetching direct data for month: ${month}, department: ${department || 'all'}`);
  
  try {
    // Use pagination to fetch all records
    let allData: any[] = [];
    let hasMoreData = true;
    let offset = 0;
    const pageSize = 1000;
    
    while (hasMoreData) {
      console.log(`Fetching page ${offset/pageSize + 1}...`);
      
      // Build query with pagination - use type assertion to avoid TypeScript errors
      let query = (supabase as any)
        .from('unified_sales_data')
        .select('*')
        .eq('reporting_month', month)
        .limit(pageSize)
        .range(offset, offset + pageSize - 1);
      
      // Add department filter if specified
      if (department) {
        query = query.ilike('department', department);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`Got ${data.length} records for page ${offset/pageSize + 1}`);
        allData = [...allData, ...data];
      }
      
      // Check if we need to fetch more pages
      if (!data || data.length < pageSize) {
        hasMoreData = false;
      } else {
        offset += pageSize;
      }
    }
    
    console.log(`Total records fetched: ${allData.length}`);
    return allData;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

/**
 * Helper function to calculate sales metrics for a month
 */
export async function calculateMonthMetrics(month: string) {
  try {
    // Fetch all data with pagination
    const data = await getMonthData(month);
    
    if (!data || !data.length) {
      return {
        totalSpend: 0,
        totalProfit: 0,
        totalPacks: 0,
        avgMargin: 0,
        recordCount: 0
      };
    }
    
    // Calculate metrics
    const totalSpend = data.reduce((sum, item) => sum + Number(item.spend || 0), 0);
    const totalProfit = data.reduce((sum, item) => sum + Number(item.profit || 0), 0);
    const totalPacks = data.reduce((sum, item) => sum + Number(item.packs || 0), 0);
    const avgMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
    
    return {
      totalSpend,
      totalProfit,
      totalPacks,
      avgMargin,
      recordCount: data.length
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    throw error;
  }
} 