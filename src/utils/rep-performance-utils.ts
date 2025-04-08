
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
  includeReva: boolean,
  includeWholesale: boolean
) => {
  // Start with retail values (base without reva and wholesale)
  let totalSpend = baseSummary.totalSpend;
  let totalProfit = baseSummary.totalProfit;
  let totalPacks = baseSummary.totalPacks;
  let totalAccounts = baseSummary.totalAccounts;
  let activeAccounts = baseSummary.activeAccounts;
  
  // Add REVA values if toggle is on
  if (includeReva) {
    totalSpend += revaValues.totalSpend;
    totalProfit += revaValues.totalProfit;
    totalPacks += revaValues.totalPacks;
    totalAccounts += revaValues.totalAccounts;
    activeAccounts += revaValues.activeAccounts;
  }
  
  // Add Wholesale values if toggle is on
  if (includeWholesale) {
    totalSpend += wholesaleValues.totalSpend;
    totalProfit += wholesaleValues.totalProfit;
    totalPacks += wholesaleValues.totalPacks;
    totalAccounts += wholesaleValues.totalAccounts;
    activeAccounts += wholesaleValues.activeAccounts;
  }
  
  // Calculate average margin based on included values
  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
  
  return {
    totalSpend,
    totalProfit,
    totalPacks,
    totalAccounts,
    activeAccounts,
    averageMargin
  };
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
