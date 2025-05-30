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
    
    // MARCH DATA FETCHING
    // Instead of fetching all data at once, fetch by department to avoid pagination issues
    // RETAIL data
    const { data: retailData, error: retailError } = await fetchDepartmentData('RETAIL', true);
    if (retailError) throw new Error(`Error fetching RETAIL data: ${retailError.message}`);
    console.log('Fetched RETAIL records:', retailData?.length || 0);
    
    // REVA data
    const { data: revaData, error: revaError } = await fetchDepartmentData('REVA', true);
    if (revaError) throw new Error(`Error fetching REVA data: ${revaError.message}`);
    console.log('Fetched REVA records:', revaData?.length || 0);
    
    // Wholesale data
    const { data: wholesaleData, error: wholesaleError } = await fetchDepartmentData('Wholesale', true);
    if (wholesaleError) throw new Error(`Error fetching Wholesale data: ${wholesaleError.message}`);
    console.log('Fetched Wholesale records:', wholesaleData?.length || 0);
    
    // If no wholesale data was found, try using "WHOLESALE" (all caps) as the department name
    let finalWholesaleData = wholesaleData;
    if (!wholesaleData || wholesaleData.length === 0) {
      const { data: upperWholesaleData, error: upperWholesaleError } = await fetchDepartmentData('WHOLESALE', true);
      if (!upperWholesaleError) {
        finalWholesaleData = upperWholesaleData;
        console.log('Fetched WHOLESALE (uppercase) records:', upperWholesaleData?.length || 0);
      }
    }

    // FEBRUARY DATA FETCHING
    console.log('Fetching February data from sales_data_februrary table...');
    
    // RETAIL data from February
    const { data: febRetailData, error: febRetailError } = await fetchDepartmentData('RETAIL', false);
    if (febRetailError) throw new Error(`Error fetching February RETAIL data: ${febRetailError.message}`);
    console.log('Fetched February RETAIL records:', febRetailData?.length || 0);
    
    // REVA data from February
    const { data: febRevaData, error: febRevaError } = await fetchDepartmentData('REVA', false);
    if (febRevaError) throw new Error(`Error fetching February REVA data: ${febRevaError.message}`);
    console.log('Fetched February REVA records:', febRevaData?.length || 0);
    
    // Wholesale data from February
    const { data: febWholesaleData, error: febWholesaleError } = await fetchDepartmentData('Wholesale', false);
    if (febWholesaleError) throw new Error(`Error fetching February Wholesale data: ${febWholesaleError.message}`);
    console.log('Fetched February Wholesale records:', febWholesaleData?.length || 0);
    
    // Try to fetch with uppercase WHOLESALE if no results for February
    let finalFebWholesaleData = febWholesaleData;
    if (!febWholesaleData || febWholesaleData.length === 0) {
      const { data: upperFebWholesaleData, error: upperFebWholesaleError } = await fetchDepartmentData('WHOLESALE', false);
      if (!upperFebWholesaleError) {
        finalFebWholesaleData = upperFebWholesaleData;
        console.log('Fetched February WHOLESALE (uppercase) records:', upperFebWholesaleData?.length || 0);
      }
    }

    // Process all March data
    const allDataFromDb = [...(retailData || []), ...(revaData || []), ...(finalWholesaleData || [])];
    
    // Process all February data
    const allFebDataFromDb = [...(febRetailData || []), ...(febRevaData || []), ...(finalFebWholesaleData || [])];
    
    if (!allDataFromDb || allDataFromDb.length === 0) {
      throw new Error('No data found for March.');
    }
    
    console.log('Total combined data rows (March):', allDataFromDb.length);
    console.log('Total combined data rows (February):', allFebDataFromDb.length || 0);
    
    // Map the March data
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
      if ((department === 'REVA' || department === 'Wholesale' || department === 'WHOLESALE') && subRep) {
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

    // Map the February data - ensure we're using different values from March
    const mappedFebData = allFebDataFromDb.map((item: any) => {
      let repName = item.Rep || '';
      const subRep = item['Sub-Rep'] || '';
      const department = item.Department || 'RETAIL';
      
      if ((department === 'REVA' || department === 'Wholesale' || department === 'WHOLESALE') && subRep) {
        repName = subRep;
      }
      
      return {
        id: item.id ? (typeof item.id === 'string' ? parseInt(item.id) : item.id) : 0,
        reporting_period: 'February 2025',
        rep_name: repName,
        sub_rep: subRep,
        account_ref: item['Account Ref'] || '',
        account_name: item['Account Name'] || '',
        spend: typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0),
        cost: typeof item.Cost === 'string' ? parseFloat(item.Cost) : Number(item.Cost || 0),
        credit: typeof item.Credit === 'string' ? parseFloat(item.Credit) : Number(item.Credit || 0),
        profit: typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0),
        margin: typeof item.Margin === 'string' ? parseFloat(item.Margin) : Number(item.Margin || 0),
        packs: typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0),
        rep_type: department,
        original_dept: department,
        import_date: new Date().toISOString()
      };
    });
    
    // Filter data by department for further processing - March data
    const repDataFromDb = mappedData.filter(item => item.rep_type === 'RETAIL');
    const revaDataFromDb = mappedData.filter(item => item.rep_type === 'REVA');
    const wholesaleDataFromDb = mappedData.filter(item => item.rep_type === 'Wholesale' || item.rep_type === 'WHOLESALE');
    
    // Filter data by department for further processing - February data
    const febRepDataFromDb = mappedFebData.filter(item => item.rep_type === 'RETAIL');
    const febRevaDataFromDb = mappedFebData.filter(item => item.rep_type === 'REVA');
    const febWholesaleDataFromDb = mappedFebData.filter(item => item.rep_type === 'Wholesale' || item.rep_type === 'WHOLESALE');
    
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
    
    console.log('February summary data calculated:', {
      retailSummary: calculatedFebSummary,
      revaSummary: revaFebSummary,
      wholesaleSummary: wholesaleFebSummary
    });
    
    console.log('March summary data calculated:', {
      retailSummary: calculatedSummary,
      revaSummary: revaSummary,
      wholesaleSummary: wholesaleSummary
    });
    
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
  
  const currentTotalAccounts = (currentRetail?.totalAccounts || 0) + 
                               (currentReva?.totalAccounts || 0) + 
                               (currentWholesale?.totalAccounts || 0);
  
  const currentActiveAccounts = (currentRetail?.activeAccounts || 0) + 
                                (currentReva?.activeAccounts || 0) + 
                                (currentWholesale?.activeAccounts || 0);
  
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
  
  const previousTotalAccounts = (previousRetail?.totalAccounts || 0) + 
                                (previousReva?.totalAccounts || 0) + 
                                (previousWholesale?.totalAccounts || 0);
  
  const previousActiveAccounts = (previousRetail?.activeAccounts || 0) + 
                                 (previousReva?.totalAccounts || 0) + 
                                 (previousWholesale?.totalAccounts || 0);
  
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
    totalPacks: calculatePercentageChange(currentTotalPacks, previousTotalPacks),
    totalAccounts: calculatePercentageChange(currentTotalAccounts, previousTotalAccounts),
    activeAccounts: calculatePercentageChange(currentActiveAccounts, previousActiveAccounts)
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
  
  // Create maps for current and previous month data to simplify lookup
  const currentRepMap: Record<string, {
    spend: number;
    profit: number;
    margin: number;
    packs: number;
    activeAccounts: number;
    totalAccounts: number;
  }> = {};
  
  const previousRepMap: Record<string, {
    spend: number;
    profit: number;
    margin: number;
    packs: number;
    activeAccounts: number;
    totalAccounts: number;
  }> = {};
  
  // Process all rep data first to create accurate maps
  
  // Current month maps - combine all department data for each rep
  [...currentRetailReps, ...currentRevaReps.filter(r => r.rep !== 'REVA'), ...currentWholesaleReps.filter(r => r.rep !== 'Wholesale')]
    .forEach(rep => {
      if (!currentRepMap[rep.rep]) {
        currentRepMap[rep.rep] = {
          spend: 0,
          profit: 0,
          margin: 0,
          packs: 0,
          activeAccounts: 0,
          totalAccounts: 0
        };
      }
      
      currentRepMap[rep.rep].spend += rep.spend;
      currentRepMap[rep.rep].profit += rep.profit;
      currentRepMap[rep.rep].packs += rep.packs;
      currentRepMap[rep.rep].activeAccounts += rep.activeAccounts;
      currentRepMap[rep.rep].totalAccounts += rep.totalAccounts;
    });
  
  // Calculate margins correctly after aggregating all values
  Object.keys(currentRepMap).forEach(rep => {
    currentRepMap[rep].margin = currentRepMap[rep].spend > 0 ? 
      (currentRepMap[rep].profit / currentRepMap[rep].spend * 100) : 0;
  });
  
  // Previous month maps - combine all department data for each rep
  [...previousRetailReps, ...previousRevaReps.filter(r => r.rep !== 'REVA'), ...previousWholesaleReps.filter(r => r.rep !== 'Wholesale')]
    .forEach(rep => {
      if (!previousRepMap[rep.rep]) {
        previousRepMap[rep.rep] = {
          spend: 0,
          profit: 0,
          margin: 0,
          packs: 0,
          activeAccounts: 0,
          totalAccounts: 0
        };
      }
      
      previousRepMap[rep.rep].spend += rep.spend;
      previousRepMap[rep.rep].profit += rep.profit;
      previousRepMap[rep.rep].packs += rep.packs;
      previousRepMap[rep.rep].activeAccounts += rep.activeAccounts;
      previousRepMap[rep.rep].totalAccounts += rep.totalAccounts;
    });
  
  // Calculate margins correctly after aggregating all values
  Object.keys(previousRepMap).forEach(rep => {
    previousRepMap[rep].margin = previousRepMap[rep].spend > 0 ? 
      (previousRepMap[rep].profit / previousRepMap[rep].spend * 100) : 0;
  });
  
  // Now calculate percentage changes using the accurate maps
  Object.keys(currentRepMap).forEach(rep => {
    const current = currentRepMap[rep];
    const previous = previousRepMap[rep];
    
    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };
    
    if (!previous) {
      // Rep didn't exist in February
      changes[rep] = {
        profit: 100,
        spend: 100,
        margin: 100,
        packs: 100,
        activeAccounts: 100,
        totalAccounts: 100
      };
    } else {
      changes[rep] = {
        profit: calculatePercentageChange(current.profit, previous.profit),
        spend: calculatePercentageChange(current.spend, previous.spend),
        margin: current.margin - previous.margin, // Margin is a percentage point difference
        packs: calculatePercentageChange(current.packs, previous.packs),
        activeAccounts: calculatePercentageChange(current.activeAccounts, previous.activeAccounts),
        totalAccounts: calculatePercentageChange(current.totalAccounts, previous.totalAccounts)
      };
    }
  });
  
  return changes;
};

