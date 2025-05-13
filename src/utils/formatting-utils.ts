import { formatDistanceToNow } from 'date-fns';

// Format numerical values as currency (GBP)
export const formatCurrency = (value: number | null | undefined, noDecimals = false): string => {
  if (value === null || value === undefined) return '£0';
  
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  });
  
  return formatter.format(value);
};

// Format values as percentages - FIXED: now multiplies by 100 to display correctly
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0.00%';
  // Multiply by 100 to convert decimal to percentage
  return `${(value * 100).toFixed(2)}%`;
};

// Format numbers with appropriate separators
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('en-GB');
};

// Format elapsed time in a readable format
export const formatElapsedTime = (date: Date | string): string => {
  const dateToUse = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateToUse, { addSuffix: true });
};

// Calculate usage-weighted margin and other metrics
export const calculateUsageWeightedMetrics = (data: any[]) => {
  let totalUsage = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalUsageWeightedMargin = 0;
  let validItemCount = 0;
  
  // For proposed price calculations
  let proposedRevenue = 0;
  let proposedProfit = 0;
  
  // Create margin bands for distribution
  const marginBands = [
    { name: 'Negative', range: 'Below 0%', count: 0, revenue: 0, profit: 0, color: '#ef4444' },
    { name: 'Very Low', range: '0-5%', count: 0, revenue: 0, profit: 0, color: '#f97316' },
    { name: 'Low', range: '5-10%', count: 0, revenue: 0, profit: 0, color: '#eab308' },
    { name: 'Medium', range: '10-20%', count: 0, revenue: 0, profit: 0, color: '#84cc16' },
    { name: 'High', range: '20-30%', count: 0, revenue: 0, profit: 0, color: '#22c55e' },
    { name: 'Very High', range: 'Above 30%', count: 0, revenue: 0, profit: 0, color: '#14b8a6' }
  ];

  data.forEach(item => {
    // Skip items with no usage data
    if (!item.revaUsage || item.revaUsage <= 0) return;
    
    validItemCount++;
    totalUsage += item.revaUsage;
    
    // Calculate revenue and profit based on current price
    const price = item.currentREVAPrice || 0;
    const cost = item.avgCost || 0;
    const revenue = price * item.revaUsage;
    const profit = revenue - (cost * item.revaUsage); // Correct profit calculation
    
    totalRevenue += revenue;
    totalProfit += profit;
    
    // Calculate proposed revenue and profit if available
    if (item.proposedPrice) {
      const proposedPriceValue = item.proposedPrice || price;
      const propRevenue = proposedPriceValue * item.revaUsage;
      const propProfit = propRevenue - (cost * item.revaUsage); // Correct profit calculation
      
      proposedRevenue += propRevenue;
      proposedProfit += propProfit;
    }

    // Calculate margin and add to margin band
    let margin = 0;
    if (price > 0) {
      margin = ((price - cost) / price) * 100; // Correct margin calculation as percentage
      
      // Assign to margin band
      if (margin < 0) {
        marginBands[0].count++;
        marginBands[0].revenue += revenue;
        marginBands[0].profit += profit;
      } else if (margin < 5) {
        marginBands[1].count++;
        marginBands[1].revenue += revenue;
        marginBands[1].profit += profit;
      } else if (margin < 10) {
        marginBands[2].count++;
        marginBands[2].revenue += revenue;
        marginBands[2].profit += profit;
      } else if (margin < 20) {
        marginBands[3].count++;
        marginBands[3].revenue += revenue;
        marginBands[3].profit += profit;
      } else if (margin < 30) {
        marginBands[4].count++;
        marginBands[4].revenue += revenue;
        marginBands[4].profit += profit;
      } else {
        marginBands[5].count++;
        marginBands[5].revenue += revenue;
        marginBands[5].profit += profit;
      }
    }
  });
  
  // Calculate usage-weighted margin
  let weightedMargin = 0;
  if (totalRevenue > 0) {
    weightedMargin = (totalProfit / totalRevenue) * 100; // Calculate as percentage
  }

  // Calculate proposed margin
  let proposedWeightedMargin = 0;
  if (proposedRevenue > 0) {
    proposedWeightedMargin = (proposedProfit / proposedRevenue) * 100; // Calculate as percentage
  }
  
  // Calculate margin improvement
  const marginImprovement = proposedWeightedMargin - weightedMargin;
  
  return {
    weightedMargin,
    proposedWeightedMargin,
    marginImprovement,
    totalRevenue,
    totalProfit,
    proposedRevenue,
    proposedProfit,
    validItemCount,
    totalUsage,
    marginDistribution: marginBands
  };
};
