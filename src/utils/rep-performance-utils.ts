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
 * Calculate goals based on previous month performance with specific growth factors
 * @param matchName Name to match in the data (rep name or 'all' for all data)
 * @param isAllData Whether this is for all data or a specific rep
 * @returns Object with calculated goals
 */
export const calculateGoals = async (matchName: string, isAllData: boolean) => {
  try {
    // Default goals in case we can't fetch previous month data
    const defaultGoals = {
      profit: 100000,
      margin: 15,
      activeRatio: 75,
      packs: 5000
    };
    
    // Define growth factors for different metrics
    const profitGrowthFactor = 1.1;     // 10% increase for profit
    const activeRatioGrowthFactor = 1.1; // 10% increase for active ratio
    const packsGrowthFactor = 1.05;      // 5% increase for packs
    
    // Margin target range
    const minMarginTarget = 10;
    const maxMarginTarget = 20;
    
    if (!matchName) {
      console.log("No match name provided, using default goals");
      return defaultGoals;
    }
    
    // Import supabase client directly here to prevent circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    // First determine the current month to fetch appropriate historical data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
    
    // Map of month numbers to table names containing that month's data
    const monthToTableMap: Record<number, string> = {
      1: 'sales_data_februrary', // January data in February table (possibly mislabeled)
      2: 'sales_data_februrary',
      3: 'sales_data',
      4: 'mtd_daily',
      5: 'May_Data',
      // Add other months as they become available
    };
    
    // Get previous month's table
    const previousMonthNum = currentMonth - 1 === 0 ? 12 : currentMonth - 1;
    const previousMonthTable = monthToTableMap[previousMonthNum] || 'Prior_Month_Rolling';
    
    console.log(`Current month: ${currentMonth}, using ${previousMonthTable} for previous month data`);
    
    let data;
    let error;
    
    // FIX: Use type assertion to tell TypeScript that the table name is valid
    // For all data, get overall metrics
    if (isAllData) {
      console.log("Fetching previous month data for all reps");
      // Use type assertion to tell TypeScript we know this table exists
      const { data: resultData, error: resultError } = await supabase
        .from(previousMonthTable as any)
        .select('*');
      
      data = resultData;
      error = resultError;
    } else {
      // For a specific rep, get their data
      console.log(`Fetching previous month data for rep: ${matchName}`);
      
      // Different column names based on table structure
      if (previousMonthTable === 'sales_data') {
        const { data: resultData, error: resultError } = await supabase
          .from('sales_data')
          .select('*')
          .or(`rep_name.ilike.%${matchName}%,sub_rep.ilike.%${matchName}%`);
        
        data = resultData;
        error = resultError;
      } else {
        // FIX: Use type assertion for the dynamic table name
        const { data: resultData, error: resultError } = await supabase
          .from(previousMonthTable as any)
          .select('*')
          .or(`Rep.ilike.%${matchName}%,Sub-Rep.ilike.%${matchName}%`);
        
        data = resultData;
        error = resultError;
      }
    }
    
    if (error) {
      console.error("Error fetching previous month data:", error);
      return defaultGoals;
    }
    
    if (!data || data.length === 0) {
      console.log("No previous month data found, using default goals");
      return defaultGoals;
    }
    
    console.log(`Found ${data.length} records for previous month from ${previousMonthTable}`);
    
    // Calculate metrics from previous month data
    let totalProfit = 0;
    let totalSpend = 0;
    let totalPacks = 0;
    let accountSet = new Set();
    let activeAccountSet = new Set();
    
    data.forEach(item => {
      // Handle different column naming conventions between tables
      const profit = item.Profit !== undefined ? Number(item.Profit) : 
                    item.profit !== undefined ? Number(item.profit) : 0;
                    
      const spend = item.Spend !== undefined ? Number(item.Spend) : 
                   item.spend !== undefined ? Number(item.spend) : 0;
                   
      const packs = item.Packs !== undefined ? Number(item.Packs) : 
                   item.packs !== undefined ? Number(item.packs) : 0;
                   
      const accountRef = item['Account Ref'] || item.account_ref || '';
      
      totalProfit += profit;
      totalSpend += spend;
      totalPacks += packs;
      
      if (accountRef) {
        accountSet.add(accountRef);
        if (spend > 0) {
          activeAccountSet.add(accountRef);
        }
      }
    });
    
    const margin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
    const activeRatio = accountSet.size > 0 ? (activeAccountSet.size / accountSet.size) * 100 : 0;
    
    console.log("Previous month metrics:", {
      profit: totalProfit,
      margin: margin,
      activeRatio: activeRatio,
      packs: totalPacks
    });
    
    // Calculate targeted margin goal - aim for 10-20% range
    let marginGoal;
    if (margin < minMarginTarget) {
      // If below minimum, target the minimum plus a small improvement
      marginGoal = minMarginTarget + 2;
    } else if (margin > maxMarginTarget) {
      // If above maximum, maintain current margin
      marginGoal = margin;
    } else {
      // If within range, aim for 10% improvement but cap at max target
      const improvedMargin = margin * 1.1;
      marginGoal = Math.min(improvedMargin, maxMarginTarget);
    }
    
    // Calculate goals with appropriate growth factors
    const calculatedGoals = {
      profit: Math.round(totalProfit * profitGrowthFactor),
      margin: Math.round(marginGoal * 10) / 10, // Round to 1 decimal place
      activeRatio: Math.round(Math.min(activeRatio * activeRatioGrowthFactor, 100) * 10) / 10, // Cap at 100%
      packs: Math.round(totalPacks * packsGrowthFactor)
    };
    
    console.log("Calculated goals with growth factors:", calculatedGoals);
    
    // If any values are too small or zero, use default values
    return {
      profit: calculatedGoals.profit > 5000 ? calculatedGoals.profit : defaultGoals.profit,
      margin: calculatedGoals.margin > 5 ? calculatedGoals.margin : defaultGoals.margin,
      activeRatio: calculatedGoals.activeRatio > 10 ? calculatedGoals.activeRatio : defaultGoals.activeRatio,
      packs: calculatedGoals.packs > 100 ? calculatedGoals.packs : defaultGoals.packs
    };
  } catch (error) {
    console.error("Error calculating goals:", error);
    return {
      profit: 100000,
      margin: 15,
      activeRatio: 75,
      packs: 5000
    };
  }
};

