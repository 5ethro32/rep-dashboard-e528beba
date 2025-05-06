import { useState, useEffect } from 'react';
import { calculateSummary, calculateDeptSummary } from '@/utils/rep-performance-utils';
import { getCombinedRepData, sortRepData } from '@/utils/rep-data-processing';
import { fetchRepPerformanceData, saveRepPerformanceData, loadStoredRepPerformanceData, fetchMarchRollingData, fetchMarchDataFromSalesData } from '@/services/rep-performance-service';
import { RepData, SummaryData, RepChangesRecord } from '@/types/rep-performance.types';
import { supabase } from '@/integrations/supabase/client';
import {
  defaultOverallData,
  defaultRepData,
  defaultRevaData,
  defaultWholesaleData,
  defaultBaseSummary,
  defaultRevaValues,
  defaultWholesaleValues,
  defaultSummaryChanges,
  defaultRepChanges
} from '@/data/rep-performance-default-data';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';

export const useRepPerformanceData = () => {
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('May');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
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

  // Improved initial data loading sequence
  useEffect(() => {
    const initializeData = async () => {
      // Set loading state
      setIsLoading(true);
      
      // First, load data from localStorage
      const storedData = loadStoredRepPerformanceData();
      
      if (storedData) {
        console.log("Loading stored data from localStorage");
        
        // Load all stored data for all months
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
        
        // Log stored data to help diagnose issues
        console.log("February stored summary data:", storedData.febBaseSummary);
        console.log("March stored summary data:", storedData.baseSummary);
        console.log("April stored summary data:", storedData.aprBaseSummary);
        console.log("May stored summary data:", storedData.mayBaseSummary);
      }
      
      // After setting initial data from localStorage, fetch fresh data for all months
      try {
        console.log("Starting comprehensive data load from Supabase for all months");
        await loadAllMonthsData();
        console.log("Completed loading all months data");
      } catch (error) {
        console.error("Error during initial data load:", error);
      } finally {
        // Set loading state to false and mark initial load as complete
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    };
    
    initializeData();
  }, []);

  // Update combined data when toggle states change or month selection changes
  useEffect(() => {
    if (!initialLoadComplete) return;
    
    console.log("Recalculating combined data based on toggle changes:", { 
      includeRetail, 
      includeReva, 
      includeWholesale, 
      selectedMonth,
      initialLoadComplete
    });

    let currentRepData = repData;
    let currentRevaData = revaData;
    let currentWholesaleData = wholesaleData;
    
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
    
    const combinedData = getCombinedRepData(
      currentRepData,
      currentRevaData,
      currentWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    // Sort the combined data right away using the current sort settings
    const sortedData = sortRepData(combinedData, sortBy, sortOrder);
    console.log(`Data sorted by ${sortBy} in ${sortOrder} order, length: ${sortedData.length}`);
    
    setOverallData(sortedData);

    // Apply correct change indicators based on selected month
    updateChangeIndicators();
    
  }, [includeRetail, includeReva, includeWholesale, selectedMonth, repData, revaData, wholesaleData, 
      febRepData, febRevaData, febWholesaleData, aprRepData, aprRevaData, aprWholesaleData,
      mayRepData, mayRevaData, mayWholesaleData, initialLoadComplete, sortBy, sortOrder]);

  // Update change indicators based on selected month
  const updateChangeIndicators = () => {
    if (selectedMonth === 'February') {
      const invertedChanges: Record<string, any> = {};
      Object.keys(repChanges).forEach(rep => {
        if (repChanges[rep]) {
          invertedChanges[rep] = {
            profit: repChanges[rep].profit ? -repChanges[rep].profit / (1 + repChanges[rep].profit / 100) * 100 : 0,
            spend: repChanges[rep].spend ? -repChanges[rep].spend / (1 + repChanges[rep].spend / 100) * 100 : 0,
            margin: -repChanges[rep].margin,
            packs: repChanges[rep].packs ? -repChanges[rep].packs / (1 + repChanges[rep].packs / 100) * 100 : 0,
            activeAccounts: repChanges[rep].activeAccounts ? -repChanges[rep].activeAccounts / (1 + repChanges[rep].activeAccounts / 100) * 100 : 0,
            totalAccounts: repChanges[rep].totalAccounts ? -repChanges[rep].totalAccounts / (1 + repChanges[rep].totalAccounts / 100) * 100 : 0
          };
        }
      });
      
      const invertedSummaryChanges = {
        totalSpend: summaryChanges.totalSpend ? -summaryChanges.totalSpend / (1 + summaryChanges.totalSpend / 100) * 100 : 0,
        totalProfit: summaryChanges.totalProfit ? -summaryChanges.totalProfit / (1 + summaryChanges.totalProfit / 100) * 100 : 0,
        averageMargin: -summaryChanges.averageMargin,
        totalPacks: summaryChanges.totalPacks ? -summaryChanges.totalPacks / (1 + summaryChanges.totalPacks / 100) * 100 : 0,
        totalAccounts: summaryChanges.totalAccounts ? -summaryChanges.totalAccounts / (1 + summaryChanges.totalAccounts / 100) * 100 : 0,
        activeAccounts: summaryChanges.activeAccounts ? -summaryChanges.activeAccounts / (1 + summaryChanges.activeAccounts / 100) * 100 : 0
      };
      
      setSummaryChanges(invertedSummaryChanges);
      setRepChanges(invertedChanges);
    } else if (selectedMonth === 'April') {
      const storedData = loadStoredRepPerformanceData();
      if (storedData && storedData.aprilMarchChanges) {
        setRepChanges(storedData.aprilMarchChanges);
      }
      
      if (storedData && storedData.aprilSummaryChanges) {
        setSummaryChanges(storedData.aprilSummaryChanges);
      }
    } else if (selectedMonth === 'May') {
      const storedData = loadStoredRepPerformanceData();
      if (storedData && storedData.mayPriorChanges) {
        setRepChanges(storedData.mayPriorChanges);
      }
      
      if (storedData && storedData.maySummaryChanges) {
        setSummaryChanges(storedData.maySummaryChanges);
      }
    } else {
      const storedData = loadStoredRepPerformanceData();
      if (storedData) {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
      }
    }
  };

  // New function to load all months data at once
  const loadAllMonthsData = async () => {
    setIsLoading(true);
    try {
      // First load March and February data
      const marchData = await fetchRepPerformanceData();
      
      // Set March and February data
      setRepData(marchData.repData);
      setRevaData(marchData.revaData);
      setWholesaleData(marchData.wholesaleData);
      setBaseSummary(marchData.baseSummary);
      setRevaValues(marchData.revaValues);
      setWholesaleValues(marchData.wholesaleValues);
      
      setFebRepData(marchData.febRepData);
      setFebRevaData(marchData.febRevaData);
      setFebWholesaleData(marchData.febWholesaleData);
      setFebBaseSummary(marchData.febBaseSummary);
      setFebRevaValues(marchData.febRevaValues);
      setFebWholesaleValues(marchData.febWholesaleValues);
      
      setSummaryChanges(marchData.summaryChanges);
      setRepChanges(marchData.repChanges);
      
      // Now load April data
      await loadAprilData(false); // false means don't set isLoading to false yet
      
      // Finally load May data
      await loadMayData(false); // false means don't set isLoading to false yet
      
      // Update the overall data based on the currently selected month
      updateOverallDataForSelectedMonth();
      
      // Save all the data to localStorage
      saveAllDataToLocalStorage();
      
      console.log("Successfully loaded all data from Supabase");
      return true;
    } catch (error) {
      console.error('Error loading all data from Supabase:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update overall data based on selected month
  const updateOverallDataForSelectedMonth = () => {
    let currentRepData = repData;
    let currentRevaData = revaData;
    let currentWholesaleData = wholesaleData;
    
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
    
    const combinedData = getCombinedRepData(
      currentRepData,
      currentRevaData,
      currentWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    // Sort the combined data right away using the current sort settings
    const sortedData = sortRepData(combinedData, sortBy, sortOrder);
    setOverallData(sortedData);
    
    // Update changes based on selected month
    updateChangeIndicators();
  };

  // Function to save all data to localStorage
  const saveAllDataToLocalStorage = () => {
    const currentStoredData = loadStoredRepPerformanceData() || {};
    saveRepPerformanceData({
      ...currentStoredData,
      overallData,
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
      summaryChanges,
      repChanges
    });
  };

  // Modified loadMayData function that can be called during comprehensive data loading
  const loadMayData = async (updateLoadingState = true) => {
    if (updateLoadingState) setIsLoading(true);
    try {
      console.log('Starting to fetch May data from May_Data table...');
      
      // First, check if there's any data in the May_Data table
      const { count, error: countError } = await supabase
        .from('May_Data')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw new Error(`Error getting count: ${countError.message}`);
      
      if (!count || count === 0) {
        setIsLoading(false);
        console.log('No data found in the May_Data table');
        return false;
      }
      
      console.log(`Found ${count} total records in May_Data table`);
      
      // Fetch all records from May_Data using pagination
      let allRecords = [];
      const pageSize = 1000;
      const pages = Math.ceil(count / pageSize);
      
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('May_Data')
          .select('*')
          .range(from, to);
        
        if (pageError) throw new Error(`Error fetching page ${page}: ${pageError.message}`);
        if (pageData) allRecords = [...allRecords, ...pageData];
        
        console.log(`Fetched page ${page + 1}/${pages} with ${pageData?.length || 0} records from May_Data`);
      }
      
      const mayData = allRecords;
      console.log('Fetched May records total count:', mayData.length);
      
      // Use Prior_Month_Rolling for comparison data (April)
      console.log('Fetching April data from Prior_Month_Rolling table for May comparison...');
      
      const { count: priorCount, error: priorCountError } = await supabase
        .from('Prior_Month_Rolling')
        .select('*', { count: 'exact', head: true });
        
      if (priorCountError) throw new Error(`Error getting prior month count: ${priorCountError.message}`);
      
      let priorMonthRecords = [];
      const priorMonthPages = Math.ceil((priorCount || 0) / pageSize);
      
      for (let page = 0; page < priorMonthPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: priorPageData, error: priorPageError } = await supabase
          .from('Prior_Month_Rolling')
          .select('*')
          .range(from, to);
        
        if (priorPageError) throw new Error(`Error fetching prior month page ${page}: ${priorPageError.message}`);
        if (priorPageData) priorMonthRecords = [...priorMonthRecords, ...priorPageData];
        
        console.log(`Fetched prior month page ${page + 1}/${priorMonthPages} with ${priorPageData?.length || 0} records`);
      }
      
      const priorMonthData = priorMonthRecords;
      console.log('Fetched Prior Month records total count for May comparison:', priorMonthData.length);
      
      if (!mayData || mayData.length === 0) {
        setIsLoading(false);
        return false;
      }
      
      // Let's log some sample data to check what we're receiving
      if (mayData.length > 0) {
        console.log('Sample May_Data record:', mayData[0]);
      }
      
      // Filter the data by department
      const retailData = mayData.filter(item => !item.Department || item.Department === 'RETAIL');
      const revaData = mayData.filter(item => item.Department === 'REVA');
      const wholesaleData = mayData.filter(item => 
        item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
      );
      
      console.log(`May data breakdown - Retail: ${retailData.length}, REVA: ${revaData.length}, Wholesale: ${wholesaleData.length}`);
      
      const priorRetailData = priorMonthData?.filter(item => !item.Department || item.Department === 'RETAIL') || [];
      const priorRevaData = priorMonthData?.filter(item => item.Department === 'REVA') || [];
      const priorWholesaleData = priorMonthData?.filter(item => 
        item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
      ) || [];
      
      console.log(`Prior month data breakdown - Retail: ${priorRetailData.length}, REVA: ${priorRevaData.length}, Wholesale: ${priorWholesaleData.length}`);

      const transformData = (data: any[], isDepartmentData = false): RepData[] => {
        console.log(`Transforming ${data.length} records`);
        
        // Log the structure of the data to make sure we're accessing fields correctly
        if (data.length > 0) {
          console.log('Data structure sample:', data[0]);
        }
        
        const repMap = new Map<string, {
          rep: string;
          spend: number;
          profit: number;
          packs: number;
          activeAccounts: Set<string>;
          totalAccounts: Set<string>;
          profitPerActiveShop: number;
          profitPerPack: number;
          activeRatio: number;
        }>();
        
        data.forEach(item => {
          let repName;
          
          if (isDepartmentData && item['Sub-Rep'] && item['Sub-Rep'].trim() !== '') {
            repName = item['Sub-Rep'];
          } else if (item.Rep === 'REVA' || item.Rep === 'Wholesale' || item.Rep === 'WHOLESALE') {
            return;
          } else {
            repName = item.Rep;
          }
          
          if (!repName) {
            console.log('Found item without Rep name:', item);
            return;
          }
          
          if (!repMap.has(repName)) {
            repMap.set(repName, {
              rep: repName,
              spend: 0,
              profit: 0,
              packs: 0,
              activeAccounts: new Set(),
              totalAccounts: new Set(),
              profitPerActiveShop: 0,
              profitPerPack: 0,
              activeRatio: 0
            });
          }
          
          const currentRep = repMap.get(repName)!;
          
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
          
          currentRep.spend += spend;
          currentRep.profit += profit;
          currentRep.packs += packs;
          
          if (item["Account Ref"]) {
            currentRep.totalAccounts.add(item["Account Ref"]);
            if (spend > 0) {
              currentRep.activeAccounts.add(item["Account Ref"]);
            }
          }
          
          repMap.set(repName, currentRep);
        });
        
        console.log(`Transformed data into ${repMap.size} unique reps`);
        return Array.from(repMap.values()).map(rep => {
          const margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
          
          return {
            rep: rep.rep,
            spend: rep.spend,
            profit: rep.profit,
            margin: margin,
            packs: rep.packs,
            activeAccounts: rep.activeAccounts.size,
            totalAccounts: rep.totalAccounts.size,
            profitPerActiveShop: rep.profitPerActiveShop,
            profitPerPack: rep.profitPerPack,
            activeRatio: rep.activeRatio
          };
        }).filter(rep => {
          return rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0;
        });
      };
      
      // Transform the data
      const mayRetailData = transformData(retailData);
      const mayRevaData = transformData(revaData, true);
      const mayWholesaleData = transformData(wholesaleData, true);
      
      const priorRetailRepData = transformData(priorRetailData);
      const priorRevaRepData = transformData(priorRevaData, true);
      const priorWholesaleRepData = transformData(priorWholesaleData, true);
      
      console.log(`Transformed Rep Data - Retail: ${mayRetailData.length}, REVA: ${mayRevaData.length}, Wholesale: ${mayWholesaleData.length}`);
      console.log(`Transformed Prior Rep Data - Retail: ${priorRetailRepData.length}, REVA: ${priorRevaRepData.length}, Wholesale: ${priorWholesaleRepData.length}`);
      
      // Calculate summary data
      const calculateDeptSummary = (data: any[]) => {
        const totalProfit = data.reduce((sum, item) => {
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          return sum + profit;
        }, 0);
      
        const totalSpend = data.reduce((sum, item) => {
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          return sum + spend;
        }, 0);
      
        const totalPacks = data.reduce((sum, item) => {
          const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
          return sum + packs;
        }, 0);
      
        const uniqueAccounts = new Set();
        const activeAccounts = new Set();
      
        data.forEach(item => {
          if (item["Account Ref"]) {
            uniqueAccounts.add(item["Account Ref"]);
            
            const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
            if (spend > 0) {
              activeAccounts.add(item["Account Ref"]);
            }
          }
        });
      
        const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
      
        return {
          totalProfit,
          totalSpend,
          totalPacks,
          totalAccounts: uniqueAccounts.size,
          activeAccounts: activeAccounts.size,
          averageMargin
        };
      };
      
      const mayRetailSummary = calculateDeptSummary(retailData);
      const mayRevaSummary = calculateDeptSummary(revaData);
      const mayWholesaleSummary = calculateDeptSummary(wholesaleData);
      
      const priorRetailSummary = calculateDeptSummary(priorRetailData);
      const priorRevaSummary = calculateDeptSummary(priorRevaData);
      const priorWholesaleSummary = calculateDeptSummary(priorWholesaleData);
      
      // Log the calculated summary data to help with debugging
      console.log('May Department Summaries:');
      console.log('Retail:', mayRetailSummary);
      console.log('REVA:', mayRevaSummary);
      console.log('Wholesale:', mayWholesaleSummary);
      
      console.log('Prior Department Summaries:');
      console.log('Retail:', priorRetailSummary);
      console.log('REVA:', priorRevaSummary);
      console.log('Wholesale:', priorWholesaleSummary);
      
      // Update state with May data
      setMayRepData(mayRetailData);
      setMayRevaData(mayRevaData);
      setMayWholesaleData(mayWholesaleData);
      setMayBaseSummary(mayRetailSummary);
      setMayRevaValues(mayRevaSummary);
      setMayWholesaleValues(mayWholesaleSummary);
      
      // Calculate changes between May and April
      const calculateChanges = (mayData: RepData[], priorData: RepData[]): RepChangesRecord => {
        const changes: RepChangesRecord = {};
        
        mayData.forEach(mayRep => {
          const priorRep = priorData.find(r => r.rep === mayRep.rep);
          
          if (priorRep) {
            changes[mayRep.rep] = {
              profit: priorRep.profit > 0 ? ((mayRep.profit - priorRep.profit) / priorRep.profit) * 100 : 0,
              spend: priorRep.spend > 0 ? ((mayRep.spend - priorRep.spend) / priorRep.spend) * 100 : 0,
              margin: mayRep.margin - priorRep.margin,
              packs: priorRep.packs > 0 ? ((mayRep.packs - priorRep.packs) / priorRep.packs) * 100 : 0,
              activeAccounts: priorRep.activeAccounts > 0 ? ((mayRep.activeAccounts - priorRep.activeAccounts) / priorRep.activeAccounts) * 100 : 0,
              totalAccounts: priorRep.totalAccounts > 0 ? ((mayRep.totalAccounts - priorRep.totalAccounts) / priorRep.totalAccounts) * 100 : 0,
              profitPerActiveShop: priorRep.profitPerActiveShop > 0 ? 
                ((mayRep.profitPerActiveShop - priorRep.profitPerActiveShop) / priorRep.profitPerActiveShop) * 100 : 0,
              profitPerPack: priorRep.profitPerPack > 0 ? 
                ((mayRep.profitPerPack - priorRep.profitPerPack) / priorRep.profitPerPack) * 100 : 0,
              activeRatio: priorRep.activeRatio > 0 ? 
                mayRep.activeRatio - priorRep.activeRatio : 0
            };
          }
        });
        
        return changes;
      };
      
      // Create combined data for all departments
      const mayAllData = getCombinedRepData(
        mayRetailData,
        mayRevaData,
        mayWholesaleData,
        true, true, true
      );
      
      const priorAllData = getCombinedRepData(
        priorRetailRepData,
        priorRevaRepData,
        priorWholesaleRepData,
        true, true, true
      );
      
      const mayPriorChanges = calculateChanges(mayAllData, priorAllData);
      
      // Calculate combined summary for all departments
      const calculateSummary = (retail: SummaryData, reva: SummaryData, wholesale: SummaryData, includeRetail: boolean, includeReva: boolean, includeWholesale: boolean) => {
        const totalSpend = (includeRetail ? retail.totalSpend : 0) + 
                          (includeReva ? reva.totalSpend : 0) + 
                          (includeWholesale ? wholesale.totalSpend : 0);
        
        const totalProfit = (includeRetail ? retail.totalProfit : 0) + 
                           (includeReva ? reva.totalProfit : 0) + 
                           (includeWholesale ? wholesale.totalProfit : 0);
        
        const totalPacks = (includeRetail ? retail.totalPacks : 0) + 
                          (includeReva ? reva.totalPacks : 0) + 
                          (includeWholesale ? wholesale.totalPacks : 0);
        
        const totalAccounts = (includeRetail ? retail.totalAccounts : 0) + 
                             (includeReva ? reva.totalAccounts : 0) + 
                             (includeWholesale ? wholesale.totalAccounts : 0);
        
        const activeAccounts = (includeRetail ? retail.activeAccounts : 0) + 
                              (includeReva ? reva.activeAccounts : 0) + 
                              (includeWholesale ? wholesale.activeAccounts : 0);
        
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
      
      const maySummary = calculateSummary(
        mayRetailSummary,
        mayRevaSummary,
        mayWholesaleSummary,
        true, true, true
      );
      
      const priorSummary = calculateSummary(
        priorRetailSummary,
        priorRevaSummary,
        priorWholesaleSummary,
        true, true, true
      );
      
      // Calculate summary percentage changes
      const maySummaryChanges = {
        totalSpend: priorSummary.totalSpend > 0 ? 
          ((maySummary.totalSpend - priorSummary.totalSpend) / priorSummary.totalSpend) * 100 : 0,
        totalProfit: priorSummary.totalProfit > 0 ? 
          ((maySummary.totalProfit - priorSummary.totalProfit) / priorSummary.totalProfit) * 100 : 0,
        averageMargin: maySummary.averageMargin - priorSummary.averageMargin,
        totalPacks: priorSummary.totalPacks > 0 ? 
          ((maySummary.totalPacks - priorSummary.totalPacks) / priorSummary.totalPacks) * 100 : 0,
        totalAccounts: priorSummary.totalAccounts > 0 ? 
          ((maySummary.totalAccounts - priorSummary.totalAccounts) / priorSummary.totalAccounts) * 100 : 0,
        activeAccounts: priorSummary.activeAccounts > 0 ? 
          ((maySummary.activeAccounts - priorSummary.activeAccounts) / priorSummary.activeAccounts) * 100 : 0
      };
      
      // Update the state if May is currently selected
      if (selectedMonth === 'May') {
        setRepChanges(mayPriorChanges);
        setSummaryChanges(maySummaryChanges);
        
        // Create combined data based on selected toggles
        const combinedMayData = getCombinedRepData(
          mayRetailData,
          mayRevaData,
          mayWholesaleData,
          includeRetail,
          includeReva,
          includeWholesale
        );
        
        // Sort the combined data right away using the current sort settings
        const sortedData = sortRepData(combinedMayData, sortBy, sortOrder);
        setOverallData(sortedData);
        
        console.log('Combined May Data length:', combinedMayData.length);
        console.log('Combined May Total Profit:', combinedMayData.reduce((sum, item) => sum + item.profit, 0));
      }
      
      // Save the data to localStorage
      const currentData = loadStoredRepPerformanceData() || {};
      saveRepPerformanceData({
        ...currentData,
        mayRepData: mayRetailData,
        mayRevaData: mayRevaData,
        mayWholesaleData: mayWholesaleData,
        mayBaseSummary: mayRetailSummary,
        mayRevaValues: mayRevaSummary,
        mayWholesaleValues: mayWholesaleSummary,
        priorRollingRetailData: priorRetailRepData,
        priorRollingRevaData: priorRevaRepData,
        priorRollingWholesaleData: priorWholesaleRepData,
        priorRollingRetailSummary: priorRetailSummary,
        priorRollingRevaSummary: priorRevaSummary,
        priorRollingWholesaleSummary: priorWholesaleSummary,
        mayPriorChanges: mayPriorChanges,
        maySummaryChanges: maySummaryChanges
      });
      
      // Successfully loaded May data
      return true;
    } catch (error) {
      console.error('Error loading May data:', error);
      return false;
    } finally {
      if (updateLoadingState) setIsLoading(false);
    }
  };

  // Modified loadAprilData function that can be called during comprehensive data loading
  const loadAprilData = async (updateLoadingState = true) => {
    if (updateLoadingState) setIsLoading(true);
    try {
      const { count, error: countError } = await supabase
        .from('mtd_daily')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw new Error(`Error getting count: ${countError.message}`);
      
      if (!count || count === 0) {
        if (updateLoadingState) setIsLoading(false);
        return false;
      }
      
      console.log(`Found ${count} total records in mtd_daily`);
      
      let allRecords = [];
      const pageSize = 1000;
      const pages = Math.ceil(count / pageSize);
      
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('mtd_daily')
          .select('*')
          .range(from, to);
        
        if (pageError) throw new Error(`Error fetching page ${page}: ${pageError.message}`);
        if (pageData) allRecords = [...allRecords, ...pageData];
        
        console.log(`Fetched page ${page + 1}/${pages} with ${pageData?.length || 0} records`);
      }
      
      const mtdData = allRecords;
      console.log('Fetched April MTD records total count:', mtdData.length);
      
      // Use fetchMarchDataFromSalesData instead of fetchMarchRollingData
      console.log('Fetching March data from sales_data table for April comparison...');
      const { data: marchData, error: marchDataError } = await fetchMarchDataFromSalesData();
      
      if (marchDataError) throw new Error(`Error fetching March data from sales_data: ${marchDataError.message}`);
      
      console.log('Fetched March data from sales_data count:', marchData?.length || 0);
      
      if (!mtdData || mtdData.length === 0) {
        if (updateLoadingState) setIsLoading(false);
        return false;
      }
      
      const retailData = mtdData.filter(item => !item.Department || item.Department === 'RETAIL');
      const revaData = mtdData.filter(item => item.Department === 'REVA');
      const wholesaleData = mtdData.filter(item => 
        item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
      );
      
      console.log(`April data breakdown - Retail: ${retailData.length}, REVA: ${revaData.length}, Wholesale: ${wholesaleData.length}`);
      
      const marchRetailData = marchData?.filter(item => !item.Department || item.Department === 'RETAIL') || [];
      const marchRevaData = marchData?.filter(item => item.Department === 'REVA') || [];
      const marchWholesaleData = marchData?.filter(item => 
        item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
      ) || [];
      
      console.log(`March data breakdown - Retail: ${marchRetailData.length}, REVA: ${marchRevaData.length}, Wholesale: ${marchWholesaleData.length}`);

      const transformData = (data: any[], isDepartmentData = false): RepData[] => {
        console.log(`Transforming ${data.length} records`);
        const repMap = new Map<string, {
          rep: string;
          spend: number;
          profit: number;
          packs: number;
          activeAccounts: Set<string>;
          totalAccounts: Set<string>;
          profitPerActiveShop: number;
          profitPerPack: number;
          activeRatio: number;
        }>();
        
        data.forEach(item => {
          let repName;
          
          if (isDepartmentData && item['Sub-Rep'] && item['Sub-Rep'].trim() !== '') {
            repName = item['Sub-Rep'];
          } else if (item.Rep === 'REVA' || item.Rep === 'Wholesale' || item.Rep === 'WHOLESALE') {
            return;
          } else {
            repName = item.Rep;
          }
          
          if (!repName) {
            console.log('Found item without Rep name:', item);
            return;
          }
          
          if (!repMap.has(repName)) {
            repMap.set(repName, {
              rep: repName,
              spend: 0,
              profit: 0,
              packs: 0,
              activeAccounts: new Set(),
              totalAccounts: new Set(),
              profitPerActiveShop: 0,
              profitPerPack: 0,
              activeRatio: 0
            });
          }
          
          const currentRep = repMap.get(repName)!;
          
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
          
          currentRep.spend += spend;
          currentRep.profit += profit;
          currentRep.packs += packs;
          
          if (item["Account Ref"]) {
            currentRep.totalAccounts.add(item["Account Ref"]);
            if (spend > 0) {
              currentRep.activeAccounts.add(item["Account Ref"]);
            }
          }
          
          repMap.set(repName, currentRep);
        });
        
        console.log(`Transformed data into ${repMap.size} unique reps`);
        return Array.from(repMap.values()).map(rep => {
          const margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
          
          return {
            rep: rep.rep,
            spend: rep.spend,
            profit: rep.profit,
            margin: margin,
            packs: rep.packs,
            activeAccounts: rep.activeAccounts.size,
            totalAccounts: rep.totalAccounts.size,
            profitPerActiveShop: rep.profitPerActiveShop,
            profitPerPack: rep.profitPerPack,
            activeRatio: rep.activeRatio
          };
        }).filter(rep => {
          return rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0;
        });
      };
      
      const aprRetailData = transformData(retailData);
      const aprRevaData = transformData(revaData, true);
      const aprWholesaleData = transformData(wholesaleData, true);
      
      const marchRetailRepData = transformData(marchRetailData);
      const marchRevaRepData = transformData(marchRevaData, true);
      const marchWholesaleRepData = transformData(marchWholesaleData, true);
      
      console.log(`Transformed Rep Data - Retail: ${aprRetailData.length}, REVA: ${aprRevaData.length}, Wholesale: ${aprWholesaleData.length}`);
      console.log(`Transformed March Rep Data - Retail: ${marchRetailRepData.length}, REVA: ${marchRevaRepData.length}, Wholesale: ${marchWholesaleRepData.length}`);
      
      const aprRetailSummary = calculateDeptSummary(retailData);
      const aprRevaSummary = calculateDeptSummary(revaData);
      const aprWholesaleSummary = calculateDeptSummary(wholesaleData);
      
      const marchRetailSummary = calculateDeptSummary(marchRetailData);
      const marchRevaSummary = calculateDeptSummary(marchRevaData);
      const marchWholesaleSummary = calculateDeptSummary(marchWholesaleData);
      
      console.log('April Department Summaries:');
      console.log('Retail:', aprRetailSummary);
      console.log('REVA:', aprRevaSummary);
      console.log('Wholesale:', aprWholesaleSummary);
      
      console.log('March Department Summaries:');
      console.log('Retail:', marchRetailSummary);
      console.log('REVA:', marchRevaSummary);
      console.log('Wholesale:', marchWholesaleSummary);
      
      setAprRepData(aprRetailData);
      setAprRevaData(aprRevaData);
      setAprWholesaleData(aprWholesaleData);
      setAprBaseSummary(aprRetailSummary);
      setAprRevaValues(aprRevaSummary);
      setAprWholesaleValues(aprWholesaleSummary);
      
      const calculateChanges = (aprData: RepData[], marchData: RepData[]): RepChangesRecord => {
        const changes: RepChangesRecord = {};
        
        aprData.forEach(aprRep => {
          const marchRep = marchData.find(r => r.rep === aprRep.rep);
          
          if (marchRep) {
            changes[aprRep.rep] = {
              profit: marchRep.profit > 0 ? ((aprRep.profit - marchRep.profit) / marchRep.profit) * 100 : 0,
              spend: marchRep.spend > 0 ? ((aprRep.spend - marchRep.spend) / marchRep.spend) * 100 : 0,
              margin: aprRep.margin - marchRep.margin,
              packs: marchRep.packs > 0 ? ((aprRep.packs - marchRep.packs) / marchRep.packs) * 100 : 0,
              activeAccounts: marchRep.activeAccounts > 0 ? ((aprRep.activeAccounts - marchRep.activeAccounts) / marchRep.activeAccounts) * 100 : 0,
              totalAccounts: marchRep.totalAccounts > 0 ? ((aprRep.totalAccounts - marchRep.totalAccounts) / marchRep.totalAccounts) * 100 : 0,
              profitPerActiveShop: marchRep.profitPerActiveShop > 0 ? 
                ((aprRep.profitPerActiveShop - marchRep.profitPerActiveShop) / marchRep.profitPerActiveShop) * 100 : 0,
              profitPerPack: marchRep.profitPerPack > 0 ? 
                ((aprRep.profitPerPack - marchRep.profitPerPack) / marchRep.profitPerPack) * 100 : 0,
              activeRatio: marchRep.activeRatio > 0 ? 
                aprRep.activeRatio - marchRep.activeRatio : 0
            };
          }
        });
        
        return changes;
      };
      
      const aprAllData = getCombinedRepData(
        aprRetailData,
        aprRevaData,
        aprWholesaleData,
        true, true, true
      );
      
      const marchAllData = getCombinedRepData(
        marchRetailRepData,
        marchRevaRepData,
        marchWholesaleRepData,
        true, true, true
      );
      
      const aprilMarchChanges = calculateChanges(aprAllData, marchAllData);
      
      const aprSummary = calculateSummary(
        aprRetailSummary,
        aprRevaSummary,
        aprWholesaleSummary,
        true, true, true
      );
      
      const marchSummary = calculateSummary(
        marchRetailSummary,
        marchRevaSummary,
        marchWholesaleSummary,
        true, true, true
      );
      
      const aprilSummaryChanges = {
        totalSpend: marchSummary.totalSpend > 0 ? 
          ((aprSummary.totalSpend - marchSummary.totalSpend) / marchSummary.totalSpend) * 100 : 0,
        totalProfit: marchSummary.totalProfit > 0 ? 
          ((aprSummary.totalProfit - marchSummary.totalProfit) / marchSummary.totalProfit) * 100 : 0,
        averageMargin: aprSummary.averageMargin - marchSummary.averageMargin,
        totalPacks: marchSummary.totalPacks > 0 ? 
          ((aprSummary.totalPacks - marchSummary.totalPacks) / marchSummary.totalPacks) * 100 : 0,
        totalAccounts: marchSummary.totalAccounts > 0 ? 
          ((aprSummary.totalAccounts - marchSummary.totalAccounts) / marchSummary.totalAccounts) * 100 : 0,
        activeAccounts: marchSummary.activeAccounts > 0 ? 
          ((aprSummary.activeAccounts - marchSummary.activeAccounts) / marchSummary.activeAccounts) * 100 : 0
      };
      
      if (selectedMonth === 'April' && updateLoadingState) {
        setRepChanges(aprilMarchChanges);
        setSummaryChanges(aprilSummaryChanges);
      }
      
      const combinedAprilData = getCombinedRepData(
        aprRetailData,
        aprRevaData,
        aprWholesaleData,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      // Sort the combined data right away using the current sort settings
      const sortedData = sortRepData(combinedAprilData, sortBy, sortOrder);
      
      console.log('Combined April Data length:', combinedAprilData.length);
      console.log('Combined April Total Profit:', combinedAprilData.reduce((sum, item) => sum + item.profit, 0));
      
      const currentData = loadStoredRepPerformanceData() || {};
      saveRepPerformanceData({
        ...currentData,
        aprRepData: aprRetailData,
        aprRevaData: aprRevaData,
        aprWholesaleData: aprWholesaleData,
        aprBaseSummary: aprRetailSummary,
        aprRevaValues: aprRevaSummary,
        aprWholesaleValues: aprWholesaleSummary,
        marchRollingRetailData: marchRetailRepData,
        marchRollingRevaData: marchRevaRepData,
        marchRollingWholesaleData: marchWholesaleRepData,
        marchRollingRetailSummary: marchRetailSummary,
        marchRollingRevaSummary: marchRevaSummary,
        marchRollingWholesaleSummary: marchWholesaleSummary,
        aprilMarchChanges: aprilMarchChanges,
        aprilSummaryChanges: aprilSummaryChanges
      });
      
      if (selectedMonth === 'April' && updateLoadingState) {
        setOverallData(sortedData);
      }
      
      return true;
    } catch (error) {
      console.error('Error loading April data:', error);
      return false;
    } finally {
      if (updateLoadingState) setIsLoading(false);
    }
  };

  // Modified to use the new comprehensive loading approach
  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      await loadAllMonthsData();
      return true;
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Modified getActiveData function to ensure data is properly sorted
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
        return sortRepData(includeRetail ? currentRepData : [], sortBy, sortOrder);
      case 'reva':
        return sortRepData(includeReva ? currentRevaData : [], sortBy, sortOrder);
      case 'wholesale':
        return sortRepData(includeWholesale ? currentWholesaleData : [], sortBy, sortOrder);
      case 'overall':
      default:
        if (monthToUse !== selectedMonth) {
          // If we're requesting data for a specific month different from the selected month,
          // we need to recombine the data for that specific month
          const combinedData = getCombinedRepData(
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
          return sortRepData(combinedData, sortBy, sortOrder);
        }
        return overallData; // overallData should already be sorted
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortData = (data: RepData[]) => {
    return sortRepData(data, sortBy, sortOrder);
  };

  // Updated summary calculation to include May data
  const summary = calculateSummary(
    selectedMonth === 'March' ? baseSummary : 
    selectedMonth === 'February' ? febBaseSummary : 
    selectedMonth === 'April' ? aprBaseSummary : mayBaseSummary,
    
    selectedMonth === 'March' ? revaValues : 
    selectedMonth === 'February' ? febRevaValues : 
    selectedMonth === 'April' ? aprRevaValues : mayRevaValues,
    
    selectedMonth === 'March' ? wholesaleValues : 
    selectedMonth === 'February' ? febWholesaleValues :
    selectedMonth === 'April' ? aprWholesaleValues : mayWholesaleValues,
    
    includeRetail,
    includeReva, 
    includeWholesale
  );

  // Updated getFebValue function to handle May data for comparison
  const getFebValue = (repName: string, metricType: string, currentValue: number, changePercent: number) => {
    if (!repName || Math.abs(changePercent) < 0.1) return '';
    
    const comparisonRepData = 
      selectedMonth === 'March' ? febRepData : 
      selectedMonth === 'April' ? repData :
      selectedMonth === 'May' ? aprRepData : febRepData;
      
    const comparisonRevaData = 
      selectedMonth === 'March' ? febRevaData : 
      selectedMonth === 'April' ? revaData :
      selectedMonth === 'May' ? aprRevaData : febRevaData;
      
    const comparisonWholesaleData = 
      selectedMonth === 'March' ? febWholesaleData : 
      selectedMonth === 'April' ? wholesaleData :
      selectedMonth === 'May' ? aprWholesaleData : febWholesaleData;
    
    // Find the rep in the appropriate dataset
    let rep: RepData | undefined;
    
    // First check retail data
    rep = comparisonRepData.find(r => r.rep === repName);
    
    // If not found in retail, check REVA
    if (!rep) {
      rep = comparisonRevaData.find(r => r.rep === repName);
    }
    
    // If still not found, check wholesale
    if (!rep) {
      rep = comparisonWholesaleData.find(r => r.rep === repName);
    }
    
    if (!rep) return '';
    
    // Return the appropriate metric value based on the metric type
    switch (metricType) {
      case 'profit':
        return formatCurrency(rep.profit);
      case 'spend':
        return formatCurrency(rep.spend);
      case 'margin':
        return formatPercent(rep.margin);
      case 'packs':
        return formatNumber(rep.packs);
      case 'activeAccounts':
        return formatNumber(rep.activeAccounts);
      case 'totalAccounts':
        return formatNumber(rep.totalAccounts);
      default:
        return '';
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
  };
};
