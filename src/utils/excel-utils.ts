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
  transformed.profitPerActiveShop = 
    transformed.activeAccounts > 0 ? 
    transformed.profit / transformed.activeAccounts : 0;
    
  transformed.profitPerPack = 
    transformed.packs > 0 ? 
    transformed.profit / transformed.packs : 0;
    
  transformed.activeRatio = 
    transformed.totalAccounts > 0 ? 
    (transformed.activeAccounts / transformed.totalAccounts) * 100 : 0;
  
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
      revaData.push({
        ...row,
        // For REVA, if subRep exists and is not empty, use it as the rep
        rep: row.subRep && row.subRep.trim() !== '' ? row.subRep : row.rep
      });
    } else if (row.sector === 'Wholesale') {
      wholesaleData.push({
        ...row,
        // For Wholesale, if subRep exists and is not empty, use it as the rep
        rep: row.subRep && row.subRep.trim() !== '' ? row.subRep : row.rep
      });
    } else {
      // For standard retail, keep the rep as is
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
  
  // Create overall data by combining all sectors but handling duplicate rep names
  // Start with all retail reps
  const overallData = [...aggregatedRepData];
  
  // Add REVA and Wholesale data to the overall data, combining with existing reps if needed
  combineDataIntoOverall(overallData, aggregatedRevaData);
  combineDataIntoOverall(overallData, aggregatedWholesaleData);
  
  // Calculate summary values
  const baseSummary = calculateSummaryValues(overallData);
  const revaValues = calculateSummaryValues(aggregatedRevaData);
  const wholesaleValues = calculateSummaryValues(aggregatedWholesaleData);
  
  // Generate placeholder changes data
  const summaryChanges = generatePlaceholderSummaryChanges();
  const repChanges = generatePlaceholderRepChanges(overallData);
  
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
      overallData[existingIndex] = combineRepData(sectorRep.rep, [overallData[existingIndex], sectorRep]);
    }
  });
}

// Helper function to check if an account is likely a REVA account
function isRevaAccount(row: RepData): boolean {
  // REVA accounts typically have lower margins and higher pack volumes
  return row.margin < 12.5 && row.packs > 1000;
}

// Helper function to check if an account is likely a Wholesale account
function isWholesaleAccount(row: RepData): boolean {
  // Wholesale accounts typically have higher profit per shop and higher pack volumes
  return (row.profit > 500 && row.packs > 5000) && 
         !(row.margin < 12.5 && row.packs > 1000); // Not a REVA account
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
