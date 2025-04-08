
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummaryFromData } from '@/utils/rep-data-processing';

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data from Supabase...');
    
    // Use direct SQL queries for accurate department profit totals for March
    const { data: retailProfitData, error: retailProfitError } = await supabase
      .rpc('get_retail_profit');
    
    const { data: revaProfitData, error: revaProfitError } = await supabase
      .rpc('get_reva_profit');
      
    const { data: wholesaleProfitData, error: wholesaleProfitError } = await supabase
      .rpc('get_wholesale_profit');

    if (retailProfitError || revaProfitError || wholesaleProfitError) {
      console.error("Error fetching profit data:", { 
        retailProfitError, 
        revaProfitError, 
        wholesaleProfitError 
      });
    }
    
    // MARCH DATA FETCHING
    // Instead of fetching all data at once, fetch by department to avoid pagination issues
    // RETAIL data
    const { data: retailData, error: retailError } = await fetchAllDepartmentData('RETAIL', 'sales_data_march');
    if (retailError) throw new Error(`Error fetching RETAIL data: ${retailError.message}`);
    console.log('Fetched RETAIL records:', retailData?.length || 0);
    
    // REVA data
    const { data: revaData, error: revaError } = await fetchAllDepartmentData('REVA', 'sales_data_march');
    if (revaError) throw new Error(`Error fetching REVA data: ${revaError.message}`);
    console.log('Fetched REVA records:', revaData?.length || 0);
    
    // Wholesale data
    const { data: wholesaleData, error: wholesaleError } = await fetchAllDepartmentData('Wholesale', 'sales_data_march');
    if (wholesaleError) throw new Error(`Error fetching Wholesale data: ${wholesaleError.message}`);
    console.log('Fetched Wholesale records:', wholesaleData?.length || 0);

    // FEBRUARY DATA FETCHING
    // Fetching February data for comparison
    // RETAIL data from February
    const { data: febRetailData, error: febRetailError } = await fetchAllDepartmentData('RETAIL', 'sales_data_februrary');
    if (febRetailError) throw new Error(`Error fetching February RETAIL data: ${febRetailError.message}`);
    console.log('Fetched February RETAIL records:', febRetailData?.length || 0);
    
    // REVA data from February
    const { data: febRevaData, error: febRevaError } = await fetchAllDepartmentData('REVA', 'sales_data_februrary');
    if (febRevaError) throw new Error(`Error fetching February REVA data: ${febRevaError.message}`);
    console.log('Fetched February REVA records:', febRevaData?.length || 0);
    
    // Wholesale data from February
    const { data: febWholesaleData, error: febWholesaleError } = await fetchAllDepartmentData('Wholesale', 'sales_data_februrary');
    if (febWholesaleError) throw new Error(`Error fetching February Wholesale data: ${febWholesaleError.message}`);
    console.log('Fetched February Wholesale records:', febWholesaleData?.length || 0);
    
    // Count total records for verification - March
    const totalCount = (retailData?.length || 0) + (revaData?.length || 0) + (wholesaleData?.length || 0);
    console.log('Total fetched records (March):', totalCount);

    // Count total records for verification - February
    const totalFebCount = (febRetailData?.length || 0) + (febRevaData?.length || 0) + (febWholesaleData?.length || 0);
    console.log('Total fetched records (February):', totalFebCount);
    
    // Process all March data
    const allDataFromDb = [...(retailData || []), ...(revaData || []), ...(wholesaleData || [])];
    
    // Process all February data
    const allFebDataFromDb = [...(febRetailData || []), ...(febRevaData || []), ...(febWholesaleData || [])];
    
    if (!allDataFromDb || allDataFromDb.length === 0) {
      throw new Error('No data found for March.');
    }
    
    console.log('Total combined data rows (March):', allDataFromDb.length);
    console.log('Total combined data rows (February):', allFebDataFromDb.length || 0);
    
    // Map the data to our standard format, handling special cases for REVA and Wholesale
    // March data mapping
    const mappedData = allDataFromDb.map((item: any) => {
      // Parse numerical values properly, ensuring they're numbers and not strings
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      const cost = typeof item.Cost === 'string' ? parseFloat(item.Cost) : Number(item.Cost || 0);
      const credit = typeof item.Credit === 'string' ? parseFloat(item.Credit) : Number(item.Credit || 0);
      const margin = typeof item.Margin === 'string' ? parseFloat(item.Margin) : Number(item.Margin || 0);
      const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
      
      // Determine the rep name to use
      // For REVA and Wholesale, use the Sub-Rep field if available instead of the Rep field
      let repName = item.Rep || '';
      const subRep = item['Sub-Rep'] || '';
      const department = item.Department || 'RETAIL';
      
      // If this is a REVA or Wholesale item and we have a Sub-Rep, use that as the rep name
      if ((department === 'REVA' || department === 'Wholesale') && subRep) {
        repName = subRep;
      }
      
      return {
        id: item.id ? (typeof item.id === 'string' ? parseInt(item.id) : item.id) : 0,
        reporting_period: 'March 2025',
        rep_name: repName,
        sub_rep: subRep,
        account_ref: item['Account Ref'] || '',
        account_name: item['Account Name'] || '',
        spend: spend,
        cost: cost,
        credit: credit,
        profit: profit,
        margin: margin,
        packs: packs,
        rep_type: department,
        original_dept: department,
        import_date: new Date().toISOString()
      };
    });

    // February data mapping
    const mappedFebData = allFebDataFromDb.map((item: any) => {
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      const cost = typeof item.Cost === 'string' ? parseFloat(item.Cost) : Number(item.Cost || 0);
      const credit = typeof item.Credit === 'string' ? parseFloat(item.Credit) : Number(item.Credit || 0);
      const margin = typeof item.Margin === 'string' ? parseFloat(item.Margin) : Number(item.Margin || 0);
      const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
      
      let repName = item.Rep || '';
      const subRep = item['Sub-Rep'] || '';
      const department = item.Department || 'RETAIL';
      
      if ((department === 'REVA' || department === 'Wholesale') && subRep) {
        repName = subRep;
      }
      
      return {
        id: item.id ? (typeof item.id === 'string' ? parseInt(item.id) : item.id) : 0,
        reporting_period: 'February 2025',
        rep_name: repName,
        sub_rep: subRep,
        account_ref: item['Account Ref'] || '',
        account_name: item['Account Name'] || '',
        spend: spend,
        cost: cost,
        credit: credit,
        profit: profit,
        margin: margin,
        packs: packs,
        rep_type: department,
        original_dept: department,
        import_date: new Date().toISOString()
      };
    });
    
    // Filter data by department for further processing - March data
    const repDataFromDb = mappedData.filter(item => item.rep_type === 'RETAIL');
    const revaDataFromDb = mappedData.filter(item => item.rep_type === 'REVA');
    const wholesaleDataFromDb = mappedData.filter(item => item.rep_type === 'Wholesale');
    
    // Filter data by department for further processing - February data
    const febRepDataFromDb = mappedFebData.filter(item => item.rep_type === 'RETAIL');
    const febRevaDataFromDb = mappedFebData.filter(item => item.rep_type === 'REVA');
    const febWholesaleDataFromDb = mappedFebData.filter(item => item.rep_type === 'Wholesale');
    
    // Process the data to RepData format - March data
    const processedRepData = processRepData(repDataFromDb as SalesDataItem[] || []);
    const processedRevaData = processRepData(revaDataFromDb as SalesDataItem[] || []);
    const processedWholesaleData = processRepData(wholesaleDataFromDb as SalesDataItem[] || []);
    
    // Process the data to RepData format - February data
    const processedFebRepData = processRepData(febRepDataFromDb as SalesDataItem[] || []);
    const processedFebRevaData = processRepData(febRevaDataFromDb as SalesDataItem[] || []);
    const processedFebWholesaleData = processRepData(febWholesaleDataFromDb as SalesDataItem[] || []);
    
    // Calculate summary data - March
    const calculatedSummary = calculateSummaryFromData(processedRepData);
    const revaSummary = calculateSummaryFromData(processedRevaData);
    const wholesaleSummary = calculateSummaryFromData(processedWholesaleData);
    
    // Calculate summary data - February
    const calculatedFebSummary = calculateSummaryFromData(processedFebRepData);
    const revaFebSummary = calculateSummaryFromData(processedFebRevaData);
    const wholesaleFebSummary = calculateSummaryFromData(processedFebWholesaleData);
    
    // Calculate percentage changes between February and March
    const summaryChanges = calculateSummaryChanges(
      calculatedSummary, 
      revaSummary,
      wholesaleSummary,
      calculatedFebSummary,
      revaFebSummary,
      wholesaleFebSummary
    );

    // Calculate rep-level changes for all departments
    const repChanges = calculateRepChanges(
      processedRepData,
      processedRevaData,
      processedWholesaleData,
      processedFebRepData,
      processedFebRevaData,
      processedFebWholesaleData
    );
    
    return {
      // Current month data
      repData: processedRepData,
      revaData: processedRevaData,
      wholesaleData: processedWholesaleData,
      baseSummary: calculatedSummary,
      revaValues: revaSummary,
      wholesaleValues: wholesaleSummary,
      
      // Previous month data
      febRepData: processedFebRepData,
      febRevaData: processedFebRevaData,
      febWholesaleData: processedFebWholesaleData,
      febBaseSummary: calculatedFebSummary,
      febRevaValues: revaFebSummary,
      febWholesaleValues: wholesaleFebSummary,
      
      // Changes between months
      summaryChanges,
      repChanges
    };
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    toast({
      title: "Error loading data",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    throw error;
  }
};

