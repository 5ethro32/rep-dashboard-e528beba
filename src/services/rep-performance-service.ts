import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummary, calculateRawMtdSummary, calculateSummaryFromData, processRawData } from '@/utils/rep-data-processing';

// Define valid table and view names for type safety
// Tables
type DbTableName = 'mtd_daily' | 'sales_data' | 'sales_data_februrary' | 'march_rolling' | 'customer_visits' | 'profiles' | 'week_plans';
// Views
type DbViewName = 'combined_rep_performance';

// Helper function to fetch all records from a table using pagination
async function fetchAllRecords(tableName: DbTableName) {
  let allRecords: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(`Error fetching ${tableName} data:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allRecords = [...allRecords, ...data];
      page++;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`Fetched ${allRecords.length} total records from ${tableName}`);
  return allRecords;
}

// Helper function for views if needed in the future
async function fetchAllViewRecords(viewName: DbViewName) {
  let allRecords: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(`Error fetching ${viewName} view data:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allRecords = [...allRecords, ...data];
      page++;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`Fetched ${allRecords.length} total records from ${viewName} view`);
  return allRecords;
}

export const fetchRepPerformanceData = async (currentSelectedMonth: string = 'April') => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data using pagination...');
    
    // April Data from mtd_daily
    const mtdData = await fetchAllRecords('mtd_daily');
    
    // March Data from sales_data
    const marchData = await fetchAllRecords('sales_data');
    
    // February Data from sales_data_februrary
    const februaryData = await fetchAllRecords('sales_data_februrary');
    
    // March Rolling Data (for April comparisons) from march_rolling
    const marchRollingData = await fetchAllRecords('march_rolling');
    
    console.log('Total records fetched:', {
      mtd: mtdData?.length || 0,
      march: marchData?.length || 0,
      february: februaryData?.length || 0,
      marchRolling: marchRollingData?.length || 0
    });
    
    // Show toast with number of records fetched
    toast({
      title: "Data Load Information",
      description: `April: ${mtdData?.length || 0} records\nMarch: ${marchData?.length || 0} records\nFebruary: ${februaryData?.length || 0} records`,
      duration: 10000,
    });

    // April data processing
    const aprRetailData = processRawData(mtdData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const aprRevaData = processRawData(mtdData?.filter(item => item.Department === 'REVA') || []);
    const aprWholesaleData = processRawData(mtdData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    const rawAprSummary = calculateRawMtdSummary(mtdData || []);
    
    // March data processing
    const marchRetailData = processRawData(marchData?.filter(item => !item.rep_type || item.rep_type === 'RETAIL') || []);
    const marchRevaData = processRawData(marchData?.filter(item => item.rep_type === 'REVA') || []);
    const marchWholesaleData = processRawData(marchData?.filter(item => 
      item.rep_type === 'Wholesale' || item.rep_type === 'WHOLESALE'
    ) || []);
    const rawMarchSummary = calculateRawMtdSummary(marchData || []);
    
    // February data processing - now using the same direct calculation approach as April
    const febRetailData = processRawData(februaryData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const febRevaData = processRawData(februaryData?.filter(item => item.Department === 'REVA') || []);
    const febWholesaleData = processRawData(februaryData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    const rawFebSummary = calculateRawMtdSummary(februaryData || []); // Using same direct calculation as April
    
    // March Rolling data processing
    console.log('Processing March Rolling data by department...');
    
    const marchRollingRetailData = processRawData(marchRollingData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const marchRollingRevaData = processRawData(marchRollingData?.filter(item => item.Department === 'REVA') || []);
    const marchRollingWholesaleData = processRawData(marchRollingData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    const rawMarchRollingSummary = calculateRawMtdSummary(marchRollingData || []);

    // Calculate filtered summaries
    const aprRetailSummary = calculateSummaryFromData(aprRetailData);
    const aprRevaSummary = calculateSummaryFromData(aprRevaData);
    const aprWholesaleSummary = calculateSummaryFromData(aprWholesaleData);
    
    const marchRetailSummary = calculateSummaryFromData(marchRetailData);
    const marchRevaSummary = calculateSummaryFromData(marchRevaData);
    const marchWholesaleSummary = calculateSummaryFromData(marchWholesaleData);
    
    const febRetailSummary = calculateSummaryFromData(febRetailData);
    const febRevaSummary = calculateSummaryFromData(febRevaData);
    const febWholesaleSummary = calculateSummaryFromData(febWholesaleData);

    // Calculate changes for different periods
    const calculateChanges = (current: number, previous: number): number => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };
    
    // April vs March Rolling changes
    const aprVsMarchChanges = {
      totalSpend: calculateChanges(rawAprSummary.totalSpend, rawMarchRollingSummary.totalSpend),
      totalProfit: calculateChanges(rawAprSummary.totalProfit, rawMarchRollingSummary.totalProfit),
      averageMargin: calculateChanges(rawAprSummary.averageMargin, rawMarchRollingSummary.averageMargin),
      totalPacks: calculateChanges(rawAprSummary.totalPacks, rawMarchRollingSummary.totalPacks),
      totalAccounts: calculateChanges(rawAprSummary.totalAccounts, rawMarchRollingSummary.totalAccounts),
      activeAccounts: calculateChanges(rawAprSummary.activeAccounts, rawMarchRollingSummary.activeAccounts)
    };
    
    // March vs February changes
    const marchVsFebChanges = {
      totalSpend: calculateChanges(rawMarchSummary.totalSpend, rawFebSummary.totalSpend),
      totalProfit: calculateChanges(rawMarchSummary.totalProfit, rawFebSummary.totalProfit),
      averageMargin: calculateChanges(rawMarchSummary.averageMargin, rawFebSummary.averageMargin),
      totalPacks: calculateChanges(rawMarchSummary.totalPacks, rawFebSummary.totalPacks),
      totalAccounts: calculateChanges(rawMarchSummary.totalAccounts, rawFebSummary.totalAccounts),
      activeAccounts: calculateChanges(rawMarchSummary.activeAccounts, rawFebSummary.activeAccounts)
    };
    
    // Fix: Calculate rep-level changes with improved handling for extreme values
    const aprRepChanges = calculateRepChanges(aprRetailData, marchRollingRetailData);
    const marchRepChanges = calculateRepChanges(marchRetailData, febRetailData);
    
    return {
      // April data
      repData: aprRetailData,
      revaData: aprRevaData,
      wholesaleData: aprWholesaleData,
      baseSummary: rawAprSummary,
      revaValues: aprRevaSummary,
      wholesaleValues: aprWholesaleSummary,
      
      // March data (using March Rolling for April comparisons)
      marchRepData: currentSelectedMonth === 'April' ? marchRollingRetailData : marchRetailData,
      marchRevaData: currentSelectedMonth === 'April' ? marchRollingRevaData : marchRevaData,
      marchWholesaleData: currentSelectedMonth === 'April' ? marchRollingWholesaleData : marchWholesaleData,
      marchBaseSummary: currentSelectedMonth === 'April' ? rawMarchRollingSummary : rawMarchSummary,
      marchRevaValues: marchRevaSummary,
      marchWholesaleValues: marchWholesaleSummary,
      
      // February data - now using raw summary directly like April
      febRepData: febRetailData,
      febRevaData: febRevaData,
      febWholesaleData: febWholesaleData,
      febBaseSummary: rawFebSummary,
      febRevaValues: febRevaSummary,
      febWholesaleValues: febWholesaleSummary,
      
      // Changes
      summaryChanges: aprVsMarchChanges,
      marchSummaryChanges: marchVsFebChanges,
      repChanges: aprRepChanges,
      marchRepChanges: marchRepChanges
    };
  } catch (error) {
    console.error('Error loading data:', error);
    toast({
      title: "Error loading data",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    throw error;
  }
};

function calculateRepChanges(currentData: RepData[], previousData: RepData[]) {
  const changes: Record<string, any> = {};
  
  // Debug log for troubleshooting
  console.log(`Calculating changes between datasets: current=${currentData.length} reps, previous=${previousData.length} reps`);
  
  // Log rep names from both datasets to help debug matching issues
  console.log('Current rep names:', currentData.map(r => r.rep));
  console.log('Previous rep names:', previousData.map(r => r.rep));
  
  currentData.forEach(current => {
    // Find the matching rep in previous data
    // Fix: Improve matching by normalizing rep names (trim, lowercase)
    const currentRepName = current.rep.toLowerCase().trim();
    
    const previous = previousData.find(prev => {
      const prevRepName = prev.rep.toLowerCase().trim();
      return currentRepName === prevRepName;
    });
    
    // Debug log for specific rep (Craig McDowall)
    if (current.rep.includes('Craig McDowall')) {
      console.log('Processing Craig McDowall:');
      console.log('  Current profit:', current.profit);
      console.log('  Previous profit:', previous?.profit || 'Not found in previous data');
      
      if (previous) {
        const percentChange = ((current.profit - previous.profit) / Math.abs(previous.profit)) * 100;
        console.log('  Raw percent change:', percentChange);
      }
    }
    
    if (previous) {
      // Fix: Add capping to prevent extreme percentage values
      const calculateChange = (currentValue: number, previousValue: number) => {
        if (previousValue === 0) return currentValue > 0 ? 100 : 0;
        
        const percentChange = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
        
        // Cap extreme percentage values to prevent UI issues
        const MAX_PERCENTAGE = 500; // Lower the cap to 500% change
        return Math.max(Math.min(percentChange, MAX_PERCENTAGE), -MAX_PERCENTAGE);
      };
      
      changes[current.rep] = {
        spend: calculateChange(current.spend, previous.spend),
        profit: calculateChange(current.profit, previous.profit),
        margin: calculateChange(current.margin, previous.margin),
        packs: calculateChange(current.packs, previous.packs),
        activeAccounts: calculateChange(current.activeAccounts, previous.activeAccounts),
        totalAccounts: calculateChange(current.totalAccounts, previous.totalAccounts),
        profitPerActiveShop: calculateChange(current.profitPerActiveShop, previous.profitPerActiveShop),
        profitPerPack: calculateChange(current.profitPerPack, previous.profitPerPack),
        activeRatio: calculateChange(current.activeRatio, previous.activeRatio)
      };
      
      // Log extreme changes for debugging
      if (Math.abs(changes[current.rep].profit) > 100) {
        console.log(`Large profit change detected for ${current.rep}:`, {
          current: current.profit,
          previous: previous.profit,
          change: changes[current.rep].profit
        });
      }
    }
  });
  
  return changes;
}
