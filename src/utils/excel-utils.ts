import * as XLSX from 'xlsx';

interface RepData {
  rep: string;
  spend: number;
  profit: number;
  margin: number;
  packs: number;
  activeAccounts?: number;
  totalAccounts?: number;
  profitPerActiveShop?: number;
  profitPerPack?: number;
  activeRatio?: number;
  cost?: number;
  credit?: number;
  subRep?: string;
  accountRef?: string;
  accountName?: string;
  sector?: string;
}

interface SummaryValues {
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
  totalAccounts?: number;
  activeAccounts?: number;
  averageMargin: number;
}

interface RepChanges {
  [rep: string]: {
    spend: number;
    profit: number;
    margin: number;
    packs: number;
    profitPerActiveShop?: number;
    profitPerPack?: number;
    activeRatio?: number;
  };
}

interface ProcessedData {
  overallData: RepData[];
  repData: RepData[];
  revaData?: RepData[];
  wholesaleData?: RepData[];
  baseSummary: SummaryValues;
  revaValues?: SummaryValues;
  wholesaleValues?: SummaryValues;
  summaryChanges?: {
    totalSpend: number;
    totalProfit: number;
    totalPacks: number;
    totalAccounts?: number;
    activeAccounts?: number;
    averageMargin: number;
  };
  repChanges?: RepChanges;
  rawData: RepData[];
}

// Maps the expected columns to the actual columns in the file
const columnMapping = {
  rep: "Rep",
  subRep: "Sub-Rep",
  accountRef: "Account Ref",
  accountName: "Account Name",
  spend: "Spend",
  cost: "Cost",
  credit: "Credit",
  profit: "Profit",
  margin: "Margin",
  packs: "Packs",
  activeAccounts: "activeAccounts",
  totalAccounts: "totalAccounts",
};