// Helper function to fetch all records for a specific department from the appropriate table
const fetchDepartmentData = async (department: string, isMarch: boolean) => {
  // This function fetches data in chunks to avoid pagination limits
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMoreData = true;
  
  console.log(`Fetching ${isMarch ? 'March' : 'February'} data for department: ${department}`);
  
  // Use explicit table name strings rather than dynamic ones
  // This avoids TypeScript's deep type instantiation error
  const tableName = isMarch ? 'sales_data' : 'sales_data_februrary';
  
  while (hasMoreData) {
    let query;
    
    if (isMarch) {
      // For March data from sales_data table
      query = supabase
        .from(tableName as 'sales_data')
        .select('*')
        .eq('rep_type', department)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    } else {
      // For February data from sales_data_februrary table
      query = supabase
        .from(tableName as 'sales_data_februrary')
        .select('*')
        .eq('Department', department)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return { data: null, error };
    }
    
    // Transform the data to match expected format if we're using sales_data for March
    if (isMarch && data) {
      const transformedData = data.map(item => ({
        id: item.id,
        Rep: item.rep_name,
        'Sub-Rep': item.sub_rep,
        Department: item.rep_type,
        'Account Ref': item.account_ref,
        'Account Name': item.account_name,
        Spend: item.spend,
        Cost: item.cost,
        Credit: item.credit,
        Profit: item.profit,
        Margin: item.margin,
        Packs: item.packs
      }));
      
      allData = [...allData, ...transformedData];
    } else if (data) {
      allData = [...allData, ...data];
    }
    
    if (data && data.length > 0) {
      page++;
      
      // Check if we've fetched all available data
      hasMoreData = data.length === PAGE_SIZE;
    } else {
      hasMoreData = false;
    }
  }
  
  console.log(`Completed fetching ${isMarch ? 'March' : 'February'} data for ${department}. Total records: ${allData.length}`);
  return { data: allData, error: null };
};

