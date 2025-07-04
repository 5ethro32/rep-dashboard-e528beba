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
import { debugJuneComparisonData } from '@/utils/debug-june-data';
import { debugMayData } from '@/utils/debug-may-data';
import { debugJulyComparisonData } from '@/utils/debug-july-data';

export const useRepPerformanceData = () => {
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('July MTD');
  
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
  
  // June data states
  const [junRepData, setJunRepData] = useState(defaultRepData);
  const [junRevaData, setJunRevaData] = useState(defaultRevaData);
  const [junWholesaleData, setJunWholesaleData] = useState(defaultWholesaleData);
  const [junBaseSummary, setJunBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [junRevaValues, setJunRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [junWholesaleValues, setJunWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  // June 2 data states (copy of June structure)
  const [jun2RepData, setJun2RepData] = useState(defaultRepData);
  const [jun2RevaData, setJun2RevaData] = useState(defaultRevaData);
  const [jun2WholesaleData, setJun2WholesaleData] = useState(defaultWholesaleData);
  const [jun2BaseSummary, setJun2BaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [jun2RevaValues, setJun2RevaValues] = useState<SummaryData>(defaultRevaValues);
  const [jun2WholesaleValues, setJun2WholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [mayRepData, setMayRepData] = useState(defaultRepData);
  const [mayRevaData, setMayRevaData] = useState(defaultRevaData);
  const [mayWholesaleData, setMayWholesaleData] = useState(defaultWholesaleData);
  const [mayBaseSummary, setMayBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [mayRevaValues, setMayRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [mayWholesaleValues, setMayWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  // July data states
  const [julRepData, setJulRepData] = useState(defaultRepData);
  const [julRevaData, setJulRevaData] = useState(defaultRevaData);
  const [julWholesaleData, setJulWholesaleData] = useState(defaultWholesaleData);
  const [julBaseSummary, setJulBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [julRevaValues, setJulRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [julWholesaleValues, setJulWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  // Add new state for storing actual comparison values from June_Data_Comparison
  const [comparisonSummary, setComparisonSummary] = useState<SummaryData | null>(null);
  // Store June comparison summary separately so it's always available
  const [juneComparisonSummary, setJuneComparisonSummary] = useState<SummaryData | null>(null);
  // Store June summary changes separately so they're always available
  const [juneSummaryChanges, setJuneSummaryChanges] = useState(defaultSummaryChanges);
  // Store June rep changes separately so they're always available
  const [juneRepChanges, setJuneRepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  
  // June comparison department summaries for toggle filtering
  const [juneComparisonRetailSummary, setJuneComparisonRetailSummary] = useState<SummaryData>(defaultBaseSummary);
  const [juneComparisonRevaSummary, setJuneComparisonRevaSummary] = useState<SummaryData>(defaultRevaValues);
  const [juneComparisonWholesaleSummary, setJuneComparisonWholesaleSummary] = useState<SummaryData>(defaultWholesaleValues);
  
  // June 2 comparison state variables (copy of June structure)
  const [june2ComparisonSummary, setJune2ComparisonSummary] = useState<SummaryData | null>(null);
  const [june2SummaryChanges, setJune2SummaryChanges] = useState(defaultSummaryChanges);
  const [june2RepChanges, setJune2RepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  const [june2ComparisonRetailSummary, setJune2ComparisonRetailSummary] = useState<SummaryData>(defaultBaseSummary);
  const [june2ComparisonRevaSummary, setJune2ComparisonRevaSummary] = useState<SummaryData>(defaultRevaValues);
  const [june2ComparisonWholesaleSummary, setJune2ComparisonWholesaleSummary] = useState<SummaryData>(defaultWholesaleValues);
  
  // July comparison state variables
  const [julyComparisonSummary, setJulyComparisonSummary] = useState<SummaryData | null>(null);
  const [julySummaryChanges, setJulySummaryChanges] = useState(defaultSummaryChanges);
  const [julyRepChanges, setJulyRepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  const [julyComparisonRetailSummary, setJulyComparisonRetailSummary] = useState<SummaryData>(defaultBaseSummary);
  const [julyComparisonRevaSummary, setJulyComparisonRevaSummary] = useState<SummaryData>(defaultRevaValues);
  const [julyComparisonWholesaleSummary, setJulyComparisonWholesaleSummary] = useState<SummaryData>(defaultWholesaleValues);
  
  // May comparison department summaries for toggle filtering (April data from Prior_Month_Rolling)
  const [mayComparisonRetailSummary, setMayComparisonRetailSummary] = useState<SummaryData>(defaultBaseSummary);
  const [mayComparisonRevaSummary, setMayComparisonRevaSummary] = useState<SummaryData>(defaultRevaValues);
  const [mayComparisonWholesaleSummary, setMayComparisonWholesaleSummary] = useState<SummaryData>(defaultWholesaleValues);
  
  // April comparison department summaries for toggle filtering (March data from sales_data)
  const [aprilComparisonRetailSummary, setAprilComparisonRetailSummary] = useState<SummaryData>(defaultBaseSummary);
  const [aprilComparisonRevaSummary, setAprilComparisonRevaSummary] = useState<SummaryData>(defaultRevaValues);
  const [aprilComparisonWholesaleSummary, setAprilComparisonWholesaleSummary] = useState<SummaryData>(defaultWholesaleValues);

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
      
      // Load June data and comparison summaries
      setJunRepData(storedData.junRepData || defaultRepData);
      setJunRevaData(storedData.junRevaData || defaultRevaData);
      setJunWholesaleData(storedData.junWholesaleData || defaultWholesaleData);
      setJunBaseSummary(storedData.junBaseSummary || defaultBaseSummary);
      setJunRevaValues(storedData.junRevaValues || defaultRevaValues);
      setJunWholesaleValues(storedData.junWholesaleValues || defaultWholesaleValues);
      
      // Load June 2 data and comparison summaries
      setJun2RepData(storedData.jun2RepData || defaultRepData);
      setJun2RevaData(storedData.jun2RevaData || defaultRevaData);
      setJun2WholesaleData(storedData.jun2WholesaleData || defaultWholesaleData);
      setJun2BaseSummary(storedData.jun2BaseSummary || defaultBaseSummary);
      setJun2RevaValues(storedData.jun2RevaValues || defaultRevaValues);
      setJun2WholesaleValues(storedData.jun2WholesaleValues || defaultWholesaleValues);
      
      // Load July data
      setJulRepData(storedData.julRepData || defaultRepData);
      setJulRevaData(storedData.julRevaData || defaultRevaData);
      setJulWholesaleData(storedData.julWholesaleData || defaultWholesaleData);
      setJulBaseSummary(storedData.julBaseSummary || defaultBaseSummary);
      setJulRevaValues(storedData.julRevaValues || defaultRevaValues);
      setJulWholesaleValues(storedData.julWholesaleValues || defaultWholesaleValues);
      setJuneComparisonSummary(storedData.juneComparisonSummary || null);
      setJuneSummaryChanges(storedData.juneSummaryChanges || defaultSummaryChanges);
      setJuneRepChanges(storedData.juneRepChanges || defaultRepChanges);
      setJuneComparisonRetailSummary(storedData.juneComparisonRetailSummary || defaultBaseSummary);
      setJuneComparisonRevaSummary(storedData.juneComparisonRevaSummary || defaultRevaValues);
      setJuneComparisonWholesaleSummary(storedData.juneComparisonWholesaleSummary || defaultWholesaleValues);
      
      // Load June 2 comparison data
      setJune2ComparisonSummary(storedData.june2ComparisonSummary || null);
      setJune2SummaryChanges(storedData.june2SummaryChanges || defaultSummaryChanges);
      setJune2RepChanges(storedData.june2RepChanges || defaultRepChanges);
      setJune2ComparisonRetailSummary(storedData.june2ComparisonRetailSummary || defaultBaseSummary);
      setJune2ComparisonRevaSummary(storedData.june2ComparisonRevaSummary || defaultRevaValues);
      setJune2ComparisonWholesaleSummary(storedData.june2ComparisonWholesaleSummary || defaultWholesaleValues);
      
      // Load July comparison data
      setJulyComparisonSummary(storedData.julyComparisonSummary || null);
      setJulySummaryChanges(storedData.julySummaryChanges || defaultSummaryChanges);
      setJulyRepChanges(storedData.julyRepChanges || defaultRepChanges);
      setJulyComparisonRetailSummary(storedData.julyComparisonRetailSummary || defaultBaseSummary);
      setJulyComparisonRevaSummary(storedData.julyComparisonRevaSummary || defaultRevaValues);
      setJulyComparisonWholesaleSummary(storedData.julyComparisonWholesaleSummary || defaultWholesaleValues);
      
      // Load May comparison department summaries
      setMayComparisonRetailSummary(storedData.priorRollingRetailSummary || defaultBaseSummary);
      setMayComparisonRevaSummary(storedData.priorRollingRevaSummary || defaultRevaValues);
      setMayComparisonWholesaleSummary(storedData.priorRollingWholesaleSummary || defaultWholesaleValues);
      console.log('Loaded May comparison summaries from localStorage:', {
        priorRollingRetailSummary: storedData.priorRollingRetailSummary,
        priorRollingRevaSummary: storedData.priorRollingRevaSummary,
        priorRollingWholesaleSummary: storedData.priorRollingWholesaleSummary
      });
      
      // Load April comparison department summaries
      setAprilComparisonRetailSummary(storedData.marchRollingRetailSummary || defaultBaseSummary);
      setAprilComparisonRevaSummary(storedData.marchRollingRevaSummary || defaultRevaValues);
      setAprilComparisonWholesaleSummary(storedData.marchRollingWholesaleSummary || defaultWholesaleValues);
      
      setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
      setRepChanges(storedData.repChanges || defaultRepChanges);
      
      // Log stored data to help diagnose issues
      console.log("February stored summary data:", storedData.febBaseSummary);
      console.log("March stored summary data:", storedData.baseSummary);
      console.log("April stored summary data:", storedData.aprBaseSummary);
      console.log("May stored summary data:", storedData.mayBaseSummary);
    }
    
    // Load all data on initial load
    loadDataFromSupabase();
  }, []);

  useEffect(() => {
    console.log("Recalculating combined data based on toggle changes:", { includeRetail, includeReva, includeWholesale, selectedMonth });
    
    // Clear comparison summary when switching months to prevent cross-contamination
    if (selectedMonth !== 'June' && selectedMonth !== 'June 2' && selectedMonth !== 'May' && selectedMonth !== 'April' && selectedMonth !== 'July') {
      setComparisonSummary(null);
    }

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
    } else if (selectedMonth === 'June') {
      currentRepData = junRepData;
      currentRevaData = junRevaData;
      currentWholesaleData = junWholesaleData;
    } else if (selectedMonth === 'June 2' || selectedMonth === 'July MTD') {
      currentRepData = jun2RepData;
      currentRevaData = jun2RevaData;
      currentWholesaleData = jun2WholesaleData;
    } else if (selectedMonth === 'July') {
      currentRepData = julRepData;
      currentRevaData = julRevaData;
      currentWholesaleData = julWholesaleData;
    }
    
    const combinedData = getCombinedRepData(
      currentRepData,
      currentRevaData,
      currentWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    setOverallData(combinedData);

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
    } else if (selectedMonth === 'March') {
      // Special handling for March - recalculate comparison data based on toggles
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

      console.log('Recalculating March comparison data based on toggles:', { includeRetail, includeReva, includeWholesale });
      
      // For March, recalculate comparison with February data based on toggles
      const filteredComparisonSummary = calculateSummary(
        febBaseSummary,
        febRevaValues,
        febWholesaleValues,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      // Recalculate March current summary with current toggles
      const filteredMarchSummary = calculateSummary(
        baseSummary,
        revaValues,
        wholesaleValues,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      // Recalculate summary changes with filtered data
      const recalculatedSummaryChanges = {
        totalSpend: filteredComparisonSummary.totalSpend > 0 ? 
          ((filteredMarchSummary.totalSpend - filteredComparisonSummary.totalSpend) / filteredComparisonSummary.totalSpend) * 100 : 0,
        totalProfit: filteredComparisonSummary.totalProfit > 0 ? 
          ((filteredMarchSummary.totalProfit - filteredComparisonSummary.totalProfit) / filteredComparisonSummary.totalProfit) * 100 : 0,
        averageMargin: filteredMarchSummary.averageMargin - filteredComparisonSummary.averageMargin,
        totalPacks: filteredComparisonSummary.totalPacks > 0 ? 
          ((filteredMarchSummary.totalPacks - filteredComparisonSummary.totalPacks) / filteredComparisonSummary.totalPacks) * 100 : 0,
        totalAccounts: filteredComparisonSummary.totalAccounts > 0 ? 
          ((filteredMarchSummary.totalAccounts - filteredComparisonSummary.totalAccounts) / filteredComparisonSummary.totalAccounts) * 100 : 0,
        activeAccounts: filteredComparisonSummary.activeAccounts > 0 ? 
          ((filteredMarchSummary.activeAccounts - filteredComparisonSummary.activeAccounts) / filteredComparisonSummary.activeAccounts) * 100 : 0
      };
      
      console.log('Recalculated March comparison summary:', filteredComparisonSummary);
      console.log('Recalculated March summary changes:', recalculatedSummaryChanges);
      
      setSummaryChanges(recalculatedSummaryChanges);
      
      // Clear comparison summary for March (it doesn't use comparisonSummary like June)
      setComparisonSummary(null);
          } else if (selectedMonth === 'April' || selectedMonth === 'May' || selectedMonth === 'June' || selectedMonth === 'June 2' || selectedMonth === 'July MTD' || selectedMonth === 'July') {
      if (repChanges) {
        setRepChanges(repChanges);
      }
      
      if (summaryChanges) {
        setSummaryChanges(summaryChanges);
      }
      
      // Special handling for months with comparison data - recalculate based on toggles
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

      if (selectedMonth === 'June' && juneComparisonSummary) {
        console.log('Recalculating June comparison data based on toggles:', { includeRetail, includeReva, includeWholesale });
        
        // Use stored June department summaries from state
        if (juneComparisonRetailSummary && juneComparisonRevaSummary && juneComparisonWholesaleSummary) {
          // Recalculate comparison summary with current toggles
          const filteredComparisonSummary = calculateSummary(
            juneComparisonRetailSummary,
            juneComparisonRevaSummary,
            juneComparisonWholesaleSummary,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate June current summary with current toggles
          const filteredJuneSummary = calculateSummary(
            junBaseSummary,
            junRevaValues,
            junWholesaleValues,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate summary changes with filtered data
          const recalculatedSummaryChanges = {
            totalSpend: filteredComparisonSummary.totalSpend > 0 ? 
              ((filteredJuneSummary.totalSpend - filteredComparisonSummary.totalSpend) / filteredComparisonSummary.totalSpend) * 100 : 0,
            totalProfit: filteredComparisonSummary.totalProfit > 0 ? 
              ((filteredJuneSummary.totalProfit - filteredComparisonSummary.totalProfit) / filteredComparisonSummary.totalProfit) * 100 : 0,
            averageMargin: filteredJuneSummary.averageMargin - filteredComparisonSummary.averageMargin,
            totalPacks: filteredComparisonSummary.totalPacks > 0 ? 
              ((filteredJuneSummary.totalPacks - filteredComparisonSummary.totalPacks) / filteredComparisonSummary.totalPacks) * 100 : 0,
            totalAccounts: filteredComparisonSummary.totalAccounts > 0 ? 
              ((filteredJuneSummary.totalAccounts - filteredComparisonSummary.totalAccounts) / filteredComparisonSummary.totalAccounts) * 100 : 0,
            activeAccounts: filteredComparisonSummary.activeAccounts > 0 ? 
              ((filteredJuneSummary.activeAccounts - filteredComparisonSummary.activeAccounts) / filteredComparisonSummary.activeAccounts) * 100 : 0
          };
          
          console.log('Recalculated June comparison summary:', filteredComparisonSummary);
          console.log('Recalculated June summary changes:', recalculatedSummaryChanges);
          
          setComparisonSummary(filteredComparisonSummary);
          setSummaryChanges(recalculatedSummaryChanges);
        } else {
          // Fallback to original stored data
          console.log('Using original June comparison summary:', juneComparisonSummary);
          console.log('Using original June summary changes:', juneSummaryChanges);
          setComparisonSummary(juneComparisonSummary);
          setSummaryChanges(juneSummaryChanges);
        }
        
        // Rep changes should also be filtered, but this is more complex
        // For now, use the stored rep changes
        setRepChanges(juneRepChanges);
      } else if ((selectedMonth === 'June 2' || selectedMonth === 'July MTD') && june2ComparisonSummary) {
        console.log('Recalculating June 2 comparison data based on toggles:', { includeRetail, includeReva, includeWholesale });
        
        // Use stored June 2 department summaries from state (EXACTLY like June)
        if (june2ComparisonRetailSummary && june2ComparisonRevaSummary && june2ComparisonWholesaleSummary) {
          // Recalculate comparison summary with current toggles
          const filteredComparisonSummary = calculateSummary(
            june2ComparisonRetailSummary,
            june2ComparisonRevaSummary,
            june2ComparisonWholesaleSummary,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate June 2 current summary with current toggles
          const filteredJune2Summary = calculateSummary(
            jun2BaseSummary,
            jun2RevaValues,
            jun2WholesaleValues,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate summary changes with filtered data
          const recalculatedSummaryChanges = {
            totalSpend: filteredComparisonSummary.totalSpend > 0 ? 
              ((filteredJune2Summary.totalSpend - filteredComparisonSummary.totalSpend) / filteredComparisonSummary.totalSpend) * 100 : 0,
            totalProfit: filteredComparisonSummary.totalProfit > 0 ? 
              ((filteredJune2Summary.totalProfit - filteredComparisonSummary.totalProfit) / filteredComparisonSummary.totalProfit) * 100 : 0,
            averageMargin: filteredJune2Summary.averageMargin - filteredComparisonSummary.averageMargin,
            totalPacks: filteredComparisonSummary.totalPacks > 0 ? 
              ((filteredJune2Summary.totalPacks - filteredComparisonSummary.totalPacks) / filteredComparisonSummary.totalPacks) * 100 : 0,
            totalAccounts: filteredComparisonSummary.totalAccounts > 0 ? 
              ((filteredJune2Summary.totalAccounts - filteredComparisonSummary.totalAccounts) / filteredComparisonSummary.totalAccounts) * 100 : 0,
            activeAccounts: filteredComparisonSummary.activeAccounts > 0 ? 
              ((filteredJune2Summary.activeAccounts - filteredComparisonSummary.activeAccounts) / filteredComparisonSummary.activeAccounts) * 100 : 0
          };
          
          console.log('Recalculated June 2 comparison summary:', filteredComparisonSummary);
          console.log('Recalculated June 2 summary changes:', recalculatedSummaryChanges);
          
          setComparisonSummary(filteredComparisonSummary);
          setSummaryChanges(recalculatedSummaryChanges);
        } else {
          // Fallback to original stored data
          console.log('Using original June 2 comparison summary:', june2ComparisonSummary);
          console.log('Using original June 2 summary changes:', june2SummaryChanges);
          setComparisonSummary(june2ComparisonSummary);
          setSummaryChanges(june2SummaryChanges);
        }
        
        // Use the stored rep changes (EXACTLY like June)
        setRepChanges(june2RepChanges);
      } else if (selectedMonth === 'July') {
        console.log('Recalculating July comparison data based on toggles:', { includeRetail, includeReva, includeWholesale });
        
        // Use stored July department summaries from state (EXACTLY like June)
        if (julyComparisonRetailSummary && julyComparisonRevaSummary && julyComparisonWholesaleSummary) {
          // Recalculate comparison summary with current toggles
          const filteredComparisonSummary = calculateSummary(
            julyComparisonRetailSummary,
            julyComparisonRevaSummary,
            julyComparisonWholesaleSummary,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate July current summary with current toggles
          const filteredJulySummary = calculateSummary(
            julBaseSummary,
            julRevaValues,
            julWholesaleValues,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate summary changes with filtered data
          const recalculatedSummaryChanges = {
            totalSpend: filteredComparisonSummary.totalSpend > 0 ? 
              ((filteredJulySummary.totalSpend - filteredComparisonSummary.totalSpend) / filteredComparisonSummary.totalSpend) * 100 : 0,
            totalProfit: filteredComparisonSummary.totalProfit > 0 ? 
              ((filteredJulySummary.totalProfit - filteredComparisonSummary.totalProfit) / filteredComparisonSummary.totalProfit) * 100 : 0,
            averageMargin: filteredJulySummary.averageMargin - filteredComparisonSummary.averageMargin,
            totalPacks: filteredComparisonSummary.totalPacks > 0 ? 
              ((filteredJulySummary.totalPacks - filteredComparisonSummary.totalPacks) / filteredComparisonSummary.totalPacks) * 100 : 0,
            totalAccounts: filteredComparisonSummary.totalAccounts > 0 ? 
              ((filteredJulySummary.totalAccounts - filteredComparisonSummary.totalAccounts) / filteredComparisonSummary.totalAccounts) * 100 : 0,
            activeAccounts: filteredComparisonSummary.activeAccounts > 0 ? 
              ((filteredJulySummary.activeAccounts - filteredComparisonSummary.activeAccounts) / filteredComparisonSummary.activeAccounts) * 100 : 0
          };
          
          console.log('Recalculated July comparison summary:', filteredComparisonSummary);
          console.log('Recalculated July summary changes:', recalculatedSummaryChanges);
          
          setComparisonSummary(filteredComparisonSummary);
          setSummaryChanges(recalculatedSummaryChanges);
        } else {
          // Fallback to original stored data
          console.log('Using original July comparison summary:', julyComparisonSummary);
          console.log('Using original July summary changes:', julySummaryChanges);
          setComparisonSummary(julyComparisonSummary);
          setSummaryChanges(julySummaryChanges);
        }
        
        // Use the stored rep changes (EXACTLY like June)
        setRepChanges(julyRepChanges);
      } else if (selectedMonth === 'May') {
        console.log('Recalculating May comparison data based on toggles:', { includeRetail, includeReva, includeWholesale });
        console.log('May comparison summaries from state:', {
          retail: mayComparisonRetailSummary,
          reva: mayComparisonRevaSummary,
          wholesale: mayComparisonWholesaleSummary
        });
        
        // Use stored May comparison department summaries from state (April data from Prior_Month_Rolling)
        if (mayComparisonRetailSummary && mayComparisonRevaSummary && mayComparisonWholesaleSummary) {
          // Recalculate comparison summary with current toggles
          const filteredComparisonSummary = calculateSummary(
            mayComparisonRetailSummary,
            mayComparisonRevaSummary,
            mayComparisonWholesaleSummary,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate May current summary with current toggles
          const filteredMaySummary = calculateSummary(
            mayBaseSummary,
            mayRevaValues,
            mayWholesaleValues,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate summary changes with filtered data
          const recalculatedSummaryChanges = {
            totalSpend: filteredComparisonSummary.totalSpend > 0 ? 
              ((filteredMaySummary.totalSpend - filteredComparisonSummary.totalSpend) / filteredComparisonSummary.totalSpend) * 100 : 0,
            totalProfit: filteredComparisonSummary.totalProfit > 0 ? 
              ((filteredMaySummary.totalProfit - filteredComparisonSummary.totalProfit) / filteredComparisonSummary.totalProfit) * 100 : 0,
            averageMargin: filteredMaySummary.averageMargin - filteredComparisonSummary.averageMargin,
            totalPacks: filteredComparisonSummary.totalPacks > 0 ? 
              ((filteredMaySummary.totalPacks - filteredComparisonSummary.totalPacks) / filteredComparisonSummary.totalPacks) * 100 : 0,
            totalAccounts: filteredComparisonSummary.totalAccounts > 0 ? 
              ((filteredMaySummary.totalAccounts - filteredComparisonSummary.totalAccounts) / filteredComparisonSummary.totalAccounts) * 100 : 0,
            activeAccounts: filteredComparisonSummary.activeAccounts > 0 ? 
              ((filteredMaySummary.activeAccounts - filteredComparisonSummary.activeAccounts) / filteredComparisonSummary.activeAccounts) * 100 : 0
          };
          
          console.log('Recalculated May comparison summary:', filteredComparisonSummary);
          console.log('Recalculated May summary changes:', recalculatedSummaryChanges);
          
          setSummaryChanges(recalculatedSummaryChanges);
          // Set comparison summary for May so SummaryMetrics can use actual values
          setComparisonSummary(filteredComparisonSummary);
        } else {
          // Clear comparison summary if no May comparison data available
          setComparisonSummary(null);
        }
      } else if (selectedMonth === 'April') {
        console.log('Recalculating April comparison data based on toggles:', { includeRetail, includeReva, includeWholesale });
        
        // Use stored April comparison department summaries from state (March data from sales_data)
        if (aprilComparisonRetailSummary && aprilComparisonRevaSummary && aprilComparisonWholesaleSummary) {
          // Recalculate comparison summary with current toggles
          const filteredComparisonSummary = calculateSummary(
            aprilComparisonRetailSummary,
            aprilComparisonRevaSummary,
            aprilComparisonWholesaleSummary,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate April current summary with current toggles
          const filteredAprilSummary = calculateSummary(
            aprBaseSummary,
            aprRevaValues,
            aprWholesaleValues,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          // Recalculate summary changes with filtered data
          const recalculatedSummaryChanges = {
            totalSpend: filteredComparisonSummary.totalSpend > 0 ? 
              ((filteredAprilSummary.totalSpend - filteredComparisonSummary.totalSpend) / filteredComparisonSummary.totalSpend) * 100 : 0,
            totalProfit: filteredComparisonSummary.totalProfit > 0 ? 
              ((filteredAprilSummary.totalProfit - filteredComparisonSummary.totalProfit) / filteredComparisonSummary.totalProfit) * 100 : 0,
            averageMargin: filteredAprilSummary.averageMargin - filteredComparisonSummary.averageMargin,
            totalPacks: filteredComparisonSummary.totalPacks > 0 ? 
              ((filteredAprilSummary.totalPacks - filteredComparisonSummary.totalPacks) / filteredComparisonSummary.totalPacks) * 100 : 0,
            totalAccounts: filteredComparisonSummary.totalAccounts > 0 ? 
              ((filteredAprilSummary.totalAccounts - filteredComparisonSummary.totalAccounts) / filteredComparisonSummary.totalAccounts) * 100 : 0,
            activeAccounts: filteredComparisonSummary.activeAccounts > 0 ? 
              ((filteredAprilSummary.activeAccounts - filteredComparisonSummary.activeAccounts) / filteredComparisonSummary.activeAccounts) * 100 : 0
          };
          
          console.log('Recalculated April comparison summary:', filteredComparisonSummary);
          console.log('Recalculated April summary changes:', recalculatedSummaryChanges);
          
          setSummaryChanges(recalculatedSummaryChanges);
          // Set comparison summary for April so SummaryMetrics can use actual values
          setComparisonSummary(filteredComparisonSummary);
        } else {
          // Clear comparison summary if no April comparison data available
          setComparisonSummary(null);
        }
      } else {
        // Clear comparison summary for other months
        setComparisonSummary(null);
      }
    } else {
      const storedData = loadStoredRepPerformanceData();
      if (storedData) {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
      }
    }
  }, [includeRetail, includeReva, includeWholesale, selectedMonth, repData, revaData, wholesaleData, 
      febRepData, febRevaData, febWholesaleData, aprRepData, aprRevaData, aprWholesaleData,
      mayRepData, mayRevaData, mayWholesaleData, junRepData, junRevaData, junWholesaleData, 
      julRepData, julRevaData, julWholesaleData,
      juneComparisonSummary, juneSummaryChanges, juneRepChanges,
      junBaseSummary, junRevaValues, junWholesaleValues,
      julBaseSummary, julRevaValues, julWholesaleValues,
      juneComparisonRetailSummary, juneComparisonRevaSummary, juneComparisonWholesaleSummary,
      julyComparisonSummary, julySummaryChanges, julyRepChanges,
      julyComparisonRetailSummary, julyComparisonRevaSummary, julyComparisonWholesaleSummary,
      mayBaseSummary, mayRevaValues, mayWholesaleValues,
      mayComparisonRetailSummary, mayComparisonRevaSummary, mayComparisonWholesaleSummary,
      aprBaseSummary, aprRevaValues, aprWholesaleValues,
      aprilComparisonRetailSummary, aprilComparisonRevaSummary, aprilComparisonWholesaleSummary,
      baseSummary, revaValues, wholesaleValues, febBaseSummary, febRevaValues, febWholesaleValues]);

  // New loadMayData function to fetch May data from the May_Data table
  const loadJuneData = async () => {
    setIsLoading(true);
    try {
      console.log('Starting to fetch June data from June_Data table...');
      
      // First, check if there's any data in the June_Data table
      const { count, error: countError } = await supabase
        .from('June_Data')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw new Error(`Error getting count: ${countError.message}`);
      
      if (!count || count === 0) {
        console.log('No data found in the June_Data table - setting empty June data');
        
        // Create empty/zero summary values for June
        const emptySummary = {
          totalSpend: 0,
          totalProfit: 0,
          totalPacks: 0,
          totalAccounts: 0,
          activeAccounts: 0,
          averageMargin: 0
        };
        
        // Set all June data states to empty/zero values
        setJunRepData([]);
        setJunRevaData([]);
        setJunWholesaleData([]);
        setJunBaseSummary(emptySummary);
        setJunRevaValues(emptySummary);
        setJunWholesaleValues(emptySummary);
        
        setIsLoading(false);
        return true; // Return true to indicate successful handling of empty data
      }
      
      console.log(`Found ${count} total records in June_Data table`);
      
      // Fetch all records from June_Data using pagination
      let allRecords = [];
      const pageSize = 1000;
      const pages = Math.ceil(count / pageSize);
      
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('June_Data')
          .select('*')
          .range(from, to);
        
        if (pageError) throw new Error(`Error fetching page ${page}: ${pageError.message}`);
        if (pageData) allRecords = [...allRecords, ...pageData];
        
        console.log(`Fetched page ${page + 1}/${pages} with ${pageData?.length || 0} records from June_Data`);
      }
      
      const juneData = allRecords;
      console.log('Fetched June records total count:', juneData.length);
      
      // Use June_Data_Comparison for comparison data
      console.log('Fetching June comparison data from June_Data_Comparison table...');
      
      const { count: comparisonCount, error: comparisonCountError } = await supabase
        .from('June_Data_Comparison')
        .select('*', { count: 'exact', head: true });
        
              if (comparisonCountError) throw new Error(`Error getting June comparison count: ${comparisonCountError.message}`);
        
        let comparisonRecords = [];
        if (comparisonCount && comparisonCount > 0) {
          const comparisonPages = Math.ceil(comparisonCount / pageSize);
          
          for (let page = 0; page < comparisonPages; page++) {
            const from = page * pageSize;
            const to = from + pageSize - 1;
            
            const { data: pageData, error: pageError } = await supabase
              .from('June_Data_Comparison')
              .select('*')
              .range(from, to);
            
            if (pageError) throw new Error(`Error fetching June comparison page ${page}: ${pageError.message}`);
            if (pageData) comparisonRecords = [...comparisonRecords, ...pageData];
          }
        }
        
        console.log('Fetched June comparison records:', comparisonRecords.length);
      
      // Process June data by department
      const juneRetailData = juneData.filter(item => item.Department === 'RETAIL');
      const juneRevaData = juneData.filter(item => item.Department === 'REVA');
      const juneWholesaleData = juneData.filter(item => item.Department === 'Wholesale' || item.Department === 'WHOLESALE');
      
              // Process June comparison data by department
        const comparisonRetailData = comparisonRecords.filter(item => item.Department === 'RETAIL');
        const comparisonRevaData = comparisonRecords.filter(item => item.Department === 'REVA');
        const comparisonWholesaleData = comparisonRecords.filter(item => item.Department === 'Wholesale' || item.Department === 'WHOLESALE');
      
      console.log('June data breakdown:', {
        retail: juneRetailData.length,
        reva: juneRevaData.length,
        wholesale: juneWholesaleData.length
      });
      
             // Transform data function (same as in loadMayData)
       const transformData = (data: any[], isDepartmentData = false): RepData[] => {
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
           
           if (!repName) return;
           
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
             profitPerActiveShop: rep.activeAccounts.size > 0 ? rep.profit / rep.activeAccounts.size : 0,
             profitPerPack: rep.packs > 0 ? rep.profit / rep.packs : 0,
             activeRatio: rep.totalAccounts.size > 0 ? (rep.activeAccounts.size / rep.totalAccounts.size) * 100 : 0
           };
         }).filter(rep => {
           return rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0;
         });
       };

       // Calculate summary function
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
       
       // Transform and aggregate June data
       const processedJuneRetail = transformData(juneRetailData);
       const processedJuneReva = transformData(juneRevaData, true);
       const processedJuneWholesale = transformData(juneWholesaleData, true);
       
       // Calculate summaries
       const juneSummary = calculateDeptSummary(juneRetailData);
       const juneRevaSummary = calculateDeptSummary(juneRevaData);
       const juneWholesaleSummary = calculateDeptSummary(juneWholesaleData);
       
       // Transform comparison data (June_Data_Comparison data)
       const comparisonRetailRepData = transformData(comparisonRetailData);
       const comparisonRevaRepData = transformData(comparisonRevaData, true);
       const comparisonWholesaleRepData = transformData(comparisonWholesaleData, true);
       
             // Calculate comparison summaries
      const comparisonRetailSummary = calculateDeptSummary(comparisonRetailData);
      const comparisonRevaSummary = calculateDeptSummary(comparisonRevaData);
      const comparisonWholesaleSummary = calculateDeptSummary(comparisonWholesaleData);
       
       // Calculate combined summary for comparison data
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
       
       const juneCombinedSummary = calculateSummary(
         juneSummary,
         juneRevaSummary,
         juneWholesaleSummary,
         true, true, true
       );
       
       const comparisonSummary = calculateSummary(
         comparisonRetailSummary,
         comparisonRevaSummary,
         comparisonWholesaleSummary,
         true, true, true
       );
       
       // Calculate summary percentage changes for metric cards
       const juneSummaryChanges = {
         totalSpend: comparisonSummary.totalSpend > 0 ? 
           ((juneCombinedSummary.totalSpend - comparisonSummary.totalSpend) / comparisonSummary.totalSpend) * 100 : 0,
         totalProfit: comparisonSummary.totalProfit > 0 ? 
           ((juneCombinedSummary.totalProfit - comparisonSummary.totalProfit) / comparisonSummary.totalProfit) * 100 : 0,
         averageMargin: juneCombinedSummary.averageMargin - comparisonSummary.averageMargin,
         totalPacks: comparisonSummary.totalPacks > 0 ? 
           ((juneCombinedSummary.totalPacks - comparisonSummary.totalPacks) / comparisonSummary.totalPacks) * 100 : 0,
         totalAccounts: comparisonSummary.totalAccounts > 0 ? 
           ((juneCombinedSummary.totalAccounts - comparisonSummary.totalAccounts) / comparisonSummary.totalAccounts) * 100 : 0,
         activeAccounts: comparisonSummary.activeAccounts > 0 ? 
           ((juneCombinedSummary.activeAccounts - comparisonSummary.activeAccounts) / comparisonSummary.activeAccounts) * 100 : 0
       };
       
       // Calculate individual rep changes for the table (MISSING PIECE!)
       const calculateChanges = (juneData: RepData[], comparisonData: RepData[]): RepChangesRecord => {
         const changes: RepChangesRecord = {};
         
         juneData.forEach(juneRep => {
           const comparisonRep = comparisonData.find(r => r.rep === juneRep.rep);
           
           if (comparisonRep) {
             changes[juneRep.rep] = {
               profit: comparisonRep.profit > 0 ? ((juneRep.profit - comparisonRep.profit) / comparisonRep.profit) * 100 : 0,
               spend: comparisonRep.spend > 0 ? ((juneRep.spend - comparisonRep.spend) / comparisonRep.spend) * 100 : 0,
               margin: juneRep.margin - comparisonRep.margin,
               packs: comparisonRep.packs > 0 ? ((juneRep.packs - comparisonRep.packs) / comparisonRep.packs) * 100 : 0,
               activeAccounts: comparisonRep.activeAccounts > 0 ? ((juneRep.activeAccounts - comparisonRep.activeAccounts) / comparisonRep.activeAccounts) * 100 : 0,
               totalAccounts: comparisonRep.totalAccounts > 0 ? ((juneRep.totalAccounts - comparisonRep.totalAccounts) / comparisonRep.totalAccounts) * 100 : 0,
               profitPerActiveShop: comparisonRep.profitPerActiveShop > 0 ? 
                 ((juneRep.profitPerActiveShop - comparisonRep.profitPerActiveShop) / comparisonRep.profitPerActiveShop) * 100 : 0,
               profitPerPack: comparisonRep.profitPerPack > 0 ? 
                 ((juneRep.profitPerPack - comparisonRep.profitPerPack) / comparisonRep.profitPerPack) * 100 : 0,
               activeRatio: comparisonRep.activeRatio > 0 ? 
                 juneRep.activeRatio - comparisonRep.activeRatio : 0
             };
           }
         });
         
         return changes;
       };
       
       // Create combined data for all departments
       const juneAllData = getCombinedRepData(
         processedJuneRetail,
         processedJuneReva,
         processedJuneWholesale,
         true, true, true
       );
       
       const comparisonAllData = getCombinedRepData(
         comparisonRetailRepData,
         comparisonRevaRepData,
         comparisonWholesaleRepData,
         true, true, true
       );
       
       const juneRepChanges = calculateChanges(juneAllData, comparisonAllData);
       console.log('Calculated June rep changes:', juneRepChanges);
       
       // Always store June rep changes for later use - regardless of selected month
       setJuneRepChanges(juneRepChanges);
       console.log('Stored June rep changes for later use:', juneRepChanges);
       
       // Immediately update window data if we're on rep performance page and June is selected
       if (typeof window !== 'undefined' && window.location?.pathname === '/rep-performance') {
         console.log('🚀 Immediately updating window.repPerformanceData with June rep changes');
         window.repPerformanceData = {
           repChanges: juneRepChanges,
           selectedMonth: 'June'
         };
       }
       
       // Set June data
       setJunRepData(processedJuneRetail);
       setJunRevaData(processedJuneReva);
       setJunWholesaleData(processedJuneWholesale);
       setJunBaseSummary(juneSummary);
       setJunRevaValues(juneRevaSummary);
       setJunWholesaleValues(juneWholesaleSummary);
       
       // Always store the June comparison summary for later use - regardless of selected month
       setJuneComparisonSummary(comparisonSummary);
       console.log('Stored June comparison summary for later use:', comparisonSummary);
       
       // Always store June summary changes for later use - regardless of selected month
       setJuneSummaryChanges(juneSummaryChanges);
       console.log('Stored June summary changes for later use:', juneSummaryChanges);
       
       // Store individual department comparison summaries for toggle filtering
       setJuneComparisonRetailSummary(comparisonRetailSummary);
       setJuneComparisonRevaSummary(comparisonRevaSummary);
       setJuneComparisonWholesaleSummary(comparisonWholesaleSummary);
       console.log('Stored June comparison department summaries for toggle filtering');
       
       // Always calculate and store June summary changes - regardless of selected month
       console.log('Always calculating June summary changes:', juneSummaryChanges);
       console.log('June combined summary values:', {
         totalSpend: juneCombinedSummary.totalSpend,
         totalProfit: juneCombinedSummary.totalProfit,
         averageMargin: juneCombinedSummary.averageMargin,
         totalPacks: juneCombinedSummary.totalPacks
       });
       console.log('Comparison summary values:', {
         totalSpend: comparisonSummary.totalSpend,
         totalProfit: comparisonSummary.totalProfit,
         averageMargin: comparisonSummary.averageMargin,
         totalPacks: comparisonSummary.totalPacks
       });
       
       // Update the state if June is currently selected
       if (selectedMonth === 'June') {
         console.log('June is currently selected - setting active data');
         setSummaryChanges(juneSummaryChanges);
         setComparisonSummary(comparisonSummary); // Store actual comparison values from June_Data_Comparison
         setRepChanges(juneRepChanges); // Store actual rep changes from June vs June_Data_Comparison
         
         // Create combined data based on selected toggles
         const combinedJuneData = getCombinedRepData(
           processedJuneRetail,
           processedJuneReva,
           processedJuneWholesale,
           includeRetail,
           includeReva,
           includeWholesale
         );
         
         setOverallData(combinedJuneData);
       }
       
       // Save the data to localStorage
       const currentData = loadStoredRepPerformanceData() || {};
       saveRepPerformanceData({
         ...currentData,
         junRepData: processedJuneRetail,
         junRevaData: processedJuneReva,
         junWholesaleData: processedJuneWholesale,
         junBaseSummary: juneSummary,
         junRevaValues: juneRevaSummary,
         junWholesaleValues: juneWholesaleSummary,
         juneComparisonSummary: comparisonSummary,
         juneSummaryChanges: juneSummaryChanges,
         juneRepChanges: juneRepChanges,
         // Store individual department comparison summaries for toggle filtering
         juneComparisonRetailSummary: comparisonRetailSummary,
         juneComparisonRevaSummary: comparisonRevaSummary,
         juneComparisonWholesaleSummary: comparisonWholesaleSummary
       });
       
       return true;
    } catch (error) {
      console.error('Error loading June data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load June 2 Data function (copy of loadJuneData for testing July structure)
  const loadJune2Data = async () => {
    setIsLoading(true);
    try {
      console.log('Starting to fetch June 2 data from July_Data table...'); // Now use July tables
      
      // First, check if there's any data in the July_Data table
      const { count, error: countError } = await supabase
        .from('July_Data' as any)
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw new Error(`Error getting count: ${countError.message}`);
      
      if (!count || count === 0) {
        console.log('No data found in the July_Data table - setting empty June 2 data');
        
        // Create empty/zero summary values for June 2
        const emptySummary = {
          totalSpend: 0,
          totalProfit: 0,
          totalPacks: 0,
          totalAccounts: 0,
          activeAccounts: 0,
          averageMargin: 0
        };
        
        // Set all June 2 data states to empty/zero values
        setJun2RepData([]);
        setJun2RevaData([]);
        setJun2WholesaleData([]);
        setJun2BaseSummary(emptySummary);
        setJun2RevaValues(emptySummary);
        setJun2WholesaleValues(emptySummary);
        
        setIsLoading(false);
        return true; // Return true to indicate successful handling of empty data
      }
      
      console.log(`Found ${count} total records in July_Data table for June 2`);
      
      // Fetch all records from July_Data using pagination
      let allRecords = [];
      const pageSize = 1000;
      const pages = Math.ceil(count / pageSize);
      
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('July_Data' as any)
          .select('*')
          .range(from, to);
        
        if (pageError) throw new Error(`Error fetching page ${page}: ${pageError.message}`);
        if (pageData) allRecords = [...allRecords, ...pageData];
        
        console.log(`Fetched page ${page + 1}/${pages} with ${pageData?.length || 0} records from July_Data for June 2`);
      }
      
      const june2Data = allRecords;
      console.log('Fetched June 2 records total count:', june2Data.length);
      
      // Use July_Data_Comparison for comparison data
      console.log('Fetching June 2 comparison data from July_Data_Comparison table...');
      
      const { count: comparisonCount, error: comparisonCountError } = await supabase
        .from('July_Data_Comparison' as any)
        .select('*', { count: 'exact', head: true });
        
      if (comparisonCountError) throw new Error(`Error getting June 2 comparison count: ${comparisonCountError.message}`);
        
      let comparisonRecords = [];
      if (comparisonCount && comparisonCount > 0) {
        const comparisonPages = Math.ceil(comparisonCount / pageSize);
        
        for (let page = 0; page < comparisonPages; page++) {
          const from = page * pageSize;
          const to = from + pageSize - 1;
          
          const { data: pageData, error: pageError } = await supabase
            .from('July_Data_Comparison' as any)
            .select('*')
            .range(from, to);
          
          if (pageError) throw new Error(`Error fetching June 2 comparison page ${page}: ${pageError.message}`);
          if (pageData) comparisonRecords = [...comparisonRecords, ...pageData];
        }
      }
      
      console.log('Fetched June 2 comparison records:', comparisonRecords.length);
      
      // Process June 2 data by department
      const june2RetailData = june2Data.filter(item => item.Department === 'RETAIL');
      const june2RevaData = june2Data.filter(item => item.Department === 'REVA');
      const june2WholesaleData = june2Data.filter(item => item.Department === 'Wholesale' || item.Department === 'WHOLESALE');
      
      // Process June 2 comparison data by department
      const comparisonRetailData = comparisonRecords.filter(item => item.Department === 'RETAIL');
      const comparisonRevaData = comparisonRecords.filter(item => item.Department === 'REVA');
      const comparisonWholesaleData = comparisonRecords.filter(item => item.Department === 'Wholesale' || item.Department === 'WHOLESALE');
      
      console.log('June 2 data breakdown:', {
        retail: june2RetailData.length,
        reva: june2RevaData.length,
        wholesale: june2WholesaleData.length
      });
      
      // Transform data function (same as in loadJuneData)
      const transformData = (data: any[], isDepartmentData = false): RepData[] => {
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
          
          if (!repName) return;
          
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
            profitPerActiveShop: rep.activeAccounts.size > 0 ? rep.profit / rep.activeAccounts.size : 0,
            profitPerPack: rep.packs > 0 ? rep.profit / rep.packs : 0,
            activeRatio: rep.totalAccounts.size > 0 ? (rep.activeAccounts.size / rep.totalAccounts.size) * 100 : 0
          };
        }).filter(rep => {
          return rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0;
        });
      };

      // Calculate summary function
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
      
      // Transform and aggregate June 2 data
      const processedJune2Retail = transformData(june2RetailData);
      const processedJune2Reva = transformData(june2RevaData, true);
      const processedJune2Wholesale = transformData(june2WholesaleData, true);
      
      // Calculate summaries
      const june2Summary = calculateDeptSummary(june2RetailData);
      const june2RevaSummary = calculateDeptSummary(june2RevaData);
      const june2WholesaleSummary = calculateDeptSummary(june2WholesaleData);
      
      // Transform comparison data (June_Data_Comparison data)
      const comparisonRetailRepData = transformData(comparisonRetailData);
      const comparisonRevaRepData = transformData(comparisonRevaData, true);
      const comparisonWholesaleRepData = transformData(comparisonWholesaleData, true);
      
      // Calculate comparison summaries
      const comparisonRetailSummary = calculateDeptSummary(comparisonRetailData);
      const comparisonRevaSummary = calculateDeptSummary(comparisonRevaData);
      const comparisonWholesaleSummary = calculateDeptSummary(comparisonWholesaleData);
      
      // Calculate combined summary for comparison data
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
      
      const june2CombinedSummary = calculateSummary(
        june2Summary,
        june2RevaSummary,
        june2WholesaleSummary,
        true, true, true
      );
      
      const comparisonSummary = calculateSummary(
        comparisonRetailSummary,
        comparisonRevaSummary,
        comparisonWholesaleSummary,
        true, true, true
      );
      
      // Calculate summary percentage changes for metric cards
      const june2SummaryChanges = {
        totalSpend: comparisonSummary.totalSpend > 0 ? 
          ((june2CombinedSummary.totalSpend - comparisonSummary.totalSpend) / comparisonSummary.totalSpend) * 100 : 0,
        totalProfit: comparisonSummary.totalProfit > 0 ? 
          ((june2CombinedSummary.totalProfit - comparisonSummary.totalProfit) / comparisonSummary.totalProfit) * 100 : 0,
        averageMargin: june2CombinedSummary.averageMargin - comparisonSummary.averageMargin,
        totalPacks: comparisonSummary.totalPacks > 0 ? 
          ((june2CombinedSummary.totalPacks - comparisonSummary.totalPacks) / comparisonSummary.totalPacks) * 100 : 0,
        totalAccounts: comparisonSummary.totalAccounts > 0 ? 
          ((june2CombinedSummary.totalAccounts - comparisonSummary.totalAccounts) / comparisonSummary.totalAccounts) * 100 : 0,
        activeAccounts: comparisonSummary.activeAccounts > 0 ? 
          ((june2CombinedSummary.activeAccounts - comparisonSummary.activeAccounts) / comparisonSummary.activeAccounts) * 100 : 0
      };
      
      // Calculate individual rep changes for the table
      const calculateChanges = (june2Data: RepData[], comparisonData: RepData[]): RepChangesRecord => {
        const changes: RepChangesRecord = {};
        
        june2Data.forEach(june2Rep => {
          const comparisonRep = comparisonData.find(r => r.rep === june2Rep.rep);
          
          if (comparisonRep) {
            changes[june2Rep.rep] = {
              profit: comparisonRep.profit > 0 ? ((june2Rep.profit - comparisonRep.profit) / comparisonRep.profit) * 100 : 0,
              spend: comparisonRep.spend > 0 ? ((june2Rep.spend - comparisonRep.spend) / comparisonRep.spend) * 100 : 0,
              margin: june2Rep.margin - comparisonRep.margin,
              packs: comparisonRep.packs > 0 ? ((june2Rep.packs - comparisonRep.packs) / comparisonRep.packs) * 100 : 0,
              activeAccounts: comparisonRep.activeAccounts > 0 ? ((june2Rep.activeAccounts - comparisonRep.activeAccounts) / comparisonRep.activeAccounts) * 100 : 0,
              totalAccounts: comparisonRep.totalAccounts > 0 ? ((june2Rep.totalAccounts - comparisonRep.totalAccounts) / comparisonRep.totalAccounts) * 100 : 0,
              profitPerActiveShop: comparisonRep.profitPerActiveShop > 0 ? 
                ((june2Rep.profitPerActiveShop - comparisonRep.profitPerActiveShop) / comparisonRep.profitPerActiveShop) * 100 : 0,
              profitPerPack: comparisonRep.profitPerPack > 0 ? 
                ((june2Rep.profitPerPack - comparisonRep.profitPerPack) / comparisonRep.profitPerPack) * 100 : 0,
              activeRatio: comparisonRep.activeRatio > 0 ? 
                june2Rep.activeRatio - comparisonRep.activeRatio : 0
            };
          }
        });
        
        return changes;
      };
      
      // Create combined data for all departments
      const june2AllData = getCombinedRepData(
        processedJune2Retail,
        processedJune2Reva,
        processedJune2Wholesale,
        true, true, true
      );
      
      const comparisonAllData = getCombinedRepData(
        comparisonRetailRepData,
        comparisonRevaRepData,
        comparisonWholesaleRepData,
        true, true, true
      );
      
      const june2RepChanges = calculateChanges(june2AllData, comparisonAllData);
      console.log('Calculated June 2 rep changes:', june2RepChanges);
      
      // Store June 2 rep changes for later use
      setJune2RepChanges(june2RepChanges);
      console.log('Stored June 2 rep changes for later use:', june2RepChanges);
      
      // Set June 2 data
      setJun2RepData(processedJune2Retail);
      setJun2RevaData(processedJune2Reva);
      setJun2WholesaleData(processedJune2Wholesale);
      setJun2BaseSummary(june2Summary);
      setJun2RevaValues(june2RevaSummary);
      setJun2WholesaleValues(june2WholesaleSummary);
      
      // Store the June 2 comparison summary for later use
      setJune2ComparisonSummary(comparisonSummary);
      console.log('Stored June 2 comparison summary for later use:', comparisonSummary);
      
      // Store June 2 summary changes for later use
      setJune2SummaryChanges(june2SummaryChanges);
      console.log('Stored June 2 summary changes for later use:', june2SummaryChanges);
      
      // Store individual department comparison summaries for toggle filtering
      setJune2ComparisonRetailSummary(comparisonRetailSummary);
      setJune2ComparisonRevaSummary(comparisonRevaSummary);
      setJune2ComparisonWholesaleSummary(comparisonWholesaleSummary);
      console.log('Stored June 2 comparison department summaries for toggle filtering');
      
      // Update the state if June 2 or July MTD is currently selected
      if (selectedMonth === 'June 2' || selectedMonth === 'July MTD') {
        console.log('June 2 is currently selected - setting active data');
        setSummaryChanges(june2SummaryChanges);
        setComparisonSummary(comparisonSummary);
        setRepChanges(june2RepChanges);
        
        // Create combined data based on selected toggles
        const combinedJune2Data = getCombinedRepData(
          processedJune2Retail,
          processedJune2Reva,
          processedJune2Wholesale,
          includeRetail,
          includeReva,
          includeWholesale
        );
        
        setOverallData(combinedJune2Data);
      }
      
      // Save the data to localStorage (using june2 keys)
      const currentData = loadStoredRepPerformanceData() || {};
      saveRepPerformanceData({
        ...currentData,
        jun2RepData: processedJune2Retail,
        jun2RevaData: processedJune2Reva,
        jun2WholesaleData: processedJune2Wholesale,
        jun2BaseSummary: june2Summary,
        jun2RevaValues: june2RevaSummary,
        jun2WholesaleValues: june2WholesaleSummary,
        june2ComparisonSummary: comparisonSummary,
        june2SummaryChanges: june2SummaryChanges,
        june2RepChanges: june2RepChanges,
        june2ComparisonRetailSummary: comparisonRetailSummary,
        june2ComparisonRevaSummary: comparisonRevaSummary,
        june2ComparisonWholesaleSummary: comparisonWholesaleSummary
      });
      
      console.log('June 2 data loading completed successfully');
      return true;
    } catch (error) {
      console.error('Error loading June 2 data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadJulyData = async () => {
    setIsLoading(true);
    try {
      console.log('🟡 JULY DEBUG: Starting to fetch July data from July_Data table...');
      console.log('🟡 JULY DEBUG: Current selectedMonth:', selectedMonth);
      
      // First, check if there's any data in the July_Data table
      const { count, error: countError } = await supabase
        .from('July_Data' as any)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('🔴 JULY DEBUG: Error getting count:', countError);
        throw new Error(`Error getting count: ${countError.message}`);
      }
      
      console.log('🟡 JULY DEBUG: Count result:', count);
      
      if (!count || count === 0) {
        console.log('🔴 JULY DEBUG: No data found in the July_Data table - setting empty July data');
        
        // Create empty/zero summary values for July
        const emptySummary = {
          totalSpend: 0,
          totalProfit: 0,
          totalPacks: 0,
          totalAccounts: 0,
          activeAccounts: 0,
          averageMargin: 0
        };
        
        // Set all July data states to empty/zero values
        setJulRepData([]);
        setJulRevaData([]);
        setJulWholesaleData([]);
        setJulBaseSummary(emptySummary);
        setJulRevaValues(emptySummary);
        setJulWholesaleValues(emptySummary);
        
        setIsLoading(false);
        return true; // Return true to indicate successful handling of empty data
      }
      
      console.log(`🟢 JULY DEBUG: Found ${count} total records in July_Data table`);
      
      // Fetch all records from July_Data using pagination
      let allRecords = [];
      const pageSize = 1000;
      const pages = Math.ceil(count / pageSize);
      
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('July_Data' as any)
          .select('*')
          .range(from, to);
        
        if (pageError) throw new Error(`Error fetching page ${page}: ${pageError.message}`);
        if (pageData) allRecords = [...allRecords, ...pageData];
        
        console.log(`Fetched page ${page + 1}/${pages} with ${pageData?.length || 0} records from July_Data`);
      }
      
      const julyData = allRecords;
      console.log('🟢 JULY DEBUG: Fetched July records total count:', julyData.length);
      console.log('🟢 JULY DEBUG: Sample July record:', julyData[0]);
      
      // Use July_Data_Comparison for comparison data
      console.log('🟢 JULY DEBUG: Fetching July comparison data from July_Data_Comparison table...');
      
      const { count: comparisonCount, error: comparisonCountError } = await supabase
        .from('July_Data_Comparison' as any)
        .select('*', { count: 'exact', head: true });
        
      if (comparisonCountError) throw new Error(`Error getting July comparison count: ${comparisonCountError.message}`);
        
      let comparisonRecords = [];
      if (comparisonCount && comparisonCount > 0) {
        console.log(`🟢 JULY DEBUG: Found ${comparisonCount} comparison records in July_Data_Comparison table`);
        const comparisonPages = Math.ceil(comparisonCount / pageSize);
        
        for (let page = 0; page < comparisonPages; page++) {
          const from = page * pageSize;
          const to = from + pageSize - 1;
          
          const { data: pageData, error: pageError } = await supabase
            .from('July_Data_Comparison' as any)
            .select('*')
            .range(from, to);
          
          if (pageError) throw new Error(`Error fetching July comparison page ${page}: ${pageError.message}`);
          if (pageData) comparisonRecords = [...comparisonRecords, ...pageData];
        }
      } else {
        console.log('🔴 JULY DEBUG: No comparison data found in July_Data_Comparison table');
      }
      
      console.log('🟢 JULY DEBUG: Fetched July comparison records:', comparisonRecords.length);
      
      // Process July data by department
      const julyRetailData = julyData.filter(item => item.Department === 'RETAIL');
      const julyRevaData = julyData.filter(item => item.Department === 'REVA');
      const julyWholesaleData = julyData.filter(item => item.Department === 'Wholesale' || item.Department === 'WHOLESALE');
      
      // Process July comparison data by department
      const comparisonRetailData = comparisonRecords.filter(item => item.Department === 'RETAIL');
      const comparisonRevaData = comparisonRecords.filter(item => item.Department === 'REVA');
      const comparisonWholesaleData = comparisonRecords.filter(item => item.Department === 'Wholesale' || item.Department === 'WHOLESALE');
      
      console.log('July data breakdown:', {
        retail: julyRetailData.length,
        reva: julyRevaData.length,
        wholesale: julyWholesaleData.length
      });
      
      // Transform data function (same as in other load functions)
      const transformData = (data: any[], isDepartmentData = false): RepData[] => {
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
          
          if (!repName) return;
          
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
            profitPerActiveShop: rep.activeAccounts.size > 0 ? rep.profit / rep.activeAccounts.size : 0,
            profitPerPack: rep.packs > 0 ? rep.profit / rep.packs : 0,
            activeRatio: rep.totalAccounts.size > 0 ? (rep.activeAccounts.size / rep.totalAccounts.size) * 100 : 0
          };
        });
      };
      
      // Calculate department summary function
      const calculateDeptSummary = (data: any[]) => {
        const totalSpend = data.reduce((sum, item) => {
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          return sum + spend;
        }, 0);
        
        const totalProfit = data.reduce((sum, item) => {
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          return sum + profit;
        }, 0);
        
        const totalPacks = data.reduce((sum, item) => {
          const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
          return sum + packs;
        }, 0);
        
        const uniqueAccounts = new Set(data.map(item => item['Account Ref']).filter(Boolean));
        const activeAccounts = new Set(data.filter(item => {
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          return spend > 0;
        }).map(item => item['Account Ref']).filter(Boolean));
        
        const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
        
        return {
          totalSpend,
          totalProfit,
          totalPacks,
          totalAccounts: uniqueAccounts.size,
          activeAccounts: activeAccounts.size,
          averageMargin
        };
      };
      
      // Process July data
      const processedJulyRetail = transformData(julyRetailData, false);
      const processedJulyReva = transformData(julyRevaData, true);
      const processedJulyWholesale = transformData(julyWholesaleData, true);
      
      // Process July comparison data
      const processedComparisonRetail = transformData(comparisonRetailData, false);
      const processedComparisonReva = transformData(comparisonRevaData, true);
      const processedComparisonWholesale = transformData(comparisonWholesaleData, true);
      
      // Calculate July summaries
      const julySummary = calculateDeptSummary(julyRetailData);
      const julyRevaSummary = calculateDeptSummary(julyRevaData);
      const julyWholesaleSummary = calculateDeptSummary(julyWholesaleData);
      
      // Calculate July comparison summaries
      const comparisonRetailSummary = calculateDeptSummary(comparisonRetailData);
      const comparisonRevaSummary = calculateDeptSummary(comparisonRevaData);
      const comparisonWholesaleSummary = calculateDeptSummary(comparisonWholesaleData);
      
      // Calculate summary function
      const calculateSummary = (retail: SummaryData, reva: SummaryData, wholesale: SummaryData, includeRetail: boolean, includeReva: boolean, includeWholesale: boolean) => {
        let totalSpend = 0;
        let totalProfit = 0;
        let totalPacks = 0;
        let totalAccounts = 0;
        let activeAccounts = 0;
        
        if (includeRetail) {
          totalSpend += retail.totalSpend;
          totalProfit += retail.totalProfit;
          totalPacks += retail.totalPacks;
          totalAccounts += retail.totalAccounts;
          activeAccounts += retail.activeAccounts;
        }
        
        if (includeReva) {
          totalSpend += reva.totalSpend;
          totalProfit += reva.totalProfit;
          totalPacks += reva.totalPacks;
          totalAccounts += reva.totalAccounts;
          activeAccounts += reva.activeAccounts;
        }
        
        if (includeWholesale) {
          totalSpend += wholesale.totalSpend;
          totalProfit += wholesale.totalProfit;
          totalPacks += wholesale.totalPacks;
          totalAccounts += wholesale.totalAccounts;
          activeAccounts += wholesale.activeAccounts;
        }
        
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
      
      // Calculate changes function
      const calculateChanges = (julyData: RepData[], comparisonData: RepData[]): RepChangesRecord => {
        const changes: RepChangesRecord = {};
        
        julyData.forEach(julyRep => {
          const comparisonRep = comparisonData.find(r => r.rep === julyRep.rep);
          
          if (comparisonRep) {
            changes[julyRep.rep] = {
              profit: comparisonRep.profit > 0 ? ((julyRep.profit - comparisonRep.profit) / comparisonRep.profit) * 100 : 0,
              spend: comparisonRep.spend > 0 ? ((julyRep.spend - comparisonRep.spend) / comparisonRep.spend) * 100 : 0,
              margin: julyRep.margin - comparisonRep.margin,
              packs: comparisonRep.packs > 0 ? ((julyRep.packs - comparisonRep.packs) / comparisonRep.packs) * 100 : 0,
              activeAccounts: comparisonRep.activeAccounts > 0 ? ((julyRep.activeAccounts - comparisonRep.activeAccounts) / comparisonRep.activeAccounts) * 100 : 0,
              totalAccounts: comparisonRep.totalAccounts > 0 ? ((julyRep.totalAccounts - comparisonRep.totalAccounts) / comparisonRep.totalAccounts) * 100 : 0,
              profitPerActiveShop: comparisonRep.profitPerActiveShop > 0 ? 
                ((julyRep.profitPerActiveShop - comparisonRep.profitPerActiveShop) / comparisonRep.profitPerActiveShop) * 100 : 0,
              profitPerPack: comparisonRep.profitPerPack > 0 ? 
                ((julyRep.profitPerPack - comparisonRep.profitPerPack) / comparisonRep.profitPerPack) * 100 : 0,
              activeRatio: comparisonRep.activeRatio > 0 ? 
                julyRep.activeRatio - comparisonRep.activeRatio : 0
            };
          }
        });
        
        return changes;
      };
      
      // Calculate all July rep changes
      const allJulyReps = [...processedJulyRetail, ...processedJulyReva, ...processedJulyWholesale];
      const allComparisonReps = [...processedComparisonRetail, ...processedComparisonReva, ...processedComparisonWholesale];
      const julyRepChanges = calculateChanges(allJulyReps, allComparisonReps);
      
      // Calculate July summary changes
      const julyTotalSummary = calculateSummary(julySummary, julyRevaSummary, julyWholesaleSummary, true, true, true);
      const comparisonTotalSummary = calculateSummary(comparisonRetailSummary, comparisonRevaSummary, comparisonWholesaleSummary, true, true, true);
      
      const julySummaryChanges = {
        totalSpend: comparisonTotalSummary.totalSpend > 0 ? 
          ((julyTotalSummary.totalSpend - comparisonTotalSummary.totalSpend) / comparisonTotalSummary.totalSpend) * 100 : 0,
        totalProfit: comparisonTotalSummary.totalProfit > 0 ? 
          ((julyTotalSummary.totalProfit - comparisonTotalSummary.totalProfit) / comparisonTotalSummary.totalProfit) * 100 : 0,
        averageMargin: julyTotalSummary.averageMargin - comparisonTotalSummary.averageMargin,
        totalPacks: comparisonTotalSummary.totalPacks > 0 ? 
          ((julyTotalSummary.totalPacks - comparisonTotalSummary.totalPacks) / comparisonTotalSummary.totalPacks) * 100 : 0,
        totalAccounts: comparisonTotalSummary.totalAccounts > 0 ? 
          ((julyTotalSummary.totalAccounts - comparisonTotalSummary.totalAccounts) / comparisonTotalSummary.totalAccounts) * 100 : 0,
        activeAccounts: comparisonTotalSummary.activeAccounts > 0 ? 
          ((julyTotalSummary.activeAccounts - comparisonTotalSummary.activeAccounts) / comparisonTotalSummary.activeAccounts) * 100 : 0
      };
      
      // Update July data states
      console.log('🟢 JULY DEBUG: Setting July data states...');
      console.log('🟢 JULY DEBUG: julySummary:', julySummary);
      console.log('🟢 JULY DEBUG: processedJulyRetail count:', processedJulyRetail.length);
      
      setJulRepData(processedJulyRetail);
      setJulRevaData(processedJulyReva);
      setJulWholesaleData(processedJulyWholesale);
      setJulBaseSummary(julySummary);
      setJulRevaValues(julyRevaSummary);
      setJulWholesaleValues(julyWholesaleSummary);
      
      console.log('🟢 JULY DEBUG: Comparison summary values:', {
        totalSpend: comparisonTotalSummary.totalSpend,
        totalProfit: comparisonTotalSummary.totalProfit,
        averageMargin: comparisonTotalSummary.averageMargin,
        totalPacks: comparisonTotalSummary.totalPacks
      });
      
      // Set July comparison state variables
      setJulyComparisonSummary(comparisonTotalSummary);
      setJulySummaryChanges(julySummaryChanges);
      setJulyRepChanges(julyRepChanges);
      setJulyComparisonRetailSummary(comparisonRetailSummary);
      setJulyComparisonRevaSummary(comparisonRevaSummary);
      setJulyComparisonWholesaleSummary(comparisonWholesaleSummary);
      
      // Update the state if July is currently selected
      if (selectedMonth === 'July') {
        console.log('🔧 JULY: July is currently selected - loading current data only');
        console.log('🔧 JULY: Comparison data will be loaded by useEffect when needed');
        
        // Create combined data based on selected toggles (current month data only)
        const combinedJulyData = getCombinedRepData(
          processedJulyRetail,
          processedJulyReva,
          processedJulyWholesale,
          includeRetail,
          includeReva,
          includeWholesale
        );
        
        setOverallData(combinedJulyData);
        
        console.log('✅ JULY: July current data loaded, comparison will be handled separately');
      }
      
      // Store July data in localStorage
      const existingData = loadStoredRepPerformanceData() || {};
      saveRepPerformanceData({
        ...existingData,
        julRepData: processedJulyRetail,
        julRevaData: processedJulyReva,
        julWholesaleData: processedJulyWholesale,
        julBaseSummary: julySummary,
        julRevaValues: julyRevaSummary,
        julWholesaleValues: julyWholesaleSummary,
        julyComparisonSummary: comparisonTotalSummary,
        julySummaryChanges: julySummaryChanges,
        julyRepChanges: julyRepChanges,
        // Store individual department comparison summaries for toggle filtering
        julyComparisonRetailSummary: comparisonRetailSummary,
        julyComparisonRevaSummary: comparisonRevaSummary,
        julyComparisonWholesaleSummary: comparisonWholesaleSummary
      });
      
      console.log('🟢 JULY DEBUG: July data loading completed successfully');
      return true;
    } catch (error) {
      console.error('🔴 JULY DEBUG: Error loading July data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

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
        console.log('🔍 JULY DEBUG: calculateDeptSummary called with', data.length, 'records');
        
        const totalProfit = data.reduce((sum, item) => {
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          
          // Log suspicious values
          if (profit > 1000000) {
            console.log('🚨 JULY DEBUG: Suspicious profit value found:', {
              profit: profit,
              item: item,
              rep: item.Rep,
              department: item.Department
            });
          }
          
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
      
      // Debug logging for May summary values
      console.log('🔍 Setting May summary values:');
      console.log('May Retail Summary (mayBaseSummary):', mayRetailSummary);
      console.log('May REVA Summary (mayRevaValues):', mayRevaSummary);
      console.log('May Wholesale Summary (mayWholesaleValues):', mayWholesaleSummary);
      
      // Store May comparison department summaries for toggle filtering
      setMayComparisonRetailSummary(priorRetailSummary);
      setMayComparisonRevaSummary(priorRevaSummary);
      setMayComparisonWholesaleSummary(priorWholesaleSummary);
      console.log('Stored May comparison department summaries for toggle filtering:', {
        priorRetailSummary,
        priorRevaSummary,
        priorWholesaleSummary
      });
      
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
        setIsLoading(false);
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
      
      // Store April comparison department summaries for toggle filtering
      setAprilComparisonRetailSummary(marchRetailSummary);
      setAprilComparisonRevaSummary(marchRevaSummary);
      setAprilComparisonWholesaleSummary(marchWholesaleSummary);
      console.log('Stored April comparison department summaries for toggle filtering');
      
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
      
      if (selectedMonth === 'April') {
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
      
      if (selectedMonth === 'April') {
        setOverallData(combinedAprilData);
      }
      
      return true;
    } catch (error) {
      console.error('Error loading April data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      if (selectedMonth === 'April') {
        return await loadAprilData();
      } else if (selectedMonth === 'May') {
        return await loadMayData();
      } else if (selectedMonth === 'June') {
        return await loadJuneData();
      } else if (selectedMonth === 'June 2' || selectedMonth === 'July MTD') {
        return await loadJune2Data();
      } else if (selectedMonth === 'July') {
        return await loadJulyData();
      }
      
      const data = await fetchRepPerformanceData();
      
      console.log("February data from fetchRepPerformanceData:", {
        febBaseSummary: data.febBaseSummary,
        febRevaValues: data.febRevaValues,
        febWholesaleValues: data.febWholesaleValues
      });
      
      console.log("March data from fetchRepPerformanceData:", {
        baseSummary: data.baseSummary,
        revaValues: data.revaValues,
        wholesaleValues: data.wholesaleValues
      });
      
      setRepData(data.repData);
      setRevaData(data.revaData);
      setWholesaleData(data.wholesaleData);
      
      setBaseSummary({
        totalSpend: data.baseSummary.totalSpend,
        totalProfit: data.baseSummary.totalProfit,
        totalPacks: data.baseSummary.totalPacks,
        totalAccounts: data.baseSummary.totalAccounts,
        activeAccounts: data.baseSummary.activeAccounts,
        averageMargin: data.baseSummary.averageMargin
      });
      
      setRevaValues({
        totalSpend: data.revaValues.totalSpend,
        totalProfit: data.revaValues.totalProfit,
        totalPacks: data.revaValues.totalPacks,
        totalAccounts: data.revaValues.totalAccounts,
        activeAccounts: data.revaValues.activeAccounts,
        averageMargin: data.revaValues.averageMargin
      });
      
      setWholesaleValues({
        totalSpend: data.wholesaleValues.totalSpend,
        totalProfit: data.wholesaleValues.totalProfit,
        totalPacks: data.wholesaleValues.totalPacks,
        totalAccounts: data.wholesaleValues.totalAccounts,
        activeAccounts: data.wholesaleValues.activeAccounts,
        averageMargin: data.wholesaleValues.averageMargin
      });
      
      setFebRepData(data.febRepData);
      setFebRevaData(data.febRevaData);
      setFebWholesaleData(data.febWholesaleData);
      
      setFebBaseSummary({
        totalSpend: data.febBaseSummary.totalSpend,
        totalProfit: data.febBaseSummary.totalProfit,
        totalPacks: data.febBaseSummary.totalPacks,
        totalAccounts: data.febBaseSummary.totalAccounts,
        activeAccounts: data.febBaseSummary.activeAccounts,
        averageMargin: data.febBaseSummary.averageMargin
      });
      
      setFebRevaValues({
        totalSpend: data.febRevaValues.totalSpend,
        totalProfit: data.febRevaValues.totalProfit,
        totalPacks: data.febRevaValues.totalPacks,
        totalAccounts: data.febRevaValues.totalAccounts,
        activeAccounts: data.febRevaValues.activeAccounts,
        averageMargin: data.febRevaValues.averageMargin
      });
      
      setFebWholesaleValues({
        totalSpend: data.febWholesaleValues.totalSpend,
        totalProfit: data.febWholesaleValues.totalProfit,
        totalPacks: data.febWholesaleValues.totalPacks,
        totalAccounts: data.febWholesaleValues.totalAccounts,
        activeAccounts: data.febWholesaleValues.activeAccounts,
        averageMargin: data.febWholesaleValues.averageMargin
      });
      
      setSummaryChanges({
        totalSpend: data.summaryChanges.totalSpend,
        totalProfit: data.summaryChanges.totalProfit,
        totalPacks: data.summaryChanges.totalPacks,
        averageMargin: data.summaryChanges.averageMargin,
        totalAccounts: data.summaryChanges.totalAccounts || 0,
        activeAccounts: data.summaryChanges.activeAccounts || 0
      });
      
      setRepChanges(data.repChanges);
      
      const combinedData = getCombinedRepData(
        data.repData,
        data.revaData,
        data.wholesaleData,
        includeRetail,
        includeReva,
        includeWholesale
      );
      setOverallData(combinedData);

      saveRepPerformanceData({
        overallData: combinedData,
        repData: data.repData,
        revaData: data.revaData,
        wholesaleData: data.wholesaleData,
        baseSummary: data.baseSummary,
        revaValues: data.revaValues,
        wholesaleValues: data.wholesaleValues,
        
        febRepData: data.febRepData,
        febRevaData: data.febRevaData,
        febWholesaleData: data.febWholesaleData,
        febBaseSummary: data.febBaseSummary,
        febRevaValues: data.febRevaValues,
        febWholesaleValues: data.febWholesaleValues,
        
        summaryChanges: data.summaryChanges,
        repChanges: data.repChanges
      });

      // Only load the specific month data to avoid overwriting comparison summaries
      if (selectedMonth === 'April') {
        await loadAprilData();
      } else if (selectedMonth === 'May') {
        await loadMayData();
      } else if (selectedMonth === 'June') {
        await loadJuneData();
      } else if (selectedMonth === 'June 2' || selectedMonth === 'July MTD') {
        await loadJune2Data();
      } else if (selectedMonth === 'July') {
        await loadJulyData();
      } else {
        // For March and February, load all additional months for chart data
        await loadAprilData();
        await loadMayData();
        await loadJuneData();
        await loadJune2Data();
        await loadJulyData();
      }
      
      console.log("Successfully loaded data from Supabase");
      return true;
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Modified getActiveData function to handle May data
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
    } else if (monthToUse === 'June') {
      currentRepData = junRepData;
      currentRevaData = junRevaData;
      currentWholesaleData = junWholesaleData;
    } else if (monthToUse === 'June 2' || monthToUse === 'July MTD') {
      currentRepData = jun2RepData;
      currentRevaData = jun2RevaData;
      currentWholesaleData = jun2WholesaleData;
    } else if (monthToUse === 'July') {
      currentRepData = julRepData;
      currentRevaData = julRevaData;
      currentWholesaleData = julWholesaleData;
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
          // If we're requesting data for a specific month different from the selected month,
          // we need to recombine the data for that specific month
          return getCombinedRepData(
            monthToUse === 'February' ? febRepData :
            monthToUse === 'April' ? aprRepData :
            monthToUse === 'May' ? mayRepData :
            monthToUse === 'June' ? junRepData :
            monthToUse === 'June 2' ? jun2RepData :
            monthToUse === 'July' ? julRepData : repData,
            
            monthToUse === 'February' ? febRevaData :
            monthToUse === 'April' ? aprRevaData :
            monthToUse === 'May' ? mayRevaData :
            monthToUse === 'June' ? junRevaData :
            monthToUse === 'June 2' ? jun2RevaData :
            monthToUse === 'July' ? julRevaData : revaData,
            
            monthToUse === 'February' ? febWholesaleData :
            monthToUse === 'April' ? aprWholesaleData :
            monthToUse === 'May' ? mayWholesaleData :
            monthToUse === 'June' ? junWholesaleData :
            monthToUse === 'June 2' ? jun2WholesaleData :
            monthToUse === 'July' ? julWholesaleData : wholesaleData,
            
            includeRetail,
            includeReva,
            includeWholesale
          );
        }
        return overallData;
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

  // Updated summary calculation to include July data
  const summary = calculateSummary(
    selectedMonth === 'March' ? baseSummary : 
    selectedMonth === 'February' ? febBaseSummary : 
    selectedMonth === 'April' ? aprBaseSummary : 
    selectedMonth === 'May' ? mayBaseSummary : 
    selectedMonth === 'June' ? junBaseSummary : 
    (selectedMonth === 'June 2' || selectedMonth === 'July MTD') ? jun2BaseSummary : 
    selectedMonth === 'July' ? julBaseSummary : baseSummary,
    
    selectedMonth === 'March' ? revaValues : 
    selectedMonth === 'February' ? febRevaValues : 
    selectedMonth === 'April' ? aprRevaValues : 
    selectedMonth === 'May' ? mayRevaValues : 
    selectedMonth === 'June' ? junRevaValues : 
    (selectedMonth === 'June 2' || selectedMonth === 'July MTD') ? jun2RevaValues : 
    selectedMonth === 'July' ? julRevaValues : revaValues,
    
    selectedMonth === 'March' ? wholesaleValues : 
    selectedMonth === 'February' ? febWholesaleValues :
    selectedMonth === 'April' ? aprWholesaleValues : 
    selectedMonth === 'May' ? mayWholesaleValues : 
    selectedMonth === 'June' ? junWholesaleValues : 
    (selectedMonth === 'June 2' || selectedMonth === 'July MTD') ? jun2WholesaleValues : 
    selectedMonth === 'July' ? julWholesaleValues : wholesaleValues,
    
    includeRetail,
    includeReva, 
    includeWholesale
  );

  // Debug logging for July summary calculation
  if (selectedMonth === 'July') {
    console.log('🔍 JULY SUMMARY DEBUG:');
    console.log('selectedMonth:', selectedMonth);
    console.log('julBaseSummary:', julBaseSummary);
    console.log('julRevaValues:', julRevaValues);
    console.log('julWholesaleValues:', julWholesaleValues);
    console.log('Final calculated summary:', summary);
  }

  // Debug logging for May summary calculation
  if (selectedMonth === 'May') {
    console.log('🔍 May summary calculation inputs:');
    console.log('mayBaseSummary:', mayBaseSummary);
    console.log('mayRevaValues:', mayRevaValues);
    console.log('mayWholesaleValues:', mayWholesaleValues);
    console.log('Final calculated summary:', summary);
  }

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
    
    // ... keep existing code (previous value calculation)
  };

  // Add debug function for June comparison data
  const debugJuneData = async () => {
    console.log('🧪 Running June comparison data debug...');
    await debugJuneComparisonData();
  };

  // Add debug function for May data
  const debugMayDataTable = async () => {
    console.log('🧪 Running May data debug...');
    await debugMayData();
  };

  // Add debug function for July comparison table
  const queryJulyComparisonTable = async () => {
    console.log('🧪 Running July comparison table query...');
    const { queryJulyComparisonTable } = await import('@/utils/debug-july-data');
    await queryJulyComparisonTable();
  };

  // Add function to clear July localStorage data and force recalculation
  const clearJulyDataAndRecalculate = async () => {
    console.log('🧹 Clearing July localStorage data and forcing recalculation...');
    
    // Get current localStorage data
    const currentData = loadStoredRepPerformanceData() || {};
    
    // Remove all July-related data
    delete currentData.julRepData;
    delete currentData.julRevaData;
    delete currentData.julWholesaleData;
    delete currentData.julBaseSummary;
    delete currentData.julRevaValues;
    delete currentData.julWholesaleValues;
    delete currentData.julyComparisonSummary;
    delete currentData.julySummaryChanges;
    delete currentData.julyRepChanges;
    delete currentData.julyComparisonRetailSummary;
    delete currentData.julyComparisonRevaSummary;
    delete currentData.julyComparisonWholesaleSummary;
    
    // Save the cleaned data back to localStorage
    saveRepPerformanceData(currentData);
    
    console.log('🧹 Cleared July data from localStorage');
    
    // Reset all July state variables to defaults
    setJulRepData(defaultRepData);
    setJulRevaData(defaultRevaData);
    setJulWholesaleData(defaultWholesaleData);
    setJulBaseSummary(defaultBaseSummary);
    setJulRevaValues(defaultRevaValues);
    setJulWholesaleValues(defaultWholesaleValues);
    setJulyComparisonSummary(null);
    setJulySummaryChanges(defaultSummaryChanges);
    setJulyRepChanges(defaultRepChanges);
    setJulyComparisonRetailSummary(defaultBaseSummary);
    setJulyComparisonRevaSummary(defaultRevaValues);
    setJulyComparisonWholesaleSummary(defaultWholesaleValues);
    
    console.log('🔄 Reset all July state variables to defaults');
    
    // Force reload July data with corrected calculations
    await loadJulyData();
    
    console.log('🔄 July data reloaded with corrected calculations');
  };

  // Add comprehensive July cache clearing and refresh function
  const clearJulyDataAndRefresh = async () => {
    console.log('🧹 COMPREHENSIVE JULY DATA REFRESH STARTING...');
    
    // Step 1: Clear localStorage completely
    const currentData = loadStoredRepPerformanceData() || {};
    const keysToDelete = [
      'julRepData', 'julRevaData', 'julWholesaleData', 
      'julBaseSummary', 'julRevaValues', 'julWholesaleValues',
      'julyComparisonSummary', 'julySummaryChanges', 'julyRepChanges',
      'julyComparisonRetailSummary', 'julyComparisonRevaSummary', 'julyComparisonWholesaleSummary'
    ];
    
    keysToDelete.forEach(key => delete currentData[key]);
    saveRepPerformanceData(currentData);
    console.log('🧹 Cleared all July data from localStorage');
    
    // Step 2: Reset all state variables to defaults
    setJulRepData(defaultRepData);
    setJulRevaData(defaultRevaData);
    setJulWholesaleData(defaultWholesaleData);
    setJulBaseSummary(defaultBaseSummary);
    setJulRevaValues(defaultRevaValues);
    setJulWholesaleValues(defaultWholesaleValues);
    setJulyComparisonSummary(null);
    setJulySummaryChanges(defaultSummaryChanges);
    setJulyRepChanges(defaultRepChanges);
    setJulyComparisonRetailSummary(defaultBaseSummary);
    setJulyComparisonRevaSummary(defaultRevaValues);
    setJulyComparisonWholesaleSummary(defaultWholesaleValues);
    console.log('🔄 Reset all July state variables');
    
    // Step 3: Clear comparison summary if July is selected
    if (selectedMonth === 'July') {
      setComparisonSummary(null);
      setSummaryChanges(defaultSummaryChanges);
      setRepChanges(defaultRepChanges);
      console.log('🔄 Cleared current comparison data for July');
    }
    
    // Step 4: Force fresh data load
    setIsLoading(true);
    try {
      await loadJulyData();
      console.log('✅ July data reloaded successfully');
      
      // Step 5: If July is currently selected, refresh the active data
      if (selectedMonth === 'July') {
        // Trigger a recalculation of the combined data
        const combinedData = getCombinedRepData(
          julRepData,
          julRevaData,
          julWholesaleData,
          includeRetail,
          includeReva,
          includeWholesale
        );
        setOverallData(combinedData);
        console.log('🔄 Refreshed active July data');
      }
    } catch (error) {
      console.error('❌ Error reloading July data:', error);
    } finally {
      setIsLoading(false);
    }
    
    console.log('✅ COMPREHENSIVE JULY DATA REFRESH COMPLETED');
  };

  // Add comprehensive test function for July data consistency
  const testJulyDataConsistency = async () => {
    console.log('🧪 TESTING JULY DATA CONSISTENCY...');
    
    // Test 1: Check if July data is loaded
    console.log('📊 Test 1: July Data Loading Check');
    console.log('July Rep Data count:', julRepData.length);
    console.log('July REVA Data count:', julRevaData.length);
    console.log('July Wholesale Data count:', julWholesaleData.length);
    console.log('July Comparison Summary:', julyComparisonSummary);
    console.log('July Rep Changes count:', Object.keys(julyRepChanges).length);
    
    // Test 2: Check specific rep data
    console.log('📊 Test 2: Specific Rep Data Check');
    const testReps = ['Michael McKay', 'Pete Dhillon', 'Stuart Geddes'];
    testReps.forEach(repName => {
      const repData = julRepData.find(r => r.rep === repName);
      const repChanges = julyRepChanges[repName];
      
      console.log(`${repName} July data:`, {
        found: !!repData,
        profit: repData?.profit,
        spend: repData?.spend,
        changeData: repChanges,
        profitChange: repChanges?.profit,
        spendChange: repChanges?.spend
      });
    });
    
    // Test 3: Check if percentages are reasonable
    console.log('📊 Test 3: Percentage Reasonableness Check');
    const unreasonableChanges = Object.entries(julyRepChanges).filter(([repName, changes]) => {
      return Math.abs(changes.profit) > 500 || Math.abs(changes.spend) > 500;
    });
    
    if (unreasonableChanges.length > 0) {
      console.log('⚠️ Found unreasonable percentage changes:', unreasonableChanges);
    } else {
      console.log('✅ All percentage changes appear reasonable');
    }
    
    // Test 4: Check data consistency with June pattern
    console.log('📊 Test 4: June vs July Pattern Consistency');
    console.log('June Rep Changes count:', Object.keys(juneRepChanges).length);
    console.log('July Rep Changes count:', Object.keys(julyRepChanges).length);
    console.log('June Comparison Summary exists:', !!juneComparisonSummary);
    console.log('July Comparison Summary exists:', !!julyComparisonSummary);
    
    // Test 5: Check if current month data is being used correctly
    console.log('📊 Test 5: Current Month Data Usage Check');
    if (selectedMonth === 'July') {
      console.log('Current selected month is July');
      console.log('Current repChanges being used:', Object.keys(repChanges).length);
      console.log('July-specific repChanges available:', Object.keys(julyRepChanges).length);
      
      // Check if we're using July-specific data
      const usingJulyData = Object.keys(repChanges).length === Object.keys(julyRepChanges).length;
      console.log('Using July-specific data:', usingJulyData);
      
      // CRITICAL: Test if the repChanges match the July-specific ones
      const testRepChangesMatch = testReps.every(repName => {
        const currentChange = repChanges[repName];
        const julyChange = julyRepChanges[repName];
        return JSON.stringify(currentChange) === JSON.stringify(julyChange);
      });
      
      console.log('Current repChanges match July-specific ones:', testRepChangesMatch);
      
      // Show detailed comparison for problematic reps
      testReps.forEach(repName => {
        console.log(`🔍 ${repName} comparison:`, {
          current: repChanges[repName],
          july: julyRepChanges[repName],
          match: JSON.stringify(repChanges[repName]) === JSON.stringify(julyRepChanges[repName])
        });
      });
    }
    
    console.log('✅ JULY DATA CONSISTENCY TEST COMPLETED');
  };

  // Add new function to verify July comparison data source
  const verifyJulyComparisonDataSource = async () => {
    console.log('🔍 VERIFYING JULY COMPARISON DATA SOURCE...');
    
    try {
      // Check July_Data_Comparison table directly
      const { data: julyComparisonData, error: julyComparisonError } = await supabase
        .from('July_Data_Comparison' as any)
        .select('*')
        .limit(10);
      
      if (julyComparisonError) {
        console.error('❌ Error fetching July_Data_Comparison:', julyComparisonError);
        return;
      }
      
      console.log('✅ July_Data_Comparison sample data:', julyComparisonData);
      
      // Check if our stored comparison data matches the source
      const storedData = localStorage.getItem('repPerformanceData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('📊 Stored July comparison summary:', parsedData.julyComparisonSummary);
        console.log('📊 Stored July rep changes sample:', {
          'Michael McKay': parsedData.julyRepChanges?.['Michael McKay'],
          'Pete Dhillon': parsedData.julyRepChanges?.['Pete Dhillon'],
          'Stuart Geddes': parsedData.julyRepChanges?.['Stuart Geddes']
        });
      }
      
      // Verify the data is from June (previous month)
      const { data: juneData, error: juneError } = await supabase
        .from('June_Data')
        .select('*')
        .limit(10);
      
      if (!juneError && juneData) {
        console.log('✅ June_Data sample data:', juneData);
        console.log('🔍 Comparing July_Data_Comparison vs June_Data structure...');
        
        // Compare structure
        const julyKeys = Object.keys(julyComparisonData[0] || {});
        const juneKeys = Object.keys(juneData[0] || {});
        
        console.log('July_Data_Comparison keys:', julyKeys);
        console.log('June_Data keys:', juneKeys);
        console.log('Keys match:', JSON.stringify(julyKeys.sort()) === JSON.stringify(juneKeys.sort()));
      }
      
    } catch (error) {
      console.error('❌ Error in verifyJulyComparisonDataSource:', error);
    }
  };

  // NEW: Proper July comparison data loading function
  const loadJulyComparisonDataProperly = async () => {
    console.log('🆕 JULY REBUILD: Loading July comparison data properly...');
    
    try {
      // Step 1: Fetch current July data from July_Data table WITH PAGINATION
      console.log('📊 Step 1: Fetching current July data with pagination...');
      
      // Get count first
      const { count: julyCurrentCount, error: julyCurrentCountError } = await supabase
        .from('July_Data' as any)
        .select('*', { count: 'exact', head: true });
        
      if (julyCurrentCountError) {
        console.error('❌ Error getting July current count:', julyCurrentCountError);
        return false;
      }
      
      console.log(`📊 Found ${julyCurrentCount || 0} total July current records`);
      
      // Paginate through all current records
      let julyCurrentData = [];
      const pageSize = 1000;
      const currentPages = Math.ceil((julyCurrentCount || 0) / pageSize);
      
      for (let page = 0; page < currentPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('July_Data' as any)
          .select('*')
          .range(from, to);
        
        if (pageError) {
          console.error(`❌ Error fetching July current page ${page}:`, pageError);
          return false;
        }
        
        if (pageData) {
          julyCurrentData = [...julyCurrentData, ...pageData];
        }
        
        console.log(`📊 Fetched July current page ${page + 1}/${currentPages} with ${pageData?.length || 0} records`);
      }
      
      console.log('✅ July current data fetched with pagination:', julyCurrentData.length, 'total records');
      
      // Step 2: Fetch comparison data from July_Data_Comparison table WITH PAGINATION
      console.log('📊 Step 2: Fetching July comparison data with pagination...');
      
      // Get comparison count first
      const { count: julyComparisonCount, error: julyComparisonCountError } = await supabase
        .from('July_Data_Comparison' as any)
        .select('*', { count: 'exact', head: true });
        
      if (julyComparisonCountError) {
        console.error('❌ Error getting July comparison count:', julyComparisonCountError);
        return false;
      }
      
      console.log(`📊 Found ${julyComparisonCount || 0} total July comparison records`);
      
      // Paginate through all comparison records
      let julyComparisonData = [];
      const comparisonPages = Math.ceil((julyComparisonCount || 0) / pageSize);
      
      for (let page = 0; page < comparisonPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('July_Data_Comparison' as any)
          .select('*')
          .range(from, to);
        
        if (pageError) {
          console.error(`❌ Error fetching July comparison page ${page}:`, pageError);
          return false;
        }
        
        if (pageData) {
          julyComparisonData = [...julyComparisonData, ...pageData];
        }
        
        console.log(`📊 Fetched July comparison page ${page + 1}/${comparisonPages} with ${pageData?.length || 0} records`);
      }
      
      console.log('✅ July comparison data fetched with pagination:', julyComparisonData.length, 'total records');
      
      // Step 3: Transform and process both datasets using the same logic
      const transformData = (data: any[], isDepartmentData = false) => {
        const repMap = new Map<string, {
          rep: string;
          spend: number;
          profit: number;
          packs: number;
          activeAccounts: Set<string>;
          totalAccounts: Set<string>;
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
          
          if (!repName) return;
          
          if (!repMap.has(repName)) {
            repMap.set(repName, {
              rep: repName,
              spend: 0,
              profit: 0,
              packs: 0,
              activeAccounts: new Set(),
              totalAccounts: new Set()
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
        });
        
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
            profitPerActiveShop: rep.activeAccounts.size > 0 ? rep.profit / rep.activeAccounts.size : 0,
            profitPerPack: rep.packs > 0 ? rep.profit / rep.packs : 0,
            activeRatio: rep.totalAccounts.size > 0 ? (rep.activeAccounts.size / rep.totalAccounts.size) * 100 : 0
          };
        });
      };
      
      // Step 4: Process current July data
      const julyRetailCurrent = julyCurrentData?.filter((item: any) => item.Department === 'RETAIL') || [];
      const processedJulyCurrentRetail = transformData(julyRetailCurrent, false);
      
      // Step 5: Process comparison data (June from July_Data_Comparison)
      const julyRetailComparison = julyComparisonData?.filter((item: any) => item.Department === 'RETAIL') || [];
      const processedJulyComparisonRetail = transformData(julyRetailComparison, false);
      
      // Step 6: Calculate proper rep changes
      const calculateProperRepChanges = (currentData: any[], comparisonData: any[]) => {
        const changes: any = {};
        
        currentData.forEach(currentRep => {
          const comparisonRep = comparisonData.find(r => r.rep === currentRep.rep);
          
          if (comparisonRep) {
            // Calculate percentage changes properly
            changes[currentRep.rep] = {
              profit: comparisonRep.profit > 0 ? 
                ((currentRep.profit - comparisonRep.profit) / comparisonRep.profit) * 100 : 0,
              spend: comparisonRep.spend > 0 ? 
                ((currentRep.spend - comparisonRep.spend) / comparisonRep.spend) * 100 : 0,
              margin: currentRep.margin - comparisonRep.margin, // Direct difference for margin
              packs: comparisonRep.packs > 0 ? 
                ((currentRep.packs - comparisonRep.packs) / comparisonRep.packs) * 100 : 0,
              activeAccounts: comparisonRep.activeAccounts > 0 ? 
                ((currentRep.activeAccounts - comparisonRep.activeAccounts) / comparisonRep.activeAccounts) * 100 : 0,
              totalAccounts: comparisonRep.totalAccounts > 0 ? 
                ((currentRep.totalAccounts - comparisonRep.totalAccounts) / comparisonRep.totalAccounts) * 100 : 0
            };
            
            // Debug logging for specific reps
            const problematicReps = ['Michael McKay', 'Pete Dhillon', 'Stuart Geddes'];
            if (problematicReps.includes(currentRep.rep)) {
              console.log(`🔍 ${currentRep.rep} calculation:`, {
                current: { profit: currentRep.profit, spend: currentRep.spend },
                comparison: { profit: comparisonRep.profit, spend: comparisonRep.spend },
                changes: changes[currentRep.rep]
              });
            }
          }
        });
        
        return changes;
      };
      
      // Step 7: Calculate rep changes
      const properJulyRepChanges = calculateProperRepChanges(
        processedJulyCurrentRetail, 
        processedJulyComparisonRetail
      );
      
      console.log('✅ Proper July rep changes calculated for', Object.keys(properJulyRepChanges).length, 'reps');
      
      // Step 8: Store the results (but don't apply them yet - we'll do this manually)
      console.log('📊 Proper July comparison data ready');
      console.log('Sample proper changes:', {
        'Michael McKay': properJulyRepChanges['Michael McKay'],
        'Pete Dhillon': properJulyRepChanges['Pete Dhillon'],
        'Stuart Geddes': properJulyRepChanges['Stuart Geddes']
      });
      
      return {
        currentData: processedJulyCurrentRetail,
        comparisonData: processedJulyComparisonRetail,
        repChanges: properJulyRepChanges
      };
      
    } catch (error) {
      console.error('❌ Error in loadJulyComparisonDataProperly:', error);
      return false;
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
    junBaseSummary,
    junRevaValues,
    junWholesaleValues,
    jun2BaseSummary,
    jun2RevaValues,
    jun2WholesaleValues,
    julBaseSummary,
    julRevaValues,
    julWholesaleValues,
    comparisonSummary,
    debugJuneData,
    debugMayDataTable,
    debugJulyComparisonData,
    queryJulyComparisonTable,
    juneRepChanges,
    june2RepChanges,
    june2SummaryChanges,
    june2ComparisonSummary,
    julyRepChanges,
    clearJulyDataAndRecalculate,
    clearJulyDataAndRefresh,
    testJulyDataConsistency,
          verifyJulyComparisonDataSource,
      loadJulyComparisonDataProperly
  };
};
