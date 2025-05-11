import * as XLSX from 'xlsx';

// Define the types of the data
interface RevaItem {
  description: string;
  inStock: number;
  inRF?: number;
  onOrder: number;
  blocked?: number;
  keepRemove?: string;
  revaUsage: number;
  usageRank?: number; // Now optional as we'll calculate it
  flag?: string; // Used for SHORT flag and other flags
  avgCost: number;
  avgCostLessThanML?: string;
  nextCost: number;
  trend?: string;
  currentREVAPrice: number;
  currentREVAMargin: number;
  eth_net?: number;
  eth?: number;
  nupharm?: number;
  lexon?: number;
  aah?: number;
  marketLow?: number;
  trueMarketLow?: number;
  appliedRule?: string;
  proposedPrice?: number;
  proposedMargin?: number;
  flag1?: boolean; // Price ≥10% above TRUE MARKET LOW
  flag2?: boolean; // Margin < 3%
  // New properties for price editing and workflow
  calculatedPrice?: number;
  priceModified?: boolean;
  workflowStatus?: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedBy?: string;
  submissionDate?: string;
  reviewer?: string;
  reviewDate?: string;
  reviewComments?: string;
  id?: string; // Added for item identification
  // New flags property to store all flags that apply to this item
  flags?: string[];
}

interface ProcessedEngineData {
  fileName: string;
  totalItems: number;
  activeItems: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallMargin: number;
  avgCostLessThanMLCount: number; // Added new metric
  rule1Flags: number;
  rule2Flags: number;
  profitDelta: number;
  marginLift: number;
  items: RevaItem[];
  flaggedItems: RevaItem[];
  chartData: any[];
  ruleConfig: RuleConfig;
}

interface RuleConfig {
  rule1: {
    group1_2: { trend_down: number; trend_flat_up: number };
    group3_4: { trend_down: number; trend_flat_up: number };
    group5_6: { trend_down: number; trend_flat_up: number };
  };
  rule2: {
    group1_2: { trend_down: number; trend_flat_up: number };
    group3_4: { trend_down: number; trend_flat_up: number };
    group5_6: { trend_down: number; trend_flat_up: number };
  };
}

// Flexible column mapping - will match case-insensitive and allow variations
const findColumnMatch = (headers: string[], possibleNames: string[]): string | null => {
  for (const header of headers) {
    for (const name of possibleNames) {
      if (header.toLowerCase().includes(name.toLowerCase())) {
        return header;
      }
    }
  }
  return null;
};

// Generate a dynamic column mapping based on the actual headers in the file
const generateColumnMapping = (headers: string[]) => {
  const mapping: Record<string, string> = {};
  
  // Define possible variations for each required field
  const columnVariations = {
    description: ['description', 'desc', 'product', 'item'],
    inStock: ['instock', 'in stock', 'stock', 'quantity', 'qty'],
    inRF: ['inrf', 'in rf', 'rf'],
    onOrder: ['onorder', 'on order', 'order', 'ordered'],
    blocked: ['blocked'],
    keepRemove: ['keep/remove', 'keep', 'remove'],
    revaUsage: ['revausage', 'usage', 'reva usage', 'monthly usage', 'sales', 'units sold'],
    usageRank: ['usagerank', 'usage rank', 'rank', 'priority', 'group'],
    flag: ['flag', 'flags', 'note', 'comment'], // Expanded to look for flag column
    avgCost: ['avgcost', 'avg cost', 'average cost', 'cost', 'unit cost'],
    avgCostLessThanML: ['avgcost<ml', 'avgcost < ml'],
    nextCost: ['nextcost', 'next cost', 'next buying price', 'future cost', 'new cost'],
    trend: ['trend', 'downwards', 'upwards'],
    currentREVAPrice: ['currentrevaprice', 'current reva price', 'price', 'selling price', 'current price', 'reva price'],
    currentREVAMargin: ['currentrevamargin', 'current reva %', 'margin', 'current margin', 'reva margin', 'current reva margin'],
    eth_net: ['eth_net', 'eth net', 'ethnet', 'market low'],
    eth: ['eth', 'eth price'],
    nupharm: ['nupharm', 'nu pharm', 'nupharm price'],
    lexon: ['lexon', 'lexon price'],
    aah: ['aah', 'aah price']
  };
  
  // Find matches for each field
  for (const [field, variations] of Object.entries(columnVariations)) {
    const match = findColumnMatch(headers, variations);
    if (match) {
      mapping[field] = match;
    }
  }
  
  // Make sure we don't have the nextCost field for currentREVAPrice - that looks like a bug
  if (mapping.nextCost && !mapping.currentREVAPrice) {
    // Try to find a specific "Current REVA Price" column
    const betterMatch = findColumnMatch(headers, ['Current REVA Price']);
    if (betterMatch) {
      mapping.currentREVAPrice = betterMatch;
    }
  }
  
  return mapping;
};

