import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummaryFromData } from '@/utils/rep-data-processing';

// Define a simple type for Supabase query responses to avoid excessive type instantiation
interface SupabaseQueryResult {
  data: any[] | null;
  error: Error | null;
}

// Define the return type explicitly to avoid excessive type instantiation
type DepartmentDataResult = {
  data: any[] | null;
  error: Error | null;
}

// Helper function to fetch department data from different tables
const fetchDepartmentData = async (department: string, isMarch: boolean): Promise<DepartmentDataResult> => {
  const table = isMarch ? 'sales_data' : 'sales_data_februrary';
  
  try {
    if (isMarch) {
      const result = await supabase
        .from(table)
        .select('*')
        .eq('rep_type', department);
      return result as DepartmentDataResult;
    } else {
      const result = await supabase
        .from(table)
        .select('*')
        .eq('Department', department);
      return result as DepartmentDataResult;
    }
  } catch (error) {
    console.error(`Error fetching ${department} data:`, error);
    return { data: null, error: error as Error };
  }
};

export const saveRepPerformanceData = (data: any) => {
  try {
    localStorage.setItem('rep-performance-data', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save rep performance data to local storage:', error);
  }
};

export const loadStoredRepPerformanceData = () => {
  try {
    const storedData = localStorage.getItem('rep-performance-data');
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error('Failed to load rep performance data from local storage:', error);
    return null;
  }
};

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data from Supabase...');
    
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
    
    const { data: retailData, error: retailError } = await fetchDepartmentData('RETAIL', true);
    if (retailError) throw new Error(`Error fetching RETAIL data: ${retailError.message}`);
    console.log('Fetched RETAIL records:', retailData?.length || 0);
    
    const { data: revaData, error: revaError } = await fetchDepartmentData('REVA', true);
    if (revaError) throw new Error(`Error fetching REVA data: ${revaError.message}`);
    console.log('Fetched REVA records:', revaData?.length || 0);
    
    const { data: wholesaleData, error: wholesaleError } = await fetchDepartmentData('Wholesale', true);
    if (wholesaleError) throw new Error(`Error fetching Wholesale data: ${wholesaleError.message}`);
    console.log('Fetched Wholesale records:', wholesaleData?.length || 0);
    
    let finalWholesaleData = wholesaleData;
    if (!wholesaleData || wholesaleData.length === 0) {
      const { data: upperWholesaleData, error: upperWholesaleError } = await fetchDepartmentData('WHOLESALE', true);
      if (!upperWholesaleError) {
        finalWholesaleData = upperWholesaleData;
        console.log('Fetched WHOLESALE (uppercase) records:', upperWholesaleData?.length || 0);
      }
    }

    const { data: febRetailData, error: febRetailError } = await fetchDepartmentData('RETAIL', false);
    if (febRetailError) throw new Error(`Error fetching February RETAIL data: ${febRetailError.message}`);
    console.log('Fetched February RETAIL records:', febRetailData?.length || 0);
    
    const { data: febRevaData, error: febRevaError } = await fetchDepartmentData('REVA', false);
    if (febRevaError) throw new Error(`Error fetching February REVA data: ${febRevaError.message}`);
    console.log('Fetched February REVA records:', febRevaData?.length || 0);
    
    const { data: febWholesaleData, error: febWholesaleError } = await fetchDepartmentData('Wholesale', false);
    if (febWholesaleError) throw new Error(`Error fetching February Wholesale data: ${febWholesaleError.message}`);
    console.log('Fetched February Wholesale records:', febWholesaleData?.length || 0);
    
    const totalCount = (retailData?.length || 0) + (revaData?.length || 0) + (finalWholesaleData?.length || 0);
    console.log('Total fetched records (March):', totalCount);

    const totalFebCount = (febRetailData?.length || 0) + (febRevaData?.length || 0) + (febWholesaleData?.length || 0);
    console.log('Total fetched records (February):', totalFebCount);
    
    const allDataFromDb = [...(retailData || []), ...(revaData || []), ...(finalWholesaleData || [])];
    
    const allFebDataFromDb = [...(febRetailData || []), ...(febRevaData || []), ...(febWholesaleData || [])];
    
    if (!allDataFromDb || allDataFromDb.length === 0) {
      throw new Error('No data found for March.');
    }
    
    console.log('Total combined data rows (March):', allDataFromDb.length);
    console.log('Total combined data rows (February):', allFebDataFromDb.length || 0);
    
    const mappedData = allDataFromDb.map((item: any) => {
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      const cost = typeof item.Cost === 'string' ? parseFloat(item.Cost) : Number(item.Cost || 0);
      const credit = typeof item.Credit === 'string' ? parseFloat(item.Credit) : Number(item.Credit || 0);
      const margin = typeof item.Margin === 'string' ? parseFloat(item.Margin) : Number(item.Margin || 0);
      const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
      
      let repName = item.Rep || '';
      const subRep = item['Sub-Rep'] || '';
      const department = item.Department || 'RETAIL';
      
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
    
    const repDataFromDb = mappedData.filter(item => item.rep_type === 'RETAIL');
    const revaDataFromDb = mappedData.filter(item => item.rep_type === 'REVA');
    const wholesaleDataFromDb = mappedData.filter(item => item.rep_type === 'Wholesale' || item.rep_type === 'WHOLESALE');
    
    const febRepDataFromDb = mappedFebData.filter(item => item.rep_type === 'RETAIL');
    const febRevaDataFromDb = mappedFebData.filter(item => item.rep_type === 'REVA');
    const febWholesaleDataFromDb = mappedFebData.filter(item => item.rep_type === 'Wholesale');
    
    const processedRepData = processRepData(repDataFromDb as SalesDataItem[] || []);
    const processedRevaData = processRepData(revaDataFromDb as SalesDataItem[] || []);
    const processedWholesaleData = processRepData(wholesaleDataFromDb as SalesDataItem[] || []);
    
    const processedFebRepData = processRepData(febRepDataFromDb as SalesDataItem[] || []);
    const processedFebRevaData = processRepData(febRevaDataFromDb as SalesDataItem[] || []);
    const processedFebWholesaleData = processRepData(febWholesaleDataFromDb as SalesDataItem[] || []);
    
    const calculatedSummary = calculateSummaryFromData(processedRepData);
    const revaSummary = calculateSummaryFromData(processedRevaData);
    const wholesaleSummary = calculateSummaryFromData(processedWholesaleData);
    
    const calculatedFebSummary = calculateSummaryFromData(processedFebRepData);
    const revaFebSummary = calculateSummaryFromData(processedFebRevaData);
    const wholesaleFebSummary = calculateSummaryFromData(processedFebWholesaleData);
    
    const summaryChanges = calculateSummaryChanges(
      calculatedSummary, 
      revaSummary,
      wholesaleSummary,
      calculatedFebSummary,
      revaFebSummary,
      wholesaleFebSummary
    );

    const repChanges = calculateRepChanges(
      processedRepData,
      processedRevaData,
      processedWholesaleData,
      processedFebRepData,
      processedFebRevaData,
      processedFebWholesaleData
    );
    
    return {
      repData: processedRepData,
      revaData: processedRevaData,
      wholesaleData: processedWholesaleData,
      baseSummary: calculatedSummary,
      revaValues: revaSummary,
      wholesaleValues: wholesaleSummary,
      
      febRepData: processedFebRepData,
      febRevaData: processedFebRevaData,
      febWholesaleData: processedFebWholesaleData,
      febBaseSummary: calculatedFebSummary,
      febRevaValues: revaFebSummary,
      febWholesaleValues: wholesaleFebSummary,
      
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

const calculateTotalProfit = (data: any[]): number => {
  return data.reduce((sum, item) => {
    const profit = typeof item.Profit === 'string' 
      ? parseFloat(item.Profit) 
      : Number(item.Profit || 0);
    return sum + profit;
  }, 0);
};

const calculateSummaryChanges = (
  currentRetail: SummaryData,
  currentReva: SummaryData,
  currentWholesale: SummaryData,
  previousRetail: SummaryData,
  previousReva: SummaryData,
  previousWholesale: SummaryData
) => {
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
  
  const currentAverageMargin = currentTotalSpend > 0 ? 
    (currentTotalProfit / currentTotalSpend * 100) : 0;
  
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
                                 (previousReva?.activeAccounts || 0) + 
                                 (previousWholesale?.activeAccounts || 0);
  
  const previousAverageMargin = previousTotalSpend > 0 ? 
    (previousTotalProfit / previousTotalSpend * 100) : 0;
    
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

const calculateRepChanges = (
  currentRetailReps: RepData[],
  currentRevaReps: RepData[],
  currentWholesaleReps: RepData[],
  previousRetailReps: RepData[],
  previousRevaReps: RepData[],
  previousWholesaleReps: RepData[]
) => {
  const changes: Record<string, any> = {};
  
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
  
  Object.keys(currentRepMap).forEach(rep => {
    currentRepMap[rep].margin = currentRepMap[rep].spend > 0 ? 
      (currentRepMap[rep].profit / currentRepMap[rep].spend * 100) : 0;
  });
  
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
  
  Object.keys(previousRepMap).forEach(rep => {
    previousRepMap[rep].margin = previousRepMap[rep].spend > 0 ? 
      (previousRepMap[rep].profit / previousRepMap[rep].spend * 100) : 0;
  });
  
  Object.keys(currentRepMap).forEach(rep => {
    const current = currentRepMap[rep];
    const previous = previousRepMap[rep];
    
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };
    
    if (!previous) {
      // Rep didn't exist in February
      changes[rep] = {
        profit: 100,
        spend: 100,
        margin: current.margin,
        packs: 100,
        activeAccounts: 100,
        totalAccounts: 100,
        profitPerActiveShop: 0,
        profitPerPack: 0,
        activeRatio: 0
      };
    } else {
      changes[rep] = {
        profit: calculatePercentageChange(current.profit, previous.profit),
        spend: calculatePercentageChange(current.spend, previous.spend),
        margin: current.margin - previous.margin,
        packs: calculatePercentageChange(current.packs, previous.packs),
        activeAccounts: calculatePercentageChange(current.activeAccounts, previous.activeAccounts),
        totalAccounts: calculatePercentageChange(current.totalAccounts, previous.totalAccounts),
        profitPerActiveShop: 0,
        profitPerPack: 0,
        activeRatio: 0
      };
    }
  });
  
  Object.keys(previousRepMap).forEach(rep => {
    if (!currentRepMap[rep]) {
      changes[rep] = {
        profit: -100,
        spend: -100,
        margin: -previousRepMap[rep].margin,
        packs: -100,
        activeAccounts: -100,
        totalAccounts: -100,
        profitPerActiveShop: 0,
        profitPerPack: 0,
        activeRatio: 0
      };
    }
  });
  
  return changes;
};

export const loadAprilData = async (
  setIsLoading: (loading: boolean) => void,
  setAprRepData: (data: RepData[]) => void,
  setAprRevaData: (data: RepData[]) => void,
  setAprWholesaleData: (data: RepData[]) => void,
  setAprBaseSummary: (data: SummaryData) => void,
  setAprRevaValues: (data: SummaryData) => void,
  setAprWholesaleValues: (data: SummaryData) => void,
  setSummaryChanges: (data: any) => void,
  setRepChanges: (data: any) => void,
  includeRetail: boolean,
  includeReva: boolean,
  includeWholesale: boolean,
  getCombinedRepData: any,
  calculateSummary: any,
  calculateDeptSummary: any
) => {
  setIsLoading(true);
  try {
    const { count, error: countError } = await supabase
      .from('mtd_daily')
      .select('*', { count: 'exact', head: true });
      
    if (countError) throw new Error(`Error getting count: ${countError.message}`);
    
    if (!count || count === 0) {
      toast({
        title: "No April data found",
        description: "The MTD Daily table appears to be empty.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
    
    const { data: lastMtdData, error: lastMtdError } = await supabase
      .from('last_mtd_daily')
      .select('*');
      
    if (lastMtdError) {
      console.error('Error fetching last MTD data:', lastMtdError);
    }
    
    console.log(`Found ${count} total records in mtd_daily`);
      
    let allRecords = [];
    const pageSize = 1000;
    const pages = Math.ceil(count / pageSize);
    
    for (let page = 0; page < pages; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
        
      const { data: pageData, error: pageError } = await supabase
        .from('mtd_daily')
        .select('*')
        .range(from, to);
        
      if (pageError) throw new Error(`Error fetching page ${page}: ${pageError.message}`);
      if (pageData) allRecords = [...allRecords, ...pageData];
        
      console.log(`Fetched page ${page + 1}/${pages} with ${pageData?.length || 0} records`);
    }
      
    const mtdData = allRecords;
    console.log('Fetched April MTD records total count:', mtdData.length);
      
    if (!mtdData || mtdData.length === 0) {
      toast({
        title: "No April data found",
        description: "The MTD Daily table appears to be empty.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
      
    const retailData = mtdData.filter(item => !item.Department || item.Department === 'RETAIL');
    const revaData = mtdData.filter(item => item.Department === 'REVA');
    const wholesaleData = mtdData.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    );
    
    const transformData = (data: any[], isDepartmentData = false): RepData[] => {
      console.log(`Transforming ${data.length} records`);
      const repMap = new Map<string, RepData>();
        
      data.forEach(item => {
        let repName;
          
        if (isDepartmentData && item['Sub-Rep'] && item['Sub-Rep'].trim() !== '') {
          repName = item['Sub-Rep'];
        } else if (item.Rep === 'REVA' || item.Rep === 'Wholesale' || item.Rep === 'WHOLESALE') {
          return;
        } else {
          repName = item.Rep;
        }
          
        if (!repName) {
          console.log('Found item without Rep name:', item);
          return;
        }
          
        if (!repMap.has(repName)) {
          repMap.set(repName, {
            rep: repName,
            spend: 0,
            profit: 0,
            packs: 0,
            margin: 0,
            activeAccounts: 0,
            totalAccounts: 0,
            profitPerActiveShop: 0,
            profitPerPack: 0,
            activeRatio: 0
          });
        }
          
        const currentRep = repMap.get(repName)!;
          
        const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
        const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
        const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
          
        currentRep.spend += spend;
        currentRep.profit += profit;
        currentRep.packs += packs;
          
        if (item["Account Ref"]) {
          currentRep.totalAccounts += 1;
          if (spend > 0) {
            currentRep.activeAccounts += 1;
          }
        }
          
        currentRep.margin = currentRep.spend > 0 ? (currentRep.profit / currentRep.spend) * 100 : 0;
          
        repMap.set(repName, currentRep);
      });
        
      console.log(`Transformed data into ${repMap.size} unique reps`);
      return Array.from(repMap.values()).map(rep => {
        rep.profitPerActiveShop = rep.activeAccounts > 0 ? rep.profit / rep.activeAccounts : 0;
        rep.profitPerPack = rep.packs > 0 ? rep.profit / rep.packs : 0;
        rep.activeRatio = rep.totalAccounts > 0 ? (rep.activeAccounts / rep.totalAccounts) * 100 : 0;
        return rep;
      });
    };
    
    const lastRetailData = (lastMtdData || []).filter(item => !item.Department || item.Department === 'RETAIL');
    const lastRevaData = (lastMtdData || []).filter(item => item.Department === 'REVA');
    const lastWholesaleData = (lastMtdData || []).filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    );
    
    const lastAprRetailData = transformData(lastRetailData);
    const lastAprRevaData = transformData(lastRevaData, true);
    const lastAprWholesaleData = transformData(lastWholesaleData, true);
      
    console.log(`April data breakdown - Retail: ${retailData.length}, REVA: ${revaData.length}, Wholesale: ${wholesaleData.length}`);
    console.log(`Last MTD breakdown - Retail: ${lastRetailData.length}, REVA: ${lastRevaData.length}, Wholesale: ${lastWholesaleData.length}`);
      
    const aprRetailData = transformData(retailData);
    const aprRevaData = transformData(revaData, true);
    const aprWholesaleData = transformData(wholesaleData, true);
      
    console.log(`Transformed Rep Data - Retail: ${aprRetailData.length}, REVA: ${aprRevaData.length}, Wholesale: ${aprWholesaleData.length}`);
      
    const aprRetailSummary = calculateDeptSummary(retailData);
    const aprRevaSummary = calculateDeptSummary(revaData);
    const aprWholesaleSummary = calculateDeptSummary(wholesaleData);
      
    console.log('April Department Summaries:');
    console.log('Retail:', aprRetailSummary);
    console.log('REVA:', aprRevaSummary);
    console.log('Wholesale:', aprWholesaleSummary);
      
    setAprRepData(aprRetailData);
    setAprRevaData(aprRevaData);
    setAprWholesaleData(aprWholesaleData);
    setAprBaseSummary(aprRetailSummary);
    setAprRevaValues(aprRevaSummary);
    setAprWholesaleValues(aprWholesaleSummary);
      
    const combinedAprilData = getCombinedRepData(
      aprRetailData,
      aprRevaData,
      aprWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    const localRepChanges: Record<string, any> = {};
    
    const combinedLastMtdData = getCombinedRepData(
      lastAprRetailData,
      lastAprRevaData,
      lastAprWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    combinedAprilData.forEach(aprRep => {
      const lastRep = combinedLastMtdData.find(r => r.rep === aprRep.rep);
      
      if (lastRep) {
        const profitChange = lastRep.profit > 0 ? ((aprRep.profit - lastRep.profit) / lastRep.profit) * 100 : 0;
        const spendChange = lastRep.spend > 0 ? ((aprRep.spend - lastRep.spend) / lastRep.spend) * 100 : 0;
        const marginChange = aprRep.margin - lastRep.margin;
        const packsChange = lastRep.packs > 0 ? ((aprRep.packs - lastRep.packs) / lastRep.packs) * 100 : 0;
        const activeAccountsChange = lastRep.activeAccounts > 0 ? 
          ((aprRep.activeAccounts - lastRep.activeAccounts) / lastRep.activeAccounts) * 100 : 0;
        const totalAccountsChange = lastRep.totalAccounts > 0 ? 
          ((aprRep.totalAccounts - lastRep.totalAccounts) / lastRep.totalAccounts) * 100 : 0;
        
        localRepChanges[aprRep.rep] = {
          profit: profitChange,
          spend: spendChange,
          margin: marginChange,
          packs: packsChange,
          activeAccounts: activeAccountsChange,
          totalAccounts: totalAccountsChange
        };
      } else {
        localRepChanges[aprRep.rep] = {
          profit: 100,
          spend: 100,
          margin: aprRep.margin,
          packs: 100,
          activeAccounts: 100,
          totalAccounts: 100
        };
      }
    });
    
    combinedLastMtdData.forEach(lastRep => {
      if (!combinedAprilData.find(r => r.rep === lastRep.rep)) {
        localRepChanges[lastRep.rep] = {
          profit: -100,
          spend: -100,
          margin: -lastRep.margin,
          packs: -100,
          activeAccounts: -100,
          totalAccounts: -100
        };
      }
    });
      
    const aprSummary = calculateSummary(
      aprRetailSummary,
      aprRevaSummary,
      aprWholesaleSummary,
      includeRetail,
      includeReva,
      includeWholesale
    );
      
    const lastRetailSummary = calculateDeptSummary(lastRetailData);
    const lastRevaSummary = calculateDeptSummary(lastRevaData);
    const lastWholesaleSummary = calculateDeptSummary(lastWholesaleData);
    
    const lastSummary = calculateSummary(
      lastRetailSummary,
      lastRevaSummary,
      lastWholesaleSummary,
      includeRetail,
      includeReva,
      includeWholesale
    );
      
    const aprilSummaryChanges = {
      totalSpend: lastSummary.totalSpend > 0 ? 
        ((aprSummary.totalSpend - lastSummary.totalSpend) / lastSummary.totalSpend) * 100 : 0,
      totalProfit: lastSummary.totalProfit > 0 ? 
        ((aprSummary.totalProfit - lastSummary.totalProfit) / lastSummary.totalProfit) * 100 : 0,
      averageMargin: aprSummary.averageMargin - lastSummary.averageMargin,
      totalPacks: lastSummary.totalPacks > 0 ? 
        ((aprSummary.totalPacks - lastSummary.totalPacks) / lastSummary.totalPacks) * 100 : 0,
      totalAccounts: lastSummary.totalAccounts > 0 ? 
        ((aprSummary.totalAccounts - lastSummary.totalAccounts) / lastSummary.totalAccounts) * 100 : 0,
      activeAccounts: lastSummary.activeAccounts > 0 ? 
        ((aprSummary.activeAccounts - lastSummary.activeAccounts) / lastSummary.activeAccounts) * 100 : 0
    };
      
    setSummaryChanges(aprilSummaryChanges);
    setRepChanges(localRepChanges);
    
    console.log('Combined April Data length:', combinedAprilData.length);
    console.log('Combined April Total Profit:', combinedAprilData.reduce((sum, item) => sum + item.profit, 0));
    console.log('Comparison data source for April:', lastMtdData ? 'last_mtd_daily' : 'None available');
      
    const currentData = loadStoredRepPerformanceData() || {};
    saveRepPerformanceData({
      ...currentData,
      aprRepData: aprRetailData,
      aprRevaData: aprRevaData,
      aprWholesaleData: aprWholesaleData,
      aprBaseSummary: aprRetailSummary,
      aprRevaValues: aprRevaSummary,
      aprWholesaleValues: aprWholesaleSummary
    });
      
    toast({
      title: "April data loaded successfully",
      description: `Loaded ${mtdData.length} April MTD records with ${lastMtdData?.length || 0} comparison records`,
    });
      
    return true;
  } catch (error) {
    console.error('Error loading April data:', error);
    toast({
      title: "Error loading April data",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    return false;
  } finally {
    setIsLoading(false);
  }
};
