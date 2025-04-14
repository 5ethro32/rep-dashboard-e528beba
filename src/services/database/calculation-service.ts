import { RepData, SummaryData } from '@/types/rep-performance.types';

export const calculateTotalProfit = (data: any[]): number => {
  return data.reduce((sum, item) => {
    const profit = typeof item.Profit === 'string' 
      ? parseFloat(item.Profit) 
      : Number(item.Profit || 0);
    return sum + profit;
  }, 0);
};

export const calculateSummaryChanges = (
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

export const calculateRepChanges = (
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
