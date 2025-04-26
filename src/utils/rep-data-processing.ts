import { RepData, SalesDataItem, SummaryData } from "@/types/rep-performance.types";

export const processRepData = (salesData: SalesDataItem[]): RepData[] => {
  const repGrouped: Record<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }> = {};
  
  console.log(`Processing ${salesData.length} raw sales data items`);
  
  salesData.forEach(item => {
    // Use rep_name for consistency
    const repName = item.rep_name;
    
    if (!repGrouped[repName]) {
      repGrouped[repName] = {
        rep: repName,
        spend: 0,
        profit: 0,
        packs: 0,
        activeAccounts: new Set(),
        totalAccounts: new Set(),
      };
    }
    
    const spend = Number(item.spend) || 0;
    const profit = Number(item.profit) || 0;
    const packs = Number(item.packs) || 0;
    
    repGrouped[repName].spend += spend;
    repGrouped[repName].profit += profit;
    repGrouped[repName].packs += packs;
    
    if (spend > 0) {
      repGrouped[repName].activeAccounts.add(item.account_ref);
    }
    repGrouped[repName].totalAccounts.add(item.account_ref);
  });
  
  const result = Object.values(repGrouped).map(rep => {
    const spend = rep.spend;
    const profit = rep.profit;
    const packs = rep.packs;
    const activeAccounts = rep.activeAccounts.size;
    const totalAccounts = rep.totalAccounts.size;
    
    return {
      rep: rep.rep,
      spend: spend,
      profit: profit,
      margin: spend > 0 ? (profit / spend) * 100 : 0,
      packs: packs,
      activeAccounts: activeAccounts,
      totalAccounts: totalAccounts,
      profitPerActiveShop: activeAccounts > 0 ? profit / activeAccounts : 0,
      profitPerPack: packs > 0 ? profit / packs : 0,
      activeRatio: totalAccounts > 0 ? (activeAccounts / totalAccounts) * 100 : 0
    };
  });
  
  const filteredResult = result.filter(rep => {
    // Filter out reps with zero metrics (all values are zero)
    return rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0;
  });
  
  console.log(`Processed data into ${result.length} rep records, ${filteredResult.length} after filtering zero records`);
  if (filteredResult.length > 0) {
    console.log('Sample processed rep data:', filteredResult[0]);
  }
  
  return filteredResult;
};

export const calculateSummaryFromData = (repData: RepData[]): SummaryData => {
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  let totalActiveAccounts = 0;
  let totalAccounts = 0;
  
  repData.forEach(rep => {
    totalSpend += rep.spend;
    totalProfit += rep.profit;
    totalPacks += rep.packs;
    totalActiveAccounts += rep.activeAccounts;
    totalAccounts += rep.totalAccounts;
  });
  
  const summary = {
    totalSpend,
    totalProfit,
    totalPacks,
    totalAccounts,
    activeAccounts: totalActiveAccounts,
    averageMargin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0
  };
  
  console.log('Calculated summary:', summary);
  return summary;
};

