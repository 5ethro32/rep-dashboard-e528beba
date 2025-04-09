import { useState, useEffect } from 'react';
import { calculateSummary } from '@/utils/rep-performance-utils';
import { toast } from '@/components/ui/use-toast';
import { getCombinedRepData, sortRepData } from '@/utils/rep-data-processing';
import { fetchRepPerformanceData, saveRepPerformanceData, loadStoredRepPerformanceData, fetchAprilMTDData } from '@/services/rep-performance-service';
import { RepData, SummaryData, RepChangesRecord } from '@/types/rep-performance.types';
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
  const [selectedMonth, setSelectedMonth] = useState('March');
  
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
  
  // New state for April MTD data
  const [aprilRepData, setAprilRepData] = useState(defaultRepData);
  const [aprilRevaData, setAprilRevaData] = useState(defaultRevaData);
  const [aprilWholesaleData, setAprilWholesaleData] = useState(defaultWholesaleData);
  const [aprilBaseSummary, setAprilBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [aprilRevaValues, setAprilRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [aprilWholesaleValues, setAprilWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  useEffect(() => {
    const storedData = loadStoredRepPerformanceData();
    
    if (storedData) {
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
      
      // Load April data if available
      setAprilRepData(storedData.aprilRepData || defaultRepData);
      setAprilRevaData(storedData.aprilRevaData || defaultRevaData);
      setAprilWholesaleData(storedData.aprilWholesaleData || defaultWholesaleData);
      setAprilBaseSummary(storedData.aprilBaseSummary || defaultBaseSummary);
      setAprilRevaValues(storedData.aprilRevaValues || defaultRevaValues);
      setAprilWholesaleValues(storedData.aprilWholesaleValues || defaultWholesaleValues);
      
      setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
      setRepChanges(storedData.repChanges || defaultRepChanges);
    }
  }, []);

  useEffect(() => {
    console.log("Recalculating combined data based on toggle changes:", { includeRetail, includeReva, includeWholesale, selectedMonth });

    // Use different data sources based on selectedMonth
    let currentRepData = selectedMonth === 'March' 
      ? repData 
      : selectedMonth === 'February' 
        ? febRepData 
        : aprilRepData;
        
    let currentRevaData = selectedMonth === 'March' 
      ? revaData 
      : selectedMonth === 'February' 
        ? febRevaData 
        : aprilRevaData;
        
    let currentWholesaleData = selectedMonth === 'March' 
      ? wholesaleData 
      : selectedMonth === 'February' 
        ? febWholesaleData 
        : aprilWholesaleData;
    
    const combinedData = getCombinedRepData(
      currentRepData,
      currentRevaData,
      currentWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    setOverallData(combinedData);

    // If showing February data, reverse the changes direction
    if (selectedMonth === 'February') {
      // Invert the change percentages
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
      
      // Update summary changes by inverting them as well
      const invertedSummaryChanges = {
        totalSpend: summaryChanges.totalSpend ? -summaryChanges.totalSpend / (1 + summaryChanges.totalSpend / 100) * 100 : 0,
        totalProfit: summaryChanges.totalProfit ? -summaryChanges.totalProfit / (1 + summaryChanges.totalProfit / 100) * 100 : 0,
        averageMargin: -summaryChanges.averageMargin,
        totalPacks: summaryChanges.totalPacks ? -summaryChanges.totalPacks / (1 + summaryChanges.totalPacks / 100) * 100 : 0,
        totalAccounts: summaryChanges.totalAccounts ? -summaryChanges.totalAccounts / (1 + summaryChanges.totalAccounts / 100) * 100 : 0,
        activeAccounts: summaryChanges.activeAccounts ? -summaryChanges.activeAccounts / (1 + summaryChanges.activeAccounts / 100) * 100 : 0
      };
      
      // Temporarily update the changes when viewing February data
      // (but don't save them permanently)
      setSummaryChanges(invertedSummaryChanges);
      setRepChanges(invertedChanges);
    } else if (selectedMonth === 'April') {
      // For April, we show comparison with March
      const storedData = loadStoredRepPerformanceData();
      if (storedData) {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
      }
    } else {
      // Restore original changes from stored data when viewing March
      const storedData = loadStoredRepPerformanceData();
      if (storedData) {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
      }
    }
  }, [includeRetail, includeReva, includeWholesale, selectedMonth, repData, revaData, wholesaleData, febRepData, febRevaData, febWholesaleData, aprilRepData, aprilRevaData, aprilWholesaleData]);

  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      // Load March and February data
      const data = await fetchRepPerformanceData();
      
      setRepData(data.repData);
      setRevaData(data.revaData);
      setWholesaleData(data.wholesaleData);
      setBaseSummary(data.baseSummary);
      setRevaValues(data.revaValues);
      setWholesaleValues(data.wholesaleValues);
      
      setFebRepData(data.febRepData);
      setFebRevaData(data.febRevaData);
      setFebWholesaleData(data.febWholesaleData);
      setFebBaseSummary(data.febBaseSummary);
      setFebRevaValues(data.febRevaValues);
      setFebWholesaleValues(data.febWholesaleValues);
      
      setSummaryChanges(data.summaryChanges);
      setRepChanges(data.repChanges);
      
      // Load April MTD data
      try {
        const aprilData = await fetchAprilMTDData();
        
        setAprilRepData(aprilData.repData);
        setAprilRevaData(aprilData.revaData);
        setAprilWholesaleData(aprilData.wholesaleData);
        setAprilBaseSummary(aprilData.baseSummary);
        setAprilRevaValues(aprilData.revaValues);
        setAprilWholesaleValues(aprilData.wholesaleValues);
        
        console.log("Successfully loaded April MTD data from Supabase");
      } catch (aprilError) {
        console.error('Error loading April data:', aprilError);
        toast({
          title: "Error loading April data",
          description: aprilError instanceof Error ? aprilError.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
      
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
        
        aprilRepData: aprilRepData,
        aprilRevaData: aprilRevaData,
        aprilWholesaleData: aprilWholesaleData,
        aprilBaseSummary: aprilBaseSummary,
        aprilRevaValues: aprilRevaValues,
        aprilWholesaleValues: aprilWholesaleValues,
        
        summaryChanges: data.summaryChanges,
        repChanges: data.repChanges
      });

      console.log("Successfully loaded data from Supabase");
      toast({
        title: "Data loaded successfully",
        description: "The latest performance data has been loaded with February and April comparison.",
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

  const getActiveData = (tabValue: string) => {
    // Use different data sources based on selectedMonth
    const currentRepData = selectedMonth === 'March' 
      ? repData 
      : selectedMonth === 'February' 
        ? febRepData 
        : aprilRepData;
        
    const currentRevaData = selectedMonth === 'March' 
      ? revaData 
      : selectedMonth === 'February' 
        ? febRevaData 
        : aprilRevaData;
        
    const currentWholesaleData = selectedMonth === 'March' 
      ? wholesaleData 
      : selectedMonth === 'February' 
        ? febWholesaleData 
        : aprilWholesaleData;
    
    switch (tabValue) {
      case 'rep':
        return includeRetail ? currentRepData : [];
      case 'reva':
        return includeReva ? currentRevaData : [];
      case 'wholesale':
        return includeWholesale ? currentWholesaleData : [];
      case 'overall':
      default:
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

  // Calculate summary based on selected month
  const summary = calculateSummary(
    selectedMonth === 'March' 
      ? baseSummary 
      : selectedMonth === 'February' 
        ? febBaseSummary 
        : aprilBaseSummary,
        
    selectedMonth === 'March' 
      ? revaValues 
      : selectedMonth === 'February' 
        ? febRevaValues 
        : aprilRevaValues,
        
    selectedMonth === 'March' 
      ? wholesaleValues 
      : selectedMonth === 'February' 
        ? febWholesaleValues 
        : aprilWholesaleValues,
        
    includeRetail,
    includeReva, 
    includeWholesale
  );

  console.log("Current summary values:", summary);
  console.log("Current summary changes:", summaryChanges);

  const getFebValue = (repName: string, metricType: string, currentValue: number, changePercent: number) => {
    if (!repName || Math.abs(changePercent) < 0.1) return '';
    
    // For February, we use March data to show comparison
    const comparisonRepData = selectedMonth === 'March' ? febRepData : repData;
    const comparisonRevaData = selectedMonth === 'March' ? febRevaData : revaData;
    const comparisonWholesaleData = selectedMonth === 'March' ? febWholesaleData : wholesaleData;
    
    const comparisonRetailRep = comparisonRepData.find(rep => rep.rep === repName);
    const comparisonRevaRep = comparisonRevaData.find(rep => rep.rep === repName);
    const comparisonWholesaleRep = comparisonWholesaleData.find(rep => rep.rep === repName);
    
    let previousValue = 0;
    
    switch (metricType) {
      case 'spend':
        previousValue = (comparisonRetailRep?.spend || 0) + 
                        (includeReva ? (comparisonRevaRep?.spend || 0) : 0) + 
                        (includeWholesale ? (comparisonWholesaleRep?.spend || 0) : 0);
        return formatCurrency(previousValue);
        
      case 'profit':
        previousValue = (comparisonRetailRep?.profit || 0) + 
                        (includeReva ? (comparisonRevaRep?.profit || 0) : 0) + 
                        (includeWholesale ? (comparisonWholesaleRep?.profit || 0) : 0);
        return formatCurrency(previousValue);
        
      case 'margin':
        const totalComparisonSpend = (comparisonRetailRep?.spend || 0) + 
                             (includeReva ? (comparisonRevaRep?.spend || 0) : 0) + 
                             (includeWholesale ? (comparisonWholesaleRep?.spend || 0) : 0);
                             
        const totalComparisonProfit = (comparisonRetailRep?.profit || 0) + 
                              (includeReva ? (comparisonRevaRep?.profit || 0) : 0) + 
                              (includeWholesale ? (comparisonWholesaleRep?.profit || 0) : 0);
                              
        previousValue = totalComparisonSpend > 0 ? (totalComparisonProfit / totalComparisonSpend) * 100 : 0;
        return formatPercent(previousValue);
        
      case 'packs':
        previousValue = (comparisonRetailRep?.packs || 0) + 
                        (includeReva ? (comparisonRevaRep?.packs || 0) : 0) + 
                        (includeWholesale ? (comparisonWholesaleRep?.packs || 0) : 0);
        return formatNumber(previousValue);
        
      case 'activeAccounts':
        previousValue = (comparisonRetailRep?.activeAccounts || 0) + 
                        (includeReva ? (comparisonRevaRep?.activeAccounts || 0) : 0) + 
                        (includeWholesale ? (comparisonWholesaleRep?.activeAccounts || 0) : 0);
        return formatNumber(previousValue);
        
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
    loadDataFromSupabase,
    isLoading,
    getFebValue,
    selectedMonth,
    setSelectedMonth
  };
};
