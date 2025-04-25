
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummaryFromData } from '@/utils/rep-data-processing';

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data using direct SQL functions...');
    
    // Use our SQL functions to get MTD data (April)
    const { data: mtdData, error: mtdError } = await supabase.rpc('fetch_all_mtd_data');
    if (mtdError) {
      console.error('Error fetching MTD data:', mtdError);
      throw new Error(`Error fetching MTD data: ${mtdError.message}`);
    }
    
    // Use our SQL functions to get March rolling data
    const { data: marchRollingData, error: marchRollingError } = await supabase.rpc('fetch_all_march_rolling_data');
    if (marchRollingError) {
      console.error('Error fetching March Rolling data:', marchRollingError);
      throw new Error(`Error fetching March Rolling data: ${marchRollingError.message}`);
    }
    
    console.log('Total MTD records fetched:', mtdData?.length || 0);
    console.log('Total March Rolling records fetched:', marchRollingData?.length || 0);
    
    // Transform data into the format we need
    // For April (MTD) data
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
    
    // Calculate summaries - April
    const aprRetailSummary = calculateSummaryFromData(aprRetailData);
    const aprRevaSummary = calculateSummaryFromData(aprRevaData);
    const aprWholesaleSummary = calculateSummaryFromData(aprWholesaleData);
    
    // Calculate summaries - March
    const marchRetailSummary = calculateSummaryFromData(marchRetailData);
    const marchRevaSummary = calculateSummaryFromData(marchRevaData);
    const marchWholesaleSummary = calculateSummaryFromData(marchWholesaleData);
    
    // Calculate changes between March and April
    const calculateChanges = (april: number, march: number): number => {
      if (march === 0) return 0;
      return ((april - march) / march) * 100;
    };
    
    const summaryChanges = {
      totalSpend: calculateChanges(aprRetailSummary.totalSpend, marchRetailSummary.totalSpend),
      totalProfit: calculateChanges(aprRetailSummary.totalProfit, marchRetailSummary.totalProfit),
      averageMargin: calculateChanges(aprRetailSummary.averageMargin, marchRetailSummary.averageMargin),
      totalPacks: calculateChanges(aprRetailSummary.totalPacks, marchRetailSummary.totalPacks),
      totalAccounts: calculateChanges(aprRetailSummary.totalAccounts, marchRetailSummary.totalAccounts),
      activeAccounts: calculateChanges(aprRetailSummary.activeAccounts, marchRetailSummary.activeAccounts)
    };
    
    // Calculate rep-level changes
    const repChanges = calculateRepChanges(aprRetailData, marchRetailData);
    
    return {
      repData: aprRetailData,
      revaData: aprRevaData,
      wholesaleData: aprWholesaleData,
      baseSummary: aprRetailSummary,
      revaValues: aprRevaSummary,
      wholesaleValues: aprWholesaleSummary,
      
      febRepData: marchRetailData,
      febRevaData: marchRevaData,
      febWholesaleData: marchWholesaleData,
      febBaseSummary: marchRetailSummary,
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
  
  rawData.forEach(item => {
    let repName;
    
    if (item['Sub-Rep'] && item['Sub-Rep'].trim() !== '') {
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
    
    const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
    const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
    const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
    
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
  
  return Array.from(repMap.values()).map(rep => {
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