export const getCombinedRepData = (
  retailData: RepData[],
  revaData: RepData[],
  wholesaleData: RepData[],
  includeRetailData: boolean,
  includeRevaData: boolean,
  includeWholesaleData: boolean
): RepData[] => {
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }>();
  
  if (includeRetailData) {
    console.log("Including Retail data in combined data");
    
    retailData.forEach(rep => {
      repMap.set(rep.rep, {
        rep: rep.rep,
        spend: rep.spend,
        profit: rep.profit,
        packs: rep.packs,
        activeAccounts: new Set(Array(rep.activeAccounts).fill(null).map((_, i) => `retail_${rep.rep}_${i}`)),
        totalAccounts: new Set(Array(rep.totalAccounts).fill(null).map((_, i) => `retail_${rep.rep}_${i}`))
      });
    });
  }
  
  console.log("Starting combined data processing. Rep count:", repMap.size);
  
  if (includeRevaData) {
    console.log("Including REVA data in combined data");
    
    revaData.forEach(rep => {
      if (rep.rep === 'REVA') {
        return;
      }
      
      if (!repMap.has(rep.rep)) {
        repMap.set(rep.rep, {
          rep: rep.rep,
          spend: 0,
          profit: 0,
          packs: 0,
          activeAccounts: new Set(),
          totalAccounts: new Set()
        });
      }
      
      const repData = repMap.get(rep.rep)!;
      repData.spend += rep.spend;
      repData.profit += rep.profit;
      repData.packs += rep.packs;
      
      const revaActiveAccounts = Array(rep.activeAccounts).fill(null)
        .map((_, i) => `reva_${rep.rep}_${i}`);
      const revaTotalAccounts = Array(rep.totalAccounts).fill(null)
        .map((_, i) => `reva_${rep.rep}_${i}`);
        
      revaActiveAccounts.forEach(account => repData.activeAccounts.add(account));
      revaTotalAccounts.forEach(account => repData.totalAccounts.add(account));
    });
  }
  
  if (includeWholesaleData) {
    console.log("Including Wholesale data in combined data");
    
    wholesaleData.forEach(rep => {
      if (rep.rep === 'Wholesale') {
        return;
      }
      
      if (!repMap.has(rep.rep)) {
        repMap.set(rep.rep, {
          rep: rep.rep,
          spend: 0,
          profit: 0,
          packs: 0,
          activeAccounts: new Set(),
          totalAccounts: new Set()
        });
      }
      
      const repData = repMap.get(rep.rep)!;
      repData.spend += rep.spend;
      repData.profit += rep.profit;
      repData.packs += rep.packs;
      
      const wholesaleActiveAccounts = Array(rep.activeAccounts).fill(null)
        .map((_, i) => `wholesale_${rep.rep}_${i}`);
      const wholesaleTotalAccounts = Array(rep.totalAccounts).fill(null)
        .map((_, i) => `wholesale_${rep.rep}_${i}`);
        
      wholesaleActiveAccounts.forEach(account => repData.activeAccounts.add(account));
      wholesaleTotalAccounts.forEach(account => repData.totalAccounts.add(account));
    });
  }
  
  const combinedData: RepData[] = Array.from(repMap.values()).map(rep => {
    return {
      rep: rep.rep,
      spend: rep.spend,
      profit: rep.profit,
      margin: rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0,
      packs: rep.packs,
      activeAccounts: rep.activeAccounts.size,
      totalAccounts: rep.totalAccounts.size,
      profitPerActiveShop: rep.activeAccounts.size > 0 ? rep.profit / rep.activeAccounts.size : 0,
      profitPerPack: rep.packs > 0 ? rep.profit / rep.packs : 0,
      activeRatio: rep.totalAccounts.size > 0 ? (rep.activeAccounts.size / rep.totalAccounts.size) * 100 : 0
    };
  });
  
  // Filter out reps with zero metrics
  const filteredCombinedData = combinedData.filter(rep => {
    return (rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0) 
      && rep.rep !== 'ALL_RECORDS'; // Also exclude the ALL_RECORDS entry
  });
  
  console.log("Final combined data length:", combinedData.length, "filtered length:", filteredCombinedData.length);
  return filteredCombinedData;
};

export const sortRepData = (data: RepData[], sortBy: string, sortOrder: string): RepData[] => {
  return [...data].sort((a, b) => {
    const aValue = a[sortBy as keyof RepData] as number;
    const bValue = b[sortBy as keyof RepData] as number;
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const calculateRawMtdSummary = (rawData: any[]): SummaryData => {
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  const accountRefs = new Set<string>();
  const activeAccountRefs = new Set<string>();
  
  // Process each record directly without filtering
  rawData.forEach(item => {
    // Parse numeric values
    const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
    const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
    const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
    
    // Add to totals
    totalSpend += spend;
    totalProfit += profit;
    totalPacks += packs;
    
    // Track accounts
    if (item["Account Ref"]) {
      accountRefs.add(item["Account Ref"]);
      if (spend > 0) {
        activeAccountRefs.add(item["Account Ref"]);
      }
    }
  });
  
  console.log('Raw MTD Summary Calculation:', {
    totalSpend,
    totalProfit,
    totalPacks,
    accountsCount: accountRefs.size,
    activeAccountsCount: activeAccountRefs.size
  });
  
  return {
    totalSpend,
    totalProfit,
    totalPacks,
    totalAccounts: accountRefs.size,
    activeAccounts: activeAccountRefs.size,
    averageMargin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0
  };
};
