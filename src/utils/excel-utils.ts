
import * as XLSX from 'xlsx';

interface RepData {
  rep: string;
  spend: number;
  profit: number;
  margin: number;
  packs: number;
  activeAccounts: number;
  totalAccounts: number;
  profitPerActiveShop: number;
  profitPerPack: number;
  activeRatio: number;
}

interface SummaryValues {
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
  totalAccounts: number;
  activeAccounts: number;
  averageMargin: number;
}

interface RepChanges {
  [rep: string]: {
    spend: number;
    profit: number;
    margin: number;
    packs: number;
    profitPerActiveShop: number;
    profitPerPack: number;
    activeRatio: number;
  };
}

interface ProcessedData {
  overallData: RepData[];
  repData: RepData[];
  revaData: RepData[];
  wholesaleData: RepData[];
  baseSummary: SummaryValues;
  revaValues: SummaryValues;
  wholesaleValues: SummaryValues;
  summaryChanges: {
    totalSpend: number;
    totalProfit: number;
    totalPacks: number;
    totalAccounts: number;
    activeAccounts: number;
    averageMargin: number;
  };
  repChanges: RepChanges;
}

export const processExcelFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Process each sheet
        const processedData: ProcessedData = {
          overallData: extractSheetData(workbook, 'overall'),
          repData: extractSheetData(workbook, 'rep'),
          revaData: extractSheetData(workbook, 'reva'),
          wholesaleData: extractSheetData(workbook, 'wholesale'),
          baseSummary: calculateBaseSummary(extractSheetData(workbook, 'overall')),
          revaValues: calculateSummaryValues(extractSheetData(workbook, 'reva')),
          wholesaleValues: calculateSummaryValues(extractSheetData(workbook, 'wholesale')),
          summaryChanges: extractSummaryChanges(workbook),
          repChanges: extractRepChanges(workbook)
        };
        
        resolve(processedData);
      } catch (error) {
        reject(new Error('Invalid Excel file format. Please ensure your file follows the required structure.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file. Please try again.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const extractSheetData = (workbook: XLSX.WorkBook, sheetName: string): RepData[] => {
  if (!workbook.Sheets[sheetName]) {
    throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
  }
  
  const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  return jsonData.map((row: any) => {
    // Validate row data
    const requiredFields = ['rep', 'spend', 'profit', 'margin', 'packs', 'activeAccounts', 'totalAccounts'];
    for (const field of requiredFields) {
      if (row[field] === undefined) {
        throw new Error(`Missing required field "${field}" in sheet "${sheetName}"`);
      }
    }
    
    // Convert to proper types
    return {
      rep: String(row.rep),
      spend: Number(row.spend),
      profit: Number(row.profit),
      margin: Number(row.margin),
      packs: Number(row.packs),
      activeAccounts: Number(row.activeAccounts),
      totalAccounts: Number(row.totalAccounts),
      profitPerActiveShop: row.profitPerActiveShop ? Number(row.profitPerActiveShop) : 
        (row.activeAccounts > 0 ? Number(row.profit) / Number(row.activeAccounts) : 0),
      profitPerPack: row.profitPerPack ? Number(row.profitPerPack) : 
        (row.packs > 0 ? Number(row.profit) / Number(row.packs) : 0),
      activeRatio: row.activeRatio ? Number(row.activeRatio) : 
        (row.totalAccounts > 0 ? (Number(row.activeAccounts) / Number(row.totalAccounts)) * 100 : 0)
    };
  });
};

const calculateBaseSummary = (data: RepData[]): SummaryValues => {
  const totalSpend = data.reduce((sum, item) => sum + item.spend, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
  const totalPacks = data.reduce((sum, item) => sum + item.packs, 0);
  const totalAccounts = data.reduce((sum, item) => sum + item.totalAccounts, 0);
  const activeAccounts = data.reduce((sum, item) => sum + item.activeAccounts, 0);
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