// Helper function to fetch March rolling data with pagination
export const fetchMarchRollingData = async () => {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMoreData = true;
  
  console.log('Starting to fetch March Rolling data with pagination...');
  
  while (hasMoreData) {
    try {
      const { data, error, count } = await supabase
        .from('Prior_Month_Rolling')
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (error) {
        console.error('Error fetching March Rolling data page', page, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        console.log(`Fetched March Rolling page ${page+1} with ${data.length} records. Total so far: ${allData.length}`);
        page++;
        
        // Check if we've fetched all available data
        hasMoreData = data.length === PAGE_SIZE;
      } else {
        hasMoreData = false;
      }
    } catch (error) {
      console.error('Error in pagination loop for March Rolling data:', error);
      hasMoreData = false;
    }
  }
  
  console.log(`Completed fetching March Rolling data. Total records: ${allData.length}`);
  return { data: allData, error: null };
};

// New function to fetch March data from sales_data table instead of march_rolling
export const fetchMarchDataFromSalesData = async () => {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMoreData = true;
  
  console.log('Starting to fetch March data from sales_data with pagination...');
  
  while (hasMoreData) {
    try {
      const { data, error, count } = await supabase
        .from('sales_data')
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (error) {
        console.error('Error fetching sales_data page', page, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Transform sales_data format to match march_rolling format
        const transformedData = data.map(item => ({
          'id': item.id,
          'Rep': item.rep_name,
          'Sub-Rep': item.sub_rep || '',
          'Department': item.rep_type,
          'Account Ref': item.account_ref,
          'Account Name': item.account_name,
          'Spend': item.spend,
          'Cost': item.cost,
          'Credit': item.credit,
          'Profit': item.profit,
          'Margin': item.margin,
          'Packs': item.packs
        }));
        
        allData = [...allData, ...transformedData];
        console.log(`Fetched sales_data page ${page+1} with ${data.length} records. Total so far: ${allData.length}`);
        page++;
        
        // Check if we've fetched all available data
        hasMoreData = data.length === PAGE_SIZE;
      } else {
        hasMoreData = false;
      }
    } catch (error) {
      console.error('Error in pagination loop for sales_data:', error);
      hasMoreData = false;
    }
  }
  
  console.log(`Completed fetching March data from sales_data. Total records: ${allData.length}`);
  console.log('Sample transformed record:', allData.length > 0 ? allData[0] : 'No data');
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
