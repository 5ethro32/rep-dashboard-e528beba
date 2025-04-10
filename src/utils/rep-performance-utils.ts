
export const calculateSummary = (
  baseSummary: {
    totalSpend: number;
    totalProfit: number;
    totalPacks: number;
    totalAccounts: number;
    activeAccounts: number;
    averageMargin: number;
  },
  revaValues: {
    totalSpend: number;
    totalProfit: number;
    totalPacks: number;
    totalAccounts: number;
    activeAccounts: number;
    averageMargin: number;
  },
  wholesaleValues: {
    totalSpend: number;
    totalProfit: number;
    totalPacks: number;
    totalAccounts: number;
    activeAccounts: number;
    averageMargin: number;
  },
  includeRetail: boolean,
  includeReva: boolean,
  includeWholesale: boolean
) => {
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  let totalAccounts = 0;
  let activeAccounts = 0;
  
  // Add base (retail) values if toggle is on
  if (includeRetail && baseSummary) {
    console.log("Adding Retail values:", baseSummary);
    totalSpend += baseSummary.totalSpend || 0;
    totalProfit += baseSummary.totalProfit || 0;
    totalPacks += baseSummary.totalPacks || 0;
    totalAccounts += baseSummary.totalAccounts || 0;
    activeAccounts += baseSummary.activeAccounts || 0;
  }
  
  // Add REVA values if toggle is on
  if (includeReva && revaValues) {
    console.log("Adding REVA values:", revaValues);
    totalSpend += revaValues.totalSpend || 0;
    totalProfit += revaValues.totalProfit || 0;
    totalPacks += revaValues.totalPacks || 0;
    totalAccounts += revaValues.totalAccounts || 0;
    activeAccounts += revaValues.activeAccounts || 0;
  }
  
  // Add Wholesale values if toggle is on
  if (includeWholesale && wholesaleValues) {
    console.log("Adding Wholesale values:", wholesaleValues);
    totalSpend += wholesaleValues.totalSpend || 0;
    totalProfit += wholesaleValues.totalProfit || 0;
    totalPacks += wholesaleValues.totalPacks || 0;
    totalAccounts += wholesaleValues.totalAccounts || 0;
    activeAccounts += wholesaleValues.activeAccounts || 0;
  }
  
  // Calculate average margin based on included values
  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
  
  const result = {
    totalSpend,
    totalProfit,
    totalPacks,
    totalAccounts,
    activeAccounts,
    averageMargin
  };
  
  console.log("Final calculated summary:", result);
  return result;
};

export const calculateDeptSummary = (departmentData: any[]): {
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
  totalAccounts: number;
  activeAccounts: number;
  averageMargin: number;
} => {
  let totalSpend = 0;
  let totalProfit = 0;
  let totalPacks = 0;
  const accountRefs = new Set<string>();
  const activeAccountRefs = new Set<string>();
  
  // Log the initial data count
  console.log(`Processing ${departmentData.length} records in calculateDeptSummary`);
  
  departmentData.forEach(item => {
    // Parse values safely, ensuring we capture all data
    const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
    const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
    const packs = typeof item.Packs === 'string' ? parseInt(item.Packs) : Number(item.Packs || 0);
    
    totalSpend += spend;
    totalProfit += profit;
    totalPacks += packs;
    
    if (item["Account Ref"]) {
      accountRefs.add(item["Account Ref"]);
      if (spend > 0) {
        activeAccountRefs.add(item["Account Ref"]);
      }
    }
  });
  
  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
  
  const result = {
    totalSpend,
    totalProfit,
    totalPacks,
    totalAccounts: accountRefs.size,
    activeAccounts: activeAccountRefs.size,
    averageMargin
  };
  
  // Log the results for debugging
  console.log(`Department Summary Results:`, result);
  
  return result;
};

export const formatCurrency = (value: number, decimals = 0) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-GB').format(value);
};
