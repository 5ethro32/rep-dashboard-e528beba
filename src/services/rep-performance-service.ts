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
    
    // Use our new SQL functions to get all data without pagination
    const { data: mtdData, error: mtdError } = await supabase.rpc('fetch_all_mtd_data');
    if (mtdError) {
      console.error('Error fetching MTD data:', mtdError);
      throw new Error(`Error fetching MTD data: ${mtdError.message}`);
    }
    
    const { data: marchRollingData, error: marchRollingError } = await supabase.rpc('fetch_all_march_rolling_data');
    if (marchRollingError) {
      console.error('Error fetching March Rolling data:', marchRollingError);
      throw new Error(`Error fetching March Rolling data: ${marchRollingError.message}`);
    }
    
    console.log('Total MTD records fetched:', mtdData?.length || 0);
    console.log('Total March Rolling records fetched:', marchRollingData?.length || 0);
    
    // Process MTD data
    const retailData = mtdData?.filter(item => !item.Department || item.Department === 'RETAIL') || [];
    const revaData = mtdData?.filter(item => item.Department === 'REVA') || [];
    const wholesaleData = mtdData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || [];
    
    console.log('April data breakdown:', {
      retail: retailData.length,
      reva: revaData.length,
      wholesale: wholesaleData.length
    });
    
    // Process March Rolling data
    const marchRetailData = marchRollingData?.filter(item => !item.Department || item.Department === 'RETAIL') || [];
    const marchRevaData = marchRollingData?.filter(item => item.Department === 'REVA') || [];
    const marchWholesaleData = marchRollingData?.filter(item => 
      item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
    ) || [];
    
    console.log('March Rolling data breakdown:', {
      retail: marchRetailData.length,
      reva: marchRevaData.length,
      wholesale: marchWholesaleData.length
    });
    
    // Transform data
    const processData = (data: any[]): RepData[] => {
      const repMap = new Map<string, {
        rep: string;
        spend: number;
        profit: number;
        packs: number;
        activeAccounts: Set<string>;
        totalAccounts: Set<string>;
        profitPerActiveShop: number;
        profitPerPack: number;
        activeRatio: number;
      }>();
      
      data.forEach(item => {
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
            totalAccounts: new Set(),
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
          currentRep.totalAccounts.add(item["Account Ref"]);
          if (spend > 0) {
            currentRep.activeAccounts.add(item["Account Ref"]);
          }
        }
        
        repMap.set(repName, currentRep);
      });
      
      return Array.from(repMap.values()).map(rep => {
        const margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
        
        return {
          rep: rep.rep,
          spend: rep.spend,
          profit: rep.profit,
          margin: margin,
          packs: rep.packs,
          activeAccounts: rep.activeAccounts.size,
          totalAccounts: rep.totalAccounts.size,
          profitPerActiveShop: rep.profitPerActiveShop,
          profitPerPack: rep.profitPerPack,
          activeRatio: rep.activeRatio
        };
      });
    };
    
    // Process all data sets
    const aprRetailData = processData(retailData);
    const aprRevaData = processData(revaData);
    const aprWholesaleData = processData(wholesaleData);
    
    const marchRetailRepData = processData(marchRetailData);
    const marchRevaRepData = processData(marchRevaData);
    const marchWholesaleRepData = processData(marchWholesaleData);
    
    // Calculate summaries - April
    const aprRetailSummary = calculateSummaryFromData(aprRetailData);
    const aprRevaSummary = calculateSummaryFromData(aprRevaData);
    const aprWholesaleSummary = calculateSummaryFromData(aprWholesaleData);
    
    // Calculate summaries - March
    const marchRetailSummary = calculateSummaryFromData(marchRetailRepData);
    const marchRevaSummary = calculateSummaryFromData(marchRevaRepData);
    const marchWholesaleSummary = calculateSummaryFromData(marchWholesaleRepData);
    
    // Calculate percentage changes between February and March
    const summaryChanges = {
      totalSpend: 0,
      totalProfit: 0,
      averageMargin: 0,
      totalPacks: 0,
      totalAccounts: 0,
      activeAccounts: 0
    };

    // Calculate rep-level changes
    const repChanges = {};
    
    return {
      repData: aprRetailData,
      revaData: aprRevaData,
      wholesaleData: aprWholesaleData,
      baseSummary: aprRetailSummary,
      revaValues: aprRevaSummary,
      wholesaleValues: aprWholesaleSummary,
      
      febRepData: marchRetailRepData,
      febRevaData: marchRevaRepData,
      febWholesaleData: marchWholesaleRepData,
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
