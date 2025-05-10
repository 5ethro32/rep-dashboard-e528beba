
import * as XLSX from 'xlsx';

// Define the types of the data
interface RevaItem {
  description: string;
  inStock: number;
  onOrder: number;
  revaUsage: number;
  usageRank: number;
  avgCost: number;
  nextCost: number;
  currentREVAPrice: number;
  currentREVAMargin: number;
  eth_net?: number;
  eth?: number;
  nupharm?: number;
  lexon?: number;
  aah?: number;
  marketLow?: number;
  trueMarketLow?: number;
  trend?: string;
  appliedRule?: string;
  proposedPrice?: number;
  proposedMargin?: number;
  flag1?: boolean;
  flag2?: boolean;
}

interface ProcessedEngineData {
  fileName: string;
  totalItems: number;
  activeItems: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  overallMargin: number;
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
    onOrder: ['onorder', 'on order', 'order', 'ordered'],
    revaUsage: ['revausage', 'usage', 'monthly usage', 'sales', 'units sold'],
    usageRank: ['usagerank', 'usage rank', 'rank', 'priority', 'group'],
    avgCost: ['avgcost', 'avg cost', 'average cost', 'cost', 'unit cost'],
    nextCost: ['nextcost', 'next cost', 'future cost', 'new cost'],
    currentREVAPrice: ['currentrevaprice', 'price', 'selling price', 'current price', 'reva price'],
    currentREVAMargin: ['currentrevamargin', 'margin', 'current margin', 'reva margin'],
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
        
        // Extract headers from first row
        const headers = Object.keys(rawData[0] as object);
        const columnMapping = generateColumnMapping(headers);
        
        // Check for minimum required columns
        const requiredFields = [
          'description', 'revaUsage', 'usageRank', 'avgCost', 
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
  onOrder: ['onorder', 'on order', 'order', 'ordered'],
  revaUsage: ['revausage', 'usage', 'monthly usage', 'sales', 'units sold'],
  usageRank: ['usagerank', 'usage rank', 'rank', 'priority', 'group'],
  avgCost: ['avgcost', 'avg cost', 'average cost', 'cost', 'unit cost'],
  nextCost: ['nextcost', 'next cost', 'future cost', 'new cost'],
  currentREVAPrice: ['currentrevaprice', 'price', 'selling price', 'current price', 'reva price'],
  currentREVAMargin: ['currentrevamargin', 'margin', 'current margin', 'reva margin'],
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
    usageRank: Number(row[mapping.usageRank] || 6),
    avgCost: Number(row[mapping.avgCost] || 0),
    nextCost: Number(row[mapping.nextCost] || 0),
    currentREVAPrice: Number(row[mapping.currentREVAPrice] || 0),
    currentREVAMargin: Number(row[mapping.currentREVAMargin] || 0),
  };
  
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
  // Apply pricing rules and calculate derived values
  const processedItems = applyPricingRules(transformedData, defaultRuleConfig);
  
  // Filter items with flags
  const flaggedItems = processedItems.filter(item => item.flag1 || item.flag2);
  
  // Calculate summary metrics
  const totalItems = processedItems.length;
  const activeItems = processedItems.filter(item => item.inStock > 0 || item.onOrder > 0).length;
  
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let currentTotalProfit = 0;
  
  processedItems.forEach(item => {
    // Calculate revenue and profit based on proposed prices
    const itemRevenue = (item.proposedPrice || 0) * item.revaUsage;
    const itemCost = item.avgCost * item.revaUsage;
    const itemProfit = itemRevenue - itemCost;
    
    // Calculate current profit for comparison
    const currentItemRevenue = item.currentREVAPrice * item.revaUsage;
    const currentItemProfit = currentItemRevenue - itemCost;
    
    totalRevenue += itemRevenue;
    totalCost += itemCost;
    totalProfit += itemProfit;
    currentTotalProfit += currentItemProfit;
  });
  
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const currentOverallMargin = totalRevenue > 0 ? (currentTotalProfit / totalRevenue) * 100 : 0;
  
  // Calculate profit delta and margin lift
  const profitDelta = currentTotalProfit > 0 
    ? ((totalProfit - currentTotalProfit) / currentTotalProfit) * 100 
    : 0;
    
  const marginLift = overallMargin - currentOverallMargin;

  // Generate chart data
  const chartData = generateChartData(processedItems);
  
  return {
    fileName,
    totalItems,
    activeItems,
    totalRevenue,
    totalCost,
    totalProfit,
    overallMargin,
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

// Apply pricing rules to the data
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
    
    // Calculate True Market Low
    processedItem.trueMarketLow = Math.min(
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
    
    // Determine trend
    processedItem.trend = processedItem.nextCost <= processedItem.avgCost ? 'TrendDown' : 'TrendFlatUp';
    
    // Determine which rule to apply
    if (processedItem.avgCost < processedItem.marketLow) {
      // Rule 1
      applyRule1(processedItem, ruleConfig);
    } else {
      // Rule 2
      applyRule2(processedItem, ruleConfig);
    }
    
    return processedItem;
  });
}

