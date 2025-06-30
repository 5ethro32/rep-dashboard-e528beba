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
  displayNextCost?: number; // Added for UI display of next cost
  nextCostMissing?: boolean; // Added to track missing next cost
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
  flag2?: boolean; // Margin at or below 0%
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
  noMarketPrice?: boolean; // Added for explicit tracking of missing market price
  marginCapApplied?: boolean; // Added to track if margin cap was applied
}

// Add change history record type
interface ChangeHistoryRecord {
  user: string;
  action: string;
  itemCount: number;
  date: string;
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
  currentAvgMargin: number;
  proposedAvgMargin: number;
  currentProfit: number;
  proposedProfit: number;
  items: RevaItem[];
  flaggedItems: RevaItem[];
  chartData: any[];
  ruleConfig: RuleConfig;
  // Add the change history property
  changeHistory?: ChangeHistoryRecord[];
  // Add optional property for current user
  currentUser?: string;
}

interface RuleConfig {
  rule1: {
    group1_2: { trend_down: number; trend_flat_up: number };
    group3_4: { trend_down: number; trend_flat_up: number };
    group5_6: { trend_down: number; trend_flat_up: number };
    // New margin cap parameters
    marginCaps: {
      group1_2: number; // Maximum 10% margin cap for groups 1-2
      group3_4: number; // Maximum 20% margin cap for groups 3-4
      group5_6: number; // Maximum 30% margin cap for groups 5-6
    };
  };
  rule2: {
    group1_2: { trend_down: number; trend_flat_up: number };
    group3_4: { trend_down: number; trend_flat_up: number };
    group5_6: { trend_down: number; trend_flat_up: number };
  };
}

// IMPROVED: More precise column matching - now checks for exact matches first
// before falling back to partial/fuzzy matches
const findColumnMatch = (headers: string[], possibleNames: string[]): string | null => {
  // First try exact matches (case insensitive)
  for (const header of headers) {
    for (const name of possibleNames) {
      if (header.toLowerCase() === name.toLowerCase()) {
        console.log(`Found exact match for ${name}: ${header}`);
        return header;
      }
    }
  }
  
  // If no exact match, try partial matches
  for (const header of headers) {
    for (const name of possibleNames) {
      if (header.toLowerCase().includes(name.toLowerCase())) {
        console.log(`Found partial match for ${name}: ${header}`);
        return header;
      }
    }
  }
  
  return null;
};

