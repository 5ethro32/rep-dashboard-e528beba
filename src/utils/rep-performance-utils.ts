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

/**
 * Calculate goals based on previous month performance with a growth factor
 * @param matchName Name to match in the data (rep name or 'all' for all data)
 * @param isAllData Whether this is for all data or a specific rep
 * @returns Object with calculated goals
 */
export const calculateGoals = async (matchName: string, isAllData: boolean) => {
  try {
    // Default goals in case we can't fetch previous month data
    const defaultGoals = {
      profit: 100000,
      margin: 30,
      activeRatio: 75,
      accounts: 20
    };
    
    // Growth factor - 10% increase over previous month
    const growthFactor = 1.1;
    
    if (!matchName) {
      console.log("No match name provided, using default goals");
      return defaultGoals;
    }
    
    // Import supabase client directly here to prevent circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    let query;
    
    // For all data, get overall metrics
    if (isAllData) {
      console.log("Fetching previous month data for all reps");
      query = supabase.from('mtd_daily').select('*');
    } else {
      // For a specific rep, get their data
      console.log(`Fetching previous month data for rep: ${matchName}`);
      query = supabase
        .from('mtd_daily')
        .select('*')
        .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching previous month data:", error);
      return defaultGoals;
    }
    
    if (!data || data.length === 0) {
      console.log("No previous month data found, using default goals");
      return defaultGoals;
    }
    
    console.log(`Found ${data.length} records for previous month`);
    
    // Calculate metrics from previous month data
    let totalProfit = 0;
    let totalSpend = 0;
    let accountSet = new Set();
    let activeAccountSet = new Set();
    
    data.forEach(item => {
      const profit = typeof item.Profit === 'number' ? item.Profit : 0;
      const spend = typeof item.Spend === 'number' ? item.Spend : 0;
      const accountRef = item['Account Ref'] || '';
      
      totalProfit += profit;
      totalSpend += spend;
      
      if (accountRef) {
        accountSet.add(accountRef);
        if (spend > 0) {
          activeAccountSet.add(accountRef);
        }
      }
    });
    
    const margin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
    const activeRatio = accountSet.size > 0 ? (activeAccountSet.size / accountSet.size) * 100 : 0;
    
    // Calculate goals with growth factor
    const calculatedGoals = {
      profit: Math.round(totalProfit * growthFactor),
      margin: Math.round(margin * growthFactor * 10) / 10,
      activeRatio: Math.round(activeRatio * growthFactor * 10) / 10,
      accounts: Math.round(accountSet.size * growthFactor)
    };
    
    console.log("Previous month metrics:", {
      profit: totalProfit,
      margin: margin,
      activeRatio: activeRatio,
      accounts: accountSet.size
    });
    console.log("Calculated goals with growth factor:", calculatedGoals);
    
    // If any values are too small or zero, use default values
    return {
      profit: calculatedGoals.profit > 5000 ? calculatedGoals.profit : defaultGoals.profit,
      margin: calculatedGoals.margin > 5 ? calculatedGoals.margin : defaultGoals.margin,
      activeRatio: calculatedGoals.activeRatio > 10 ? calculatedGoals.activeRatio : defaultGoals.activeRatio,
      accounts: calculatedGoals.accounts > 5 ? calculatedGoals.accounts : defaultGoals.accounts
    };
  } catch (error) {
    console.error("Error calculating goals:", error);
    return {
      profit: 100000,
      margin: 30,
      activeRatio: 75,
      accounts: 20
    };
  }
};
