
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

// Maps the expected columns to the actual columns in the file
const columnMapping = {
  description: "Description",
  inStock: "InStock",
  onOrder: "OnOrder",
  revaUsage: "RevaUsage",
  usageRank: "UsageRank",
  avgCost: "AvgCost",
  nextCost: "NextCost",
  currentREVAPrice: "CurrentREVAPrice",
  currentREVAMargin: "CurrentREVAMargin",
  eth_net: "ETH_NET",
  eth: "ETH",
  nupharm: "Nupharm",
  lexon: "LEXON",
  aah: "AAH"
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
        const rawData = extractSheetData(workbook, sheetNames[0]);
        console.log('Processing REVA file:', file.name);
        
        // Process the data into required structure for the engine room
        const processedData = processRawData(rawData, file.name);
        
        // Store the data in localStorage for persistence
        localStorage.setItem('engineRoomData', JSON.stringify(processedData));
        
        resolve(processedData);
      } catch (error) {
        console.error('Excel processing error:', error);
        reject(new Error('Invalid Excel file format. Please ensure your file follows the required structure.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file. Please try again.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Extract data from the spreadsheet
const extractSheetData = (workbook: XLSX.WorkBook, sheetName: string): any[] => {
  if (!workbook.Sheets[sheetName]) {
    throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
  }
  
  const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  // Validate that required columns exist
  if (jsonData.length > 0) {
    const firstRow = jsonData[0] as any;
    
    // Check for minimum required columns
    const requiredColumns = [
      "Description", "InStock", "OnOrder", "RevaUsage", 
      "UsageRank", "AvgCost", "NextCost", "CurrentREVAPrice"
    ];
    
    const missingColumns = requiredColumns.filter(col => firstRow[col] === undefined);
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
    }
  }
  
  return jsonData;
};

// Transform the row data from the actual column names to our expected format
function transformRowData(row: any): RevaItem {
  const transformed: RevaItem = {
    description: String(row[columnMapping.description] || ''),
    inStock: Number(row[columnMapping.inStock] || 0),
    onOrder: Number(row[columnMapping.onOrder] || 0),
    revaUsage: Number(row[columnMapping.revaUsage] || 0),
    usageRank: Number(row[columnMapping.usageRank] || 6),
    avgCost: Number(row[columnMapping.avgCost] || 0),
    nextCost: Number(row[columnMapping.nextCost] || 0),
    currentREVAPrice: Number(row[columnMapping.currentREVAPrice] || 0),
    currentREVAMargin: Number(row[columnMapping.currentREVAMargin] || 0),
  };
  
  // Add optional competitor pricing fields
  if (row[columnMapping.eth_net] !== undefined) transformed.eth_net = Number(row[columnMapping.eth_net]);
  if (row[columnMapping.eth] !== undefined) transformed.eth = Number(row[columnMapping.eth]);
  if (row[columnMapping.nupharm] !== undefined) transformed.nupharm = Number(row[columnMapping.nupharm]);
  if (row[columnMapping.lexon] !== undefined) transformed.lexon = Number(row[columnMapping.lexon]);
  if (row[columnMapping.aah] !== undefined) transformed.aah = Number(row[columnMapping.aah]);
  
  return transformed;
}

// Process raw data into the structure needed for the engine room
const processRawData = (rawData: any[], fileName: string): ProcessedEngineData => {
  // Transform raw data into our format
  const transformedData = rawData.map(transformRowData);
  
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
