import { SalesDataItem, RepData, SummaryData, RepChangesRecord } from '@/types/rep-performance.types';

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

export const calculateRawMtdSummary = (data: any[], month?: string): SummaryData => {
  console.log(`Starting calculateRawMtdSummary for ${month || 'unknown month'} with ${data.length} records`);
  
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  let totalAccounts = 0;
  let activeAccounts = 0;
  const accountSet = new Set<string>();
  const activeAccountSet = new Set<string>();
  
  // Only apply special handling for February data
  const isFebruaryData = month === 'February';
  
  if (isFebruaryData) {
    console.log("February data handling enabled - implementing special processing for February raw summary data");
  }
  
  // Track processed items to avoid double counting in February data
  const processedEntries = new Set<string>();
  
  // Sample logging to help diagnose data structure issues
  if (data.length > 0) {
    const sampleEntry = data[0];
    console.log(`Sample ${month || 'unknown'} data entry fields:`, Object.keys(sampleEntry));
    console.log(`Sample values: Spend=${getFieldValue(sampleEntry, 'Spend')}, Profit=${getFieldValue(sampleEntry, 'Profit')}`);
  }
  
  data.forEach((item, index) => {
    // For February data, avoid double-counting entries where Rep is a department and there's a Sub-Rep
    if (isFebruaryData) {
      const mainRep = item.Rep || '';
      const subRep = item['Sub-Rep'] || '';
      const accountRef = item['Account Ref'] || '';
      const entryId = `${accountRef}-${index}`;
      
      // Skip if this entry combination has already been processed
      // or if it's a department-level entry with Sub-Rep already counted
      if (processedEntries.has(entryId) || 
          (['RETAIL', 'REVA', 'Wholesale', 'WHOLESALE'].includes(mainRep) && 
           subRep && subRep.trim() !== '' && subRep.trim().toUpperCase() !== 'NONE')) {
        return;
      }
      
      processedEntries.add(entryId);
    }
    
    // Enhanced field extraction with better error handling and logging
    const spend = extractNumericValue(item, ['Spend', 'spend']);
    const profit = extractNumericValue(item, ['Profit', 'profit']);
    const packs = extractNumericValue(item, ['Packs', 'packs']);
    
    // Account reference can be in different formats based on the month's data
    const accountRef = getFieldValue(item, 'account_ref') || 
                      getFieldValue(item, 'Account Ref') || 
                      getFieldValue(item, 'ACCOUNT REF');
    
    // Add to overall totals
    totalSpend += spend;
    totalProfit += profit;
    totalPacks += packs;
    
    // Track accounts
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
  
  // Log summary for verification
  console.log(`Raw MTD Summary ${month || "unknown month"}:`, {
    totalSpend,
    totalProfit,
    totalPacks,
    totalAccounts,
    activeAccounts,
    averageMargin
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

// Helper function to get field value with consistent casing handling
function getFieldValue(record: any, fieldName: string): any {
  if (!record) return null;
  
  // Try all possible case variations
  const variants = [
    fieldName,                                        // original
    fieldName.toUpperCase(),                          // UPPERCASE
    fieldName.toLowerCase(),                          // lowercase
    fieldName.charAt(0).toUpperCase() + fieldName.slice(1), // Capitalized
    // Handle special column naming for specific tables
    fieldName === 'account_ref' ? 'Account Ref' : null,
    fieldName === 'Account Ref' ? 'account_ref' : null,
    fieldName === 'rep_name' ? 'Rep' : null,
    fieldName === 'Rep' ? 'rep_name' : null,
    fieldName === 'sub_rep' ? 'Sub-Rep' : null,
    fieldName === 'Sub-Rep' ? 'sub_rep' : null
  ].filter(Boolean); // Remove null values
  
  // Try each variant
  for (const variant of variants) {
    if (record[variant] !== undefined) {
      return record[variant];
    }
  }
  
  return null;
}

// Improved function to extract numeric values with consistent handling across tables
function extractNumericValue(item: any, fieldNames: string[]): number {
  if (!item) return 0;
  
  // Try each field name (and its case variations)
  for (const fieldName of fieldNames) {
    const value = getFieldValue(item, fieldName);
    if (value !== undefined && value !== null) {
      // Convert to number consistently
      return typeof value === 'string' ? parseFloat(value) : Number(value || 0);
    }
  }
  
  return 0;
}
