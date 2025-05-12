
/**
 * Calculates market trend based on previous and current market low prices
 * @param currentMarketLow Current market low price
 * @param previousMarketLow Previous market low price (from historical data)
 * @param threshold Percentage threshold to determine significant change (default 2%)
 * @returns 'up' | 'down' | undefined
 */
export const calculateMarketTrend = (
  currentMarketLow: number | null | undefined, 
  previousMarketLow: number | null | undefined,
  threshold = 2
): 'up' | 'down' | undefined => {
  // If any value is missing, we can't calculate trend
  if (!currentMarketLow || !previousMarketLow || previousMarketLow === 0) {
    return undefined;
  }
  
  // Calculate percentage change
  const percentChange = ((currentMarketLow - previousMarketLow) / previousMarketLow) * 100;
  
  // Determine trend based on threshold
  if (percentChange >= threshold) {
    return 'up';
  } else if (percentChange <= -threshold) {
    return 'down';
  }
  
  // Not significant enough to register as a trend
  return undefined;
};

/**
 * Calculates percentage to market low
 * @param proposedPrice The proposed price
 * @param marketLow The market low price
 * @returns Percentage difference
 */
export const calculatePercentToMarketLow = (
  proposedPrice: number | null | undefined,
  marketLow: number | null | undefined
): number => {
  if (!proposedPrice || !marketLow || marketLow === 0) return 0;
  
  return ((proposedPrice - marketLow) / marketLow) * 100;
};
