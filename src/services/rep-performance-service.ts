import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummaryFromData, calculateRawMtdSummary } from '@/utils/rep-data-processing';

// Define valid table and view names for type safety
// Tables
type DbTableName = 'April Data' | 'March Data' | 'February Data' | 'March Data MTD' | 'customer_visits' | 'profiles' | 'week_plans';
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

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data using pagination...');
    
    // April Data
    const mtdData = await fetchAllRecords('April Data');
    
    // March Data
    const marchData = await fetchAllRecords('March Data');
    
    // February Data
    const februaryData = await fetchAllRecords('February Data');
    
    // March Rolling Data (for April comparisons)
    const marchRollingData = await fetchAllRecords('March Data MTD');
    
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
    
    // February data processing
    const febRetailData = processRawData(februaryData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const febRevaData = processRawData(februaryData?.filter(item => item.Department === 'REVA') || []);
    const febWholesaleData = processRawData(februaryData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    const rawFebSummary = calculateRawMtdSummary(februaryData || []);
    
    // March Rolling data processing (for April comparison)
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
    
    // Calculate rep-level changes
    const aprRepChanges = calculateRepChanges(aprRetailData, processRawData(marchRollingData));
    const marchRepChanges = calculateRepChanges(marchRetailData, febRetailData);
    
    return {
      // April data
      repData: aprRetailData,
      revaData: aprRevaData,
      wholesaleData: aprWholesaleData,
      baseSummary: rawAprSummary,
      revaValues: aprRevaSummary,
      wholesaleValues: aprWholesaleSummary,
      
      // March data
      marchRepData: marchRetailData,
      marchRevaData: marchRevaData,
      marchWholesaleData: marchWholesaleData,
      marchBaseSummary: rawMarchSummary,
      marchRevaValues: marchRevaSummary,
      marchWholesaleValues: marchWholesaleSummary,
      
      // February data
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

function processRawData(rawData: any[]): RepData[] {
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }>();
  
  // Create a special entry for the total across ALL rows
  repMap.set('ALL_RECORDS', {
    rep: 'ALL_RECORDS',
    spend: 0,
    profit: 0,
    packs: 0,
    activeAccounts: new Set(),
    totalAccounts: new Set()
  });
  
  rawData.forEach(item => {
    // First, add this record's values to the ALL_RECORDS aggregate
    const allRecordsEntry = repMap.get('ALL_RECORDS')!;
    
    // Extract data using field mapping to handle different data structures
    const spend = extractNumericValue(item, ['Spend', 'spend']);
    const profit = extractNumericValue(item, ['Profit', 'profit']);
    const packs = extractNumericValue(item, ['Packs', 'packs']);
    const accountRef = item["Account Ref"] || item.account_ref;
    
    allRecordsEntry.spend += spend;
    allRecordsEntry.profit += profit;
    allRecordsEntry.packs += packs;
    
    if (accountRef) {
      allRecordsEntry.totalAccounts.add(accountRef);
      if (spend > 0) {
        allRecordsEntry.activeAccounts.add(accountRef);
      }
    }
    
    // Then, process the record for individual rep aggregation
    // Extract rep name with fallbacks for different column naming
    let repName;
    
    // Handle Sub-Rep logic
    const subRep = item['Sub-Rep'] || item.sub_rep;
    const mainRep = item.Rep || item.rep_name;
    
    if (subRep && subRep.trim() !== '' && subRep.trim().toUpperCase() !== 'NONE') {
      repName = subRep;
    } else if (mainRep === 'REVA' || mainRep === 'Wholesale' || mainRep === 'WHOLESALE') {
      // Skip departmental entries without subreps
      return;
    } else {
      repName = mainRep;
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
        activeAccounts: new Set(),
        totalAccounts: new Set()
      });
    }
    
    const currentRep = repMap.get(repName)!;
    
    currentRep.spend += spend;
    currentRep.profit += profit;
    currentRep.packs += packs;
    
    if (accountRef) {
      currentRep.totalAccounts.add(accountRef);
      if (spend > 0) {
        currentRep.activeAccounts.add(accountRef);
      }
    }
  });
  
  const repDataArray = Array.from(repMap.values()).map(rep => {
    const activeAccounts = rep.activeAccounts.size;
    const totalAccounts = rep.totalAccounts.size;
    
    return {
      rep: rep.rep,
      spend: rep.spend,
      profit: rep.profit,
      margin: rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0,
      packs: rep.packs,
      activeAccounts: activeAccounts,
      totalAccounts: totalAccounts,
      profitPerActiveShop: activeAccounts > 0 ? rep.profit / activeAccounts : 0,
      profitPerPack: rep.packs > 0 ? rep.profit / rep.packs : 0,
      activeRatio: totalAccounts > 0 ? (activeAccounts / totalAccounts) * 100 : 0
    };
  });
  
  // Extract out the ALL_RECORDS entry for special handling
  const allRecordsSummary = repDataArray.find(r => r.rep === 'ALL_RECORDS');
  
  // Filter out reps where all metrics are zero, but always keep ALL_RECORDS entry for internal calculations
  const filteredRepData = repDataArray.filter(rep => {
    if (rep.rep === 'ALL_RECORDS') return true;
    return rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0;
  });
  
  // Log the ALL_RECORDS summary for verification
  if (allRecordsSummary) {
    console.log('ALL RECORDS SUMMARY:', {
      totalSpend: allRecordsSummary.spend,
      totalProfit: allRecordsSummary.profit,
      totalPacks: allRecordsSummary.packs,
      margin: allRecordsSummary.margin
    });
  }
  
  // Return the filtered data without the ALL_RECORDS entry to avoid showing it in tables
  return filteredRepData.filter(rep => rep.rep !== 'ALL_RECORDS');
}

// Helper to extract numeric values from records with different field naming
function extractNumericValue(item: any, fieldNames: string[]): number {
  for (const fieldName of fieldNames) {
    const value = item[fieldName];
    if (value !== undefined) {
      return typeof value === 'string' ? parseFloat(value) : Number(value || 0);
    }
  }
  return 0;
}

function calculateRepChanges(currentData: RepData[], previousData: RepData[]) {
  const changes: Record<string, any> = {};
  
  currentData.forEach(current => {
    const previous = previousData.find(prev => {
      // Try to match reps by name, accounting for potential differences in casing
      const currentRepName = current.rep.toLowerCase();
      const prevRepName = typeof prev.rep === 'string' ? prev.rep.toLowerCase() : '';
      return currentRepName === prevRepName;
    });
    
    if (previous) {
      const calculateChange = (currentValue: number, previousValue: number) => {
        if (previousValue === 0) return 0;
        return ((currentValue - previousValue) / previousValue) * 100;
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
    }
  });
  
  return changes;
}
