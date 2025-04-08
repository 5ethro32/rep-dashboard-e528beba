import { useState, useEffect } from 'react';
import { calculateSummary } from '@/utils/rep-performance-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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

interface SalesDataItem {
  id: number;
  rep_name: string;
  rep_type: string;
  account_ref: string;
  spend: number;
  profit: number;
  packs: number;
  account_name: string;
  reporting_period: string;
}

interface SummaryData {
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
  totalAccounts: number;
  activeAccounts: number;
  averageMargin: number;
}

const defaultOverallData: RepData[] = [
  { rep: "Clare Quinn", spend: 174152.39, profit: 22951.81, margin: 13.18, packs: 105432, activeAccounts: 42, totalAccounts: 81, profitPerActiveShop: 546.47, profitPerPack: 0.22, activeRatio: 51.85 },
  { rep: "Craig McDowall", spend: 607269.54, profit: 75999.24, margin: 12.51, packs: 327729, activeAccounts: 127, totalAccounts: 291, profitPerActiveShop: 598.42, profitPerPack: 0.23, activeRatio: 43.64 },
  { rep: "Ged Thomas", spend: 186126.64, profit: 37837.48, margin: 20.33, packs: 122874, activeAccounts: 70, totalAccounts: 95, profitPerActiveShop: 540.54, profitPerPack: 0.31, activeRatio: 73.68 },
  { rep: "Jonny Cunningham", spend: 230514.37, profit: 51753.68, margin: 22.45, packs: 142395, activeAccounts: 55, totalAccounts: 111, profitPerActiveShop: 940.98, profitPerPack: 0.36, activeRatio: 49.55 },
  { rep: "Michael McKay", spend: 324630.48, profit: 53194.85, margin: 16.39, packs: 184224, activeAccounts: 105, totalAccounts: 192, profitPerActiveShop: 506.62, profitPerPack: 0.29, activeRatio: 54.69 },
  { rep: "Pete Dhillon", spend: 167740.56, profit: 33757.35, margin: 20.12, packs: 114437, activeAccounts: 76, totalAccounts: 109, profitPerActiveShop: 444.18, profitPerPack: 0.29, activeRatio: 69.72 },
  { rep: "Stuart Geddes", spend: 162698.54, profit: 25799.93, margin: 15.86, packs: 68130, activeAccounts: 57, totalAccounts: 71, profitPerActiveShop: 452.63, profitPerPack: 0.38, activeRatio: 80.28 },
  { rep: "Murray Glasgow", spend: 1259.21, profit: 365.84, margin: 29.05, packs: 289, activeAccounts: 3, totalAccounts: 5, profitPerActiveShop: 121.95, profitPerPack: 1.27, activeRatio: 60.00 }
];

const defaultRepData: RepData[] = [
  { rep: "Clare Quinn", spend: 174152.39, profit: 22951.81, margin: 13.18, packs: 105432, activeAccounts: 42, totalAccounts: 81, profitPerActiveShop: 546.47, profitPerPack: 0.22, activeRatio: 51.85 },
  { rep: "Craig McDowall", spend: 283468.89, profit: 44286.56, margin: 15.62, packs: 190846, activeAccounts: 108, totalAccounts: 262, profitPerActiveShop: 410.06, profitPerPack: 0.23, activeRatio: 41.22 },
  { rep: "Ged Thomas", spend: 152029.32, profit: 34298.11, margin: 22.56, packs: 102684, activeAccounts: 69, totalAccounts: 94, profitPerActiveShop: 497.07, profitPerPack: 0.33, activeRatio: 73.40 },
  { rep: "Jonny Cunningham", spend: 162333.80, profit: 29693.82, margin: 18.29, packs: 91437, activeAccounts: 48, totalAccounts: 91, profitPerActiveShop: 618.62, profitPerPack: 0.32, activeRatio: 52.75 },
  { rep: "Michael McKay", spend: 324630.48, profit: 53194.85, margin: 16.39, packs: 184224, activeAccounts: 105, totalAccounts: 192, profitPerActiveShop: 506.62, profitPerPack: 0.29, activeRatio: 54.69 },
  { rep: "Pete Dhillon", spend: 167740.56, profit: 33757.35, margin: 20.12, packs: 114437, activeAccounts: 76, totalAccounts: 109, profitPerActiveShop: 444.18, profitPerPack: 0.29, activeRatio: 69.72 },
  { rep: "Stuart Geddes", spend: 154070.16, profit: 25005.81, margin: 16.23, packs: 62039, activeAccounts: 56, totalAccounts: 70, profitPerActiveShop: 446.53, profitPerPack: 0.40, activeRatio: 80.00 },
  { rep: "Murray Glasgow", spend: 1259.21, profit: 365.84, margin: 29.05, packs: 289, activeAccounts: 3, totalAccounts: 5, profitPerActiveShop: 121.95, profitPerPack: 1.27, activeRatio: 60.00 }
];

