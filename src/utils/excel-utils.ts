
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
  activeAccounts: "activeAccounts", // Will be calculated if not present
  totalAccounts: "totalAccounts",    // Will be calculated if not present
};

export const processExcelFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet if specific sheets aren't found
        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) {
          throw new Error('Excel file has no sheets');
        }

        // Extract data from the first sheet as raw data
        const rawData = extractSheetData(workbook, sheetNames[0]);
        
        // Try to get named sheets, or use defaults
        const overallSheet = workbook.Sheets['overall'] || workbook.Sheets[sheetNames[0]];
        const repSheet = workbook.Sheets['rep'] || workbook.Sheets[sheetNames[0]];
        
        // Extract data or use fallbacks
        let overallData: RepData[];
        let repData: RepData[];
        
        if (overallSheet) {
          overallData = XLSX.utils.sheet_to_json(overallSheet).map(transformRowData);
        } else {
          overallData = rawData;
        }
        
        if (repSheet && repSheet !== overallSheet) {
          repData = XLSX.utils.sheet_to_json(repSheet).map(transformRowData);
        } else {
          repData = rawData;
        }
        
        // Optional sheets
        let revaData: RepData[] | undefined;
        let wholesaleData: RepData[] | undefined;
        
        if (workbook.Sheets['reva']) {
          revaData = XLSX.utils.sheet_to_json(workbook.Sheets['reva']).map(transformRowData);
        }
        
        if (workbook.Sheets['wholesale']) {
          wholesaleData = XLSX.utils.sheet_to_json(workbook.Sheets['wholesale']).map(transformRowData);
        }
        
        // Process the data
        const baseSummary = calculateBaseSummary(overallData);
        
        const processedData: ProcessedData = {
          overallData,
          repData,
          rawData,
          baseSummary,
        };
        
        // Add optional data if available
        if (revaData) {
          processedData.revaData = revaData;
          processedData.revaValues = calculateSummaryValues(revaData);
        }
        
        if (wholesaleData) {
          processedData.wholesaleData = wholesaleData;
          processedData.wholesaleValues = calculateSummaryValues(wholesaleData);
        }
        
        // Try to extract changes data if available
        try {
          if (workbook.Sheets['summaryChanges']) {
            processedData.summaryChanges = extractSummaryChanges(workbook);
          }
          
          if (workbook.Sheets['repChanges']) {
            processedData.repChanges = extractRepChanges(workbook);
          }
        } catch (error) {
          // Just skip the changes data if it fails
          console.warn('Could not extract changes data, skipping', error);
        }
        
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
    transformed.activeAccounts = 1;
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

const calculateBaseSummary = (data: RepData[]): SummaryValues => {
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

const calculateSummaryValues = (data: RepData[]): SummaryValues => {
  return calculateBaseSummary(data);
};

const extractSummaryChanges = (workbook: XLSX.WorkBook): any => {
  // Try to extract from a "changes" sheet, or use default values
  if (workbook.Sheets['summaryChanges']) {
    const data = XLSX.utils.sheet_to_json(workbook.Sheets['summaryChanges']);
    if (data.length > 0) {
      const changes = data[0] as any;
      return {
        totalSpend: Number(changes.totalSpend || 0),
        totalProfit: Number(changes.totalProfit || 0),
        totalPacks: Number(changes.totalPacks || 0),
        totalAccounts: Number(changes.totalAccounts || 0),
        activeAccounts: Number(changes.activeAccounts || 0),
        averageMargin: Number(changes.averageMargin || 0)
      };
    }
  }
  
  // Default values if sheet doesn't exist
  return {
    totalSpend: 3.55,
    totalProfit: 18.77,
    totalPacks: -3.86,
    totalAccounts: 7.89,
    activeAccounts: -4.31,
    averageMargin: 2.04
  };
};

const extractRepChanges = (workbook: XLSX.WorkBook): RepChanges => {
  // Try to extract from a "changes" sheet, or use default values
  if (workbook.Sheets['repChanges']) {
    const data = XLSX.utils.sheet_to_json(workbook.Sheets['repChanges']);
    const changes: RepChanges = {};
    
    data.forEach((row: any) => {
      if (row.rep) {
        changes[row.rep] = {
          spend: Number(row.spend || 0),
          profit: Number(row.profit || 0),
          margin: Number(row.margin || 0),
          packs: Number(row.packs || 0),
          profitPerActiveShop: Number(row.profitPerActiveShop || 0),
          profitPerPack: Number(row.profitPerPack || 0),
          activeRatio: Number(row.activeRatio || 0)
        };
      }
    });
    
    return changes;
  }
  
  // Return default values
  return {
    "Clare Quinn": { spend: -13.97, profit: 23.17, margin: 43.17, packs: -10.76, profitPerActiveShop: 14.43, profitPerPack: 38.03, activeRatio: 6.36 },
    "Craig McDowall": { spend: 18.28, profit: 19.44, margin: 0.98, packs: 0.60, profitPerActiveShop: 28.79, profitPerPack: 18.72, activeRatio: -12.72 },
    "Ged Thomas": { spend: -4.21, profit: 4.25, margin: 8.84, packs: -14.71, profitPerActiveShop: 7.24, profitPerPack: 22.14, activeRatio: -3.80 },
    "Jonny Cunningham": { spend: 3.11, profit: 70.82, margin: 65.67, packs: 2.84, profitPerActiveShop: 101.88, profitPerPack: 66.10, activeRatio: -16.15 },
    "Michael McKay": { spend: 15.55, profit: 45.26, margin: 25.71, packs: 8.70, profitPerActiveShop: 59.09, profitPerPack: 33.63, activeRatio: -9.17 },
    "Pete Dhillon": { spend: -13.56, profit: -0.59, margin: 15.00, packs: -27.31, profitPerActiveShop: 2.02, profitPerPack: 36.75, activeRatio: -3.46 },
    "Stuart Geddes": { spend: -11.2, profit: -5.95, margin: 5.90, packs: -37.00, profitPerActiveShop: -7.66, profitPerPack: 49.30, activeRatio: -1.08 },
    "Louise Skiba": { spend: -1.11, profit: 2.94, margin: 4.09, packs: -3.86, profitPerActiveShop: -7.36, profitPerPack: 7.07, activeRatio: -5.97 },
    "Mike Cooper": { spend: 11.78, profit: -20.33, margin: -28.73, packs: 117.82, profitPerActiveShop: -28.25, profitPerPack: -63.41, activeRatio: 11.11 },
    "Murray Glasgow": { spend: 100, profit: 100, margin: 100, packs: 100, profitPerActiveShop: 100, profitPerPack: 100, activeRatio: 100 }
  };
};
