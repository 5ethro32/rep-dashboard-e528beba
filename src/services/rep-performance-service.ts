import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummaryFromData, calculateRawMtdSummary } from '@/utils/rep-data-processing';

// Define table names type to avoid TypeScript errors
type TableName = 'mtd_daily' | 'march_rolling' | 'sales_data' | 'sales_data_februrary' | 'customer_visits' | 'profiles' | 'week_plans';

// Fetch all data with pagination
async function fetchAllRecords(tableName: TableName) {
  let allData: any[] = [];
  const PAGE_SIZE = 1000;
  let page = 0;
  let hasMoreData = true;
  
  while (hasMoreData) {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
    if (error) {
      console.error(`Error fetching page ${page} from ${tableName}:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`Fetched ${data.length} records from ${tableName}, page ${page}`);
      allData = [...allData, ...data];
      page++;
      
      // Check if we've fetched all available data
      hasMoreData = data.length === PAGE_SIZE;
    } else {
      hasMoreData = false;
    }
  }
  
  console.log(`Total ${allData.length} records fetched from ${tableName}`);
  return allData;
}

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data using pagination...');
    
    // Use pagination to get all MTD data (April)
    const mtdData = await fetchAllRecords('mtd_daily');
    
    // Use pagination to get all March rolling data
    const marchRollingData = await fetchAllRecords('march_rolling');
    
    console.log('Total MTD records fetched:', mtdData?.length || 0);
    console.log('Total March Rolling records fetched:', marchRollingData?.length || 0);
    
    // Show toast with number of records fetched
    toast({
      title: "Data Load Information",
      description: `April MTD: ${mtdData?.length || 0} records\nMarch: ${marchRollingData?.length || 0} records`,
      duration: 10000, // Show for 10 seconds
    });
    
    // Calculate raw summary directly from all mtd_daily records without filtering
    const rawAprSummary = calculateRawMtdSummary(mtdData || []);
    console.log('Raw April summary (all records):', rawAprSummary);
    
    // Calculate raw summary directly from all march_rolling records without filtering
    const rawMarchSummary = calculateRawMtdSummary(marchRollingData || []);
    console.log('Raw March summary (all records):', rawMarchSummary);
    
    // Transform data into the format we need
    // For April (MTD) data - still needed for rep-level data
    const aprRetailData = processRawData(mtdData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const aprRevaData = processRawData(mtdData?.filter(item => item.Department === 'REVA') || []);
    const aprWholesaleData = processRawData(mtdData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    
    // For March (Rolling) data
    const marchRetailData = processRawData(marchRollingData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const marchRevaData = processRawData(marchRollingData?.filter(item => item.Department === 'REVA') || []);
    const marchWholesaleData = processRawData(marchRollingData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    
    // Calculate filtered summaries - only used for department-specific data
    const aprRetailSummary = calculateSummaryFromData(aprRetailData);
    const aprRevaSummary = calculateSummaryFromData(aprRevaData);
    const aprWholesaleSummary = calculateSummaryFromData(aprWholesaleData);
    
    // Calculate summaries - March
    const marchRetailSummary = calculateSummaryFromData(marchRetailData);
    const marchRevaSummary = calculateSummaryFromData(marchRevaData);
    const marchWholesaleSummary = calculateSummaryFromData(marchWholesaleData);
    
    // Calculate changes between March and April using the raw summary for April
    const calculateChanges = (april: number, march: number): number => {
      if (march === 0) return 0;
      return ((april - march) / march) * 100;
    };
    
    // Use raw summary for both April and March to calculate changes
    const summaryChanges = {
      totalSpend: calculateChanges(rawAprSummary.totalSpend, rawMarchSummary.totalSpend),
      totalProfit: calculateChanges(rawAprSummary.totalProfit, rawMarchSummary.totalProfit),
      averageMargin: calculateChanges(rawAprSummary.averageMargin, rawMarchSummary.averageMargin),
      totalPacks: calculateChanges(rawAprSummary.totalPacks, rawMarchSummary.totalPacks),
      totalAccounts: calculateChanges(rawAprSummary.totalAccounts, rawMarchSummary.totalAccounts),
      activeAccounts: calculateChanges(rawAprSummary.activeAccounts, rawMarchSummary.activeAccounts)
    };
    
    // Calculate rep-level changes for all departments
    const retailRepChanges = calculateRepChanges(aprRetailData, marchRetailData);
    const revaRepChanges = calculateRepChanges(aprRevaData, marchRevaData);
    const wholesaleRepChanges = calculateRepChanges(aprWholesaleData, marchWholesaleData);
    
    // Combine all changes into a single object
    const repChanges = {
      ...retailRepChanges,
      ...revaRepChanges,
      ...wholesaleRepChanges
    };
    
    // Log the number of reps with changes per department
    console.log(`Rep changes - Retail: ${Object.keys(retailRepChanges).length}, REVA: ${Object.keys(revaRepChanges).length}, Wholesale: ${Object.keys(wholesaleRepChanges).length}`);
    console.log(`Total reps with changes: ${Object.keys(repChanges).length}`);
    
    return {
      repData: aprRetailData,
      revaData: aprRevaData,
      wholesaleData: aprWholesaleData,
      baseSummary: rawAprSummary, // Use raw April summary here
      revaValues: aprRevaSummary,
      wholesaleValues: aprWholesaleSummary,
      
      febRepData: marchRetailData,
      febRevaData: marchRevaData,
      febWholesaleData: marchWholesaleData,
      febBaseSummary: rawMarchSummary, // Use raw March summary here
      febRevaValues: marchRevaSummary,
      febWholesaleValues: marchWholesaleSummary,
      
      summaryChanges,
      repChanges
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

// Helper function to transform raw data from Supabase into RepData format
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
    let repName;
    
    // First, add this record's values to the ALL_RECORDS aggregate
    const allRecordsEntry = repMap.get('ALL_RECORDS')!;
    const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
    const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
    const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
    
    allRecordsEntry.spend += spend;
    allRecordsEntry.profit += profit;
    allRecordsEntry.packs += packs;
    
    if (item["Account Ref"]) {
      allRecordsEntry.totalAccounts.add(item["Account Ref"]);
      if (spend > 0) {
        allRecordsEntry.activeAccounts.add(item["Account Ref"]);
      }
    }
    
    // Then, process the record for individual rep aggregation as before
    if (item['Sub-Rep'] && 
        item['Sub-Rep'].trim() !== '' && 
        item['Sub-Rep'].trim().toUpperCase() !== 'NONE') {
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
        activeAccounts: new Set(),
        totalAccounts: new Set()
      });
    }
    
    const currentRep = repMap.get(repName)!;
    
    currentRep.spend += spend;
    currentRep.profit += profit;
    currentRep.packs += packs;
    
    if (item["Account Ref"]) {
      currentRep.totalAccounts.add(item["Account Ref"]);
      if (spend > 0) {
        currentRep.activeAccounts.add(item["Account Ref"]);
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

// Helper function to calculate changes between two sets of rep data
function calculateRepChanges(currentData: RepData[], previousData: RepData[]) {
  const changes: Record<string, any> = {};
  
  currentData.forEach(current => {
    const previous = previousData.find(prev => prev.rep === current.rep);
    
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
