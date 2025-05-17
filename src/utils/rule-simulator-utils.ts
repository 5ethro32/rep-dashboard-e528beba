
import { formatCurrency, calculateUsageWeightedMetrics } from './formatting-utils';

// Define the rule config type
export interface RuleConfig {
  // Simplified rule configuration to match new structure
  rule1: {
    // For when AVC < ML
    marketLowUplift: number; // Standard 3% uplift for ML
    costMarkup: number; // Standard 12% markup for cost
    marginCaps: {
      group1_2: number;
      group3_4: number;
      group5_6: number;
    };
  };
  rule2: {
    // For when AVC >= ML
    marketLowUplift: number; // Standard 3% uplift for ML
    costMarkup: number; // Standard 12% markup for cost
    marginCaps: {  // Added margin caps for rule2
      group1_2: number;
      group3_4: number;
      group5_6: number;
    };
  };
  globalMarginFloor: number;
}

// Helper function to determine usage group
const determineUsageGroup = (usageRank: number) => {
  if (usageRank <= 2) return 'group1_2';
  if (usageRank <= 4) return 'group3_4';
  return 'group5_6';
};

// Helper function to get the usage-based uplift percentage
const getUsageBasedUplift = (usageRank: number): number => {
  if (usageRank <= 2) return 0; // 0% uplift for ranks 1-2
  if (usageRank <= 4) return 1; // 1% uplift for ranks 3-4
  return 2; // 2% uplift for ranks 5-6
};

// Helper function to get the usage-based competitor markup percentage
const getUsageBasedCompetitorMarkup = (usageRank: number): number => {
  if (usageRank <= 2) return 3; // 3% uplift for ranks 1-2
  if (usageRank <= 4) return 4; // 4% uplift for ranks 3-4
  return 5; // 5% uplift for ranks 5-6
};

// Helper function to validate if a price is valid (non-zero positive number)
const isValidPrice = (price: any): boolean => {
  // Convert to number if it's a string or any other type
  const numPrice = Number(price);
  // Check if it's a valid positive number
  return !isNaN(numPrice) && numPrice > 0;
};

// Helper function to treat zero values as null/undefined
const treatZeroAsNull = (value: number | undefined | null): number | null => {
  if (value === undefined || value === null || value === 0) {
    return null;
  }
  return value;
};

