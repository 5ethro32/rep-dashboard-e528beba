
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
  let summary = {...baseSummary};
  
  if (!includeReva) {
    summary.totalSpend -= revaValues.totalSpend;
    summary.totalProfit -= revaValues.totalProfit;
    summary.totalPacks -= revaValues.totalPacks;
    summary.totalAccounts -= revaValues.totalAccounts;
    summary.activeAccounts -= revaValues.activeAccounts;
  }
  
  if (!includeWholesale) {
    summary.totalSpend -= wholesaleValues.totalSpend;
    summary.totalProfit -= wholesaleValues.totalProfit;
    summary.totalPacks -= wholesaleValues.totalPacks;
    summary.totalAccounts -= wholesaleValues.totalAccounts;
    summary.activeAccounts -= wholesaleValues.activeAccounts;
  }
  
  summary.averageMargin = summary.totalSpend > 0 ? (summary.totalProfit / summary.totalSpend) * 100 : 0;
  
  return summary;
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