export const processEngineExcelFile = async (file: File): Promise<ProcessedEngineData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) {
          throw new Error('Excel file has no sheets');
        }

        // Extract raw data from the first sheet
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
        if (rawData.length === 0) {
          throw new Error('Excel sheet is empty. Please upload a file with data.');
        }
        
        console.log('Processing REVA file:', file.name);
        console.log('Raw data headers:', Object.keys(rawData[0] as object));
        
        // Extract headers from first row
        const headers = Object.keys(rawData[0] as object);
        const columnMapping = generateColumnMapping(headers);
        
        console.log('Column mapping:', columnMapping);
        
        // Check for minimum required columns - removed usageRank from required fields
        const requiredFields = [
          'description', 'revaUsage', 'avgCost', 
          'nextCost', 'currentREVAPrice'
        ];
        
        const missingFields = requiredFields.filter(field => !columnMapping[field]);
        
        if (missingFields.length > 0) {
          const missingFieldsMessage = missingFields.map(field => {
            const variants = columnVariations[field as keyof typeof columnVariations].join(', ');
            return `${field} (looking for columns like: ${variants})`;
          }).join(', ');
          
          throw new Error(`Missing required columns: ${missingFieldsMessage}. Please ensure your file includes these fields or rename columns accordingly.`);
        }
        
        // Process the data using the dynamic column mapping
        const transformedData = rawData.map((row: any) => transformRowWithMapping(row, columnMapping));
        
        // Process the data into required structure for the engine room
        const processedData = processRawData(transformedData, file.name);
        
        // Store the data in localStorage for persistence
        localStorage.setItem('engineRoomData', JSON.stringify(processedData));
        
        resolve(processedData);
      } catch (error) {
        console.error('Excel processing error:', error);
        reject(new Error(error instanceof Error ? error.message : 'Invalid Excel file format. Please ensure your file follows the required structure.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file. Please try again.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Column variations for matching
const columnVariations = {
  description: ['description', 'desc', 'product', 'item'],
  inStock: ['instock', 'in stock', 'stock', 'quantity', 'qty'],
  inRF: ['inrf', 'in rf', 'rf'],
  onOrder: ['onorder', 'on order', 'order', 'ordered'],
  blocked: ['blocked'],
  keepRemove: ['keep/remove', 'keep', 'remove'],
  revaUsage: ['revausage', 'usage', 'reva usage', 'monthly usage', 'sales', 'units sold'],
  usageRank: ['usagerank', 'usage rank', 'rank', 'priority', 'group'],
  flag: ['flag', 'flags', 'note', 'comment'], // Expanded to look for flag column
  avgCost: ['avgcost', 'avg cost', 'average cost', 'cost', 'unit cost'],
  avgCostLessThanML: ['avgcost<ml', 'avgcost < ml'],
  nextCost: ['nextcost', 'next cost', 'next buying price', 'future cost', 'new cost'],
  trend: ['trend', 'downwards', 'upwards'],
  currentREVAPrice: ['currentrevaprice', 'current reva price', 'price', 'selling price', 'current price', 'reva price'],
  currentREVAMargin: ['currentrevamargin', 'current reva %', 'margin', 'current margin', 'reva margin', 'current reva margin'],
  eth_net: ['eth_net', 'eth net', 'ethnet', 'market low'],
  eth: ['eth', 'eth price'],
  nupharm: ['nupharm', 'nu pharm', 'nupharm price'],
  lexon: ['lexon', 'lexon price'],
  aah: ['aah', 'aah price']
};

// Transform the row data using the dynamic column mapping
function transformRowWithMapping(row: any, mapping: Record<string, string>): RevaItem {
  const transformed: RevaItem = {
    description: String(row[mapping.description] || ''),
    inStock: Number(row[mapping.inStock] || 0),
    onOrder: Number(row[mapping.onOrder] || 0),
    revaUsage: Number(row[mapping.revaUsage] || 0),
    avgCost: Number(row[mapping.avgCost] || 0),
    nextCost: Number(row[mapping.nextCost] || 0),
    currentREVAPrice: Number(row[mapping.currentREVAPrice] || 0),
    // Calculate current margin directly regardless if it exists in the file
    currentREVAMargin: 0, // Will be calculated below
  };
  
  // Calculate the current margin properly using the same formula as for proposed margin
  if (transformed.currentREVAPrice > 0 && transformed.avgCost >= 0) {
    transformed.currentREVAMargin = (transformed.currentREVAPrice - transformed.avgCost) / transformed.currentREVAPrice;
  } else {
    // If we can't calculate it properly (missing price or cost), try to use the value from the file as fallback
    if (mapping.currentREVAMargin && row[mapping.currentREVAMargin] !== undefined) {
      const rawMargin = row[mapping.currentREVAMargin];
      if (rawMargin !== undefined) {
        transformed.currentREVAMargin = parseFloat(String(rawMargin).replace('%', '')) / 100;
      }
    }
  }
  
  // Add optional fields
  if (mapping.inRF && row[mapping.inRF] !== undefined) transformed.inRF = Number(row[mapping.inRF]);
  if (mapping.blocked && row[mapping.blocked] !== undefined) transformed.blocked = Number(row[mapping.blocked]);
  if (mapping.keepRemove && row[mapping.keepRemove] !== undefined) transformed.keepRemove = String(row[mapping.keepRemove]);
  
  // Look for flag column and get flags
  if (mapping.flag && row[mapping.flag] !== undefined) {
    const flagValue = String(row[mapping.flag]);
    transformed.flag = flagValue;
    
    // Check specifically for 'SHORT' flag in the flag column (case insensitive)
    if (flagValue.toUpperCase().includes('SHORT')) {
      if (!transformed.flags) transformed.flags = [];
      transformed.flags.push('SHORT');
    }
  }
  
  // Check if we have a usage rank column, but it's no longer required
  if (mapping.usageRank && row[mapping.usageRank] !== undefined) {
    transformed.usageRank = Number(row[mapping.usageRank]);
  }
  
  if (mapping.avgCostLessThanML && row[mapping.avgCostLessThanML] !== undefined) transformed.avgCostLessThanML = String(row[mapping.avgCostLessThanML]);
  if (mapping.trend && row[mapping.trend] !== undefined) transformed.trend = String(row[mapping.trend]);
  
  // Add optional competitor pricing fields
  if (mapping.eth_net && row[mapping.eth_net] !== undefined) transformed.eth_net = Number(row[mapping.eth_net]);
  if (mapping.eth && row[mapping.eth] !== undefined) transformed.eth = Number(row[mapping.eth]);
  if (mapping.nupharm && row[mapping.nupharm] !== undefined) transformed.nupharm = Number(row[mapping.nupharm]);
  if (mapping.lexon && row[mapping.lexon] !== undefined) transformed.lexon = Number(row[mapping.lexon]);
  if (mapping.aah && row[mapping.aah] !== undefined) transformed.aah = Number(row[mapping.aah]);
  
  return transformed;
}

// Process raw data into the structure needed for the engine room
const processRawData = (transformedData: RevaItem[], fileName: string): ProcessedEngineData => {
  // Calculate usage rank if it doesn't exist
  if (!transformedData.some(item => item.usageRank !== undefined)) {
    // Sort by usage in descending order
    const sortedByUsage = [...transformedData].sort((a, b) => b.revaUsage - a.revaUsage);
    
    // Calculate the number of items per rank group (roughly dividing into 6 groups)
    const totalItems = transformedData.length;
    const itemsPerGroup = Math.ceil(totalItems / 6);
    
    // Assign ranks 1-6 based on usage volume
    sortedByUsage.forEach((item, index) => {
      const rank = Math.min(Math.floor(index / itemsPerGroup) + 1, 6);
      
      // Find the original item in transformedData and assign the rank
      const originalItem = transformedData.find(i => i.description === item.description);
      if (originalItem) {
        originalItem.usageRank = rank;
      }
    });
  }
  
  // Map trend values if they exist
  transformedData.forEach(item => {
    if (item.trend) {
      // Map "Downwards" to "TrendDown" and any other value to "TrendFlatUp"
      item.trend = item.trend.toLowerCase().includes('down') ? 'TrendDown' : 'TrendFlatUp';
    } else {
      // Set default trend based on cost comparison
      item.trend = item.nextCost <= item.avgCost ? 'TrendDown' : 'TrendFlatUp';
    }
    
    // Initialize flags array for each item
    item.flags = item.flags || [];
    
    // Add any existing flag from FLAG column
    if (item.flag && item.flag.trim() !== '' && !item.flags.includes(item.flag.trim())) {
      item.flags.push(item.flag.trim());
    }
  });
  
  // Apply pricing rules and calculate derived values
  const processedItems = applyPricingRules(transformedData, defaultRuleConfig);
  
  // Filter items with flags
  const flaggedItems = processedItems.filter(item => item.flag1 || item.flag2 || (item.flags && item.flags.length > 0));
  
  // Calculate summary metrics
  const totalItems = processedItems.length;
  const activeItems = processedItems.filter(item => item.inStock > 0 || item.onOrder > 0).length;
  
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let currentTotalProfit = 0;
  let totalUsageWeightedMargin = 0;
  let totalUsage = 0;
  let avgCostLessThanMLCount = 0;
  
  processedItems.forEach(item => {
    // Fixed: Check if revaUsage and proposedPrice/currentREVAPrice are numbers (including zero)
    // instead of using them directly in a condition which would exclude zeros
    if (typeof item.revaUsage === 'number') {
      // Calculate revenue and profit based on proposed prices
      const itemPrice = typeof item.proposedPrice === 'number' ? item.proposedPrice : 
                        (typeof item.currentREVAPrice === 'number' ? item.currentREVAPrice : 0);
      
      const itemRevenue = itemPrice * item.revaUsage;
      const itemCost = item.avgCost * item.revaUsage;
      const itemProfit = itemRevenue - itemCost;
      
      // Calculate current profit for comparison
      const currentItemRevenue = (typeof item.currentREVAPrice === 'number' ? item.currentREVAPrice : 0) * item.revaUsage;
      const currentItemProfit = currentItemRevenue - itemCost;
      
      // Calculate usage-weighted margin for this item
      let itemMargin = 0;
      if (itemPrice > 0) {
        itemMargin = (itemPrice - item.avgCost) / itemPrice;
      }
      const usageWeightedMargin = itemMargin * item.revaUsage;
      
      totalRevenue += itemRevenue;
      totalCost += itemCost;
      totalProfit += itemProfit;
      currentTotalProfit += currentItemProfit;
      totalUsageWeightedMargin += usageWeightedMargin;
      totalUsage += item.revaUsage;
    }
    
    // Count items where avgCost is less than marketLow
    if (item.marketLow && item.avgCost < item.marketLow) {
      avgCostLessThanMLCount++;
    }
  });
  
  // FIX: Calculate overall usage-weighted margin correctly
  // Previously this was using totalUsageWeightedMargin/totalUsage which might be too small numerically
  // Let's calculate it based on totalProfit and totalRevenue instead
  let overallMargin = 0;
  if (totalRevenue > 0) {
    overallMargin = (totalProfit / totalRevenue) * 100;
  }
  
  const currentOverallMargin = totalRevenue > 0 ? (currentTotalProfit / totalRevenue) * 100 : 0;
  
  // Calculate profit delta and margin lift
  const profitDelta = currentTotalProfit > 0 
    ? ((totalProfit - currentTotalProfit) / currentTotalProfit) * 100 
    : 0;
    
  const marginLift = overallMargin - currentOverallMargin;

  // For chart data, we now pass the raw processedItems to the chart component
  // which will handle the grouping by usage volume
  const chartData = processedItems;
  
  return {
    fileName,
    totalItems,
    activeItems,
    totalRevenue,
    totalCost,
    totalProfit,
    overallMargin,
    avgCostLessThanMLCount,
    rule1Flags: processedItems.filter(item => item.flag1).length,
    rule2Flags: processedItems.filter(item => item.flag2).length,
    profitDelta,
    marginLift,
    items: processedItems,
    flaggedItems,
    chartData,
    ruleConfig: defaultRuleConfig
  };
};

// Default rule configuration
const defaultRuleConfig: RuleConfig = {
  rule1: {
    group1_2: { trend_down: 1.03, trend_flat_up: 1.05 },
    group3_4: { trend_down: 1.04, trend_flat_up: 1.06 },
    group5_6: { trend_down: 1.05, trend_flat_up: 1.07 }
  },
  rule2: {
    group1_2: { trend_down: 1.12, trend_flat_up: 1.15 },
    group3_4: { trend_down: 1.13, trend_flat_up: 1.18 },
    group5_6: { trend_down: 1.15, trend_flat_up: 1.20 }
  }
};

// Apply pricing rules to the data - Updated with new rule logic
function applyPricingRules(items: RevaItem[], ruleConfig: RuleConfig): RevaItem[] {
  return items.map(item => {
    // Make a copy of the item to avoid modifying the original
    const processedItem = { ...item };
    
    // Calculate Market Low
    processedItem.marketLow = processedItem.eth_net !== undefined && processedItem.eth_net > 0 
      ? processedItem.eth_net
      : Math.min(
          processedItem.eth || Infinity,
          processedItem.nupharm || Infinity, 
          processedItem.lexon || Infinity, 
          processedItem.aah || Infinity
        );
    
    // Calculate True Market Low - this is the absolute lowest price across all competitors
    processedItem.trueMarketLow = Math.min(
      processedItem.eth_net || Infinity,
      processedItem.eth || Infinity,
      processedItem.nupharm || Infinity, 
      processedItem.lexon || Infinity, 
      processedItem.aah || Infinity
    );
    
    // If true market low is Infinity (no competitor prices given), use the market low or avg cost as fallback
    if (processedItem.trueMarketLow === Infinity) {
      processedItem.trueMarketLow = processedItem.marketLow || processedItem.avgCost;
    }
    
    // If market low is Infinity, use the true market low or the avg cost
    if (processedItem.marketLow === Infinity) {
      processedItem.marketLow = processedItem.trueMarketLow || processedItem.avgCost;
    }
    
    // RULE ONE - New Implementation
    // IF AVGCO ≤ MARKET LOW
    if (processedItem.avgCost <= processedItem.marketLow) {
      // Check market trend (a) Market Trending DOWN
      if (processedItem.nextCost <= processedItem.avgCost) {
        // THEN PRICE = MARKET LOW
        processedItem.proposedPrice = processedItem.marketLow;
        processedItem.appliedRule = "Rule 1a - Market Low (Trending DOWN)";
      } 
      // (b) Market Trending UP
      else {
        // THEN PRICE = MARKET LOW + 3%
        processedItem.proposedPrice = processedItem.marketLow * 1.03;
        processedItem.appliedRule = "Rule 1b - Market Low + 3% (Trending UP)";
      }
    }
    // Exceptions
    else {
      // IF MARKET LOW is unavailable BUT TRUE MARKET LOW is available
      if ((processedItem.marketLow === undefined || processedItem.marketLow === processedItem.avgCost) && 
          processedItem.trueMarketLow !== undefined && 
          processedItem.trueMarketLow !== processedItem.avgCost) {
        // THEN PRICE = TRUE MARKET LOW + 3%
        processedItem.proposedPrice = processedItem.trueMarketLow * 1.03;
        processedItem.appliedRule = "Rule 1 Exception - True Market Low + 3%";
      }
      // IF Competitor pricing (including TRUE MARKET LOW) is unavailable
      else {
        // THEN PRICE = AVGCO + 12%, increasing by an additional 1% for every two usage groups higher
        const rankAdjustment = Math.floor((processedItem.usageRank - 1) / 2) * 0.01;
        const baseMargin = 0.12 + rankAdjustment;
        processedItem.proposedPrice = processedItem.avgCost * (1 + baseMargin);
        processedItem.appliedRule = `Rule 1 Exception - AvgCost + ${Math.round(baseMargin * 100)}% (Rank ${processedItem.usageRank})`;
      }
    }
    
    // Ensure we never go below current price
    processedItem.proposedPrice = Math.max(processedItem.proposedPrice || 0, processedItem.currentREVAPrice || 0);
    
    // Store the calculated price for reference
    processedItem.calculatedPrice = processedItem.proposedPrice;
    
    // Calculate proposed margin
    if (processedItem.proposedPrice > 0) {
      processedItem.proposedMargin = (processedItem.proposedPrice - processedItem.avgCost) / processedItem.proposedPrice;
    } else {
      processedItem.proposedMargin = 0;
    }
    
    // Apply flag logic - IMPORTANT CHECK: Any computed price that is ≥10% above TRUE MARKET LOW requires a manual review
    if (processedItem.trueMarketLow && processedItem.proposedPrice && 
        processedItem.proposedPrice >= processedItem.trueMarketLow * 1.10) {
      processedItem.flag1 = true;
      if (!processedItem.flags) processedItem.flags = [];
      if (!processedItem.flags.includes('HIGH_PRICE')) {
        processedItem.flags.push('HIGH_PRICE');
      }
    } else {
      processedItem.flag1 = false;
    }
    
    // Keep the margin check
    processedItem.flag2 = processedItem.proposedMargin < 0.03;
    if (processedItem.flag2 && (!processedItem.flags || !processedItem.flags.includes('LOW_MARGIN'))) {
      if (!processedItem.flags) processedItem.flags = [];
      processedItem.flags.push('LOW_MARGIN');
    }

    // Add ID field for easier item identification if it doesn't already exist
    if (!processedItem.id) {
      processedItem.id = `item-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return processedItem;
  });
}