const defaultRevaData: RepData[] = [
  { rep: "Louise Skiba", spend: 113006.33, profit: 11745.28, margin: 10.39, packs: 88291, activeAccounts: 10, totalAccounts: 13, profitPerActiveShop: 1174.53, profitPerPack: 0.13, activeRatio: 76.92 },
  { rep: "Stuart Geddes", spend: 8628.38, profit: 794.12, margin: 9.20, packs: 6091, activeAccounts: 1, totalAccounts: 1, profitPerActiveShop: 794.12, profitPerPack: 0.13, activeRatio: 100.00 },
  { rep: "Craig McDowall", spend: 123321.25, profit: 11616.22, margin: 9.42, packs: 88633, activeAccounts: 13, totalAccounts: 13, profitPerActiveShop: 893.56, profitPerPack: 0.13, activeRatio: 100.00 },
  { rep: "Ged Thomas", spend: 34097.32, profit: 3539.37, margin: 10.38, packs: 20190, activeAccounts: 2, totalAccounts: 2, profitPerActiveShop: 1769.69, profitPerPack: 0.18, activeRatio: 100.00 },
  { rep: "Jonny Cunningham", spend: 15361.23, profit: 1543.18, margin: 10.05, packs: 12953, activeAccounts: 3, totalAccounts: 4, profitPerActiveShop: 514.39, profitPerPack: 0.12, activeRatio: 75.00 },
  { rep: "Pete Dhillon", spend: 12554.86, profit: 1297.68, margin: 10.34, packs: 10216, activeAccounts: 2, totalAccounts: 3, profitPerActiveShop: 648.84, profitPerPack: 0.13, activeRatio: 66.67 },
  { rep: "Michael McKay", spend: 9875.24, profit: 1052.31, margin: 10.66, packs: 7843, activeAccounts: 2, totalAccounts: 3, profitPerActiveShop: 526.16, profitPerPack: 0.13, activeRatio: 66.67 }
];

const defaultWholesaleData: RepData[] = [
  { rep: "Craig McDowall", spend: 200479.40, profit: 20096.46, margin: 10.02, packs: 48250, activeAccounts: 6, totalAccounts: 16, profitPerActiveShop: 3349.41, profitPerPack: 0.42, activeRatio: 37.50 },
  { rep: "Pete Dhillon", spend: 5850.00, profit: 900.00, margin: 15.38, packs: 11000, activeAccounts: 1, totalAccounts: 1, profitPerActiveShop: 900.00, profitPerPack: 0.08, activeRatio: 100.00 },
  { rep: "Jonny Cunningham", spend: 68180.57, profit: 22059.86, margin: 32.36, packs: 50958, activeAccounts: 7, totalAccounts: 20, profitPerActiveShop: 3151.41, profitPerPack: 0.43, activeRatio: 35.00 },
  { rep: "Mike Cooper", spend: 88801.22, profit: 13545.86, margin: 15.25, packs: 91490, activeAccounts: 10, totalAccounts: 20, profitPerActiveShop: 1354.59, profitPerPack: 0.15, activeRatio: 50.00 }
];

