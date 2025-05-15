export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value);
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

export const calculateUsageWeightedMetrics = (data: any[]) => {
  // Initialize counters and accumulators
  let totalUsage = 0;
  let weightedMarginSum = 0;
  let proposedWeightedMarginSum = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let proposedRevenue = 0;
  let proposedProfit = 0;
  let validItemCount = 0;
  
  // Initialize margin distribution bands
  const marginBands = [
    { name: "Negative (<0%)", min: -Infinity, max: 0, count: 0, items: [], profit: 0 },
    { name: "Very Low (0-5%)", min: 0, max: 5, count: 0, items: [], profit: 0 },
    { name: "Low (5-10%)", min: 5, max: 10, count: 0, items: [], profit: 0 },
    { name: "Medium (10-20%)", min: 10, max: 20, count: 0, items: [], profit: 0 },
    { name: "High (20-30%)", min: 20, max: 30, count: 0, items: [], profit: 0 },
    { name: "Very High (>30%)", min: 30, max: Infinity, count: 0, items: [], profit: 0 },
  ];

  // Process each item in the data array
  data.forEach(item => {
    // Skip items without valid usage data
    if (!item.revaUsage || isNaN(item.revaUsage) || item.revaUsage <= 0) {
      return;
    }
    
    const usage = Number(item.revaUsage);
    const currentPrice = Number(item.currentREVAPrice) || 0;
    const proposedPrice = Number(item.proposedPrice) || currentPrice;
    const cost = Number(item.avgCost) || 0;
    
    // Skip items with invalid price or cost
    if (currentPrice <= 0 || isNaN(cost)) {
      return;
    }
    
    // Calculate current margins and revenue
    const currentMargin = currentPrice > 0 ? ((currentPrice - cost) / currentPrice) * 100 : 0;
    const currentRevenue = usage * currentPrice;
    const currentProfit = usage * (currentPrice - cost);
    
    // Calculate proposed margins and revenue
    const proposedMargin = proposedPrice > 0 ? ((proposedPrice - cost) / proposedPrice) * 100 : 0;
    const proposedItemRevenue = usage * proposedPrice;
    const proposedItemProfit = usage * (proposedPrice - cost);
    
    // Add to totals
    totalUsage += usage;
    weightedMarginSum += currentMargin * usage;
    proposedWeightedMarginSum += proposedMargin * usage;
    totalRevenue += currentRevenue;
    totalProfit += currentProfit;
    proposedRevenue += proposedItemRevenue;
    proposedProfit += proposedItemProfit;
    validItemCount++;
    
    // Categorize into margin bands
    marginBands.forEach(band => {
      if (currentMargin >= band.min && currentMargin < band.max) {
        band.count++;
        band.items.push(item);
        band.profit += currentProfit;
      }
    });
  });
  
  // Calculate weighted average margins
  const weightedMargin = totalUsage > 0 ? weightedMarginSum / totalUsage : 0;
  const proposedWeightedMargin = totalUsage > 0 ? proposedWeightedMarginSum / totalUsage : 0;
  
  // Calculate business margins (total profit / total revenue)
  const businessMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const proposedBusinessMargin = proposedRevenue > 0 ? (proposedProfit / proposedRevenue) * 100 : 0;
  const businessMarginImprovement = proposedBusinessMargin - businessMargin;

  // Calculate margin improvement
  const marginImprovement = proposedWeightedMargin - weightedMargin;
  
  return {
    weightedMargin,
    proposedWeightedMargin,
    marginImprovement,
    businessMargin,
    proposedBusinessMargin,
    businessMarginImprovement,
    totalRevenue,
    totalProfit,
    proposedRevenue,
    proposedProfit,
    validItemCount,
    totalUsage,
    marginDistribution: marginBands
  };
};
