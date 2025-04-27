import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummary, calculateRawMtdSummary, calculateSummaryFromData, processRawData } from '@/utils/rep-data-processing';

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
      console.error(`Error fetching ${viewName} data:`, error);
      throw error;
    }

    if (data && data.length > 0) {
      allRecords = [...allRecords, ...data];
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allRecords.length} total records from ${viewName}`);
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
    
    // Fix: Let's debug the actual raw data for Craig McDowall
    if (marchRollingData && marchRollingData.length > 0) {
      const craigRecords = marchRollingData.filter(item => {
        const repName = (item.Rep || '').toLowerCase();
        const subRep = (item['Sub-Rep'] || '').toLowerCase();
        return repName.includes('craig') || repName.includes('mcdowall') || 
               subRep.includes('craig') || subRep.includes('mcdowall');
      });
      
      console.log(`Found ${craigRecords.length} raw records for Craig McDowall in March MTD`);
      console.log('Craig McDowall March MTD raw records:', craigRecords);
      
      // Calculate Craig's total profit directly from raw data
      if (craigRecords.length > 0) {
        const totalProfit = craigRecords.reduce((sum, item) => {
          // Be very explicit about how we extract profit
          let profit = 0;
          if (typeof item.Profit === 'number') {
            profit = item.Profit;
          } else if (typeof item.profit === 'number') {
            profit = item.profit;
          } else if (item.Profit) {
            profit = parseFloat(item.Profit);
          } else if (item.profit) {
            profit = parseFloat(item.profit);
          }
          return sum + profit;
        }, 0);
        
        console.log(`Craig McDowall's raw profit from March MTD: ${totalProfit}`);
      }
    }
    
    // Toast with number of records fetched
    toast({
      title: "Data Load Information",
      description: `April: ${mtdData?.length || 0} records\nMarch: ${marchData?.length || 0} records\nFebruary: ${februaryData?.length || 0} records`,
      duration: 10000,
    });
    
    // Process April data with careful attention to field names
    const aprRetailData = processRawData(mtdData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const aprRevaData = processRawData(mtdData?.filter(item => item.Department === 'REVA') || []);
    const aprWholesaleData = processRawData(mtdData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    const rawAprSummary = calculateRawMtdSummary(mtdData || []);
    
    // Process March data
    const marchRetailData = processRawData(marchData?.filter(item => !item.rep_type || item.rep_type === 'RETAIL') || []);
    const marchRevaData = processRawData(marchData?.filter(item => item.rep_type === 'REVA') || []);
    const marchWholesaleData = processRawData(marchData?.filter(item => 
      item.rep_type === 'Wholesale' || item.rep_type === 'WHOLESALE'
    ) || []);
    const rawMarchSummary = calculateRawMtdSummary(marchData || []);
    
    // Process February data
    const febRetailData = processRawData(februaryData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const febRevaData = processRawData(februaryData?.filter(item => item.Department === 'REVA') || []);
    const febWholesaleData = processRawData(februaryData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    const rawFebSummary = calculateRawMtdSummary(februaryData || []);
    
    // FIX: Improve March Rolling data processing with more explicit filtering and debugging
    console.log('Processing March Rolling data for better comparison with April data...');
    
    // New approach: Process March Rolling data completely separately
    // This ensures we don't have any cross-contamination with other datasets
    const processedMarchRollingData = processMarchRollingDataFixed(marchRollingData || []);
    
    // Calculate raw summary directly from the March Rolling data
    // This ensures our summary numbers match exactly with the processed rep data
    const rawMarchRollingSummary = calculateSummaryFromData(processedMarchRollingData);
    
    console.log('Processed March Rolling Summary:', {
      totalProfit: rawMarchRollingSummary.totalProfit,
      totalSpend: rawMarchRollingSummary.totalSpend
    });
    
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
    
    // Calculate changes for different periods with better precision
    const calculateChanges = (current: number, previous: number): number => {
      if (!previous) return 0;
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
    
    // FIX: Use the new processed March Rolling data for calculating rep changes
    const aprRepChanges = calculateRepChanges(aprRetailData, processedMarchRollingData);
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

// FIX: Completely rewritten function to process March Rolling data
// with extremely strict filtering and deduplication
function processMarchRollingDataFixed(rawData: any[]): RepData[] {
  console.log('Processing March Rolling data with fixed approach');
  
  // Track seen account refs to prevent double-counting
  const seenAccountRefs = new Map<string, { rep: string, spent: number, profit: number, packs: number }>();
  
  // First pass: Process each record and build a lookup of unique accounts
  rawData.forEach((item, index) => {
    // Extract all possible field names to ensure we don't miss data
    const spend = extractNumericValue(item, ['Spend', 'spend']);
    const profit = extractNumericValue(item, ['Profit', 'profit']);
    const packs = extractNumericValue(item, ['Packs', 'packs']);
    const accountRef = item["Account Ref"] || item.account_ref || item["ACCOUNT REF"];
    
    // Skip items without account ref
    if (!accountRef) return;
    
    // Get the rep name consistently
    const subRep = item['Sub-Rep'] || item.sub_rep || '';
    const mainRep = item.Rep || item.rep || '';
    const repName = subRep && subRep.trim() !== '' && subRep.trim().toUpperCase() !== 'NONE' ? 
      subRep.trim() : mainRep.trim();
    
    // Skip non-retail entries
    const department = item.Department || '';
    if (department === 'REVA' || department === 'Wholesale' || department === 'WHOLESALE') {
      return;
    }
    
    // Skip entries without rep name
    if (!repName || repName.trim() === '') {
      return;
    }
    
    // Handle Craig McDowall specially for debugging
    if (repName.toLowerCase().includes('craig') && repName.toLowerCase().includes('mcdowall')) {
      console.log(`Processing March Rolling record ${index} for Craig:`, {
        accountRef,
        profit,
        spend
      });
    }
    
    // Create a unique key for this account under this rep
    const key = `${repName.toLowerCase()}-${accountRef}`;
    
    // If we've seen this account for this rep before, update the values
    if (seenAccountRefs.has(key)) {
      const existing = seenAccountRefs.get(key)!;
      seenAccountRefs.set(key, {
        rep: repName,
        spent: existing.spent + spend,
        profit: existing.profit + profit,
        packs: existing.packs + packs
      });
      
      if (repName.toLowerCase().includes('craig') && repName.toLowerCase().includes('mcdowall')) {
        console.log(`Updated existing account ${accountRef} for Craig:`, {
          newProfit: existing.profit + profit,
          newSpend: existing.spent + spend
        });
      }
    } else {
      // Otherwise add it as a new entry
      seenAccountRefs.set(key, {
        rep: repName,
        spent: spend,
        profit: profit,
        packs: packs
      });
      
      if (repName.toLowerCase().includes('craig') && repName.toLowerCase().includes('mcdowall')) {
        console.log(`Added new account ${accountRef} for Craig:`, {
          profit, spend
        });
      }
    }
  });
  
  // Now aggregate by rep
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }>();
  
  // Process our deduplicated accounts
  seenAccountRefs.forEach((value, key) => {
    const [repName, accountRef] = key.split('-', 2);
    
    if (!repMap.has(repName)) {
      repMap.set(repName, {
        rep: value.rep, // Use the actual case from the value
        spend: 0,
        profit: 0,
        packs: 0,
        activeAccounts: new Set(),
        totalAccounts: new Set()
      });
    }
    
    const currentRep = repMap.get(repName)!;
    currentRep.spend += value.spent;
    currentRep.profit += value.profit;
    currentRep.packs += value.packs;
    currentRep.totalAccounts.add(accountRef);
    
    if (value.spent > 0) {
      currentRep.activeAccounts.add(accountRef);
    }
    
    // Special debug for Craig
    if (repName.includes('craig') && repName.includes('mcdowall')) {
      console.log(`Aggregating ${accountRef} to Craig's total:`, {
        currentTotal: currentRep.profit,
        addedProfit: value.profit
      });
    }
  });
  
  // Generate the final RepData array
  const repDataArray = Array.from(repMap.values()).map(rep => {
    const activeAccounts = rep.activeAccounts.size;
    const totalAccounts = rep.totalAccounts.size;
    
    const repData = {
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
    
    // Final debug for Craig
    if (rep.rep.toLowerCase().includes('craig') && rep.rep.toLowerCase().includes('mcdowall')) {
      console.log('FINAL PROCESSED DATA FOR CRAIG MCDOWALL:', repData);
    }
    
    return repData;
  });
  
  console.log(`Processed ${repDataArray.length} reps from March Rolling data with fixed approach`);
  
  return repDataArray;
}

// Special function to handle March Rolling data specifically for better comparisons
function processMarchRollingData(rawData: any[]): RepData[] {
  console.log('Processing March Rolling data with special handling');
  
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }>();

  if (rawData.length > 0) {
    console.log("First item in March Rolling data:", rawData[0]);
    console.log("Sample fields available:", Object.keys(rawData[0]));
  }

  rawData.forEach(item => {
    // Extract values with consistent approach for March Rolling data
    const spend = extractNumericValue(item, ['Spend', 'spend']);
    const profit = extractNumericValue(item, ['Profit', 'profit']);
    const packs = extractNumericValue(item, ['Packs', 'packs']);
    const accountRef = item["Account Ref"] || item.account_ref || item["ACCOUNT REF"];
    
    // Specially handle rep name extraction for March Rolling data
    let repName;
    
    // First check for primary rep in both Rep and rep fields
    const mainRep = item.Rep || item.rep || '';
    // Then check for sub-rep in both Sub-Rep and sub_rep fields
    const subRep = item['Sub-Rep'] || item.sub_rep || '';
    
    // Determine the actual rep based on data structure
    if (subRep && subRep.trim() !== '' && subRep.trim().toUpperCase() !== 'NONE') {
      // If we have a valid sub-rep, use that as the rep name
      repName = subRep;
    } else if (mainRep === 'REVA' || mainRep === 'Wholesale' || mainRep === 'WHOLESALE') {
      // Skip department entries
      return;
    } else {
      // Otherwise use the main rep
      repName = mainRep;
    }

    // Skip entries without a rep name
    if (!repName || repName.trim() === '') {
      return;
    }

    // Normalize rep name to handle case differences
    repName = repName.trim();
    
    // Special debug for Craig McDowall
    if (repName.toLowerCase().includes('craig') || repName.toLowerCase().includes('mcdowall')) {
      console.log(`Found Craig McDowall record in March Rolling:`, {
        repName,
        profit,
        spend,
        packs
      });
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

  // After processing, log the aggregated data for Craig McDowall
  if (repMap.has('Craig McDowall')) {
    const craigData = repMap.get('Craig McDowall')!;
    console.log('Craig McDowall processed data from March Rolling:', {
      profit: craigData.profit,
      spend: craigData.spend,
      packs: craigData.packs,
      totalAccounts: craigData.totalAccounts.size,
      activeAccounts: craigData.activeAccounts.size
    });
  }

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

  // Final debug log of all processed rep data
  console.log(`Processed ${repDataArray.length} reps from March Rolling data`);
  
  return repDataArray;
}

function calculateRepChanges(currentData: RepData[], previousData: RepData[]) {
  const changes: Record<string, any> = {};
  
  // Debug log for troubleshooting
  console.log(`Calculating changes between datasets: current=${currentData.length} reps, previous=${previousData.length} reps`);
  
  // Log rep names from both datasets to help debug matching issues
  console.log('Current rep names:', currentData.map(r => r.rep));
  console.log('Previous rep names:', previousData.map(r => r.rep));
  
  // Create a normalized map of previous data for easier lookup
  const previousDataMap = new Map<string, RepData>();
  previousData.forEach(prev => {
    const normalizedName = prev.rep.toLowerCase().trim();
    previousDataMap.set(normalizedName, prev);
    
    // Special debug for Craig McDowall in previous data
    if (normalizedName.includes('craig') && normalizedName.includes('mcdowall')) {
      console.log('Found Craig McDowall in previous data:', prev);
    }
  });
  
  currentData.forEach(current => {
    // Find the matching rep in previous data using normalized names
    const normalizedCurrentName = current.rep.toLowerCase().trim();
    const previous = previousDataMap.get(normalizedCurrentName);
    
    // Debug log for specific rep (Craig McDowall)
    if (current.rep.toLowerCase().includes('craig') && current.rep.toLowerCase().includes('mcdowall')) {
      console.log('Processing Craig McDowall comparison data:');
      console.log('  Current profit:', current.profit);
      
      if (previous) {
        console.log('  Previous profit from map:', previous.profit);
        const percentChange = previous.profit !== 0 ? 
          ((current.profit - previous.profit) / Math.abs(previous.profit)) * 100 : 0;
        console.log('  Raw percent change calculation:', percentChange);
      } else {
        console.log('  ERROR: No previous data found for Craig McDowall!');
        
        // Search manually through previous data for any similar names
        const possibleMatches = previousData.filter(p => 
          p.rep.toLowerCase().includes('craig') || 
          p.rep.toLowerCase().includes('mcdowall'));
        
        if (possibleMatches.length > 0) {
          console.log('  Possible matches found:', possibleMatches.map(p => `${p.rep} (profit: ${p.profit})`));
        }
      }
    }
    
    if (previous) {
      // Calculate change with capping to prevent extreme percentage values
      const calculateChange = (currentValue: number, previousValue: number) => {
        if (previousValue === 0) return currentValue > 0 ? 100 : 0;
        
        const percentChange = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
        
        // Cap extreme percentage values to prevent UI issues
        const MAX_PERCENTAGE = 500; // Cap to 500% change
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
    } else {
      console.log(`No previous data match found for: ${current.rep}`);
    }
  });
  
  return changes;
}

function extractNumericValue(item: any, fieldNames: string[]): number {
  for (const fieldName of fieldNames) {
    const value = item[fieldName];
    if (value !== undefined) {
      // Handle string values that need to be parsed
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/,/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      }
      // Handle numeric values directly
      return Number(value || 0);
    }
  }
  return 0;
}