// Apply Rule 1 pricing logic
function applyRule1(item: RevaItem, config: RuleConfig): void {
  // Get appropriate multipliers based on usage rank and trend
  let multiplier: number;
  let ruleLabel: string;
  
  if (item.usageRank <= 2) {
    multiplier = item.trend === 'TrendDown' 
      ? config.rule1.group1_2.trend_down 
      : config.rule1.group1_2.trend_flat_up;
    ruleLabel = `1${item.trend === 'TrendDown' ? 'a' : 'b'} (Grp 1-2)`;
  } 
  else if (item.usageRank <= 4) {
    multiplier = item.trend === 'TrendDown' 
      ? config.rule1.group3_4.trend_down 
      : config.rule1.group3_4.trend_flat_up;
    ruleLabel = `1${item.trend === 'TrendDown' ? 'a' : 'b'} (Grp 3-4)`;
  }
  else {
    multiplier = item.trend === 'TrendDown' 
      ? config.rule1.group5_6.trend_down 
      : config.rule1.group5_6.trend_flat_up;
    ruleLabel = `1${item.trend === 'TrendDown' ? 'a' : 'b'} (Grp 5-6)`;
  }
  
  // Calculate proposed price
  item.appliedRule = ruleLabel;
  item.proposedPrice = Math.max(item.avgCost * multiplier, item.currentREVAPrice);
  
  // Calculate proposed margin
  item.proposedMargin = (item.proposedPrice - item.avgCost) / item.proposedPrice;
  
  // Apply flag logic for Rule 1
  item.flag1 = item.proposedPrice >= (item.trueMarketLow || 0) * 1.10;
  item.flag2 = false; // Not applicable for Rule 1
}

// Apply Rule 2 pricing logic
function applyRule2(item: RevaItem, config: RuleConfig): void {
  // Get appropriate multipliers based on usage rank and trend
  let multiplier: number;
  let ruleLabel: string;
  
  if (item.usageRank <= 2) {
    multiplier = item.trend === 'TrendDown' 
      ? config.rule2.group1_2.trend_down 
      : config.rule2.group1_2.trend_flat_up;
    ruleLabel = `2${item.trend === 'TrendDown' ? 'a' : 'b'} (Grp 1-2)`;
  } 
  else if (item.usageRank <= 4) {
    multiplier = item.trend === 'TrendDown' 
      ? config.rule2.group3_4.trend_down 
      : config.rule2.group3_4.trend_flat_up;
    ruleLabel = `2${item.trend === 'TrendDown' ? 'a' : 'b'} (Grp 3-4)`;
  }
  else {
    multiplier = item.trend === 'TrendDown' 
      ? config.rule2.group5_6.trend_down 
      : config.rule2.group5_6.trend_flat_up;
    ruleLabel = `2${item.trend === 'TrendDown' ? 'a' : 'b'} (Grp 5-6)`;
  }
  
  // Calculate proposed price, capping at market low if specified
  const calculatedPrice = Math.max(item.avgCost * multiplier, item.currentREVAPrice);
  item.proposedPrice = Math.min(calculatedPrice, item.marketLow || Infinity);
  
  // Calculate proposed margin
  item.proposedMargin = (item.proposedPrice - item.avgCost) / item.proposedPrice;
  
  // Set rule applied
  item.appliedRule = ruleLabel;
  
  // Apply flag logic for Rule 2
  item.flag1 = false; // Not applicable for Rule 2
  item.flag2 = item.proposedMargin < 0.03; // Flag if margin less than 3%
}

// Generate chart data for visualization
function generateChartData(items: RevaItem[]): any[] {
  // Group items by usage rank
  const groupedByRank: { [key: number]: RevaItem[] } = {};
  
  items.forEach(item => {
    if (!groupedByRank[item.usageRank]) {
      groupedByRank[item.usageRank] = [];
    }
    groupedByRank[item.usageRank].push(item);
  });
  
  // Generate chart data points
  return Object.keys(groupedByRank).map(rankKey => {
    const rank = Number(rankKey);
    const rankItems = groupedByRank[rank];
    
    // Calculate average values for this rank
    const avgMargin = rankItems.reduce((sum, item) => sum + (item.proposedMargin || 0), 0) / rankItems.length;
    const avgCurrentMargin = rankItems.reduce((sum, item) => sum + item.currentREVAMargin, 0) / rankItems.length;
    const totalProfit = rankItems.reduce((sum, item) => sum + ((item.proposedPrice || 0) - item.avgCost) * item.revaUsage, 0);
    const totalCurrentProfit = rankItems.reduce((sum, item) => sum + (item.currentREVAPrice - item.avgCost) * item.revaUsage, 0);
    
    return {
      name: `Rank ${rank}`,
      currentMargin: avgCurrentMargin * 100,
      proposedMargin: avgMargin * 100,
      currentProfit: totalCurrentProfit,
      proposedProfit: totalProfit,
      itemCount: rankItems.length
    };
  });
}
