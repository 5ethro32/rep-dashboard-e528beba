import { useState, useEffect } from 'react';
import { RepData, SummaryData, RepChangesRecord } from '@/types/rep-performance.types';
import { calculateSummary } from '@/utils/rep-performance-utils';
import { saveRepPerformanceData, loadStoredRepPerformanceData } from '@/services/rep-performance-service';
import { getCombinedRepData, sortRepData } from '@/utils/rep-data-processing';
import {
  defaultOverallData, defaultRepData, defaultRevaData, defaultWholesaleData,
  defaultBaseSummary, defaultRevaValues, defaultWholesaleValues,
  defaultSummaryChanges, defaultRepChanges
} from '@/data/rep-performance-default-data';

// Function to convert the new data format to the expected RepData format
const convertDataFormat = (repPerformanceData: any[]): RepData[] => {
  // Group by rep
  const repGrouped: Record<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }> = {};
  
  repPerformanceData.forEach(item => {
    const repName = item.rep_name;
    
    if (!repGrouped[repName]) {
      repGrouped[repName] = {
        rep: repName,
        spend: 0,
        profit: 0,
        packs: 0,
        activeAccounts: new Set(),
        totalAccounts: new Set(),
      };
    }
    
    const spend = Number(item.spend) || 0;
    const profit = Number(item.profit) || 0;
    const packs = Number(item.packs) || 0;
    
    repGrouped[repName].spend += spend;
    repGrouped[repName].profit += profit;
    repGrouped[repName].packs += packs;
    
    if (spend > 0) {
      repGrouped[repName].activeAccounts.add(item.account_ref);
    }
    
    repGrouped[repName].totalAccounts.add(item.account_ref);
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

// Calculate department summary from raw data
const calculateDeptSummary = (data: any[]): SummaryData => {
  const totalSpend = data.reduce((sum, item) => sum + Number(item.spend || 0), 0);
  const totalProfit = data.reduce((sum, item) => sum + Number(item.profit || 0), 0);
  const totalPacks = data.reduce((sum, item) => sum + Number(item.packs || 0), 0);
  
  // Get unique accounts
  const activeAccounts = new Set();
  const totalAccounts = new Set();
  
  data.forEach(item => {
    if (item.account_ref) {
      totalAccounts.add(item.account_ref);
      if (Number(item.spend || 0) > 0) {
        activeAccounts.add(item.account_ref);
      }
    }
  });
  
  return {
    totalSpend,
    totalProfit,
    totalPacks,
    activeAccounts: activeAccounts.size,
    totalAccounts: totalAccounts.size,
    averageMargin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0
  };
};

// Calculate percentage change between current and previous values
const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
};

// Calculate changes between datasets
const calculateChanges = (currentData: RepData[], previousData: RepData[]): RepChangesRecord => {
  const repChanges: RepChangesRecord = {};
  
  currentData.forEach(currentRep => {
    const previousRep = previousData.find(p => p.rep === currentRep.rep);
    
    if (previousRep) {
      repChanges[currentRep.rep] = {
        profit: calculatePercentChange(currentRep.profit, previousRep.profit),
        spend: calculatePercentChange(currentRep.spend, previousRep.spend),
        margin: currentRep.margin - previousRep.margin,
        packs: calculatePercentChange(currentRep.packs, previousRep.packs),
        activeAccounts: calculatePercentChange(currentRep.activeAccounts, previousRep.activeAccounts),
        totalAccounts: calculatePercentChange(currentRep.totalAccounts, previousRep.totalAccounts),
        profitPerActiveShop: calculatePercentChange(currentRep.profitPerActiveShop, previousRep.profitPerActiveShop),
        profitPerPack: calculatePercentChange(currentRep.profitPerPack, previousRep.profitPerPack),
        activeRatio: calculatePercentChange(currentRep.activeRatio, previousRep.activeRatio)
      };
    }
  });
  
  return repChanges;
};

export const useEnhancedPerformanceData = () => {
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('May');
  const [availableMonths, setAvailableMonths] = useState<string[]>(['February', 'March', 'April', 'May']);
  
  // State for all months
  const [overallData, setOverallData] = useState(defaultOverallData);
  const [repData, setRepData] = useState(defaultRepData);
  const [revaData, setRevaData] = useState(defaultRevaData);
  const [wholesaleData, setWholesaleData] = useState(defaultWholesaleData);
  const [baseSummary, setBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [revaValues, setRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [wholesaleValues, setWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [febRepData, setFebRepData] = useState(defaultRepData);
  const [febRevaData, setFebRevaData] = useState(defaultRevaData);
  const [febWholesaleData, setFebWholesaleData] = useState(defaultWholesaleData);
  const [febBaseSummary, setFebBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [febRevaValues, setFebRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [febWholesaleValues, setFebWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [aprRepData, setAprRepData] = useState(defaultRepData);
  const [aprRevaData, setAprRevaData] = useState(defaultRevaData);
  const [aprWholesaleData, setAprWholesaleData] = useState(defaultWholesaleData);
  const [aprBaseSummary, setAprBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [aprRevaValues, setAprRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [aprWholesaleValues, setAprWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [mayRepData, setMayRepData] = useState(defaultRepData);
  const [mayRevaData, setMayRevaData] = useState(defaultRevaData);
  const [mayWholesaleData, setMayWholesaleData] = useState(defaultWholesaleData);
  const [mayBaseSummary, setMayBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [mayRevaValues, setMayRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [mayWholesaleValues, setMayWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  
  useEffect(() => {
    // Try loading from local storage first
    const storedData = loadStoredRepPerformanceData();
    
    if (storedData) {
      // Set all the state values from storage
      setOverallData(storedData.overallData || defaultOverallData);
      setRepData(storedData.repData || defaultRepData);
      setRevaData(storedData.revaData || defaultRevaData);
      setWholesaleData(storedData.wholesaleData || defaultWholesaleData);
      setBaseSummary(storedData.baseSummary || defaultBaseSummary);
      setRevaValues(storedData.revaValues || defaultRevaValues);
      setWholesaleValues(storedData.wholesaleValues || defaultWholesaleValues);
      
      setFebRepData(storedData.febRepData || defaultRepData);
      setFebRevaData(storedData.febRevaData || defaultRevaData);
      setFebWholesaleData(storedData.febWholesaleData || defaultWholesaleData);
      setFebBaseSummary(storedData.febBaseSummary || defaultBaseSummary);
      setFebRevaValues(storedData.febRevaValues || defaultRevaValues);
      setFebWholesaleValues(storedData.febWholesaleValues || defaultWholesaleValues);
      
      setAprRepData(storedData.aprRepData || defaultRepData);
      setAprRevaData(storedData.aprRevaData || defaultRevaData);
      setAprWholesaleData(storedData.aprWholesaleData || defaultWholesaleData);
      setAprBaseSummary(storedData.aprBaseSummary || defaultBaseSummary);
      setAprRevaValues(storedData.aprRevaValues || defaultRevaValues);
      setAprWholesaleValues(storedData.aprWholesaleValues || defaultWholesaleValues);
      
      setMayRepData(storedData.mayRepData || defaultRepData);
      setMayRevaData(storedData.mayRevaData || defaultRevaData);
      setMayWholesaleData(storedData.mayWholesaleData || defaultWholesaleData);
      setMayBaseSummary(storedData.mayBaseSummary || defaultBaseSummary);
      setMayRevaValues(storedData.mayRevaValues || defaultRevaValues);
      setMayWholesaleValues(storedData.mayWholesaleValues || defaultWholesaleValues);
      
      setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
      setRepChanges(storedData.repChanges || defaultRepChanges);
    }
    
    // Load fresh data from API
    loadDataFromSupabase();
  }, []);
  
  useEffect(() => {
    console.log("Recalculating combined data based on toggle changes:", { includeRetail, includeReva, includeWholesale, selectedMonth });
    
    let currentRepData = repData;
    let currentRevaData = revaData;
    let currentWholesaleData = wholesaleData;
    
    // Select the right dataset based on the selected month
    if (selectedMonth === 'February') {
      currentRepData = febRepData;
      currentRevaData = febRevaData;
      currentWholesaleData = febWholesaleData;
    } else if (selectedMonth === 'April') {
      currentRepData = aprRepData;
      currentRevaData = aprRevaData;
      currentWholesaleData = aprWholesaleData;
    } else if (selectedMonth === 'May') {
      currentRepData = mayRepData;
      currentRevaData = mayRevaData;
      currentWholesaleData = mayWholesaleData;
    }
    
    // Combine data based on the selected filters
    const combinedData = getCombinedRepData(
      currentRepData,
      currentRevaData,
      currentWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    setOverallData(combinedData);
    
    // Calculate changes based on the selected month and its previous month
    let previousMonthRepData: RepData[] = [];
    let previousMonthSummaryData: SummaryData = {
      totalSpend: 0,
      totalProfit: 0,
      averageMargin: 0,
      totalPacks: 0,
      totalAccounts: 0,
      activeAccounts: 0
    };
    
    let currentMonthSummaryData: SummaryData = calculateSummary(
      selectedMonth === 'February' ? febBaseSummary :
      selectedMonth === 'April' ? aprBaseSummary :
      selectedMonth === 'May' ? mayBaseSummary : baseSummary,
      
      selectedMonth === 'February' ? febRevaValues :
      selectedMonth === 'April' ? aprRevaValues :
      selectedMonth === 'May' ? mayRevaValues : revaValues,
      
      selectedMonth === 'February' ? febWholesaleValues :
      selectedMonth === 'April' ? aprWholesaleValues :
      selectedMonth === 'May' ? mayWholesaleValues : wholesaleValues,
      
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    if (selectedMonth === 'March') {
      // March compared to February
      previousMonthRepData = getCombinedRepData(
        febRepData, febRevaData, febWholesaleData, 
        includeRetail, includeReva, includeWholesale
      );
      previousMonthSummaryData = calculateSummary(
        febBaseSummary, febRevaValues, febWholesaleValues,
        includeRetail, includeReva, includeWholesale
      );
    } else if (selectedMonth === 'April') {
      // April compared to March
      previousMonthRepData = getCombinedRepData(
        repData, revaData, wholesaleData, 
        includeRetail, includeReva, includeWholesale
      );
      previousMonthSummaryData = calculateSummary(
        baseSummary, revaValues, wholesaleValues,
        includeRetail, includeReva, includeWholesale
      );
    } else if (selectedMonth === 'May') {
      // May compared to April
      previousMonthRepData = getCombinedRepData(
        aprRepData, aprRevaData, aprWholesaleData, 
        includeRetail, includeReva, includeWholesale
      );
      previousMonthSummaryData = calculateSummary(
        aprBaseSummary, aprRevaValues, aprWholesaleValues,
        includeRetail, includeReva, includeWholesale
      );
    }
    
    // Only update changes if we're not on February (which has no previous month)
    if (selectedMonth !== 'February') {
      // Calculate rep changes
      const newRepChanges = calculateChanges(combinedData, previousMonthRepData);
      
      // Calculate summary changes
      const newSummaryChanges = {
        totalSpend: calculatePercentChange(currentMonthSummaryData.totalSpend, previousMonthSummaryData.totalSpend),
        totalProfit: calculatePercentChange(currentMonthSummaryData.totalProfit, previousMonthSummaryData.totalProfit),
        averageMargin: currentMonthSummaryData.averageMargin - previousMonthSummaryData.averageMargin,
        totalPacks: calculatePercentChange(currentMonthSummaryData.totalPacks, previousMonthSummaryData.totalPacks),
        totalAccounts: calculatePercentChange(currentMonthSummaryData.totalAccounts, previousMonthSummaryData.totalAccounts),
        activeAccounts: calculatePercentChange(currentMonthSummaryData.activeAccounts, previousMonthSummaryData.activeAccounts)
      };
      
      setRepChanges(newRepChanges);
      setSummaryChanges(newSummaryChanges);
      
      console.log("Updated changes for month:", selectedMonth, {
        previousMonth: selectedMonth === 'March' ? 'February' : selectedMonth === 'April' ? 'March' : 'April',
        newSummaryChanges
      });
    } else {
      // For February, we have no previous month to compare against
      setRepChanges({});
      setSummaryChanges({
        totalSpend: 0,
        totalProfit: 0,
        averageMargin: 0,
        totalPacks: 0,
        totalAccounts: 0,
        activeAccounts: 0
      });
    }
  }, [includeRetail, includeReva, includeWholesale, selectedMonth]);
  
  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      // Fetch data for all months using the unified approach
      await Promise.all([
        loadMonthData('February', setFebRepData, setFebRevaData, setFebWholesaleData, setFebBaseSummary, setFebRevaValues, setFebWholesaleValues),
        loadMonthData('March', setRepData, setRevaData, setWholesaleData, setBaseSummary, setRevaValues, setWholesaleValues),
        loadMonthData('April', setAprRepData, setAprRevaData, setAprWholesaleData, setAprBaseSummary, setAprRevaValues, setAprWholesaleValues),
        loadMonthData('May', setMayRepData, setMayRevaData, setMayWholesaleData, setMayBaseSummary, setMayRevaValues, setMayWholesaleValues)
      ]);
      
      // We no longer set the global changes here - they're calculated in the useEffect
      // based on the selected month
      
      // Save all data to local storage
      saveRepPerformanceData({
        overallData: getCombinedRepData(repData, revaData, wholesaleData, includeRetail, includeReva, includeWholesale),
        repData,
        revaData,
        wholesaleData,
        baseSummary,
        revaValues,
        wholesaleValues,
        
        febRepData,
        febRevaData,
        febWholesaleData,
        febBaseSummary,
        febRevaValues,
        febWholesaleValues,
        
        aprRepData,
        aprRevaData,
        aprWholesaleData,
        aprBaseSummary,
        aprRevaValues,
        aprWholesaleValues,
        
        mayRepData,
        mayRevaData,
        mayWholesaleData,
        mayBaseSummary,
        mayRevaValues,
        mayWholesaleValues,
        
        summaryChanges: {
          totalSpend: 0,
          totalProfit: 0,
          averageMargin: 0,
          totalPacks: 0,
          totalAccounts: 0,
          activeAccounts: 0
        },
        repChanges: {}
      });
      
      console.log("Successfully loaded and processed all data");
      
      // After loading, trigger the useEffect to calculate changes for the current selected month
      // by toggling one of the dependencies
      const currentIncludeRetail = includeRetail;
      setIncludeRetail(!currentIncludeRetail);
      setTimeout(() => {
        setIncludeRetail(currentIncludeRetail);
      }, 10);
      
      return true;
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to load data for a specific month
  const loadMonthData = async (
    month: string,
    setRepDataFn: React.Dispatch<React.SetStateAction<RepData[]>>,
    setRevaDataFn: React.Dispatch<React.SetStateAction<RepData[]>>,
    setWholesaleDataFn: React.Dispatch<React.SetStateAction<RepData[]>>,
    setBaseSummaryFn: React.Dispatch<React.SetStateAction<SummaryData>>,
    setRevaValuesFn: React.Dispatch<React.SetStateAction<SummaryData>>,
    setWholesaleValuesFn: React.Dispatch<React.SetStateAction<SummaryData>>
  ) => {
    try {
      console.log(`Loading data for ${month} using unified approach`);
      
      // Fetch data from unified_sales_data table with pagination
      let allData = [];
      let hasMoreData = true;
      let offset = 0;
      const pageSize = 1000;
      
      while (hasMoreData) {
        console.log(`Fetching ${month} data page ${offset/pageSize + 1}`);
        const response = await fetch(`https://ukshnjjmsrhgvkwrzoah.supabase.co/rest/v1/unified_sales_data?reporting_month=eq.${month}&limit=${pageSize}&offset=${offset}`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const pageData = await response.json();
        console.log(`Got page with ${pageData.length} records for ${month}`);
        
        allData = [...allData, ...pageData];
        
        if (pageData.length < pageSize) {
          hasMoreData = false;
        } else {
          offset += pageSize;
        }
      }
      
      console.log(`Total records for ${month}: ${allData.length}`);
      
      // Filter data by department
      const retailData = allData.filter((item: any) => 
        (item.department || '').toLowerCase().includes('retail'));
      
      const revaData = allData.filter((item: any) => 
        (item.department || '').toLowerCase().includes('reva'));
      
      const wholesaleData = allData.filter((item: any) => 
        (item.department || '').toLowerCase().includes('wholesale'));
      
      console.log(`${month} departments - Retail: ${retailData.length}, REVA: ${revaData.length}, Wholesale: ${wholesaleData.length}`);
      
      // Convert to RepData format
      const retailRepData = convertDataFormat(retailData);
      const revaRepData = convertDataFormat(revaData);
      const wholesaleRepData = convertDataFormat(wholesaleData);
      
      // Calculate department summaries
      const retailSummary = calculateDeptSummary(retailData);
      const revaSummary = calculateDeptSummary(revaData);
      const wholesaleSummary = calculateDeptSummary(wholesaleData);
      
      // Update state
      setRepDataFn(retailRepData);
      setRevaDataFn(revaRepData);
      setWholesaleDataFn(wholesaleRepData);
      setBaseSummaryFn(retailSummary);
      setRevaValuesFn(revaSummary);
      setWholesaleValuesFn(wholesaleSummary);
      
      return true;
    } catch (error) {
      console.error(`Error loading ${month} data:`, error);
      return false;
    }
  };
  
  // Get active data for a specific tab and month
  const getActiveData = (tabValue: string, month?: string) => {
    const monthToUse = month || selectedMonth;
    
    let currentRepData = repData;
    let currentRevaData = revaData;
    let currentWholesaleData = wholesaleData;
    
    if (monthToUse === 'February') {
      currentRepData = febRepData;
      currentRevaData = febRevaData;
      currentWholesaleData = febWholesaleData;
    } else if (monthToUse === 'April') {
      currentRepData = aprRepData;
      currentRevaData = aprRevaData;
      currentWholesaleData = aprWholesaleData;
    } else if (monthToUse === 'May') {
      currentRepData = mayRepData;
      currentRevaData = mayRevaData;
      currentWholesaleData = mayWholesaleData;
    }
    
    // Determine which data to return based on the tab value
    switch (tabValue) {
      case 'rep':
        return includeRetail ? currentRepData : [];
      case 'reva':
        return includeReva ? currentRevaData : [];
      case 'wholesale':
        return includeWholesale ? currentWholesaleData : [];
      case 'overall':
      default:
        if (monthToUse !== selectedMonth) {
          // Recombine data for specific month
          return getCombinedRepData(
            monthToUse === 'February' ? febRepData :
            monthToUse === 'April' ? aprRepData :
            monthToUse === 'May' ? mayRepData : repData,
            
            monthToUse === 'February' ? febRevaData :
            monthToUse === 'April' ? aprRevaData :
            monthToUse === 'May' ? mayRevaData : revaData,
            
            monthToUse === 'February' ? febWholesaleData :
            monthToUse === 'April' ? aprWholesaleData :
            monthToUse === 'May' ? mayWholesaleData : wholesaleData,
            
            includeRetail,
            includeReva,
            includeWholesale
          );
        }
        return overallData;
    }
  };
  
  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  // Sort data based on current settings
  const sortData = (data: RepData[]) => {
    return [...data].sort((a, b) => {
      const valueA = a[sortBy as keyof RepData] as number;
      const valueB = b[sortBy as keyof RepData] as number;
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
  };
  
  // Get previous month value for a specific rep and metric
  const getFebValue = (repName: string, metricType: string, currentValue: number, changePercent: number) => {
    if (!metricType || !repName) return '0';
    
    if (metricType === 'margin') {
      const previousValue = currentValue - changePercent;
      if (isNaN(previousValue)) return '0';
      return previousValue.toFixed(1) + '%';
    }
    
    const previousValue = currentValue / (1 + changePercent / 100);
    if (isNaN(previousValue)) return '0';
    
    if (metricType === 'spend' || metricType === 'profit') {
      return '£' + Math.round(previousValue).toLocaleString();
    }
    
    return Math.round(previousValue).toLocaleString();
  };
  
  // Calculate combined summary based on department toggles
  const summary = calculateSummary(
    selectedMonth === 'February' ? febBaseSummary :
    selectedMonth === 'April' ? aprBaseSummary :
    selectedMonth === 'May' ? mayBaseSummary : baseSummary,
    
    selectedMonth === 'February' ? febRevaValues :
    selectedMonth === 'April' ? aprRevaValues :
    selectedMonth === 'May' ? mayRevaValues : revaValues,
    
    selectedMonth === 'February' ? febWholesaleValues :
    selectedMonth === 'April' ? aprWholesaleValues :
    selectedMonth === 'May' ? mayWholesaleValues : wholesaleValues,
    
    includeRetail,
    includeReva,
    includeWholesale
  );

  // Get actual previous month's summary (not calculated from percentage change)
  const getPreviousMonthSummary = () => {
    // Determine previous month based on current selection
    let prevBaseSummary, prevRevaValues, prevWholesaleValues;
    
    if (selectedMonth === 'March') {
      prevBaseSummary = febBaseSummary;
      prevRevaValues = febRevaValues;
      prevWholesaleValues = febWholesaleValues;
    } else if (selectedMonth === 'April') {
      prevBaseSummary = baseSummary;  // March data
      prevRevaValues = revaValues;
      prevWholesaleValues = wholesaleValues;
    } else if (selectedMonth === 'May') {
      prevBaseSummary = aprBaseSummary;
      prevRevaValues = aprRevaValues;
      prevWholesaleValues = aprWholesaleValues;
    } else {
      // If February or invalid month, return empty values
      return {
        totalSpend: 0,
        totalProfit: 0,
        averageMargin: 0,
        totalPacks: 0,
        totalAccounts: 0,
        activeAccounts: 0
      };
    }
    
    // Calculate combined previous month summary with same department toggles
    return calculateSummary(
      prevBaseSummary,
      prevRevaValues, 
      prevWholesaleValues,
      includeRetail,
      includeReva,
      includeWholesale
    );
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
    isLoading,
    loadDataFromSupabase,
    getFebValue,
    selectedMonth,
    setSelectedMonth,
    baseSummary,
    revaValues,
    wholesaleValues,
    aprBaseSummary,
    aprRevaValues,
    aprWholesaleValues,
    febBaseSummary,
    febRevaValues,
    febWholesaleValues,
    mayBaseSummary,
    mayRevaValues,
    mayWholesaleValues,
    availableMonths,
    previousMonthSummary: getPreviousMonthSummary()
  };
};

export default useEnhancedPerformanceData; 