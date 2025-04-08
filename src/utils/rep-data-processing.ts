
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
    
    repGrouped[item.rep_name].spend += Number(item.spend) || 0;
    repGrouped[item.rep_name].profit += Number(item.profit) || 0;
    repGrouped[item.rep_name].packs += Number(item.packs) || 0;
    
    if (Number(item.spend) > 0) {
      repGrouped[item.rep_name].activeAccounts.add(item.account_ref);
    }
    repGrouped[item.rep_name].totalAccounts.add(item.account_ref);
  });
  
  return Object.values(repGrouped).map(rep => {
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
  
  return {
    totalSpend,
    totalProfit,
    totalPacks,
    totalAccounts,
    activeAccounts: totalActiveAccounts,
    averageMargin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0
  };
};

export const getCombinedRepData = (
  baseRepData: RepData[],
  baseRevaData: RepData[],
  baseWholesaleData: RepData[],
  includeRetailData: boolean,
  includeRevaData: boolean,
  includeWholesaleData: boolean
): RepData[] => {
  let combinedData: RepData[] = [];
  
  if (includeRetailData) {
    console.log("Including Retail data in combined data");
    combinedData = JSON.parse(JSON.stringify(baseRepData));
  }
  
  console.log("Starting combined data with retail data:", combinedData.length);
  
  if (includeRevaData) {
    console.log("Including REVA data in combined data");
    baseRevaData.forEach(revaItem => {
      const repIndex = combinedData.findIndex((rep) => rep.rep === revaItem.rep);
      
      if (repIndex >= 0) {
        const rep = combinedData[repIndex];
        rep.spend += revaItem.spend;
        rep.profit += revaItem.profit;
        rep.packs += revaItem.packs;
        
        rep.margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
        
        rep.activeAccounts += revaItem.activeAccounts || 0;
        rep.profitPerActiveShop = rep.activeAccounts > 0 ? rep.profit / rep.activeAccounts : 0;
        
        rep.totalAccounts += revaItem.totalAccounts || 0;
        rep.activeRatio = rep.totalAccounts > 0 ? (rep.activeAccounts / rep.totalAccounts) * 100 : 0;
        
        if (rep.packs > 0) {
          rep.profitPerPack = rep.profit / rep.packs;
        }
      } else {
        if (revaItem.rep !== "REVA" && revaItem.rep !== "Reva") {
          combinedData.push(revaItem);
        }
      }
    });
  }
  
  if (includeWholesaleData) {
    console.log("Including Wholesale data in combined data");
    baseWholesaleData.forEach(wholesaleItem => {
      const repIndex = combinedData.findIndex((rep) => rep.rep === wholesaleItem.rep);
      
      if (repIndex >= 0) {
        const rep = combinedData[repIndex];
        rep.spend += wholesaleItem.spend;
        rep.profit += wholesaleItem.profit;
        rep.packs += wholesaleItem.packs;
        
        rep.margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
        
        rep.activeAccounts += wholesaleItem.activeAccounts || 0;
        rep.profitPerActiveShop = rep.activeAccounts > 0 ? rep.profit / rep.activeAccounts : 0;
        
        rep.totalAccounts += wholesaleItem.totalAccounts || 0;
        rep.activeRatio = rep.totalAccounts > 0 ? (rep.activeAccounts / rep.totalAccounts) * 100 : 0;
        
        if (rep.packs > 0) {
          rep.profitPerPack = rep.profit / rep.packs;
        }
      } else {
        if (wholesaleItem.rep !== "WHOLESALE" && wholesaleItem.rep !== "Wholesale") {
          combinedData.push(wholesaleItem);
        }
      }
    });
  }
  
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