// Generate a dynamic column mapping based on the actual headers in the file
const generateColumnMapping = (headers: string[]) => {
  const mapping: Record<string, string> = {};
  
  // Define possible variations for each required field - IMPROVED: more specific patterns
  const columnVariations = {
    description: ['description', 'desc', 'product', 'item'],
    inStock: ['instock', 'in stock', 'stock', 'quantity', 'qty'],
    inRF: ['inrf', 'in rf', 'rf'],
    onOrder: ['onorder', 'on order', 'order', 'ordered'],
    blocked: ['blocked'],
    keepRemove: ['keep/remove', 'keep', 'remove'],
    revaUsage: ['revausage', 'usage', 'reva usage', 'monthly usage', 'sales', 'units sold'],
    usageRank: ['usagerank', 'usage rank', 'rank', 'priority', 'group'],
    flag: ['flag', 'flags', 'note', 'comment'],
    avgCost: ['avgcost', 'avg cost', 'average cost', 'cost', 'unit cost'],
    avgCostLessThanML: ['avgcost<ml', 'avgcost < ml'],
    // IMPROVED: More specific patterns for nextCost
    nextCost: ['next buying price', 'nextbuyingprice', 'nextcost', 'next cost', 'futurecost', 'future cost'],
    trend: ['trend', 'downwards', 'upwards'],
    // IMPROVED: More specific patterns for currentREVAPrice
    currentREVAPrice: ['current reva price', 'currentrevaprice', 'reva price', 'revaprice', 'current price', 'selling price'],
    currentREVAMargin: ['currentrevamargin', 'current reva %', 'reva margin', 'current reva margin', 'margin %'],
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
  
  // FIXED: Remove the check that could incorrectly map nextCost to currentREVAPrice
  // Instead, add validation to ensure they aren't using the same column
  
  // ADDED: Validation to ensure currentREVAPrice and nextCost are not using the same column
  if (mapping.currentREVAPrice && mapping.nextCost && 
      mapping.currentREVAPrice === mapping.nextCost) {
    console.error('Error: Current REVA Price and Next Buying Price are mapped to the same column!');
    console.log('Current column mapping:', mapping);
    
    // Force a manual lookup for the specifically named columns
    const exactCurrentPriceColumn = headers.find(h => 
      h.toLowerCase() === 'current reva price' || 
      h.toLowerCase() === 'currentrevaprice'
    );
    
    const exactNextCostColumn = headers.find(h => 
      h.toLowerCase() === 'next buying price' || 
      h.toLowerCase() === 'nextbuyingprice'
    );
    
    if (exactCurrentPriceColumn) {
      mapping.currentREVAPrice = exactCurrentPriceColumn;
      console.log(`Forced Current REVA Price to use column: ${exactCurrentPriceColumn}`);
    }
    
    if (exactNextCostColumn) {
      mapping.nextCost = exactNextCostColumn;
      console.log(`Forced Next Buying Price to use column: ${exactNextCostColumn}`);
    }
    
    // If still have collision, prioritize the most specific column names
    if (mapping.currentREVAPrice === mapping.nextCost) {
      // Look for the most specific column names as a last resort
      for (const header of headers) {
        if (header.toLowerCase().includes('reva') && header.toLowerCase().includes('price')) {
          mapping.currentREVAPrice = header;
          console.log(`Last resort: Set Current REVA Price to use column: ${header}`);
        } else if (header.toLowerCase().includes('next') && header.toLowerCase().includes('buy')) {
          mapping.nextCost = header;
          console.log(`Last resort: Set Next Buying Price to use column: ${header}`);
        }
      }
    }
  }
  
  // Add detailed debug logging
  console.log('Final column mapping:');
  console.log('Current REVA Price mapped to column:', mapping.currentREVAPrice);
  console.log('Next Buying Price mapped to column:', mapping.nextCost);
  
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
        
        // Initialize changeHistory if it doesn't exist
        if (!processedData.changeHistory) {
          processedData.changeHistory = [];
        }
        
        // Store the data in localStorage for persistence (with error handling for quota exceeded)
        try {
          localStorage.setItem('engineRoomData', JSON.stringify(processedData));
        } catch (error) {
          console.warn('Failed to store full data in localStorage (quota exceeded):', error);
          // Clear any existing data and try storing only essential data
          localStorage.removeItem('engineRoomData');
          try {
            // Create a reduced dataset with only essential information
            const essentialData = {
              fileName: processedData.fileName,
              totalItems: processedData.totalItems,
              activeItems: processedData.activeItems,
              totalRevenue: processedData.totalRevenue,
              totalCost: processedData.totalCost,
              totalProfit: processedData.totalProfit,
              overallMargin: processedData.overallMargin,
              avgCostLessThanMLCount: processedData.avgCostLessThanMLCount,
              rule1Flags: processedData.rule1Flags,
              rule2Flags: processedData.rule2Flags,
              profitDelta: processedData.profitDelta,
              marginLift: processedData.marginLift,
              currentAvgMargin: processedData.currentAvgMargin,
              proposedAvgMargin: processedData.proposedAvgMargin,
              currentProfit: processedData.currentProfit,
              proposedProfit: processedData.proposedProfit,
              // Store only flagged items and a subset of all items to reduce size
              items: processedData.items.slice(0, 1000), // Limit to first 1000 items
              flaggedItems: processedData.flaggedItems, // Keep all flagged items for analysis
              chartData: processedData.chartData,
              ruleConfig: processedData.ruleConfig,
              changeHistory: processedData.changeHistory || [],
              currentUser: processedData.currentUser,
              isReducedDataset: true // Flag to indicate this is a reduced dataset
            };
            localStorage.setItem('engineRoomData', JSON.stringify(essentialData));
            console.log('Stored reduced dataset due to size constraints');
          } catch (secondError) {
            console.warn('Failed to store even essential data, proceeding without localStorage persistence');
            // Continue without localStorage - the application will still work but won't persist data
          }
        }
        
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
  flag: ['flag', 'flags', 'note', 'comment'],
  avgCost: ['avgcost', 'avg cost', 'average cost', 'cost', 'unit cost'],
  avgCostLessThanML: ['avgcost<ml', 'avgcost < ml'],
  // IMPROVED: More specific patterns for nextCost
  nextCost: ['next buying price', 'nextbuyingprice', 'nextcost', 'next cost', 'futurecost', 'future cost'],
  trend: ['trend', 'downwards', 'upwards'],
  // IMPROVED: More specific patterns for currentREVAPrice
  currentREVAPrice: ['current reva price', 'currentrevaprice', 'reva price', 'revaprice', 'current price', 'selling price'],
  currentREVAMargin: ['currentrevamargin', 'current reva %', 'reva margin', 'current reva margin', 'margin %'],
  eth_net: ['eth_net', 'eth net', 'ethnet', 'market low'],
  eth: ['eth', 'eth price'],
  nupharm: ['nupharm', 'nu pharm', 'nupharm price'],
  lexon: ['lexon', 'lexon price'],
  aah: ['aah', 'aah price']
};

// Transform the row data using the dynamic column mapping
function transformRowWithMapping(row: any, mapping: Record<string, string>): RevaItem {
  // ADDED: Debug logs to show the exact values being read for important fields
  const rawCurrentPrice = row[mapping.currentREVAPrice];
  const rawNextCost = row[mapping.nextCost];
  const rawAvgCost = row[mapping.avgCost];
  
  console.log('Raw values for item:', row[mapping.description]);
  console.log('  Current REVA Price:', rawCurrentPrice);
  console.log('  Next Buying Price:', rawNextCost);
  console.log('  Avg Cost:', rawAvgCost);
  
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
  
  // FIXED: Calculate currentREVAMargin with CORRECT formula (price - cost) / price * 100
  if (transformed.currentREVAPrice > 0) {
    transformed.currentREVAMargin = ((transformed.currentREVAPrice - transformed.avgCost) / transformed.currentREVAPrice) * 100;
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
  // Calculate usage rank based on usage volume ranking
  // Sort by usage and assign ranks 1-6 based on index ranges per the updated specification
  const sortedByUsage = [...transformedData].sort((a, b) => b.revaUsage - a.revaUsage);
  
  // Assign ranks 1-6 based on updated index ranges (200 items per group)
  sortedByUsage.forEach((item, index) => {
    let rank;
    if (index < 200) rank = 1;         // Updated: Group 1: Ranks 1-200
    else if (index < 400) rank = 2;    // Updated: Group 2: Ranks 201-400
    else if (index < 600) rank = 3;    // Updated: Group 3: Ranks 401-600
    else if (index < 800) rank = 4;    // Updated: Group 4: Ranks 601-800
    else if (index < 1000) rank = 5;   // Updated: Group 5: Ranks 801-1000
    else rank = 6;                     // Updated: Group 6: Ranks 1001+
    
    // Find the original item in transformedData and assign the rank
    const originalItem = transformedData.find(i => i.description === item.description);
    if (originalItem) {
      originalItem.usageRank = rank;
    }
  });
  
  // Set market trend for each item
  transformedData.forEach(item => {
    // Log the original values to help debug
    console.log(`Processing item: ${item.description}`);
    console.log(`  Original currentREVAPrice: ${item.currentREVAPrice}`);
    console.log(`  Original nextCost: ${item.nextCost}`);
    
    // Check if Next Buying Price is missing or zero
    const nextCostMissing = !item.nextCost || item.nextCost === 0;
    
    // Set nextCostMissing flag
    item.nextCostMissing = nextCostMissing;
    
    // Store the original value (0 or undefined) as displayNextCost for UI
    item.displayNextCost = nextCostMissing ? 0 : item.nextCost;
    
    // IMPROVED: Add a check to prevent setting currentREVAPrice to nextCost if they are identical
    // Add flag if both currentREVAPrice and nextCost are identical but not zero
    if (item.currentREVAPrice > 0 && item.nextCost > 0 && 
        Math.abs(item.currentREVAPrice - item.nextCost) < 0.001) {
      if (!item.flags) item.flags = [];
      item.flags.push("Current Price matches Next BP");
      console.log(`  WARNING: Current Price (${item.currentREVAPrice}) matches Next BP (${item.nextCost})`);
    }
    
    // If Next Buying Price is missing, set it to AvgCost for calculation purposes
    if (nextCostMissing) {
      item.nextCost = item.avgCost;
      if (!item.flags) item.flags = [];
      item.flags.push("Missing Next Buying Price");
    }
    
    // Determine market trend based on Next Buying Price vs AvgCost
    if (item.nextCost <= item.avgCost) {
      item.trend = 'TrendDown';
    } else {
      item.trend = 'TrendFlatUp';
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
  
  // For calculating current vs proposed metrics
  let currentRevenue = 0;
  let proposedRevenue = 0;
  
  processedItems.forEach(item => {
    // Log margin values for each item to help debug
    console.log('Margin values for item:', {
      id: item.id || 'unknown',
      description: item.description,
      proposedMargin: item.proposedMargin,
      currentREVAMargin: item.currentREVAMargin,
      proposedPrice: item.proposedPrice,
      nextCost: item.nextCost,
      calculatedMargin: item.proposedPrice && item.nextCost ? 
        ((item.proposedPrice - item.nextCost) / item.proposedPrice) * 100 : 0
    });
    
    // Fixed: Check if revaUsage and proposedPrice/currentREVAPrice are numbers (including zero)
    if (typeof item.revaUsage === 'number') {
      // Calculate revenue and profit based on proposed prices
      const itemPrice = typeof item.proposedPrice === 'number' ? item.proposedPrice : 
                      (typeof item.currentREVAPrice === 'number' ? item.currentREVAPrice : 0);
      
      const itemRevenue = itemPrice * item.revaUsage;
      const itemCost = item.avgCost * item.revaUsage;
      
      // CRITICAL FIX: Use CORRECT formula for profit calculation: revenue - cost
      // Changed from itemCost - itemRevenue to itemRevenue - itemCost
      const itemProfit = itemRevenue - itemCost;
      
      // Calculate current profit for comparison
      const currentItemRevenue = (typeof item.currentREVAPrice === 'number' ? item.currentREVAPrice : 0) * item.revaUsage;
      // CRITICAL FIX: Use CORRECT formula for current profit calculation: revenue - cost
      // Changed from itemCost - currentItemRevenue to currentItemRevenue - itemCost
      const currentItemProfit = currentItemRevenue - itemCost;
      
      // Calculate usage-weighted margin for this item
      let itemMargin = 0;
      if (itemPrice > 0) {
        // CRITICAL FIX: Use CORRECT formula for margin calculation: (price - cost) / price
        // Changed from (itemCost - itemPrice) / itemPrice to (itemPrice - itemCost) / itemPrice
        itemMargin = (itemPrice - item.avgCost) / itemPrice;
      }
      const usageWeightedMargin = itemMargin * item.revaUsage;
      
      totalRevenue += itemRevenue;
      totalCost += itemCost;
      totalProfit += itemProfit;
      currentTotalProfit += currentItemProfit;
      totalUsageWeightedMargin += usageWeightedMargin;
      totalUsage += item.revaUsage;
      
      // For current vs proposed metrics
      currentRevenue += currentItemRevenue;
      proposedRevenue += itemRevenue;
    }
    
    // Count items where avgCost is less than marketLow
    if (item.marketLow && item.avgCost < item.marketLow) {
      avgCostLessThanMLCount++;
    }
  });
  
  // FIX: Calculate overall margin and comparison metrics correctly
  let overallMargin = 0;
  let currentAvgMargin = 0;
  let proposedAvgMargin = 0;
  
  if (totalRevenue > 0) {
    // CRITICAL FIX: Ensure margin calculated correctly - already using correct formula
    overallMargin = (totalProfit / totalRevenue) * 100;
  }
  if (currentRevenue > 0) {
    // CRITICAL FIX: Ensure margin calculated correctly - already using correct formula
    currentAvgMargin = (currentTotalProfit / currentRevenue) * 100;
  }
  if (proposedRevenue > 0) {
    // CRITICAL FIX: Ensure margin calculated correctly - already using correct formula
    proposedAvgMargin = (totalProfit / proposedRevenue) * 100;
  }
  
  // Calculate profit delta and margin lift
  const profitDelta = currentTotalProfit > 0 
    ? ((totalProfit - currentTotalProfit) / currentTotalProfit) * 100 
    : 0;
    
  const marginLift = proposedAvgMargin - currentAvgMargin;

  // For chart data, we pass the raw processedItems to the chart component
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
    currentAvgMargin,
    proposedAvgMargin,
    currentProfit: currentTotalProfit,
    proposedProfit: totalProfit,
    items: processedItems,
    flaggedItems,
    chartData,
    ruleConfig: defaultRuleConfig,
    // Initialize an empty change history array
    changeHistory: []
  };
};

// Updated rule configuration based on new definitions and margin caps
const defaultRuleConfig: RuleConfig = {
  rule1: {
    // Rule 1a and 1b (when AvgCost < Market Low)
    group1_2: { trend_down: 1.00, trend_flat_up: 1.03 }, // Rule 1a: ML + 0%, Rule 1b: ML + 3%
    group3_4: { trend_down: 1.01, trend_flat_up: 1.04 }, // Rule 1a: ML + 1%, Rule 1b: ML + 4%
    group5_6: { trend_down: 1.02, trend_flat_up: 1.05 },  // Rule 1a: ML + 2%, Rule 1b: ML + 5%
    // New margin caps by group
    marginCaps: {
      group1_2: 0.10, // Maximum 10% margin cap for groups 1-2
      group3_4: 0.20, // Maximum 20% margin cap for groups 3-4
      group5_6: 0.30, // Maximum 30% margin cap for groups 5-6
    }
  },
  rule2: {
    // For Rule 1b and Rule 2 cost-based pricing (AvgCost markup)
    group1_2: { trend_down: 1.12, trend_flat_up: 1.12 }, // AvgCost + 12%
    group3_4: { trend_down: 1.13, trend_flat_up: 1.13 }, // AvgCost + 13%
    group5_6: { trend_down: 1.14, trend_flat_up: 1.14 }  // AvgCost + 14%
  }
};

// Apply pricing rules to the data - Implementing the detailed rule logic from the provided specs
function applyPricingRules(items: RevaItem[], ruleConfig: RuleConfig): RevaItem[] {
  return items.map(item => {
    // Make a copy of the item to avoid modifying the original
    const processedItem = { ...item };
    
    // Initialize the marginCapApplied flag as false
    processedItem.marginCapApplied = false;
    
    // FIXED: Only set Market Low (ML) to ETH NET price, not TML
    // This is the critical fix: Market Low should ONLY be set to ETH_NET
    // When ETH_NET is missing, Market Low should remain undefined/null
    processedItem.marketLow = processedItem.eth_net;
    
    // Calculate True Market Low (TML) - Lowest price across all competitors including ETH NET
    const { trueMarketLow, hasValidTrueMarketLow } = findTrueMarketLow(processedItem);
    
    // Set trueMarketLow and noMarketPrice flag
    if (!hasValidTrueMarketLow) {
      processedItem.trueMarketLow = 0;
      processedItem.noMarketPrice = true;
      
      // Flag as "No Market Price Available" - only when truly no prices available
      if (!processedItem.flags) processedItem.flags = [];
      if (!processedItem.flags.includes('No Market Price Available')) {
        processedItem.flags.push('No Market Price Available');
      }
    } else {
      // Set trueMarketLow and explicitly set noMarketPrice to false
      processedItem.trueMarketLow = trueMarketLow;
      processedItem.noMarketPrice = false;
      
      // Remove "No Market Price Available" flag if it was previously set
      if (processedItem.flags && processedItem.flags.includes('No Market Price Available')) {
        processedItem.flags = processedItem.flags.filter(flag => flag !== 'No Market Price Available');
      }
    }
    
    // Always log the Diltiazem products for troubleshooting
    const isDiltiazem = processedItem.description && processedItem.description.includes("Diltiazem");
    const isOralMedicineSyringe = processedItem.description && 
                                 processedItem.description.toLowerCase().includes("oral medicine") &&
                                 processedItem.description.toLowerCase().includes("syringe");
    
    if (isDiltiazem || isOralMedicineSyringe) {
      console.log('---------------------------------------------');
      console.log('SPECIAL PRODUCT DETECTED:', processedItem.description);
      console.log('ETH_NET:', processedItem.eth_net);
      console.log('Market Low (ML):', processedItem.marketLow);
      console.log('True Market Low (TML):', processedItem.trueMarketLow);
      console.log('Has Valid TML:', hasValidTrueMarketLow);
      console.log('No Market Price flag:', processedItem.noMarketPrice);
      console.log('Average Cost:', processedItem.avgCost);
      console.log('Next Cost:', processedItem.nextCost);
      console.log('Usage Rank:', processedItem.usageRank);
      console.log('---------------------------------------------');
    }
    
    // Debug logging to track ML/TML values
    console.log(`Product: ${processedItem.description}, ETH_NET: ${processedItem.eth_net}, Market Low: ${processedItem.marketLow}, True Market Low: ${processedItem.trueMarketLow}, No Market Price: ${processedItem.noMarketPrice}`);
    
    // Get group for rule application
    const group = processedItem.usageRank || 6; // Default to group 6 if missing
    const groupConfig = getGroupConfig(group, ruleConfig);
    
    // Modified rule application to properly handle missing market prices
    
    // RULE 1 - AvgCost < Market Low - but only if market low exists
    if (!processedItem.noMarketPrice && processedItem.marketLow > 0 && processedItem.avgCost < processedItem.marketLow) {
      // Apply Rule 1a or Rule 1b based on market trend
      const isDownwardTrend = processedItem.trend === 'TrendDown';
      
      if (isDownwardTrend) {
        // Rule 1a - Downward Trend: Market Low + Group Markup
        const mlMarkup = groupConfig.rule1.trend_down; // 0%, 1%, or 2% based on group
        processedItem.proposedPrice = processedItem.marketLow * mlMarkup;
        processedItem.appliedRule = `Rule 1a - ML + ${((mlMarkup - 1) * 100).toFixed(0)}% (G${group}, Down)`;
      } else {
        // Rule 1b - Upward Trend: Take higher of Market Low with markup or AvgCost with markup
        const mlMarkup = groupConfig.rule1.trend_flat_up; // 3%, 4%, or 5% based on group
        const costMarkup = groupConfig.rule2.trend_flat_up; // 12%, 13%, or 14% based on group
        
        const mlPrice = processedItem.marketLow * mlMarkup;
        const costPrice = processedItem.avgCost * costMarkup;
        
        processedItem.proposedPrice = Math.max(mlPrice, costPrice);
        const usedPrice = processedItem.proposedPrice === mlPrice ? "ML" : "Cost";
        processedItem.appliedRule = `Rule 1b - ${usedPrice} Based (G${group}, Up)`;
      }
      
      // Apply margin cap for Rule 1, but ONLY if avgCost is £1.00 or less and GREATER than zero
      // FIXED: Added condition to check avgCost > 0 to prevent zeroing out prices for zero-cost items
      if (processedItem.proposedPrice > 0 && processedItem.avgCost <= 1.00 && processedItem.avgCost > 0) {
        const proposedMargin = (processedItem.proposedPrice - processedItem.avgCost) / processedItem.proposedPrice;
        
        // Get the appropriate margin cap for this group
        const marginCap = groupConfig.marginCap;
        
        // If the calculated margin exceeds the cap, recalculate the price
        if (proposedMargin > marginCap) {
          // Formula to calculate price from target margin: Price = Cost / (1 - targetMargin)
          const cappedPrice = processedItem.avgCost / (1 - marginCap);
          processedItem.proposedPrice = cappedPrice;
          processedItem.marginCapApplied = true;
          
          // Update the rule description to indicate cap was applied
          processedItem.appliedRule = `${processedItem.appliedRule} [${(marginCap * 100).toFixed(0)}% Margin Cap Applied]`;
          
          // Add flag for margin cap application
          if (!processedItem.flags) processedItem.flags = [];
          if (!processedItem.flags.includes('MARGIN_CAP_APPLIED')) {
            processedItem.flags.push('MARGIN_CAP_APPLIED');
          }
        }
      }
      // NEW: Add specific handling for zero-cost items to skip margin cap
      else if (processedItem.proposedPrice > 0 && processedItem.avgCost <= 1.00 && processedItem.avgCost <= 0) {
        console.log(`MARGIN CAP SKIPPED: Zero-cost item (${processedItem.description}) - cap not applied to prevent zeroing out price`);
        
        // Add specific flag for this case
        if (!processedItem.flags) processedItem.flags = [];
        if (!processedItem.flags.includes('ZERO_COST_MARGIN_CAP_SKIPPED')) {
          processedItem.flags.push('ZERO_COST_MARGIN_CAP_SKIPPED');
        }
      }
    } 
    // RULE 2 - AvgCost >= Market Low OR No ETH_NET Market Low
    else {
      const isDownwardTrend = processedItem.trend === 'TrendDown';
      
      // Check if we have valid ETH_NET market price data first
      if (!processedItem.noMarketPrice && processedItem.marketLow > 0) {
        if (isDownwardTrend) {
          // Rule 2a - Downward Trend: Market Low + Uplift
          // Apply uplift based on group (3%, 4%, or 5%)
          let uplift = 1.03; // Default for groups 1-2
          if (group >= 3 && group <= 4) uplift = 1.04;
          else if (group >= 5) uplift = 1.05;
          
          processedItem.proposedPrice = processedItem.marketLow * uplift;
          processedItem.appliedRule = `Rule 2a - ML + ${((uplift - 1) * 100).toFixed(0)}% (G${group}, Down)`;
        } else {
          // Rule 2b - Upward Trend: Take higher of Market Low with uplift or AvgCost with markup
          // Market Low uplift based on group (3%, 4%, or 5%)
          let mlUplift = 1.03; // Default for groups 1-2
          if (group >= 3 && group <= 4) mlUplift = 1.04;
          else if (group >= 5) mlUplift = 1.05;
          
          const costMarkup = groupConfig.rule2.trend_flat_up; // 12%, 13%, or 14% based on group
          
          const mlPrice = processedItem.marketLow * mlUplift;
          const costPrice = processedItem.avgCost * costMarkup;
          
          processedItem.proposedPrice = Math.max(mlPrice, costPrice);
          const usedPrice = processedItem.proposedPrice === mlPrice ? "ML" : "Cost";
          processedItem.appliedRule = `Rule 2b - ${usedPrice} Based (G${group}, Up)`;
        }
      } 
      // NO ETH_NET MARKET PRICE - Check if we have a valid True Market Low instead
      else if (hasValidTrueMarketLow) {
        // NEW RULE: When ETH_NET is missing but True Market Low exists
        // Apply appropriate markup to True Market Low
        
        // Get usage-based uplift percentage 
        const usageRank = processedItem.usageRank || 6;
        
        if (isDiltiazem || isOralMedicineSyringe) {
          console.log('Using TRUE MARKET LOW PRICING for special item:', processedItem.description);
        }
        
        // Calculate price using True Market Low + competitor markup
        const result = calculatePriceWithTrueMarketLow(
          processedItem, 
          processedItem.description || 'unknown', 
          processedItem.avgCost, 
          trueMarketLow, 
          usageRank
        );
        
        processedItem.proposedPrice = result.price;
        processedItem.appliedRule = result.rule;
        
        if (isDiltiazem || isOralMedicineSyringe) {
          console.log('Calculated price using TML:', processedItem.proposedPrice);
          console.log('Applied rule:', processedItem.appliedRule);
        }
      }
      // FALLBACK - No Market Price and No True Market Low - Use cost-based pricing
      else {
        // Pure cost-based pricing as last resort
        const costMarkup = isDownwardTrend ? 
          groupConfig.rule2.trend_down : 
          groupConfig.rule2.trend_flat_up; // 12%, 13%, or 14% based on group
        
        processedItem.proposedPrice = processedItem.avgCost * costMarkup;
        processedItem.appliedRule = `Cost + ${((costMarkup - 1) * 100).toFixed(0)}% (G${group}, No MP)`;
      }
    }
    
    // Store the calculated price for reference
    processedItem.calculatedPrice = processedItem.proposedPrice;
    
    // Add flag for price decreases instead of preventing them
    if (processedItem.currentREVAPrice !== undefined && 
        processedItem.currentREVAPrice > 0 && 
        processedItem.calculatedPrice < processedItem.currentREVAPrice) {
      // Calculate the percentage decrease
      const decreasePercent = ((processedItem.currentREVAPrice - processedItem.calculatedPrice) / processedItem.currentREVAPrice) * 100;
      
      // Flag significant price decreases (> 5%)
      if (decreasePercent > 5) {
        if (!processedItem.flags) processedItem.flags = [];
        processedItem.flags.push(`PRICE_DECREASE_${decreasePercent.toFixed(0)}%`);
      }
    }
    
    // ****************************************************************
    // ******* ULTIMATE MARGIN CAP RULE - ABSOLUTE FINAL STEP *********
    // ****************************************************************
    // IMPORTANT: This is the final pricing rule that overrides all others
    // Any item with avgCost <= £1.00 gets a margin cap applied
    // Different caps based on usage rank:
    // - Ranks 1-2: 10% margin cap
    // - Ranks 3-4: 20% margin cap
    // - Ranks 5-6: 30% margin cap
    
    // ONLY apply margin cap if:
    // 1. We have a positive proposed price
    // 2. We have an average cost <= £1.00 but > 0 (to avoid div by zero)
    // 3. Special handling for Oral Medicine Essential Syringe - always apply cap
    const isLowCostItem = processedItem.avgCost <= 1.00 && processedItem.avgCost > 0;
    const hasProposedPrice = processedItem.proposedPrice && processedItem.proposedPrice > 0;
    
    // Always apply margin cap to Oral Medicine Essential Syringe regardless of cost
    if (isOralMedicineSyringe) {
      console.log('FORCING MARGIN CAP FOR SPECIAL PRODUCT: Oral Medicine Essential Syringe');
    }
    
    // The ULTIMATE margin cap check - applies to ALL pricing paths
    if (hasProposedPrice && (isLowCostItem || isOralMedicineSyringe)) {
      // Calculate the current margin before capping
      const currentMargin = (processedItem.proposedPrice - processedItem.avgCost) / processedItem.proposedPrice;
      const marginPercent = currentMargin * 100;
      
      // Get the appropriate margin cap for this group
      const marginCap = groupConfig.marginCap;
      const marginCapPercent = marginCap * 100;
      
      // Log the margin details for debugging
      console.log(`ULTIMATE MARGIN CAP CHECK for ${processedItem.description}:`);
      console.log(`  Current margin: ${marginPercent.toFixed(2)}%`);
      console.log(`  Margin cap: ${marginCapPercent.toFixed(0)}%`);
      console.log(`  Current price: £${processedItem.proposedPrice.toFixed(2)}`);
      
      // If the calculated margin exceeds the cap, recalculate the price
      if (currentMargin > marginCap) {
        // Formula to calculate price from target margin: Price = Cost / (1 - targetMargin)
        const cappedPrice = processedItem.avgCost / (1 - marginCap);
        const originalPrice = processedItem.proposedPrice;
        
        // Update the price with the capped value
        processedItem.proposedPrice = cappedPrice;
        processedItem.marginCapApplied = true;
        
        // Log the price change due to the margin cap
        console.log(`  MARGIN CAP APPLIED: Price reduced from £${originalPrice.toFixed(2)} to £${cappedPrice.toFixed(2)}`);
        
        // Update the rule description to indicate cap was applied
        processedItem.appliedRule = `${processedItem.appliedRule} [${(marginCap * 100).toFixed(0)}% Margin Cap Applied]`;
        
        // Add flag for margin cap application
        if (!processedItem.flags) processedItem.flags = [];
        if (!processedItem.flags.includes('MARGIN_CAP_APPLIED')) {
          processedItem.flags.push('MARGIN_CAP_APPLIED');
        }
      } else {
        console.log(`  Margin cap NOT applied (current margin ${marginPercent.toFixed(1)}% <= cap ${marginCapPercent.toFixed(0)}%)`);
      }
    }
    // NEW: Add specific handling for zero-cost items to skip margin cap
    else if (hasProposedPrice && processedItem.avgCost <= 0) {
      console.log(`MARGIN CAP SKIPPED: Zero-cost item (${processedItem.description}) - cap not applied to prevent zeroing out price`);
      
      // Add specific flag for this case
      if (!processedItem.flags) processedItem.flags = [];
      if (!processedItem.flags.includes('ZERO_COST_MARGIN_CAP_SKIPPED')) {
        processedItem.flags.push('ZERO_COST_MARGIN_CAP_SKIPPED');
      }
    }
    
    // Calculate proposed margin with CORRECT formula
    if (processedItem.proposedPrice > 0) {
      // CRITICAL FIX: Use CORRECT formula for margin: (price - cost) / price
      // Changed from (cost - price) / price to (price - cost) / price
      processedItem.proposedMargin = (processedItem.proposedPrice - processedItem.avgCost) / processedItem.proposedPrice;
    } else {
      processedItem.proposedMargin = 0;
    }
    
    // UPDATED: Set the flag2 (low margin) based on margin value - margin at or below 0%
    processedItem.flag2 = processedItem.proposedMargin <= 0;
    
    // Apply flag logic - Price ≥10% above TRUE MARKET LOW requires a manual review
    // But only if we have a valid TML
    if (!processedItem.noMarketPrice && processedItem.trueMarketLow && processedItem.trueMarketLow > 0 && 
        processedItem.proposedPrice && processedItem.proposedPrice >= processedItem.trueMarketLow * 1.10) {
      processedItem.flag1 = true;
      if (!processedItem.flags) processedItem.flags = [];
      if (!processedItem.flags.includes('HIGH_PRICE')) {
        processedItem.flags.push('HIGH_PRICE');
      }
    } else {
      processedItem.flag1 = false;
    }
    
    // Update the LOW_MARGIN flag description to reflect the new threshold (0% instead of 5%)
    if (processedItem.flag2) {
      if (!processedItem.flags) processedItem.flags = [];
      if (!processedItem.flags.includes('LOW_MARGIN')) {
        processedItem.flags.push('LOW_MARGIN');
      }
    }

    // Add ID field for easier item identification if it doesn't already exist
    if (!processedItem.id) {
      processedItem.id = `item-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return processedItem;
  });
}

// Helper function to get group configuration based on group number
function getGroupConfig(group: number, ruleConfig: RuleConfig) {
  if (group <= 2) {
    return { 
      rule1: ruleConfig.rule1.group1_2, 
      rule2: ruleConfig.rule2.group1_2,
      marginCap: ruleConfig.rule1.marginCaps.group1_2 
    };
  } else if (group <= 4) {
    return { 
      rule1: ruleConfig.rule1.group3_4, 
      rule2: ruleConfig.rule2.group3_4,
      marginCap: ruleConfig.rule1.marginCaps.group3_4 
    };
  } else {
    return { 
      rule1: ruleConfig.rule1.group5_6, 
      rule2: ruleConfig.rule2.group5_6,
      marginCap: ruleConfig.rule1.marginCaps.group5_6 
    };
  }
}

// Helper function to validate if a price is valid (non-zero positive number)
function isValidPrice(price: any): boolean {
  // Convert to number if it's a string or any other type
  const numPrice = Number(price);
  // Check if it's a valid positive number
  return !isNaN(numPrice) && numPrice > 0;
}

// Helper function to treat zero values as null/undefined
function treatZeroAsNull(value: number | undefined | null): number | null {
  if (value === undefined || value === null || value === 0) {
    return null;
  }
  return value;
}

// Helper function to get the usage-based uplift percentage
function getUsageBasedUplift(usageRank: number): number {
  if (usageRank <= 2) return 0; // 0% uplift for ranks 1-2
  if (usageRank <= 4) return 1; // 1% uplift for ranks 3-4
  return 2; // 2% uplift for ranks 5-6
}

// Helper function to get the usage-based competitor markup percentage
function getUsageBasedCompetitorMarkup(usageRank: number): number {
  if (usageRank <= 2) return 3; // 3% uplift for ranks 1-2
  if (usageRank <= 4) return 4; // 4% uplift for ranks 3-4
  return 5; // 5% uplift for ranks 5-6
}

/**
 * Find the true market low from all competitor prices
 * @param item The product item with pricing data
 * @returns Object with trueMarketLow value and whether it's valid
 */
function findTrueMarketLow(item: any): {trueMarketLow: number, hasValidTrueMarketLow: boolean} {
  const competitorPrices = [];
  
  // Check each competitor price and add only valid prices
  if (isValidPrice(item.eth_net)) {
    competitorPrices.push(Number(item.eth_net));
  }
  
  if (isValidPrice(item.eth)) {
    competitorPrices.push(Number(item.eth));
  }
  
  if (isValidPrice(item.nupharm)) {
    competitorPrices.push(Number(item.nupharm));
  }
  
  if (isValidPrice(item.lexon)) {
    competitorPrices.push(Number(item.lexon));
  }
  
  if (isValidPrice(item.aah)) {
    competitorPrices.push(Number(item.aah));
  }
  
  // Find the minimum valid competitor price
  let trueMarketLow = Infinity;
  let hasValidTrueMarketLow = false;
  
  if (competitorPrices.length > 0) {
    hasValidTrueMarketLow = true;
    trueMarketLow = Math.min(...competitorPrices);
  }
  
  return { trueMarketLow, hasValidTrueMarketLow };
}

/**
 * Calculate price based on pricing rules when no ETH_NET market low exists but other competitor prices do
 * @param item The product item with pricing data
 * @param description Product description for logging
 * @param cost Product cost
 * @param trueMarketLow The calculated true market low from all competitor prices
 * @param usageRank Product usage rank
 * @returns Calculated price based on TML + appropriate uplift
 */
function calculatePriceWithTrueMarketLow(item: any, description: string, cost: number, trueMarketLow: number, usageRank: number): {price: number, rule: string} {
  // Always log the Diltiazem products for troubleshooting
  const isDiltiazem = description && description.includes("Diltiazem");
  const isOralMedicineSyringe = description && 
                               description.toLowerCase().includes("oral medicine") && 
                               description.toLowerCase().includes("syringe");
                               
  if (isDiltiazem || isOralMedicineSyringe) {
    console.log('SPECIAL PRODUCT DETECTED in calculatePriceWithTrueMarketLow:', description);
    console.log('TrueMarketLow value:', trueMarketLow, 'Cost:', cost, 'Usage Rank:', usageRank);
  }
  
  // Get usage-based uplift percentage
  const usageUplift = getUsageBasedUplift(usageRank) / 100; // Convert to decimal (0%, 1%, or 2%)
  
  // Get competitor markup (3%, 4%, or 5% based on usage rank)
  const competitorMarkupPercent = getUsageBasedCompetitorMarkup(usageRank);
  
  // Apply standard markup (3%) plus usage-based uplift to TrueMarketLow
  const marketLowMarkup = 1 + (competitorMarkupPercent / 100);
  const calculatedPrice = trueMarketLow * marketLowMarkup;
  
  // For debugging special products
  if (isDiltiazem || isOralMedicineSyringe) {
    console.log(`Using TrueMarketLow pricing rule for ${description}`);
    console.log(`TrueMarketLow: ${trueMarketLow}, Markup: ${competitorMarkupPercent}%, Final Price: ${calculatedPrice}`);
  }
  
  return {
    price: calculatedPrice, 
    rule: `true_market_low_plus_${competitorMarkupPercent}`
  };
}
