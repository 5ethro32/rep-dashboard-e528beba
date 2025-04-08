
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
  // Use base (retail) values only, no adding until we check what's included
  let totalSpend = baseSummary?.totalSpend || 0;
  let totalProfit = baseSummary?.totalProfit || 0;
  let totalPacks = baseSummary?.totalPacks || 0;
  let totalAccounts = baseSummary?.totalAccounts || 0;
  let activeAccounts = baseSummary?.activeAccounts || 0;
  
  console.log("Base Summary:", { totalSpend, totalProfit, totalPacks, totalAccounts, activeAccounts });
  
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
