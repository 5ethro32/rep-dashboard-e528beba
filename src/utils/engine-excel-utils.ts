// This file should contain only utility functions for processing Excel data
// and should not contain any React JSX components

// Format currency - with null/undefined check
export const formatCurrency = (value: number | null | undefined, noMarketPrice?: boolean): string => {
  if (noMarketPrice || value === 0) {
    return '£0.00';
  }
  if (value === null || value === undefined) {
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

// Format for missing Next Buying Price
export const formatNextBuyingPrice = (item: any): string => {
  if (item.nextCostMissing) {
    return '£0.00';
  }
  return `£${(item.nextCost || 0).toFixed(2)}`;
};

// Process Excel file data
export const processEngineExcelFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    // This would contain the actual Excel processing logic
    // For now, we'll return a mock structure matching our expected format
    
    setTimeout(() => {
      try {
        // Mock data structure
        const mockData = {
          items: [
            // Items would be populated here from Excel file
          ],
          flaggedItems: [],
          totalItems: 0,
          activeItems: 0,
          fileName: file.name
          // Other metadata would be included here
        };
        
        resolve(mockData);
      } catch (error) {
        reject(error);
      }
    }, 1000); // Simulate processing time
  });
};

// Other utility functions for Excel data processing would go here