// Apply pricing rules to calculate a new price - Updated to make margin caps highest priority
export const applyPricingRules = (item: any, ruleConfig: RuleConfig) => {
  // Extract needed values - treating zeros as nulls
  const rawCost = Number(item.avgCost) || 0;
  const rawNextCost = Number(item.nextCost) || 0;
  const usageRank = Math.max(1, Math.min(6, Number(item.usageRank) || 1));
  
  // Apply zero-as-null logic to cost fields
  const cost = treatZeroAsNull(rawCost) !== null ? rawCost : 0;
  const nextCost = treatZeroAsNull(rawNextCost) !== null ? rawNextCost : 0;
  const hasValidCost = treatZeroAsNull(cost) !== null;
  
  // CRITICAL FIX: Properly handle ETH_NET as the Market Low
  // This is the key change - only use ETH_NET as Market Low, don't substitute others
  const rawMarketLow = Number(item.eth_net) || 0;
  
  // Apply zero-as-null logic to market low
  const marketLow = treatZeroAsNull(rawMarketLow) !== null ? rawMarketLow : 0;
  const hasValidMarketLow = treatZeroAsNull(marketLow) !== null;
  
  // ENHANCED: Improved determination of true market low with more robust validation
  // Using explicit check of each competitor price with the new isValidPrice helper
  const competitorPrices = [];
  
  // Log all competitor price fields to diagnose issues
  console.log('RAW competitor prices for item:', item.description);
  console.log('  ETH_NET:', item.eth_net, 'type:', typeof item.eth_net);
  console.log('  ETH:', item.eth, 'type:', typeof item.eth);
  console.log('  NUPHARM:', item.nupharm, 'type:', typeof item.nupharm);
  console.log('  LEXON:', item.lexon, 'type:', typeof item.lexon);
  console.log('  AAH:', item.aah, 'type:', typeof item.aah);
  
  // Add each competitor price explicitly only if it's valid using the new isValidPrice helper
  if (isValidPrice(item.eth_net)) {
    competitorPrices.push(Number(item.eth_net));
    console.log(`  Added ETH_NET price: ${Number(item.eth_net)}`);
  }
  
  if (isValidPrice(item.eth)) {
    competitorPrices.push(Number(item.eth));
    console.log(`  Added ETH price: ${Number(item.eth)}`);
  }
  
  if (isValidPrice(item.nupharm)) {
    competitorPrices.push(Number(item.nupharm));
    console.log(`  Added NUPHARM price: ${Number(item.nupharm)}`);
  }
  
  if (isValidPrice(item.lexon)) {
    competitorPrices.push(Number(item.lexon));
    console.log(`  Added LEXON price: ${Number(item.lexon)}`);
  }
  
  if (isValidPrice(item.aah)) {
    competitorPrices.push(Number(item.aah));
    console.log(`  Added AAH price: ${Number(item.aah)}`);
  }
  
  // Find the minimum valid competitor price
  let trueMarketLow = Infinity;
  let hasValidTrueMarketLow = false;
  
  if (competitorPrices.length > 0) {
    hasValidTrueMarketLow = true;
    trueMarketLow = Math.min(...competitorPrices);
    console.log(`  True Market Low calculated as: ${trueMarketLow} from ${competitorPrices.length} competitor prices`);
  } else {
    console.log(`  No valid competitor prices found for ${item.description}`);
  }
  
  // Flag if no market price is available - specifically for ETH_NET
  const noMarketPrice = !hasValidMarketLow;
  
  // Flag if we have at least one competitor price (for fallback rules)
  const hasAnyMarketPrice = hasValidTrueMarketLow;
  
  // Determine which usage group this item belongs to
  const usageGroup = determineUsageGroup(usageRank);
  
  // Determine if next buying price is lower than or equal to avg cost (downward trend)
  // Also treat as downward if next cost is missing or zero
  const isDownwardTrend = !hasValidCost || !nextCost || nextCost <= cost;
  
  // Get usage-based uplift percentage based on usage rank
  const usageUplift = getUsageBasedUplift(usageRank) / 100; // Convert to decimal (0%, 1%, or 2%)
  
  // Get usage-based competitor markup for when no market low is available
  const competitorMarkupPercent = getUsageBasedCompetitorMarkup(usageRank);
  const competitorMarkup = 1 + (competitorMarkupPercent / 100);
  
  // Special handling for zero/null cost items
  const isZeroCost = !hasValidCost;
  
  // Special debug for Diltiazem product
  const isDiltiazem = item.description && item.description.includes("Diltiazem");
  if (isDiltiazem) {
    console.log('DILTIAZEM PRODUCT DETECTED:', item.description);
    console.log('Raw pricing data:', {
      eth_net: item.eth_net,
      eth: item.eth,
      nupharm: item.nupharm,
      lexon: item.lexon,
      aah: item.aah,
      avgCost: item.avgCost,
    });
    console.log('Competitor prices array:', competitorPrices);
    console.log('Processed flags:', {
      hasValidMarketLow,
      hasValidTrueMarketLow,
      trueMarketLow,
      noMarketPrice,
      hasAnyMarketPrice,
      usageRank,
      usageUplift: usageUplift * 100 + '%',
    });
  }
  
  // Enhanced debug logging to help identify issues
  console.log('Processing item:', item.description, {
    cost, 
    marketLow, 
    trueMarketLow, 
    nextCost, 
    usageRank, 
    noMarketPrice, 
    hasAnyMarketPrice,
    isZeroCost, 
    isDownwardTrend,
    hasValidCost, 
    hasValidMarketLow, 
    hasValidTrueMarketLow,
    usageUplift: usageUplift * 100 + '%',
    competitorMarkup: competitorMarkupPercent + '%',
    currentPrice: item.currentREVAPrice,
    competitorPrices,
    competitorPricesCount: competitorPrices.length
  });
  
  let newPrice = 0;
  let ruleApplied = 'none';
  let marginCapApplied = false;
  let marginFloorApplied = false;
  
  // HIGHEST PRIORITY RULE: Calculate margin cap ceiling price
  // This is the new code to implement margin cap as top priority
  let marginCapCeilingPrice = Infinity;
  let marginCapPercentage = null;
  
  // Only apply margin cap for items with cost ≤ £1.00 AND cost > 0
  if (cost <= 1.00 && cost > 0) {
    // Determine appropriate margin cap based on usage group
    if (usageRank <= 2) {
      marginCapPercentage = ruleConfig.rule1.marginCaps.group1_2;
      console.log(`Applying Group 1-2 margin cap of ${marginCapPercentage * 100}% to ${item.description}`);
    } else if (usageRank <= 4) {
      marginCapPercentage = ruleConfig.rule1.marginCaps.group3_4;
      console.log(`Applying Group 3-4 margin cap of ${marginCapPercentage * 100}% to ${item.description}`);
    } else {
      marginCapPercentage = ruleConfig.rule1.marginCaps.group5_6;
      console.log(`Applying Group 5-6 margin cap of ${marginCapPercentage * 100}% to ${item.description}`);
    }
    
    // Calculate maximum price that would maintain the margin cap
    // Formula: Price = Cost / (1 - targetMarginCap)
    marginCapCeilingPrice = cost / (1 - marginCapPercentage);
    console.log(`Margin cap ceiling price calculated for ${item.description}: ${marginCapCeilingPrice}`);
  } else if (cost <= 0) {
    console.log(`Skipping margin cap for ${item.description} due to zero/negative cost`);
    // Add flag for logging
    if (!item.flags) item.flags = [];
    if (!item.flags.includes('ZERO_COST_MARGIN_CAP_SKIPPED')) {
      item.flags.push('ZERO_COST_MARGIN_CAP_SKIPPED');
    }
  } else {
    console.log(`Skipping margin cap for ${item.description} - cost ${cost} exceeds £1.00 threshold`);
  }
  
  // CRITICAL FIX: Complete implementation of the "No Market Low" rule
  // This is the main fix - properly handling cases where ETH_NET is missing but other competitor prices exist
  if (noMarketPrice) {
    console.log(`No Market Low (ETH_NET) detected for ${item.description}`);
    
    // CRITICAL FIX: Check if TrueMarketLow exists (any other competitor pricing)
    if (hasValidTrueMarketLow && trueMarketLow !== Infinity) {
      // Apply the standard markup plus usage-based uplift to TrueMarketLow
      const marketLowMarkup = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      newPrice = trueMarketLow * marketLowMarkup;
      ruleApplied = `no_market_low_use_true_market_low_plus_${ruleConfig.rule1.marketLowUplift + (usageUplift * 100)}`;
      
      console.log(`RULE APPLIED: Using TrueMarketLow (${trueMarketLow}) + ${ruleConfig.rule1.marketLowUplift}% + ${usageUplift * 100}% uplift = ${newPrice}`);
    }
    // If no competitor pricing at all, use Cost + markup + uplift
    else if (hasValidCost) {
      const costMarkup = 1 + (ruleConfig.rule2.costMarkup / 100) + usageUplift;
      newPrice = cost * costMarkup;
      ruleApplied = `no_market_low_use_cost_plus_${ruleConfig.rule2.costMarkup + (usageUplift * 100)}`;
      
      console.log(`RULE APPLIED: Using Cost (${cost}) + ${ruleConfig.rule2.costMarkup}% + ${usageUplift * 100}% uplift = ${newPrice}`);
    }
    // Fallback for no valid cost or TML (extreme edge case)
    else {
      // Set a nominal price to avoid zeros
      newPrice = item.currentREVAPrice > 0 ? item.currentREVAPrice : 1.00;
      ruleApplied = 'no_data_fallback';
      console.log(`RULE APPLIED: No data fallback, using current price or default: ${newPrice}`);
      
      // Flag this item for manual review
      if (!item.flags) item.flags = [];
      if (!item.flags.includes('NO_DATA_FALLBACK')) {
        item.flags.push('NO_DATA_FALLBACK');
      }
    }
  }
  // ZERO/NULL COST ITEM HANDLING
  else if (isZeroCost) {
    // Use Market Low pricing if available (regardless of trend)
    if (hasValidMarketLow && marketLow > 0) {
      // Apply Market Low with appropriate uplift based on usage rank
      const mlUplift = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      newPrice = marketLow * mlUplift;
      ruleApplied = `zero_cost_use_market_low_plus_${ruleConfig.rule1.marketLowUplift + (usageUplift * 100)}`;
      
      console.log(`RULE APPLIED: Zero Cost item using Market Low (${marketLow}) + ${ruleConfig.rule1.marketLowUplift}% + ${usageUplift * 100}% = ${newPrice}`);
    }
    // Fallback to current price if available (last resort)
    else if (item.currentREVAPrice > 0) {
      newPrice = item.currentREVAPrice;
      ruleApplied = 'zero_cost_no_market_low_use_current';
      
      console.log(`RULE APPLIED: Zero Cost item with no Market Low, using current price: ${newPrice}`);
      
      // Flag this item for manual review
      if (!item.flags) item.flags = [];
      if (!item.flags.includes('ZERO_COST_NO_MARKET_LOW')) {
        item.flags.push('ZERO_COST_NO_MARKET_LOW');
      }
    }
    // Last resort - set a default price
    else {
      newPrice = 1.00; // Set a nominal price
      ruleApplied = 'zero_cost_no_data_fallback';
      
      console.log(`RULE APPLIED: Zero Cost item with no data, using fallback price: ${newPrice}`);
      
      // Flag this item for manual review
      if (!item.flags) item.flags = [];
      if (!item.flags.includes('ZERO_COST_NO_DATA')) {
        item.flags.push('ZERO_COST_NO_DATA');
      }
    }
  }
  // RULE 1: AVC < ML
  else if (hasValidMarketLow && hasValidCost && cost < marketLow) {
    // Apply Rule 1a or Rule 1b based on market trend
    if (isDownwardTrend) {
      // Rule 1a - Downward Trend: Market Low + Group Uplift
      // Apply uplift based on usage rank (0%, 1%, or 2%)
      const mlUplift = 1 + usageUplift;
      newPrice = marketLow * mlUplift;
      ruleApplied = `rule1a_ml_plus_${usageUplift * 100}`;
      
      console.log(`RULE APPLIED: Rule 1a - Market Low (${marketLow}) + ${usageUplift * 100}% = ${newPrice}`);
    } else {
      // Rule 1b - Upward Trend: Take higher of Market Low with uplift or AvgCost with markup
      const mlUplift = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      const costMarkup = 1 + (ruleConfig.rule1.costMarkup / 100) + usageUplift;
      
      const mlPrice = marketLow * mlUplift;
      const costPrice = cost * costMarkup;
      
      newPrice = Math.max(mlPrice, costPrice);
      const usedPrice = newPrice === mlPrice ? "ML" : "Cost";
      ruleApplied = `rule1b_${usedPrice.toLowerCase()}_based`;
      
      console.log(`RULE APPLIED: Rule 1b - Using ${usedPrice}, ML price: ${mlPrice}, Cost price: ${costPrice}, Selected: ${newPrice}`);
    }
  }
  // RULE 2: AVC ≥ ML
  else if (hasValidMarketLow && hasValidCost && cost >= marketLow) {
    if (isDownwardTrend) {
      // Rule 2a - Downward Trend: Market Low + Uplift
      // Apply uplift based on usage rank (3%, 4%, or 5%)
      let mlUplift = 1.03; // Default for groups 1-2
      if (usageRank >= 3 && usageRank <= 4) mlUplift = 1.04;
      else if (usageRank >= 5) mlUplift = 1.05;
      
      newPrice = marketLow * mlUplift;
      ruleApplied = `rule2a_ml_plus_${(mlUplift - 1) * 100}`;
      
      console.log(`RULE APPLIED: Rule 2a - Market Low (${marketLow}) + ${(mlUplift - 1) * 100}% = ${newPrice}`);
    } else {
      // Rule 2b - Upward Trend: Take higher of Market Low with uplift or AvgCost with markup
      let mlUplift = 1.03; // Default for groups 1-2
      if (usageRank >= 3 && usageRank <= 4) mlUplift = 1.04;
      else if (usageRank >= 5) mlUplift = 1.05;
      
      const costMarkup = 1 + (ruleConfig.rule2.costMarkup / 100);
      
      const mlPrice = marketLow * mlUplift;
      const costPrice = cost * costMarkup;
      
      newPrice = Math.max(mlPrice, costPrice);
      const usedPrice = newPrice === mlPrice ? "ML" : "Cost";
      ruleApplied = `rule2b_${usedPrice.toLowerCase()}_based`;
      
      console.log(`RULE APPLIED: Rule 2b - Using ${usedPrice}, ML price: ${mlPrice}, Cost price: ${costPrice}, Selected: ${newPrice}`);
    }
  }
  // ENHANCED FALLBACK RULES
  else {
    // We only get here if we have no market low AND no valid cost
    console.log(`WARNING: Fallback rule triggered for ${item.description} - no valid Market Low or Cost data`);
    
    // Try to use True Market Low if available
    if (hasValidTrueMarketLow && trueMarketLow !== Infinity) {
      const mlUplift = 1 + (ruleConfig.rule1.marketLowUplift / 100) + usageUplift;
      newPrice = trueMarketLow * mlUplift;
      ruleApplied = `fallback_true_market_low`;
      
      console.log(`RULE APPLIED: Fallback - Using True Market Low (${trueMarketLow}) + ${ruleConfig.rule1.marketLowUplift + (usageUplift * 100)}% = ${newPrice}`);
    }
    // Last resort - use current price or set a default
    else if (item.currentREVAPrice > 0) {
      newPrice = item.currentREVAPrice;
      ruleApplied = 'fallback_current_price';
      
      console.log(`RULE APPLIED: Fallback - Using current price ${newPrice} due to insufficient data`);
      
      // Flag this item for manual review
      if (!item.flags) item.flags = [];
      if (!item.flags.includes('FALLBACK_CURRENT_PRICE')) {
        item.flags.push('FALLBACK_CURRENT_PRICE');
      }
    } else {
      newPrice = 1.00; // Set a nominal price
      ruleApplied = 'fallback_default_price';
      
      console.log(`RULE APPLIED: Fallback - Using default price ${newPrice} due to no data available`);
      
      // Flag this item for manual review
      if (!item.flags) item.flags = [];
      if (!item.flags.includes('NO_DATA_FALLBACK')) {
        item.flags.push('NO_DATA_FALLBACK');
      }
    }
  }
  
  // Fix for zero or negative price results
  if (newPrice <= 0) {
    // If we have a current price, use that instead
    if (item.currentREVAPrice > 0) {
      newPrice = item.currentREVAPrice;
      ruleApplied = `${ruleApplied}_fixed_negative`;
      console.log(`WARNING: Negative price fixed for ${item.description} using current price ${newPrice}`);
    } else {
      // Last resort - set a nominal price
      newPrice = 1.00;
      ruleApplied = `${ruleApplied}_fixed_default`;
      console.log(`WARNING: Negative price fixed for ${item.description} using default price ${newPrice}`);
    }
  }
  
  // HIGHEST PRIORITY RULE: Apply margin cap ceiling if necessary
  // This is now done AFTER all other rules, to make sure margin cap is the highest priority
  if (marginCapCeilingPrice !== Infinity && newPrice > marginCapCeilingPrice) {
    // Log that we're capping the price
    console.log(`MARGIN CAP APPLIED: Capping price for ${item.description} from ${newPrice} to ${marginCapCeilingPrice}`);
    console.log(`  Margin cap: ${marginCapPercentage! * 100}%, Cost: ${cost}`);
    
    // Store original price for debugging
    const originalPrice = newPrice;
    
    // Cap the price
    newPrice = marginCapCeilingPrice;
    marginCapApplied = true;
    
    // Update the rule description to indicate cap was applied
    ruleApplied = `${ruleApplied}_margin_cap_${marginCapPercentage! * 100}`;
    
    // Add flag for margin cap application
    if (!item.flags) item.flags = [];
    if (!item.flags.includes('MARGIN_CAP_APPLIED')) {
      item.flags.push('MARGIN_CAP_APPLIED');
    }
    
    // Calculate how much the price was reduced by
    const reductionAmount = originalPrice - marginCapCeilingPrice;
    const reductionPercent = (reductionAmount / originalPrice) * 100;
    console.log(`  Price reduced by ${reductionAmount.toFixed(2)} (${reductionPercent.toFixed(1)}%)`);
  }
  
  // Apply global margin floor if configured
  if (ruleConfig.globalMarginFloor > 0 && cost > 0) {
    const targetMarginFloor = ruleConfig.globalMarginFloor / 100; // Convert from percentage to decimal
    const currentMargin = (newPrice - cost) / newPrice;
    
    if (currentMargin < targetMarginFloor) {
      // Calculate price needed to achieve the margin floor: Price = Cost / (1 - TargetMargin)
      const flooredPrice = cost / (1 - targetMarginFloor);
      
      // Only apply if it would increase the price
      if (flooredPrice > newPrice) {
        newPrice = flooredPrice;
        marginFloorApplied = true;
        ruleApplied = `${ruleApplied}_margin_floor_${ruleConfig.globalMarginFloor}`;
        
        console.log(`RULE APPLIED: Global margin floor of ${ruleConfig.globalMarginFloor}% applied, new price: ${newPrice}`);
      }
    }
  }
  
  // Final sanity check - ensure price is rounded to 4 decimal places
  newPrice = Math.round(newPrice * 10000) / 10000;
  
  // Calculate margin if we have a valid newPrice and cost
  let newMargin = 0;
  let flag1 = false;
  let flag2 = false;
  
  // Calculate margin if we have a valid newPrice and cost
  if (newPrice > 0 && cost > 0) {
    newMargin = (newPrice - cost) / newPrice;
    
    // Set flags based on price and margin thresholds
    // Flag 1: Price is significantly higher than market
    // FIXED: Use trueMarketLow instead of marketLow for the comparison if we have it
    if (hasValidTrueMarketLow) {
      flag1 = newPrice > trueMarketLow * 1.10;
    } else if (hasValidMarketLow) {
      flag1 = newPrice > marketLow * 1.10;
    }
    
    // Flag 2: Margin is below threshold (e.g., 10%)
    flag2 = newMargin < 0.10;
  }
  
  return {
    originalPrice: item.currentREVAPrice || 0,
    newPrice: newPrice,
    cost: cost,
    marketLow: marketLow,
    trueMarketLow: hasValidTrueMarketLow ? trueMarketLow : null,
    originalMargin: item.currentREVAMargin || 0,
    newMargin: newMargin, // Store as decimal, not percentage
    marginDiff: newPrice > 0 ? ((newPrice - cost) / newPrice) - (item.currentREVAMargin || 0) : 0, // Store difference as decimal
    ruleApplied: ruleApplied,
    usageGroup: usageGroup,
    usageRank: usageRank,
    flag1: flag1,
    flag2: flag2,
    marginCapApplied: marginCapApplied,
    marginFloorApplied: marginFloorApplied,
    noMarketLow: !hasValidMarketLow,
    hasTrueMarketLow: hasValidTrueMarketLow,
    // Add additional diagnostic info for debugging
    competitorPricesCount: competitorPrices.length,
    competitorPrices: competitorPrices.length > 0 ? competitorPrices : null,
    // Add the new flag for zero-cost items where margin cap was skipped
    zeroCostMarginCapSkipped: cost <= 0.00 && (hasValidMarketLow || hasValidTrueMarketLow),
    // Add the margin cap ceiling price for reference
    marginCapCeilingPrice: marginCapCeilingPrice !== Infinity ? marginCapCeilingPrice : null
  };
};

