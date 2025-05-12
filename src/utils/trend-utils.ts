
/**
 * Calculate if the price trend is downward
 * @param nextPrice The next buying price
 * @param currentCost The current average cost
 * @returns boolean True if trend is downward
 */
export const isTrendDown = (nextPrice: number | null | undefined, currentCost: number | null | undefined): boolean => {
  if (nextPrice === null || nextPrice === undefined || currentCost === null || currentCost === undefined) {
    return false;
  }
  return nextPrice <= currentCost;
};

/**
 * Calculate the percentage difference between current price and market low
 * @param currentPrice The current or proposed price
 * @param marketLow The market low price
 * @returns number The percentage difference (positive means above market low)
 */
export const calculatePercentToMarketLow = (currentPrice: number | null | undefined, marketLow: number | null | undefined): number => {
  if (currentPrice === null || currentPrice === undefined || marketLow === null || marketLow === undefined || marketLow === 0) {
    return 0;
  }
  return ((currentPrice - marketLow) / marketLow) * 100;
};

/**
 * Format a currency value with £ symbol and 2 decimal places
 * @param value The number to format as currency
 * @returns string The formatted currency string
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '£0.00';
  }
  return `£${value.toFixed(2)}`;
};

/**
 * Format a percentage value with % symbol and 2 decimal places
 * @param value The decimal fraction to format as percentage
 * @returns string The formatted percentage string
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '0.00%';
  }
  return `${(value * 100).toFixed(2)}%`;
};
