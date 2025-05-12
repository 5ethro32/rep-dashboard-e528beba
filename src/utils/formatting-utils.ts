
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
  // Initialize result with default values
  const result = {
    totalRevenue: 0,
    totalProfit: 0,
    totalUsage: 0,
    weightedMargin: 0,
    proposedRevenue: 0,
    proposedProfit: 0,
    proposedWeightedMargin: 0,
    marginImprovement: 0,
    marginDistribution: [
      { name: '<5%', value: 0, color: '#ef4444', profit: 0 }, // Red
      { name: '5-10%', value: 0, color: '#f97316', profit: 0 }, // Orange
      { name: '10-15%', value: 0, color: '#eab308', profit: 0 }, // Yellow
      { name: '15-20%', value: 0, color: '#84cc16', profit: 0 }, // Light Green
      { name: '20%+', value: 0, color: '#22c55e', profit: 0 }  // Green
    ],
    validItemCount: 0
  };
  
  if (!items || items.length === 0) {
    return result;
  }

  // For debugging purposes
  console.log(`Processing ${items.length} items for usage-weighted metrics`);
  
  // Process each item
  items.forEach((item, index) => {
    // Basic data validation - ensure we have all required fields with valid numeric values
    const usage = Number(item.revaUsage);
    const currentPrice = Number(item.currentREVAPrice);
    const avgCost = Number(item.avgCost);
    
    const isValidUsage = !isNaN(usage) && usage > 0;
    const isValidPrice = !isNaN(currentPrice) && currentPrice > 0;
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
    
    // Calculate current revenue and profit
    const currentRevenue = usage * currentPrice;
    const currentProfit = usage * (currentPrice - avgCost);
    
    // Current margin as percentage
    const currentMargin = (currentPrice - avgCost) / currentPrice * 100;
    
    // Accumulate totals
    result.totalRevenue += currentRevenue;
    result.totalProfit += currentProfit;
    result.totalUsage += usage;
    result.validItemCount++;
    
    // Calculate proposed values if available
    const proposedPrice = Number(item.proposedPrice) || currentPrice;
    const proposedRevenue = usage * proposedPrice;
    const proposedProfit = usage * (proposedPrice - avgCost);
    
    result.proposedRevenue += proposedRevenue;
    result.proposedProfit += proposedProfit;
    
    // Categorize for margin distribution (using current values)
    if (currentMargin < 5) {
      result.marginDistribution[0].value += 1;
      result.marginDistribution[0].profit += currentProfit;
    } else if (currentMargin < 10) {
      result.marginDistribution[1].value += 1;
      result.marginDistribution[1].profit += currentProfit;
    } else if (currentMargin < 15) {
      result.marginDistribution[2].value += 1;
      result.marginDistribution[2].profit += currentProfit;
    } else if (currentMargin < 20) {
      result.marginDistribution[3].value += 1;
      result.marginDistribution[3].profit += currentProfit;
    } else {
      result.marginDistribution[4].value += 1;
      result.marginDistribution[4].profit += currentProfit;
    }
  });
  
  // Calculate usage-weighted margin percentages
  if (result.totalRevenue > 0) {
    result.weightedMargin = (result.totalProfit / result.totalRevenue) * 100;
  }
  
  if (result.proposedRevenue > 0) {
    result.proposedWeightedMargin = (result.proposedProfit / result.proposedRevenue) * 100;
  }
  
  result.marginImprovement = result.proposedWeightedMargin - result.weightedMargin;
  
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
    marginImprovement: result.marginImprovement
  });
  
  return result;
};