// Simulate rule changes and calculate the impact
export const simulateRuleChanges = (items: any[], ruleConfig: RuleConfig) => {
  // Create a deep copy of items to avoid mutating the original data
  const itemsCopy = JSON.parse(JSON.stringify(items || []));
  
  if (!itemsCopy || !itemsCopy.length) {
    throw new Error("No items available for simulation");
  }
  
  // Calculate baseline metrics using the original data
  const baselineMetrics = calculateUsageWeightedMetrics(itemsCopy);
  
  // Apply simulation rules to each item
  const simulatedItems = itemsCopy.map((item: any) => {
    const simulationResult = applyPricingRules(item, ruleConfig);
    
    // Update the item with the simulated price
    return {
      ...item,
      simulatedPrice: simulationResult.newPrice,
      simulatedMargin: simulationResult.newMargin,
      originalPrice: simulationResult.originalPrice,
      originalMargin: simulationResult.originalMargin,
      marginDiff: simulationResult.marginDiff,
      ruleApplied: simulationResult.ruleApplied,
      usageGroup: simulationResult.usageGroup,
      flag1: simulationResult.flag1,
      flag2: simulationResult.flag2,
      marginCapApplied: simulationResult.marginCapApplied,
      marginFloorApplied: simulationResult.marginFloorApplied,
      zeroCostMarginCapSkipped: simulationResult.zeroCostMarginCapSkipped,
      // Add the margin cap ceiling price
      marginCapCeilingPrice: simulationResult.marginCapCeilingPrice
    };
  });
  
  // Calculate metrics based on the simulated prices
  const simulatedItemsForMetrics = simulatedItems.map((item: any) => ({
    ...item,
    currentREVAPrice: item.simulatedPrice,
    currentREVAMargin: item.simulatedMargin
  }));
  
  const simulatedMetrics = calculateUsageWeightedMetrics(simulatedItemsForMetrics);
  
  // Calculate differences between baseline and simulated metrics
  const revenueDiff = simulatedMetrics.totalRevenue - baselineMetrics.totalRevenue;
  const revenueDiffPercent = baselineMetrics.totalRevenue > 0 
    ? (revenueDiff / baselineMetrics.totalRevenue) * 100 
    : 0;
    
  const profitDiff = simulatedMetrics.totalProfit - baselineMetrics.totalProfit;
  const profitDiffPercent = baselineMetrics.totalProfit > 0 
    ? (profitDiff / baselineMetrics.totalProfit) * 100 
    : 0;
    
  const marginDiff = simulatedMetrics.weightedMargin - baselineMetrics.weightedMargin;
  
  // Calculate impact by usage group
  const groupImpact = [
    { name: "Group 1-2", displayName: "Low Usage", usageRanks: [1, 2] },
    { name: "Group 3-4", displayName: "Medium Usage", usageRanks: [3, 4] },
    { name: "Group 5-6", displayName: "High Usage", usageRanks: [5, 6] }
  ].map(group => {
    // Filter items for this usage group
    const groupItems = simulatedItems.filter(item => {
      const usageRank = item.usageRank || 1;
      return group.usageRanks.includes(usageRank);
    });
    
    // Calculate baseline metrics for this group
    const groupBaseItems = itemsCopy.filter(item => {
      const usageRank = item.usageRank || 1;
      return group.usageRanks.includes(usageRank);
    });
    
    // Calculate baseline revenue and profit for this group
    let baseRevenue = 0;
    let baseProfit = 0;
    let baseMargin = 0;
    let baseMarginNum = 0;
    let baseMarginDenom = 0;
    
    groupBaseItems.forEach(item => {
      const usage = Math.max(0, item.revaUsage || 0);
      const price = Math.max(0, item.currentREVAPrice || 0);
      const cost = Math.max(0, item.avgCost || 0);
      
      if (usage > 0 && price > 0) {
        const itemRevenue = usage * price;
        const itemProfit = usage * (price - cost);
        
        baseRevenue += itemRevenue;
        baseProfit += itemProfit;
        
        // For weighted margin calculation
        baseMarginNum += (price - cost) * usage;
        baseMarginDenom += price * usage;
      }
    });
    
    // Calculate weighted margin for this group
    baseMargin = baseMarginDenom > 0 ? (baseMarginNum / baseMarginDenom) * 100 : 0;
    
    // Calculate simulated metrics for this group
    let simRevenue = 0;
    let simProfit = 0;
    let simMargin = 0;
    let simMarginNum = 0;
    let simMarginDenom = 0;
    let highPriceFlags = 0;
    let lowMarginFlags = 0;
    let marginCapApplied = 0;
    let marginFloorApplied = 0;
    let zeroCostMarginCapSkipped = 0;
    
    groupItems.forEach(item => {
      const usage = Math.max(0, item.revaUsage || 0);
      const price = Math.max(0, item.simulatedPrice || 0);
      const cost = Math.max(0, item.avgCost || 0);
      
      if (usage > 0 && price > 0) {
        const itemRevenue = usage * price;
        const itemProfit = usage * (price - cost);
        
        simRevenue += itemRevenue;
        simProfit += itemProfit;
        
        // For weighted margin calculation
        simMarginNum += (price - cost) * usage;
        simMarginDenom += price * usage;
      }
      
      // Count flags
      if (item.flag1) highPriceFlags++;
      if (item.flag2) lowMarginFlags++;
      if (item.marginCapApplied) marginCapApplied++;
      if (item.marginFloorApplied) marginFloorApplied++;
      if (item.zeroCostMarginCapSkipped) zeroCostMarginCapSkipped++;
    });
    
    // Calculate weighted margin for this group
    simMargin = simMarginDenom > 0 ? (simMarginNum / simMarginDenom) * 100 : 0;
    
    // Calculate differences for this group
    const revenueDiff = simRevenue - baseRevenue;
    const revenueDiffPercent = baseRevenue > 0 ? (revenueDiff / baseRevenue) * 100 : 0;
    
    const profitDiff = simProfit - baseProfit;
    const profitDiffPercent = baseProfit > 0 ? (profitDiff / baseProfit) * 100 : 0;
    
    const marginDiff = simMargin - baseMargin;
    
    return {
      name: group.name,
      displayName: group.displayName,
      itemCount: groupItems.length,
      baseline: {
        revenue: baseRevenue,
        profit: baseProfit,
        margin: baseMargin
      },
      simulated: {
        revenue: simRevenue,
        profit: simProfit,
        margin: simMargin,
        highPriceFlags,
        lowMarginFlags,
        marginCapApplied,
        marginFloorApplied,
        zeroCostMarginCapSkipped
      },
      changes: {
        revenueDiff,
        revenueDiffPercent,
        profitDiff,
        profitDiffPercent,
        marginDiff
      }
    };
  });
  
  // Count overall flags
  const highPriceFlags = simulatedItems.filter((item: any) => item.flag1).length;
  const lowMarginFlags = simulatedItems.filter((item: any) => item.flag2).length;
  const marginCapApplied = simulatedItems.filter((item: any) => item.marginCapApplied).length;
  const marginFloorApplied = simulatedItems.filter((item: any) => item.marginFloorApplied).length;
  const zeroCostMarginCapSkipped = simulatedItems.filter((item: any) => item.zeroCostMarginCapSkipped).length;
  
  // Return simulation results
  return {
    baseline: {
      totalRevenue: baselineMetrics.totalRevenue,
      totalProfit: baselineMetrics.totalProfit,
      weightedMargin: baselineMetrics.weightedMargin,
      count: itemsCopy.length
    },
    simulated: {
      totalRevenue: simulatedMetrics.totalRevenue,
      totalProfit: simulatedMetrics.totalProfit,
      weightedMargin: simulatedMetrics.weightedMargin,
      count: simulatedItems.length,
      highPriceFlags,
      lowMarginFlags,
      marginCapApplied,
      marginFloorApplied,
      zeroCostMarginCapSkipped
    },
    changes: {
      revenueDiff,
      revenueDiffPercent,
      profitDiff,
      profitDiffPercent,
      marginDiff
    },
    config: ruleConfig,
    itemResults: simulatedItems,
    groupImpact,
  };
};
