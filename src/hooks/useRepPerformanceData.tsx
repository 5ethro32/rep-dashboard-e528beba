
import { useState, useEffect, useCallback } from 'react';
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
import { toast } from '@/components/ui/use-toast';

export const useRepPerformanceData = () => {
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('May');
  
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

  // Define the loadDataFromSupabase function before it's used in useEffect
  const loadDataFromSupabase = async () => {
    // Logic to load data based on the selected month
    setIsLoading(true);
    let success = false;
    
    try {
      if (selectedMonth === 'May') {
        success = await loadMayData();
      } else if (selectedMonth === 'April') {
        success = await loadAprilData();
      } else {
        // For February and March, you can implement similar functions
        success = true; // Placeholder
      }
    } catch (error) {
      console.error(`Error loading data for ${selectedMonth}:`, error);
      success = false;
    } finally {
      setIsLoading(false);
    }
    
    // Always update the summary metrics after loading data
    updateSummaryMetrics();
    return success;
  };

  // Load initial data
  useEffect(() => {
    const storedData = loadStoredRepPerformanceData();
    
    if (storedData) {
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
      
      // Log loaded data for debugging
      console.log("Data loaded from storage for month:", selectedMonth);
      
      // For May month selection, set appropriate summary changes
      if (selectedMonth === 'May' && storedData.maySummaryChanges) {
        setSummaryChanges(storedData.maySummaryChanges);
        setRepChanges(storedData.mayPriorChanges || defaultRepChanges);
      } else if (selectedMonth === 'April' && storedData.aprilSummaryChanges) {
        setSummaryChanges(storedData.aprilSummaryChanges);
        setRepChanges(storedData.aprilMarchChanges || defaultRepChanges);
      } else {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
      }
      
      // Log stored data to help diagnose issues
      console.log("February stored summary data:", storedData.febBaseSummary);
      console.log("March stored summary data:", storedData.baseSummary);
      console.log("April stored summary data:", storedData.aprBaseSummary);
      console.log("May stored summary data:", storedData.mayBaseSummary);
    }
    
    // Load all data on initial load
    loadDataFromSupabase();
  }, []);

  // Enhanced effect to update data when filters or selected month changes
  useEffect(() => {
    console.log("Recalculating combined data based on changes:", { 
      includeRetail, 
      includeReva, 
      includeWholesale, 
      selectedMonth 
    });

    // Select the appropriate data based on month
    let currentRepData = repData;
    let currentRevaData = revaData;
    let currentWholesaleData = wholesaleData;
    let currentBaseSummary = baseSummary;
    let currentRevaValues = revaValues;
    let currentWholesaleValues = wholesaleValues;
    
    if (selectedMonth === 'February') {
      currentRepData = febRepData;
      currentRevaData = febRevaData;
      currentWholesaleData = febWholesaleData;
      currentBaseSummary = febBaseSummary;
      currentRevaValues = febRevaValues;
      currentWholesaleValues = febWholesaleValues;
    } else if (selectedMonth === 'April') {
      currentRepData = aprRepData;
      currentRevaData = aprRevaData;
      currentWholesaleData = aprWholesaleData;
      currentBaseSummary = aprBaseSummary;
      currentRevaValues = aprRevaValues;
      currentWholesaleValues = aprWholesaleValues;
    } else if (selectedMonth === 'May') {
      currentRepData = mayRepData;
      currentRevaData = mayRevaData;
      currentWholesaleData = mayWholesaleData;
      currentBaseSummary = mayBaseSummary; 
      currentRevaValues = mayRevaValues;
      currentWholesaleValues = mayWholesaleValues;
    }
    
    // Generate combined data for selected month
    const combinedData = getCombinedRepData(
      currentRepData,
      currentRevaData,
      currentWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    setOverallData(combinedData);
    
    // Update appropriate changes data based on selected month
    const storedData = loadStoredRepPerformanceData() || {};
    
    if (selectedMonth === 'February') {
      // For February, invert the changes (since we're going backwards)
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
      if (storedData.aprilMarchChanges) {
        setRepChanges(storedData.aprilMarchChanges);
        setSummaryChanges(storedData.aprilSummaryChanges || defaultSummaryChanges);
        console.log("Setting April-specific changes data");
      }
    } else if (selectedMonth === 'May') {
      if (storedData.mayPriorChanges) {
        setRepChanges(storedData.mayPriorChanges);
        setSummaryChanges(storedData.maySummaryChanges || defaultSummaryChanges);
        console.log("Setting May-specific changes data");
      }
    } else {
      // For March, use the default changes
      if (storedData.repChanges) {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
        console.log("Setting March-specific changes data");
      }
    }
    
    console.log(`Combined data updated for ${selectedMonth} with ${combinedData.length} records`);
    console.log(`Changes data updated for ${selectedMonth}`);
  }, [
    includeRetail, 
    includeReva, 
    includeWholesale, 
    selectedMonth,
    repData, 
    revaData, 
    wholesaleData,
    febRepData, 
    febRevaData, 
    febWholesaleData, 
    aprRepData, 
    aprRevaData, 
    aprWholesaleData,
    mayRepData, 
    mayRevaData, 
    mayWholesaleData
  ]);

  // New loadMayData function to fetch May data from the May_Data table
  const loadMayData = async () => {
    setIsLoading(true);
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
        
        setOverallData(combinedMayData);
        
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
      setIsLoading(false);
    }
  };

  // Update existing loadAprilData function implementation
  const loadAprilData = async () => {
    setIsLoading(true);
    try {
      const { count, error: countError } = await supabase
        .from('mtd_daily')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw new Error(`Error getting count: ${countError.message}`);
      
      if (!count || count === 0) {
        setIsLoading(false);
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
      }
      
      return true;
    } catch (error) {
      console.error('Error loading April data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a new method to update SummaryMetrics when month selection changes
  const updateSummaryMetrics = useCallback(() => {
    // This function will calculate the summary data for the currently selected month
    let currentBaseSummary = baseSummary;
    let currentRevaValues = revaValues;
    let currentWholesaleValues = wholesaleValues;
    
    if (selectedMonth === 'February') {
      currentBaseSummary = febBaseSummary;
      currentRevaValues = febRevaValues;
      currentWholesaleValues = febWholesaleValues;
    } else if (selectedMonth === 'April') {
      currentBaseSummary = aprBaseSummary;
      currentRevaValues = aprRevaValues;
      currentWholesaleValues = aprWholesaleValues;
    } else if (selectedMonth === 'May') {
      currentBaseSummary = mayBaseSummary;
      currentRevaValues = mayRevaValues;
      currentWholesaleValues = mayWholesaleValues;
    }
    
    const summary = calculateSummary(
      currentBaseSummary,
      currentRevaValues,
      currentWholesaleValues,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    console.log(`Summary metrics updated for ${selectedMonth}:`, summary);
    return summary;
  }, [
    selectedMonth,
    includeRetail,
    includeReva,
    includeWholesale,
    baseSummary,
    revaValues,
    wholesaleValues,
    febBaseSummary,
    febRevaValues,
    febWholesaleValues,
    aprBaseSummary,
    aprRevaValues, 
    aprWholesaleValues,
    mayBaseSummary,
    mayRevaValues,
    mayWholesaleValues
  ]);

  // Return all the data and methods from our hook
  return {
    // All the states
    includeRetail,
    setIncludeRetail,
    includeReva,
    setIncludeReva,
    includeWholesale,
    setIncludeWholesale,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    
    // Data for all months
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
    
    // Changes data
    summaryChanges,
    repChanges,
    
    // Methods for data loading and processing
    loadDataFromSupabase,
    
    // Method to get the appropriate data for each tab/view
    getActiveData: (type: string, monthOverride?: string): RepData[] => {
      // Use either the provided month override or the selected month
      const month = monthOverride || selectedMonth;
      
      // Select the appropriate data based on month and type
      if (type === 'overall') {
        // For overall data, we use the currently selected overallData
        // which is updated in the useEffect that responds to month changes
        return overallData;
      } else if (type === 'rep') {
        if (month === 'February') return febRepData;
        if (month === 'April') return aprRepData;
        if (month === 'May') return mayRepData;
        return repData; // Default for March
      } else if (type === 'reva') {
        if (month === 'February') return febRevaData;
        if (month === 'April') return aprRevaData;
        if (month === 'May') return mayRevaData;
        return revaData; // Default for March
      } else if (type === 'wholesale') {
        if (month === 'February') return febWholesaleData;
        if (month === 'April') return aprWholesaleData;
        if (month === 'May') return mayWholesaleData;
        return wholesaleData; // Default for March
      }
      
      return [];
    },
    
    // Method to sort data
    sortData: (data: RepData[]): RepData[] => {
      return sortRepData(data, sortBy, sortOrder);
    },
    
    // Method to handle sorting changes
    handleSort: (field: string) => {
      if (field === sortBy) {
        // Toggle sort direction if clicking the same column
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // Set new sort field and default to descending order
        setSortBy(field);
        setSortOrder('desc');
      }
    },
    
    // Helper method to get the previous month's value for a metric
    getFebValue: (rep: string, metricType: string, currentValue: number, changePercent: number): string => {
      if (!changePercent || Math.abs(changePercent) < 0.1) return '';
      
      // Calculate previous month's value based on current value and percent change
      let previousValue: number;
      
      if (metricType === 'margin') {
        // For margin, the change is absolute, not percentage
        previousValue = currentValue - changePercent;
      } else {
        // For other metrics, change is percentage
        previousValue = currentValue / (1 + changePercent / 100);
      }
      
      // Format the previous value based on the metric type
      if (metricType === 'spend' || metricType === 'profit') {
        return formatCurrency(previousValue, 0);
      } else if (metricType === 'margin') {
        return formatPercent(previousValue);
      } else if (metricType === 'packs' || metricType === 'activeAccounts' || metricType === 'totalAccounts') {
        return formatNumber(previousValue);
      }
      
      return previousValue.toString();
    },
    
    // Get the current summary based on filters
    get summary() {
      return calculateSummary(
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
    },
    
    // Method to update summary metrics
    updateSummaryMetrics
  };
};