// Helper function to calculate total profit from a dataset
const calculateTotalProfit = (data: any[]): number => {
  return data.reduce((sum, item) => {
    const profit = typeof item.Profit === 'string' 
      ? parseFloat(item.Profit) 
      : Number(item.Profit || 0);
    return sum + profit;
  }, 0);
};

// Helper function to calculate percentage changes between current and previous month summaries
const calculateSummaryChanges = (
  currentRetail: SummaryData,
  currentReva: SummaryData,
  currentWholesale: SummaryData,
  previousRetail: SummaryData,
  previousReva: SummaryData,
  previousWholesale: SummaryData
) => {
  // Calculate total values for current month
  const currentTotalSpend = (currentRetail?.totalSpend || 0) + 
                            (currentReva?.totalSpend || 0) + 
                            (currentWholesale?.totalSpend || 0);
                            
  const currentTotalProfit = (currentRetail?.totalProfit || 0) + 
                             (currentReva?.totalProfit || 0) + 
                             (currentWholesale?.totalProfit || 0);
                             
  const currentTotalPacks = (currentRetail?.totalPacks || 0) + 
                            (currentReva?.totalPacks || 0) + 
                            (currentWholesale?.totalPacks || 0);
  
  // Calculate average margin for current month (weighted by spend)
  const currentAverageMargin = currentTotalSpend > 0 ? 
    (currentTotalProfit / currentTotalSpend * 100) : 0;
  
  // Calculate total values for previous month
  const previousTotalSpend = (previousRetail?.totalSpend || 0) + 
                             (previousReva?.totalSpend || 0) + 
                             (previousWholesale?.totalSpend || 0);
                            
  const previousTotalProfit = (previousRetail?.totalProfit || 0) + 
                              (previousReva?.totalProfit || 0) + 
                              (previousWholesale?.totalProfit || 0);
                             
  const previousTotalPacks = (previousRetail?.totalPacks || 0) + 
                             (previousReva?.totalPacks || 0) + 
                             (previousWholesale?.totalPacks || 0);
  
  // Calculate average margin for previous month (weighted by spend)
  const previousAverageMargin = previousTotalSpend > 0 ? 
    (previousTotalProfit / previousTotalSpend * 100) : 0;
    
  // Calculate percentage changes
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  return {
    totalSpend: calculatePercentageChange(currentTotalSpend, previousTotalSpend),
    totalProfit: calculatePercentageChange(currentTotalProfit, previousTotalProfit),
    averageMargin: calculatePercentageChange(currentAverageMargin, previousAverageMargin),
    totalPacks: calculatePercentageChange(currentTotalPacks, previousTotalPacks)
  };
};

