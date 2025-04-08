
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
    if (!repGrouped[item.rep_name]) {
      repGrouped[item.rep_name] = {
        rep: item.rep_name,
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
    
    repGrouped[item.rep_name].spend += spend;
    repGrouped[item.rep_name].profit += profit;
    repGrouped[item.rep_name].packs += packs;
    
    if (spend > 0) {
      repGrouped[item.rep_name].activeAccounts.add(item.account_ref);
    }
    repGrouped[item.rep_name].totalAccounts.add(item.account_ref);
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
  
  console.log(`Processed data into ${result.length} rep records`);
  if (result.length > 0) {
    console.log('Sample processed rep data:', result[0]);
  }
  
  return result;
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
  baseRetailData: RepData[],
  baseRevaData: SalesDataItem[],
  baseWholesaleData: SalesDataItem[],
  includeRetailData: boolean,
  includeRevaData: boolean,
  includeWholesaleData: boolean
): RepData[] => {
  // Create a map to store combined data for each rep
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }>();
  
  // 1. First add retail data if included
  if (includeRetailData) {
    console.log("Including Retail data in combined data");
    
    baseRetailData.forEach(rep => {
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
  
  // 2. Process REVA data by sub_rep if included
  if (includeRevaData) {
    console.log("Including REVA data in combined data");
    
    baseRevaData.forEach(item => {
      if (!item.sub_rep) return; // Skip if no sub_rep
      const subRep = item.sub_rep;
      
      const spend = Number(item.spend) || 0;
      const profit = Number(item.profit) || 0;
      const packs = Number(item.packs) || 0;
      
      if (!repMap.has(subRep)) {
        repMap.set(subRep, {
          rep: subRep,
          spend: 0,
          profit: 0,
          packs: 0,
          activeAccounts: new Set(),
          totalAccounts: new Set()
        });
      }
      
      const repData = repMap.get(subRep)!;
      repData.spend += spend;
      repData.profit += profit;
      repData.packs += packs;
      
      if (spend > 0) {
        repData.activeAccounts.add(`reva_${item.account_ref}`);
      }
      repData.totalAccounts.add(`reva_${item.account_ref}`);
    });
  }
  
  // 3. Process WHOLESALE data by sub_rep if included
  if (includeWholesaleData) {
    console.log("Including Wholesale data in combined data");
    
    baseWholesaleData.forEach(item => {
      if (!item.sub_rep) return; // Skip if no sub_rep
      const subRep = item.sub_rep;
      
      const spend = Number(item.spend) || 0;
      const profit = Number(item.profit) || 0;
      const packs = Number(item.packs) || 0;
      
      if (!repMap.has(subRep)) {
        repMap.set(subRep, {
          rep: subRep,
          spend: 0,
          profit: 0,
          packs: 0,
          activeAccounts: new Set(),
          totalAccounts: new Set()
        });
      }
      
      const repData = repMap.get(subRep)!;
      repData.spend += spend;
      repData.profit += profit;
      repData.packs += packs;
      
      if (spend > 0) {
        repData.activeAccounts.add(`wholesale_${item.account_ref}`);
      }
      repData.totalAccounts.add(`wholesale_${item.account_ref}`);
    });
  }
  
  // Convert the map to an array of RepData objects
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
  
  console.log("Final combined data length:", combinedData.length);
  return combinedData;
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
