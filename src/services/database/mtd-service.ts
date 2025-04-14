import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { RepData, SummaryData } from '@/types/rep-performance.types';
import { saveRepPerformanceData, loadStoredRepPerformanceData } from '@/services/storage/local-storage-service';

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
    // Fetch current MTD data with increased limit
    const { data: mtdData, error: mtdError } = await supabase
      .from('mtd_daily')
      .select('*')
      .limit(2500);
      
    if (mtdError) throw new Error(`Error fetching MTD data: ${mtdError.message}`);
    
    // Fetch last MTD data for comparison with increased limit
    const { data: lastMtdData, error: lastMtdError } = await supabase
      .from('last_mtd_daily')
      .select('*')
      .limit(2500);
      
    if (lastMtdError) {
      console.error('Error fetching last MTD data:', lastMtdError);
    }
    
    console.log(`Found ${mtdData?.length || 0} total records in mtd_daily`);
    
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
