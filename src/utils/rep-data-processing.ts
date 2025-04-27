import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';

export function processRepData(data: SalesDataItem[]): RepData[] {
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }>();

  data.forEach(item => {
    // Prioritize different possible rep name fields
    // Access only properties that exist in the SalesDataItem type
    const repName = 
      item.rep_name || 
      item.sub_rep || 
      'Unknown';
    
    const spend = Number(item.spend) || 0;
    const profit = Number(item.profit) || 0;
    const packs = Number(item.packs) || 0;
    const accountRef = item.account_ref || 'Unknown';

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
    currentRep.totalAccounts.add(accountRef);
    if (spend > 0) {
      currentRep.activeAccounts.add(accountRef);
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

export const getCombinedRepData = (
  repData: RepData[],
  revaData: RepData[],
  wholesaleData: RepData[],
  includeRetail: boolean,
  includeReva: boolean,
  includeWholesale: boolean
): RepData[] => {
  const combinedDataMap = new Map<string, RepData>();

  const addDataToMap = (data: RepData[], include: boolean) => {
    if (!include) return;

    data.forEach(item => {
      if (combinedDataMap.has(item.rep)) {
        const existingItem = combinedDataMap.get(item.rep)!;
        combinedDataMap.set(item.rep, {
          ...existingItem,
          spend: existingItem.spend + item.spend,
          profit: existingItem.profit + item.profit,
          packs: existingItem.packs + item.packs,
          activeAccounts: existingItem.activeAccounts + item.activeAccounts,
          totalAccounts: existingItem.totalAccounts + item.totalAccounts,
          margin: (existingItem.spend + item.spend) > 0 ? ((existingItem.profit + item.profit) / (existingItem.spend + item.spend)) * 100 : 0,
          profitPerActiveShop: (existingItem.activeAccounts + item.activeAccounts) > 0 ? (existingItem.profit + item.profit) / (existingItem.activeAccounts + item.activeAccounts) : 0,
          profitPerPack: (existingItem.packs + item.packs) > 0 ? (existingItem.profit + item.profit) / (existingItem.packs + item.packs) : 0,
          activeRatio: (existingItem.totalAccounts + item.totalAccounts) > 0 ? ((existingItem.activeAccounts + item.activeAccounts) / (existingItem.totalAccounts + item.totalAccounts)) * 100 : 0
        });
      } else {
        combinedDataMap.set(item.rep, { ...item });
      }
    });
  };

  addDataToMap(repData, includeRetail);
  addDataToMap(revaData, includeReva);
  addDataToMap(wholesaleData, includeWholesale);

  return Array.from(combinedDataMap.values());
};

export const sortRepData = (data: RepData[], sortBy: string, sortOrder: string): RepData[] => {
  const sortedData = [...data];

  sortedData.sort((a, b) => {
    let valueA = a[sortBy as keyof RepData] as number | string;
    let valueB = b[sortBy as keyof RepData] as number | string;

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sortedData;
};

export const calculateSummaryFromData = (data: RepData[]): SummaryData => {
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  let totalAccounts = 0;
  let activeAccounts = 0;
  
  data.forEach(item => {
    totalSpend += item.spend;
    totalProfit += item.profit;
    totalPacks += item.packs;
    totalAccounts += item.totalAccounts;
    activeAccounts += item.activeAccounts;
  });
  
  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
  
  return {
    totalSpend,
    totalProfit,
    totalPacks,
    averageMargin,
    totalAccounts,
    activeAccounts
  };
};

export const calculateSummary = (
  retailValues: SummaryData,
  revaValues: SummaryData,
  wholesaleValues: SummaryData,
  includeRetail: boolean,
  includeReva: boolean,
  includeWholesale: boolean
): SummaryData => {
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  let totalAccounts = 0;
  let activeAccounts = 0;

  if (includeRetail) {
    totalSpend += retailValues.totalSpend;
    totalProfit += retailValues.totalProfit;
    totalPacks += retailValues.totalPacks;
    totalAccounts += retailValues.totalAccounts;
    activeAccounts += retailValues.activeAccounts;
  }

  if (includeReva) {
    totalSpend += revaValues.totalSpend;
    totalProfit += revaValues.totalProfit;
    totalPacks += revaValues.totalPacks;
    totalAccounts += revaValues.totalAccounts;
    activeAccounts += revaValues.activeAccounts;
  }

  if (includeWholesale) {
    totalSpend += wholesaleValues.totalSpend;
    totalProfit += wholesaleValues.totalProfit;
    totalPacks += wholesaleValues.totalPacks;
    totalAccounts += wholesaleValues.totalAccounts;
    activeAccounts += wholesaleValues.activeAccounts;
  }

  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;

  return {
    totalSpend,
    totalProfit,
    totalPacks,
    averageMargin,
    totalAccounts,
    activeAccounts
  };
};

export const calculateRawMtdSummary = (data: any[]): SummaryData => {
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  let totalAccounts = 0;
  let activeAccounts = 0;
  const accountSet = new Set<string>();
  const activeAccountSet = new Set<string>();
  
  data.forEach(item => {
    const spend = Number(item.Spend || item.spend) || 0;
    const profit = Number(item.Profit || item.profit) || 0;
    const packs = Number(item.Packs || item.packs) || 0;
    const accountRef = item["Account Ref"] || item.account_ref;
    
    totalSpend += spend;
    totalProfit += profit;
    totalPacks += packs;
    
    if (accountRef) {
      accountSet.add(accountRef);
      totalAccounts = accountSet.size;
      if (spend > 0) {
        activeAccountSet.add(accountRef);
        activeAccounts = activeAccountSet.size;
      }
    }
  });
  
  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
  
  return {
    totalSpend,
    totalProfit,
    totalPacks,
    averageMargin,
    totalAccounts,
    activeAccounts
  };
};

export function processRawData(rawData: any[]): RepData[] {
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }>();

  rawData.forEach(item => {
    const spend = extractNumericValue(item, ['Spend', 'spend']);
    const profit = extractNumericValue(item, ['Profit', 'profit']);
    const packs = extractNumericValue(item, ['Packs', 'packs']);
    const accountRef = item["Account Ref"] || item.account_ref;
    
    let repName;
    const subRep = item['Sub-Rep'] || item.sub_rep;
    const mainRep = item.Rep || item.rep_name;
    
    if (subRep && subRep.trim() !== '' && subRep.trim().toUpperCase() !== 'NONE') {
      repName = subRep;
    } else if (mainRep === 'REVA' || mainRep === 'Wholesale' || mainRep === 'WHOLESALE') {
      return;
    } else {
      repName = mainRep;
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

    if (accountRef) {
      currentRep.totalAccounts.add(accountRef);
      if (spend > 0) {
        currentRep.activeAccounts.add(accountRef);
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

  return repDataArray;
}

function extractNumericValue(item: any, fieldNames: string[]): number {
  for (const fieldName of fieldNames) {
    const value = item[fieldName];
    if (value !== undefined) {
      return typeof value === 'string' ? parseFloat(value) : Number(value || 0);
    }
  }
  return 0;
}