/**
 * Checks if an account is flagged as important by admin
 * @param accountRef The account reference to check
 * @returns Promise resolving to boolean indicating if account is admin-starred
 */
export const isAdminStarredAccount = async (accountRef: string): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('admin_starred_accounts')
      .select('id')
      .eq('account_ref', accountRef)
      .single();
      
    return !!data;
  } catch (error) {
    console.error("Error checking admin starred account:", error);
    return false;
  }
};

/**
 * Checks if an account is flagged as important by the current user
 * @param accountRef The account reference to check
 * @param userId The user ID to check for
 * @returns Promise resolving to boolean indicating if account is user-starred
 */
export const isUserStarredAccount = async (accountRef: string, userId: string): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('user_starred_accounts')
      .select('id')
      .eq('account_ref', accountRef)
      .eq('user_id', userId)
      .single();
      
    return !!data;
  } catch (error) {
    console.error("Error checking user starred account:", error);
    return false;
  }
};

// Goal-related utility functions

export type GoalType = 'profit' | 'margin' | 'activeRatio' | 'packs';

export interface Goals {
  profit: number;
  margin: number;
  activeRatio: number;
  packs: number;
}

/**
 * Validates goal values to ensure they are reasonable
 * @param goals The goals object to validate
 * @returns Object with validation results and any error messages
 */
export const validateGoals = (goals: Goals): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate profit goal (should be positive and reasonable)
  if (goals.profit <= 0) {
    errors.push("Profit goal must be greater than £0");
  } else if (goals.profit > 10000000) {
    errors.push("Profit goal seems unrealistically high (max £10M)");
  }
  
  // Validate margin goal (should be between 0% and 100%)
  if (goals.margin < 0) {
    errors.push("Margin goal cannot be negative");
  } else if (goals.margin > 100) {
    errors.push("Margin goal cannot exceed 100%");
  }
  
  // Validate active ratio (should be between 0% and 100%)
  if (goals.activeRatio < 0) {
    errors.push("Active ratio goal cannot be negative");
  } else if (goals.activeRatio > 100) {
    errors.push("Active ratio goal cannot exceed 100%");
  }
  
  // Validate packs goal (should be positive and reasonable)
  if (goals.packs <= 0) {
    errors.push("Packs goal must be greater than 0");
  } else if (goals.packs > 1000000) {
    errors.push("Packs goal seems unrealistically high (max 1M)");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Applies growth percentage to existing goals
 * @param currentGoals Current goals to base growth on
 * @param growthPercent Growth percentage (e.g., 10 for 10% growth)
 * @returns New goals with growth applied
 */
export const applyGrowthToGoals = (currentGoals: Goals, growthPercent: number): Goals => {
  const growthFactor = 1 + (growthPercent / 100);
  
  return {
    profit: Math.round(currentGoals.profit * growthFactor),
    margin: Math.round(currentGoals.margin * growthFactor * 10) / 10, // Keep 1 decimal place
    activeRatio: Math.min(100, Math.round(currentGoals.activeRatio * growthFactor * 10) / 10), // Cap at 100%
    packs: Math.round(currentGoals.packs * growthFactor)
  };
};

/**
 * Formats goal values for display
 * @param goalType Type of goal to format
 * @param value Value to format
 * @returns Formatted string for display
 */
export const formatGoalValue = (goalType: GoalType, value: number): string => {
  switch (goalType) {
    case 'profit':
      return formatCurrency(value);
    case 'margin':
    case 'activeRatio':
      return `${value.toFixed(1)}%`;
    case 'packs':
      return formatNumber(value);
    default:
      return value.toString();
  }
};

/**
 * Gets goal metadata including labels and descriptions
 * @param goalType Type of goal
 * @returns Metadata object with label, description, and other info
 */
export const getGoalMetadata = (goalType: GoalType) => {
  const metadata = {
    profit: {
      label: 'Profit Goal',
      description: 'Total profit target for the period',
      unit: '£',
      placeholder: 'Enter profit target...'
    },
    margin: {
      label: 'Margin Goal',
      description: 'Target profit margin percentage',
      unit: '%', 
      placeholder: 'Enter margin target...'
    },
    activeRatio: {
      label: 'Active Accounts Ratio',
      description: 'Percentage of accounts that should be active',
      unit: '%',
      placeholder: 'Enter active ratio target...'
    },
    packs: {
      label: 'Packs Goal',
      description: 'Total number of packs target',
      unit: '',
      placeholder: 'Enter packs target...'
    }
  };
  
  return metadata[goalType];
};
