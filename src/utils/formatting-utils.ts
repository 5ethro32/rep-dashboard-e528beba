
/**
 * Utility functions for formatting values in the application
 */

/**
 * Format a number as currency with pound symbol
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Format a number as percentage with % symbol
 */
export const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100); // Division by 100 to convert percentage value to decimal
};

/**
 * Format a number with thousand separators
 */
export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-GB').format(value);
};

/**
 * Calculate usage-weighted metrics using correct formulas
 * @param items Array of items with price, cost and usage data
 * @returns Object containing calculated metrics
 */
export const calculateUsageWeightedMetrics = (items: any[]) => {
  // Initialize result with default values for both current and proposed metrics
  const result = {
    // Current metrics (based on current REVA Price)
    totalRevenue: 0,
    totalProfit: 0,
    totalUsage: 0,
    weightedMargin: 0,
    
    // Proposed metrics (based on proposed Price)
    proposedRevenue: 0,
    proposedProfit: 0,
    proposedWeightedMargin: 0,
    
    // Comparison metrics
    marginImprovement: 0,
    
    // Distribution metrics
    marginDistribution: [
      { name: '<5%', value: 0, color: '#ef4444', profit: 0 }, // Red
      { name: '5-10%', value: 0, color: '#f97316', profit: 0 }, // Orange
      { name: '10-15%', value: 0, color: '#eab308', profit: 0 }, // Yellow
      { name: '15-20%', value: 0, color: '#84cc16', profit: 0 }, // Light Green
      { name: '20%+', value: 0, color: '#22c55e', profit: 0 }  // Green
    ],
    validItemCount: 0,
    
    // Debug information for troubleshooting
    itemsWithNegativeMargin: 0,
    totalNegativeProfit: 0
  };
  
  if (!items || items.length === 0) {
    return result;
  }

  // For debugging purposes
  console.log(`Processing ${items.length} items for usage-weighted metrics`);
  
  // Track items with negative margins for debugging
  const negativeMarginItems: any[] = [];
  
  // Process each item with validation to ensure no negative values
  items.forEach((item, index) => {
    // Basic data validation - ensure we have all required fields with valid numeric values
    const usage = Math.max(0, Number(item.revaUsage) || 0); // Ensure non-negative usage
    const currentPrice = Math.max(0, Number(item.currentREVAPrice) || 0); // Ensure non-negative price
    const avgCost = Math.max(0, Number(item.avgCost) || 0); // Ensure non-negative cost
    
    const isValidUsage = usage > 0;
    const isValidPrice = currentPrice > 0;
    const isValidCost = !isNaN(avgCost);
    
    // Skip items with invalid data
    if (!isValidUsage || !isValidPrice || !isValidCost) {
      // For debugging
      if (index < 5) {
        console.log(`Skipping item due to invalid data: ${JSON.stringify({
          id: item.id,
          description: item.description,
          usage,
          currentPrice,
          avgCost,
          isValidUsage,
          isValidPrice,
          isValidCost
        })}`);
      }
      return;
    }
    
    // Calculate current revenue and profit - USING CORRECT FORMULA: price - cost
    const currentRevenue = usage * currentPrice;
    const currentProfit = usage * (currentPrice - avgCost); // FIX: Ensure price - cost (not cost - price)
    
    // Current margin as percentage - always ensure it's based on price division
    const currentMargin = currentPrice > 0 ? ((currentPrice - avgCost) / currentPrice) * 100 : 0;
    
    // Track negative margin items for debugging
    if (currentMargin < 0) {
      if (negativeMarginItems.length < 10) {
        negativeMarginItems.push({
          description: item.description,
          usage,
          currentPrice,
          avgCost,
          currentMargin,
          impact: currentProfit
        });
      }
      result.itemsWithNegativeMargin++;
      result.totalNegativeProfit += currentProfit;
    }
    
    // Accumulate totals for current pricing
    result.totalRevenue += currentRevenue;
    result.totalProfit += currentProfit;
    result.totalUsage += usage;
    result.validItemCount++;
    
    // Calculate proposed values if available
    const proposedPrice = Math.max(0, Number(item.proposedPrice) || 0); // Ensure non-negative
    const isValidProposedPrice = proposedPrice > 0;
    
    if (isValidProposedPrice) {
      const proposedRevenue = usage * proposedPrice;
      const proposedProfit = usage * (proposedPrice - avgCost); // FIX: Ensure price - cost
      
      result.proposedRevenue += proposedRevenue;
      result.proposedProfit += proposedProfit;
    }
    
    // Categorize for margin distribution (using current values)
    // Use absolute value for margin percentage to categorize
    const marginForDistribution = Math.max(0, currentMargin); // Only use positive margins for distribution
    
    if (marginForDistribution < 5) {
      result.marginDistribution[0].value += 1;
      result.marginDistribution[0].profit += currentProfit;
    } else if (marginForDistribution < 10) {
      result.marginDistribution[1].value += 1;
      result.marginDistribution[1].profit += currentProfit;
    } else if (marginForDistribution < 15) {
      result.marginDistribution[2].value += 1;
      result.marginDistribution[2].profit += currentProfit;
    } else if (marginForDistribution < 20) {
      result.marginDistribution[3].value += 1;
      result.marginDistribution[3].profit += currentProfit;
    } else {
      result.marginDistribution[4].value += 1;
      result.marginDistribution[4].profit += currentProfit;
    }
  });
  
  // Calculate usage-weighted margin percentages for current pricing
  if (result.totalRevenue > 0) {
    // FIX: This is the key formula that needs to be correct
    result.weightedMargin = (result.totalProfit / result.totalRevenue) * 100;
  }
  
  // Calculate usage-weighted margin percentages for proposed pricing
  if (result.proposedRevenue > 0) {
    result.proposedWeightedMargin = (result.proposedProfit / result.proposedRevenue) * 100;
    result.marginImprovement = result.proposedWeightedMargin - result.weightedMargin;
  }
  
  // For debugging
  console.log('Usage-weighted metrics calculation results:', {
    validItemCount: result.validItemCount,
    totalUsage: result.totalUsage,
    totalRevenue: result.totalRevenue,
    totalProfit: result.totalProfit,
    weightedMargin: result.weightedMargin,
    proposedRevenue: result.proposedRevenue,
    proposedProfit: result.proposedProfit,
    proposedWeightedMargin: result.proposedWeightedMargin,
    marginImprovement: result.marginImprovement,
    itemsWithNegativeMargin: result.itemsWithNegativeMargin,
    totalNegativeProfit: result.totalNegativeProfit
  });

  // Log information about negative margin items
  if (negativeMarginItems.length > 0) {
    console.log('Sample of items with negative margins that may be affecting overall metrics:', 
      negativeMarginItems);
  }
  
  // Convert margin distribution values to percentages
  result.marginDistribution = result.marginDistribution.map(band => ({
    ...band,
    value: result.validItemCount > 0 ? (band.value / result.validItemCount) * 100 : 0
  }));
  
  return result;
};
