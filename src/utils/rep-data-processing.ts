import { SalesDataItem, RepData, SummaryData, RepChangesRecord } from '@/types/rep-performance.types';

// Helper function to extract numeric values from different field name variations
function extractNumericValue(item: any, fieldNames: string[]): number {
  for (const fieldName of fieldNames) {
    const value = item[fieldName];
    if (value !== undefined) {
      return typeof value === 'string' ? parseFloat(value) : Number(value || 0);
    }
  }
  return 0;
}

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

  // Debug: Log the total records before filtering
  console.log('Total records before filtering:', data.length);
  
  data.forEach(item => {
    // Check both Department and rep_type fields to handle different data sources
    const department = item.Department || item.rep_type;
    
    // Skip if item represents a department summary
    if (department && ['RETAIL', 'REVA', 'Wholesale', 'WHOLESALE'].includes(department)) {
      return;
    }

    const spend = extractNumericValue(item, ['Spend', 'spend']);
    const profit = extractNumericValue(item, ['Profit', 'profit']);
    const packs = extractNumericValue(item, ['Packs', 'packs']);
    
    const accountRef = item["Account Ref"] || item.account_ref || item["ACCOUNT REF"];
    
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
  
  // Debug: Log the summary data
  console.log('Raw Summary Data:', {
    totalSpend,
    totalProfit,
    totalPacks,
    averageMargin,
    totalAccounts,
    activeAccounts
  });
  
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

  if (rawData.length > 0) {
    console.log("Sample raw data fields:", Object.keys(rawData[0]));
  }

  const processedEntries = new Set<string>();

  rawData.forEach((item, index) => {
    const spend = extractNumericValue(item, ['Spend', 'spend']);
    const profit = extractNumericValue(item, ['Profit', 'profit']);
    const packs = extractNumericValue(item, ['Packs', 'packs']);
    const accountRef = item["Account Ref"] || item.account_ref || item["ACCOUNT REF"];
    
    const entryId = `${accountRef}-${index}`;

    let repName = null;
    
    const subRep = item['Sub-Rep'] || item.sub_rep || item["SUB-REP"];
    
    const mainRep = item.Rep || item.rep || item.rep_name || item.REP;
    
    if (mainRep && ['RETAIL', 'REVA', 'Wholesale', 'WHOLESALE'].includes(mainRep) && 
        subRep && subRep.trim() !== '' && subRep.trim().toUpperCase() !== 'NONE') {
      repName = subRep.trim();
      
      // Debug Craig's data
      if (subRep.trim() === 'Craig McDowall') {
        console.log('Found Craig as Sub-Rep in:', mainRep, 'department. Data:', {
          spend,
          profit,
          packs,
          accountRef
        });
      }
      
      processedEntries.add(entryId);
    } 
    else if (!processedEntries.has(entryId) && 
             mainRep && !['RETAIL', 'REVA', 'Wholesale', 'WHOLESALE'].includes(mainRep)) {
      repName = mainRep.trim();
      
      // Debug Craig's data
      if (mainRep.trim() === 'Craig McDowall') {
        console.log('Found Craig as Main Rep. Data:', {
          spend,
          profit,
          packs,
          accountRef
        });
      }
      
      processedEntries.add(entryId);
    }

    if (!repName) {
      console.log('Skipping item without valid Rep name:', item);
      return;
    }

    repName = repName.trim();

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

  // Special debug for Craig's data
  if (repMap.has('Craig McDowall')) {
    const craigData = repMap.get('Craig McDowall')!;
    console.log('Craig McDowall processed data:', {
      profit: craigData.profit,
      spend: craigData.spend,
      packs: craigData.packs,
      totalAccounts: craigData.totalAccounts.size,
      activeAccounts: craigData.activeAccounts.size
    });
  }

  return Array.from(repMap.values()).map(rep => ({
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
  }));
}
