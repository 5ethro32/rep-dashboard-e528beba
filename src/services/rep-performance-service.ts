import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummaryFromData, calculateRawMtdSummary } from '@/utils/rep-data-processing';

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data using pagination...');
    
    // April Data: MTD Daily
    const mtdData = await fetchAllRecords('mtd_daily');
    
    // March Data: sales_data
    const marchData = await fetchAllRecords('sales_data');
    
    // February Data: sales_data_februrary
    const februaryData = await fetchAllRecords('sales_data_februrary');
    
    // March Rolling Data (for April comparisons)
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
      description: `April MTD: ${mtdData?.length || 0} records\nMarch: ${marchData?.length || 0} records`,
      duration: 10000,
    });
    
    // April data processing
    const rawAprSummary = calculateRawMtdSummary(mtdData || []);
    const aprRetailData = processRawData(mtdData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const aprRevaData = processRawData(mtdData?.filter(item => item.Department === 'REVA') || []);
    const aprWholesaleData = processRawData(mtdData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    
    // March data processing (from sales_data)
    const rawMarchSummary = calculateRawMtdSummary(marchData || []);
    const marchRetailData = processRawData(marchData?.filter(item => !item.rep_type || item.rep_type === 'RETAIL') || []);
    const marchRevaData = processRawData(marchData?.filter(item => item.rep_type === 'REVA') || []);
    const marchWholesaleData = processRawData(marchData?.filter(item => 
      item.rep_type === 'Wholesale' || item.rep_type === 'WHOLESALE'
    ) || []);
    
    // February data processing
    const rawFebSummary = calculateRawMtdSummary(februaryData || []);
    const febRetailData = processRawData(februaryData?.filter(item => !item.Department || item.Department === 'RETAIL') || []);
    const febRevaData = processRawData(februaryData?.filter(item => item.Department === 'REVA') || []);
    const febWholesaleData = processRawData(februaryData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || []);
    
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
    const aprRepChanges = calculateRepChanges(aprRetailData, marchRollingData);
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