export const processExcelFile = async (file: File): Promise<ProcessedData> => {
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
        console.log('Processing file:', file.name);
        
        // Process the data into required structure for the dashboard
        const processedData = processRawData(rawData);
        
        // Store the data in localStorage for persistence
        localStorage.setItem('repPerformanceData', JSON.stringify(processedData));
        
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

// Transform the row data from the actual column names to our expected format
function transformRowData(row: any): RepData {
  const transformed: RepData = {
    rep: String(row[columnMapping.rep] || ''),
    spend: Number(row[columnMapping.spend] || 0),
    profit: Number(row[columnMapping.profit] || 0),
    margin: Number(row[columnMapping.margin] || 0),
    packs: Number(row[columnMapping.packs] || 0),
  };
  
  // Add optional fields if present
  if (row[columnMapping.subRep]) transformed.subRep = String(row[columnMapping.subRep]);
  if (row[columnMapping.accountRef]) transformed.accountRef = String(row[columnMapping.accountRef]);
  if (row[columnMapping.accountName]) transformed.accountName = String(row[columnMapping.accountName]);
  if (row[columnMapping.cost]) transformed.cost = Number(row[columnMapping.cost]);
  if (row[columnMapping.credit]) transformed.credit = Number(row[columnMapping.credit]);
  
  // Calculate or assign account values
  if (row[columnMapping.activeAccounts]) {
    transformed.activeAccounts = Number(row[columnMapping.activeAccounts]);
  } else if (row[columnMapping.accountRef]) {
    // If we have account data but no explicit active accounts, set to 1 (this row represents one account)
    transformed.activeAccounts = transformed.profit > 0 ? 1 : 0;
  } else {
    transformed.activeAccounts = 0;
  }
  
  if (row[columnMapping.totalAccounts]) {
    transformed.totalAccounts = Number(row[columnMapping.totalAccounts]);
  } else if (row[columnMapping.accountRef]) {
    // If we have account data but no explicit total accounts, set to 1 (this row represents one account)
    transformed.totalAccounts = 1;
  } else {
    transformed.totalAccounts = 0;
  }
  
  // Calculate derived metrics if not present
  if (transformed.activeAccounts > 0) {
    transformed.profitPerActiveShop = transformed.profit / transformed.activeAccounts;
  } else {
    transformed.profitPerActiveShop = 0;
  }
    
  if (transformed.packs > 0) {
    transformed.profitPerPack = transformed.profit / transformed.packs;
  } else {
    transformed.profitPerPack = 0;
  }
    
  if (transformed.totalAccounts > 0) {
    transformed.activeRatio = (transformed.activeAccounts / transformed.totalAccounts) * 100;
  } else {
    transformed.activeRatio = 0;
  }
  
  // Identify sector (REVA or Wholesale)
  if (isRevaAccount(transformed)) {
    transformed.sector = 'REVA';
  } else if (isWholesaleAccount(transformed)) {
    transformed.sector = 'Wholesale';
  } else {
    transformed.sector = 'Retail';
  }
  
  return transformed;
}

const extractSheetData = (workbook: XLSX.WorkBook, sheetName: string): RepData[] => {
  if (!workbook.Sheets[sheetName]) {
    throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
  }
  
  const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  // Validate that required columns exist
  if (jsonData.length > 0) {
    const firstRow = jsonData[0] as any;
    
    // Check for minimum required columns
    if (firstRow[columnMapping.rep] === undefined || 
        firstRow[columnMapping.spend] === undefined || 
        firstRow[columnMapping.profit] === undefined) {
      throw new Error(`Missing required columns. Please ensure your file has columns for Rep, Spend, and Profit.`);
    }
  }
  
  return jsonData.map(transformRowData);
};

// Process raw data into the structure needed for the dashboard
const processRawData = (rawData: RepData[]): ProcessedData => {
  // Filter out rows with zero spend to avoid adding them to the tabs
  const nonZeroData = rawData.filter(row => row.spend > 0);
  
  // Group data by Rep/SubRep based on sector
  const retailData: RepData[] = [];
  const revaData: RepData[] = [];
  const wholesaleData: RepData[] = [];
  
  // Sort data into respective categories and use SubRep for REVA and Wholesale accounts
  nonZeroData.forEach(row => {
    if (row.sector === 'REVA') {
      // For REVA, use the subRep field if available, otherwise use the main rep
      const repName = row.subRep && row.subRep.trim() !== '' ? row.subRep : row.rep;
      revaData.push({...row, rep: repName});
    } else if (row.sector === 'Wholesale') {
      // For Wholesale, use the subRep field if available, otherwise use the main rep
      const repName = row.subRep && row.subRep.trim() !== '' ? row.subRep : row.rep;
      wholesaleData.push({...row, rep: repName});
    } else {
      // For standard retail, keep the rep as is (only include those not in REVA or Wholesale)
      retailData.push(row);
    }
  });
  
  // Group and aggregate data by rep for each sector
  const repGroups = groupDataByRep(retailData);
  const revaGroups = groupDataByRep(revaData);
  const wholesaleGroups = groupDataByRep(wholesaleData);
  
  // Aggregate data for each rep
  const aggregatedRepData = aggregateGroups(repGroups).filter(rep => rep.spend > 0);
  const aggregatedRevaData = aggregateGroups(revaGroups).filter(rep => rep.spend > 0);
  const aggregatedWholesaleData = aggregateGroups(wholesaleGroups).filter(rep => rep.spend > 0);
  
  // For overall data, we now just use the retail data and don't combine them here
  // The combining logic is now in the getCombinedRepData function in useRepPerformanceData
  const overallData = [...aggregatedRepData];
  
  // Calculate summary values
  const baseSummary = calculateSummaryValues([...aggregatedRepData, ...aggregatedRevaData, ...aggregatedWholesaleData]);
  const revaValues = calculateSummaryValues(aggregatedRevaData);
  const wholesaleValues = calculateSummaryValues(aggregatedWholesaleData);
  
  // Generate placeholder changes data
  const summaryChanges = generatePlaceholderSummaryChanges();
  const repChanges = generatePlaceholderRepChanges([...overallData, ...aggregatedRevaData, ...aggregatedWholesaleData]);
  
  return {
    overallData,
    repData: aggregatedRepData,
    revaData: aggregatedRevaData,
    wholesaleData: aggregatedWholesaleData,
    baseSummary,
    revaValues,
    wholesaleValues,
    summaryChanges,
    repChanges,
    rawData: nonZeroData
  };
};

// Helper function to group data by rep name
function groupDataByRep(data: RepData[]): Record<string, RepData[]> {
  return data.reduce((groups: Record<string, RepData[]>, row) => {
    const rep = row.rep;
    if (!groups[rep]) {
      groups[rep] = [];
    }
    groups[rep].push(row);
    return groups;
  }, {});
}

// Helper function to aggregate groups into RepData array
function aggregateGroups(groups: Record<string, RepData[]>): RepData[] {
  return Object.entries(groups).map(([rep, rows]) => {
    return aggregateRepData(rep, rows);
  });
}

// Helper function to combine sector data into overall data
function combineDataIntoOverall(overallData: RepData[], sectorData: RepData[]): void {
  sectorData.forEach(sectorRep => {
    const existingIndex = overallData.findIndex(rep => rep.rep === sectorRep.rep);
    if (existingIndex === -1) {
      // Rep doesn't exist in overall, add them
      overallData.push(sectorRep);
    } else {
      // Rep exists in overall, combine their metrics
      const combinedRep = combineRepData(sectorRep.rep, [overallData[existingIndex], sectorRep]);
      overallData[existingIndex] = combinedRep;
    }
  });
}

// Helper function to check if an account is likely a REVA account
function isRevaAccount(row: RepData): boolean {
  // REVA accounts typically have lower margins and higher pack volumes
  // Or if they have a specific identifier in the account name or reference
  const accountNameLower = row.accountName ? row.accountName.toLowerCase() : '';
  return (row.margin < 12.5 && row.packs > 1000) || 
         accountNameLower.includes('reva');
}

// Helper function to check if an account is likely a Wholesale account
function isWholesaleAccount(row: RepData): boolean {
  // Wholesale accounts typically have higher profit per shop and higher pack volumes
  // Or if they have a specific identifier in the account name or reference
  const accountNameLower = row.accountName ? row.accountName.toLowerCase() : '';
  return ((row.profit > 500 && row.packs > 5000) && 
         !(row.margin < 12.5 && row.packs > 1000)) || // Not a REVA account
         accountNameLower.includes('wholesale');
}

// Aggregate data for a single rep
function aggregateRepData(rep: string, rows: RepData[]): RepData {
  const spend = rows.reduce((sum, row) => sum + row.spend, 0);
  const profit = rows.reduce((sum, row) => sum + row.profit, 0);
  const packs = rows.reduce((sum, row) => sum + row.packs, 0);
  
  // Count unique account refs with profit > 0 as active accounts
  const uniqueActiveAccountRefs = new Set(
    rows
      .filter(row => row.accountRef && row.profit > 0)
      .map(row => row.accountRef)
  );
  
  // Count unique account refs as total accounts
  const uniqueTotalAccountRefs = new Set(
    rows
      .filter(row => row.accountRef)
      .map(row => row.accountRef)
  );
  
  const activeAccounts = uniqueActiveAccountRefs.size;
  const totalAccounts = uniqueTotalAccountRefs.size;
  
  // Calculate margin excluding zero values to avoid skewing the average
  const nonZeroMarginRows = rows.filter(row => row.spend > 0);
  const margin = spend > 0 ? (profit / spend) * 100 : 0;
  
  const profitPerActiveShop = activeAccounts > 0 ? profit / activeAccounts : 0;
  const profitPerPack = packs > 0 ? profit / packs : 0;
  const activeRatio = totalAccounts > 0 ? (activeAccounts / totalAccounts) * 100 : 0;
  
  return {
    rep,
    spend,
    profit,
    margin,
    packs,
    activeAccounts,
    totalAccounts,
    profitPerActiveShop,
    profitPerPack,
    activeRatio
  };
}

// Combine data from multiple rep entries (used when merging different categories)
function combineRepData(rep: string, rows: RepData[]): RepData {
  return aggregateRepData(rep, rows);
}

const calculateSummaryValues = (data: RepData[]): SummaryValues => {
  const totalSpend = data.reduce((sum, item) => sum + item.spend, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
  const totalPacks = data.reduce((sum, item) => sum + item.packs, 0);
  
  // Optional sums
  const totalAccounts = data.reduce((sum, item) => sum + (item.totalAccounts || 0), 0);
  const activeAccounts = data.reduce((sum, item) => sum + (item.activeAccounts || 0), 0);
  
  // Calculate margin excluding zero values to avoid skewing the average
  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
  
  return {
    totalSpend,
    totalProfit,
    totalPacks,
    totalAccounts,
    activeAccounts,
    averageMargin
  };
};

// Generate placeholder change values for summary metrics
const generatePlaceholderSummaryChanges = () => {
  return {
    totalSpend: 3.55,
    totalProfit: 18.77,
    totalPacks: -3.86,
    totalAccounts: 7.89,
    activeAccounts: -4.31,
    averageMargin: 2.04
  };
};

// Generate placeholder change values for rep metrics 
const generatePlaceholderRepChanges = (reps: RepData[]): RepChanges => {
  const changes: RepChanges = {};
  
  reps.forEach(rep => {
    changes[rep.rep] = {
      spend: (Math.random() * 40) - 20, // Random between -20 and 20
      profit: (Math.random() * 40) - 10, // Random between -10 and 30
      margin: (Math.random() * 20) - 5, // Random between -5 and 15
      packs: (Math.random() * 40) - 30, // Random between -30 and 10
      profitPerActiveShop: (Math.random() * 30) - 10, // Random between -10 and 20
      profitPerPack: (Math.random() * 30) - 5, // Random between -5 and 25
      activeRatio: (Math.random() * 20) - 10 // Random between -10 and 10
    };
  });
  
  return changes;
};

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

// New function to properly handle pricing rules consistently with rule-simulator-utils.ts
// This function should be used in any place where pricing calculations are performed

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
  if (isDiltiazem) {
    console.log('DILTIAZEM PRODUCT DETECTED in calculatePriceWithTrueMarketLow:', description);
    console.log('TrueMarketLow value:', trueMarketLow, 'Cost:', cost, 'Usage Rank:', usageRank);
  }
  
  // Get usage-based uplift percentage
  const usageUplift = getUsageBasedUplift(usageRank) / 100; // Convert to decimal (0%, 1%, or 2%)
  
  // Get competitor markup (3%, 4%, or 5% based on usage rank)
  const competitorMarkupPercent = getUsageBasedCompetitorMarkup(usageRank);
  
  // Apply standard markup (3%) plus usage-based uplift to TrueMarketLow
  const marketLowMarkup = 1 + (competitorMarkupPercent / 100);
  const calculatedPrice = trueMarketLow * marketLowMarkup;
  
  // For debugging especially for Diltiazem products
  if (isDiltiazem) {
    console.log(`Using TrueMarketLow pricing rule for ${description}`);
    console.log(`TrueMarketLow: ${trueMarketLow}, Markup: ${competitorMarkupPercent}%, Final Price: ${calculatedPrice}`);
  }
  
  return {
    price: calculatedPrice, 
    rule: `true_market_low_plus_${competitorMarkupPercent}`
  };
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

// These functions should be called wherever price calculations are performed in the engine-room components
// This ensures that the "No Market Low but TML exists" rule is properly implemented anywhere it's needed