const defaultBaseSummary: SummaryData = {
  totalSpend: 1419684.81,
  totalProfit: 243554.15,
  totalPacks: 851388,
  totalAccounts: 904,
  activeAccounts: 507,
  averageMargin: 15.90
};

const defaultRevaValues: SummaryData = {
  totalSpend: 279053.28,
  totalProfit: 27694.99,
  totalPacks: 203205,
  totalAccounts: 29,
  activeAccounts: 26,
  averageMargin: 9.85
};

const defaultWholesaleValues: SummaryData = {
  totalSpend: 363311.19,
  totalProfit: 56602.18,
  totalPacks: 201698,
  totalAccounts: 57,
  activeAccounts: 24,
  averageMargin: 15.58
};

const defaultSummaryChanges: SummaryData = {
  totalSpend: 3.55,
  totalProfit: 18.77,
  totalPacks: -3.86,
  totalAccounts: 7.89,
  activeAccounts: -4.31,
  averageMargin: 2.04
};

const defaultRepChanges: Record<string, {
  spend: number;
  profit: number;
  margin: number;
  packs: number;
  profitPerActiveShop: number;
  profitPerPack: number;
  activeRatio: number;
}> = {
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

export const useRepPerformanceData = () => {
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  
  const [overallData, setOverallData] = useState(defaultOverallData);
  const [repData, setRepData] = useState(defaultRepData);
  const [revaData, setRevaData] = useState(defaultRevaData);
  const [wholesaleData, setWholesaleData] = useState(defaultWholesaleData);
  const [baseSummary, setBaseSummary] = useState(defaultBaseSummary);
  const [revaValues, setRevaValues] = useState(defaultRevaValues);
  const [wholesaleValues, setWholesaleValues] = useState(defaultWholesaleValues);
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState(defaultRepChanges);

  useEffect(() => {
    const storedData = localStorage.getItem('repPerformanceData');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        
        setOverallData(parsedData.overallData || defaultOverallData);
        setRepData(parsedData.repData || defaultRepData);
        setRevaData(parsedData.revaData || defaultRevaData);
        setWholesaleData(parsedData.wholesaleData || defaultWholesaleData);
        setBaseSummary(parsedData.baseSummary || defaultBaseSummary);
        setRevaValues(parsedData.revaValues || defaultRevaValues);
        setWholesaleValues(parsedData.wholesaleValues || defaultWholesaleValues);
        setSummaryChanges(parsedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(parsedData.repChanges || defaultRepChanges);
      } catch (error) {
        console.error('Error parsing stored data:', error);
      }
    }
  }, []);

  useEffect(() => {
    console.log("Recalculating combined data based on toggle changes:", { includeRetail, includeReva, includeWholesale });
    const combinedData = getCombinedRepData(
      repData,
      revaData,
      wholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    setOverallData(combinedData);
  }, [includeRetail, includeReva, includeWholesale, repData, revaData, wholesaleData]);

  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized.');
      }
      
      const { data: repDataFromDb, error: repError } = await supabase
        .from('sales_data')
        .select('*')
        .eq('rep_type', 'RETAIL')
        .eq('reporting_period', '2025-03');
      
      if (repError) throw new Error(`Error fetching rep data: ${repError.message}`);
      
      const { data: revaDataFromDb, error: revaError } = await supabase
        .from('sales_data')
        .select('*')
        .eq('rep_type', 'REVA')
        .eq('reporting_period', '2025-03');
      
      if (revaError) throw new Error(`Error fetching REVA data: ${revaError.message}`);
      
      const { data: wholesaleDataFromDb, error: wholesaleError } = await supabase
        .from('sales_data')
        .select('*')
        .eq('rep_type', 'WHOLESALE')
        .eq('reporting_period', '2025-03');
      
      if (wholesaleError) throw new Error(`Error fetching wholesale data: ${wholesaleError.message}`);
      
      const processedRepData = processRepData(repDataFromDb || []);
      const processedRevaData = processRepData(revaDataFromDb || []);
      const processedWholesaleData = processRepData(wholesaleDataFromDb || []);
      
      setRepData(processedRepData);
      setRevaData(processedRevaData);
      setWholesaleData(processedWholesaleData);
      
      const calculatedSummary = calculateSummaryFromData(processedRepData);
      const calculatedRevaValues = calculateSummaryFromData(processedRevaData);
      const calculatedWholesaleValues = calculateSummaryFromData(processedWholesaleData);
      
      setBaseSummary(calculatedSummary);
      setRevaValues(calculatedRevaValues);
      setWholesaleValues(calculatedWholesaleValues);
      
      const combinedData = getCombinedRepData(
        processedRepData,
        processedRevaData,
        processedWholesaleData,
        includeRetail,
        includeReva,
        includeWholesale
      );
      setOverallData(combinedData);

      localStorage.setItem('repPerformanceData', JSON.stringify({
        overallData: combinedData,
        repData: processedRepData,
        revaData: processedRevaData,
        wholesaleData: processedWholesaleData,
        baseSummary: calculatedSummary,
        revaValues: calculatedRevaValues,
        wholesaleValues: calculatedWholesaleValues,
        summaryChanges,
        repChanges
      }));

      console.log("Successfully loaded data from Supabase");
      toast({
        title: "Data loaded successfully",
        description: "The latest performance data has been loaded.",
      });
      return true;
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const processRepData = (salesData) => {
    const repGrouped: Record<string, {
      rep: string;
      spend: number;
      profit: number;
      packs: number;
      activeAccounts: Set<string>;
      totalAccounts: Set<string>;
    }> = {};
    
    salesData.forEach(item => {
      if (!repGrouped[item.rep_name]) {
        repGrouped[item.rep_name] = {
          rep: item.rep_name,
          spend: 0,
          profit: 0,
          packs: 0,
          activeAccounts: new Set(),
          totalAccounts: new Set(),
        };
      }
      
      repGrouped[item.rep_name].spend += Number(item.spend) || 0;
      repGrouped[item.rep_name].profit += Number(item.profit) || 0;
      repGrouped[item.rep_name].packs += Number(item.packs) || 0;
      
      if (Number(item.spend) > 0) {
        repGrouped[item.rep_name].activeAccounts.add(item.account_ref);
      }
      repGrouped[item.rep_name].totalAccounts.add(item.account_ref);
    });
    
    return Object.values(repGrouped).map(rep => {
      const spend = rep.spend;
      const profit = rep.profit;
      const packs = rep.packs;
      const activeAccounts = rep.activeAccounts.size;
      const totalAccounts = rep.totalAccounts.size;
      
      return {
        rep: rep.rep,
        spend: spend,
        profit: profit,
        margin: spend > 0 ? (profit / spend) * 100 : 0,
        packs: packs,
        activeAccounts: activeAccounts,
        totalAccounts: totalAccounts,
        profitPerActiveShop: activeAccounts > 0 ? profit / activeAccounts : 0,
        profitPerPack: packs > 0 ? profit / packs : 0,
        activeRatio: totalAccounts > 0 ? (activeAccounts / totalAccounts) * 100 : 0
      };
    });
  };

  const calculateSummaryFromData = (repData) => {
    let totalSpend = 0;
    let totalProfit = 0;
    let totalPacks = 0;
    let totalActiveAccounts = 0;
    let totalAccounts = 0;
    
    repData.forEach(rep => {
      totalSpend += rep.spend;
      totalProfit += rep.profit;
      totalPacks += rep.packs;
      totalActiveAccounts += rep.activeAccounts;
      totalAccounts += rep.totalAccounts;
    });
    
    return {
      totalSpend,
      totalProfit,
      totalPacks,
      totalAccounts,
      activeAccounts: totalActiveAccounts,
      averageMargin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0
    };
  };

  const getCombinedRepData = (
    baseRepData = repData,
    baseRevaData = revaData,
    baseWholesaleData = wholesaleData,
    includeRetailData: boolean = includeRetail,
    includeRevaData: boolean = includeReva,
    includeWholesaleData: boolean = includeWholesale
  ) => {
    let combinedData = [];
    
    if (includeRetailData) {
      console.log("Including Retail data in combined data");
      combinedData = JSON.parse(JSON.stringify(baseRepData));
    }
    
    console.log("Starting combined data with retail data:", combinedData.length);
    
    if (includeRevaData) {
      console.log("Including REVA data in combined data");
      baseRevaData.forEach(revaItem => {
        const repIndex = combinedData.findIndex((rep) => rep.rep === revaItem.rep);
        
        if (repIndex >= 0) {
          const rep = combinedData[repIndex];
          rep.spend += revaItem.spend;
          rep.profit += revaItem.profit;
          rep.packs += revaItem.packs;
          
          rep.margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
          
          rep.activeAccounts += revaItem.activeAccounts || 0;
          rep.profitPerActiveShop = rep.activeAccounts > 0 ? rep.profit / rep.activeAccounts : 0;
          
          rep.totalAccounts += revaItem.totalAccounts || 0;
          rep.activeRatio = rep.totalAccounts > 0 ? (rep.activeAccounts / rep.totalAccounts) * 100 : 0;
          
          if (rep.packs > 0) {
            rep.profitPerPack = rep.profit / rep.packs;
          }
        } else {
          if (revaItem.rep !== "REVA" && revaItem.rep !== "Reva") {
            combinedData.push(revaItem);
          }
        }
      });
    }
    
    if (includeWholesaleData) {
      console.log("Including Wholesale data in combined data");
      baseWholesaleData.forEach(wholesaleItem => {
        const repIndex = combinedData.findIndex((rep) => rep.rep === wholesaleItem.rep);
        
        if (repIndex >= 0) {
          const rep = combinedData[repIndex];
          rep.spend += wholesaleItem.spend;
          rep.profit += wholesaleItem.profit;
          rep.packs += wholesaleItem.packs;
          
          rep.margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
          
          rep.activeAccounts += wholesaleItem.activeAccounts || 0;
          rep.profitPerActiveShop = rep.activeAccounts > 0 ? rep.profit / rep.activeAccounts : 0;
          
          rep.totalAccounts += wholesaleItem.totalAccounts || 0;
          rep.activeRatio = rep.totalAccounts > 0 ? (rep.activeAccounts / rep.totalAccounts) * 100 : 0;
          
          if (rep.packs > 0) {
            rep.profitPerPack = rep.profit / rep.packs;
          }
        } else {
          if (wholesaleItem.rep !== "WHOLESALE" && wholesaleItem.rep !== "Wholesale") {
            combinedData.push(wholesaleItem);
          }
        }
      });
    }
    
    console.log("Final combined data length:", combinedData.length);
    return combinedData;
  };

  const getActiveData = (tabValue: string) => {
    switch (tabValue) {
      case 'rep':
        return includeRetail ? repData : [];
      case 'reva':
        return includeReva ? revaData : [];
      case 'wholesale':
        return includeWholesale ? wholesaleData : [];
      case 'overall':
      default:
        return overallData;
    }
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortBy as keyof RepData] as number;
      const bValue = b[sortBy as keyof RepData] as number;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const summary = calculateSummary(
    baseSummary, 
    revaValues, 
    wholesaleValues,
    includeRetail,
    includeReva, 
    includeWholesale
  );

  console.log("Current summary values:", summary);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return {
    includeRetail,
    setIncludeRetail,
    includeReva,
    setIncludeReva,
    includeWholesale,
    setIncludeWholesale,
    sortBy,
    sortOrder,
    summary,
    summaryChanges,
    repChanges,
    getActiveData,
    sortData,
    handleSort,
    loadDataFromSupabase,
    isLoading
  };
};