// Helper function to calculate rep-level changes
const calculateRepChanges = (
  currentRetailReps: RepData[],
  currentRevaReps: RepData[],
  currentWholesaleReps: RepData[],
  previousRetailReps: RepData[],
  previousRevaReps: RepData[],
  previousWholesaleReps: RepData[]
) => {
  const changes: Record<string, any> = {};
  
  // Create a map of all previous month reps and their data
  const previousRepsMap: Record<string, RepData> = {};
  
  // Add retail reps to the map
  previousRetailReps.forEach(rep => {
    previousRepsMap[rep.rep] = rep;
  });
  
  // Add REVA reps to the map
  previousRevaReps.forEach(rep => {
    // Skip the "REVA" rep
    if (rep.rep === 'REVA') return;
    
    if (previousRepsMap[rep.rep]) {
      // If this rep already exists in the map (from retail), combine the values
      const existingRep = previousRepsMap[rep.rep];
      previousRepsMap[rep.rep] = {
        ...existingRep,
        spend: existingRep.spend + rep.spend,
        profit: existingRep.profit + rep.profit,
        packs: existingRep.packs + rep.packs,
        activeAccounts: existingRep.activeAccounts + rep.activeAccounts,
        totalAccounts: existingRep.totalAccounts + rep.totalAccounts,
        // Recalculate margin
        margin: (existingRep.spend + rep.spend) > 0 ? 
          ((existingRep.profit + rep.profit) / (existingRep.spend + rep.spend) * 100) : 0
      };
    } else {
      // If this is the first time we're seeing this rep, add them directly
      previousRepsMap[rep.rep] = rep;
    }
  });
  
  // Add Wholesale reps to the map
  previousWholesaleReps.forEach(rep => {
    // Skip the "Wholesale" rep
    if (rep.rep === 'Wholesale') return;
    
    if (previousRepsMap[rep.rep]) {
      // If this rep already exists in the map, combine the values
      const existingRep = previousRepsMap[rep.rep];
      previousRepsMap[rep.rep] = {
        ...existingRep,
        spend: existingRep.spend + rep.spend,
        profit: existingRep.profit + rep.profit,
        packs: existingRep.packs + rep.packs,
        activeAccounts: existingRep.activeAccounts + rep.activeAccounts,
        totalAccounts: existingRep.totalAccounts + rep.totalAccounts,
        // Recalculate margin
        margin: (existingRep.spend + rep.spend) > 0 ? 
          ((existingRep.profit + rep.profit) / (existingRep.spend + rep.spend) * 100) : 0
      };
    } else {
      // If this is the first time we're seeing this rep, add them directly
      previousRepsMap[rep.rep] = rep;
    }
  });
  
  // Process all current month retail reps and calculate changes
  currentRetailReps.forEach(rep => {
    const previous = previousRepsMap[rep.rep];
    
    if (!previous) {
      // If this rep didn't exist in the previous month, set change to 100% for all metrics
      changes[rep.rep] = {
        profit: 100,
        margin: 100,
        spend: 100,
        packs: 100,
        activeAccounts: 100,
        totalAccounts: 100
      };
      return;
    }
    
    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };
    
    changes[rep.rep] = {
      profit: calculatePercentageChange(rep.profit, previous.profit),
      margin: calculatePercentageChange(rep.margin, previous.margin),
      spend: calculatePercentageChange(rep.spend, previous.spend),
      packs: calculatePercentageChange(rep.packs, previous.packs),
      activeAccounts: calculatePercentageChange(rep.activeAccounts, previous.activeAccounts),
      totalAccounts: calculatePercentageChange(rep.totalAccounts, previous.totalAccounts)
    };
  });
  
  // Process all current month REVA reps
  currentRevaReps.forEach(rep => {
    // Skip the "REVA" rep
    if (rep.rep === 'REVA') return;
    
    if (!changes[rep.rep]) {
      const previous = previousRepsMap[rep.rep];
      
      if (!previous) {
        // If this rep didn't exist in the previous month, set change to 100% for all metrics
        changes[rep.rep] = {
          profit: 100,
          margin: 100,
          spend: 100,
          packs: 100,
          activeAccounts: 100,
          totalAccounts: 100
        };
        return;
      }
      
      // Calculate percentage changes
      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };
      
      changes[rep.rep] = {
        profit: calculatePercentageChange(rep.profit, previous.profit),
        margin: calculatePercentageChange(rep.margin, previous.margin),
        spend: calculatePercentageChange(rep.spend, previous.spend),
        packs: calculatePercentageChange(rep.packs, previous.packs),
        activeAccounts: calculatePercentageChange(rep.activeAccounts, previous.activeAccounts),
        totalAccounts: calculatePercentageChange(rep.totalAccounts, previous.totalAccounts)
      };
    }
  });
  
  // Process all current month Wholesale reps
  currentWholesaleReps.forEach(rep => {
    // Skip the "Wholesale" rep
    if (rep.rep === 'Wholesale') return;
    
    if (!changes[rep.rep]) {
      const previous = previousRepsMap[rep.rep];
      
      if (!previous) {
        // If this rep didn't exist in the previous month, set change to 100% for all metrics
        changes[rep.rep] = {
          profit: 100,
          margin: 100,
          spend: 100,
          packs: 100,
          activeAccounts: 100,
          totalAccounts: 100
        };
        return;
      }
      
      // Calculate percentage changes
      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };
      
      changes[rep.rep] = {
        profit: calculatePercentageChange(rep.profit, previous.profit),
        margin: calculatePercentageChange(rep.margin, previous.margin),
        spend: calculatePercentageChange(rep.spend, previous.spend),
        packs: calculatePercentageChange(rep.packs, previous.packs),
        activeAccounts: calculatePercentageChange(rep.activeAccounts, previous.activeAccounts),
        totalAccounts: calculatePercentageChange(rep.totalAccounts, previous.totalAccounts)
      };
    }
  });
  
  return changes;
};

// Helper function to fetch all records for a specific department from a specific table
const fetchAllDepartmentData = async (department: string, tableName: string) => {
  // This function fetches data in chunks to avoid pagination limits
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMoreData = true;
  
  while (hasMoreData) {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .eq('Department', department)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) {
      return { data: null, error };
    }
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      page++;
      
      // Check if we've fetched all available data
      hasMoreData = data.length === PAGE_SIZE;
    } else {
      hasMoreData = false;
    }
  }
  
  return { data: allData, error: null };
};

export const saveRepPerformanceData = (data: any) => {
  try {
    localStorage.setItem('repPerformanceData', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    return false;
  }
};

export const loadStoredRepPerformanceData = () => {
  try {
    const storedData = localStorage.getItem('repPerformanceData');
    if (storedData) {
      return JSON.parse(storedData);
    }
    return null;
  } catch (error) {
    console.error('Error parsing stored data:', error);
    return null;
  }
};
