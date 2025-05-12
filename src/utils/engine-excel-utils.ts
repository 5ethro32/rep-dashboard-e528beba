// This file should contain only utility functions for processing Excel data
// and should not contain any React JSX components

// Format currency - with null/undefined check
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) {
    return '£0.00';
  }
  return `£${value.toFixed(2)}`;
};

// Format percentage - with null/undefined check
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '0.00%';
  }
  return `${(value * 100).toFixed(2)}%`;
};

// Calculate price change percentage
export const calculatePriceChangePercentage = (currentPrice: number, proposedPrice: number): number => {
  if (currentPrice === 0) return 0;
  return ((proposedPrice - currentPrice) / currentPrice) * 100;
};

// Format rule display - Simplify rule display
export const formatRuleDisplay = (rule: string): string => {
  if (!rule) return '';

  // Check if the rule follows the pattern "Grp X-Y" and convert to [X.Y]
  const rulePattern = /Grp\s*(\d+)-(\d+)/i;
  const match = rule.match(rulePattern);
  if (match) {
    return `[${match[1]}.${match[2]}]`;
  }
  return rule;
};

// Process Excel file data - placeholder function
// In a real application, this would include the logic to process Excel data
export const processEngineExcelFile = (fileData: any): any[] => {
  // This should contain your Excel processing logic
  // For now, we're just returning the input data
  return Array.isArray(fileData) ? fileData : [];
};

// Other utility functions for Excel data processing would go here
