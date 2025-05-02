
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  fetchRepPerformanceData, 
  saveRepPerformanceData, 
  loadStoredRepPerformanceData 
} from '@/services/rep-performance-service';
import { getCombinedRepData, sortRepData, calculateSummaryFromData } from '@/utils/rep-data-processing';
import { 
  RepData,
  SummaryData,
  RepChangesRecord
} from '@/types/rep-performance.types';
import {
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
  const [selectedMonth, setSelectedMonth] = useState('March');
  
  // State for basic data sources
  const [repData, setRepData] = useState<RepData[]>([]);
  const [revaData, setRevaData] = useState<RepData[]>([]);
  const [wholesaleData, setWholesaleData] = useState<RepData[]>([]);

  // February data
  const [febRepData, setFebRepData] = useState<RepData[]>([]);
  const [febRevaData, setFebRevaData] = useState<RepData[]>([]);
  const [febWholesaleData, setFebWholesaleData] = useState<RepData[]>([]);

  // April data
  const [aprRepData, setAprRepData] = useState<RepData[]>([]);
  const [aprRevaData, setAprRevaData] = useState<RepData[]>([]);
  const [aprWholesaleData, setAprWholesaleData] = useState<RepData[]>([]);

  // May data
  const [mayRepData, setMayRepData] = useState<RepData[]>([]);
  const [mayRevaData, setMayRevaData] = useState<RepData[]>([]);
  const [mayWholesaleData, setMayWholesaleData] = useState<RepData[]>([]);
  
  // State for calculated summaries
  const [baseSummary, setBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [revaValues, setRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [wholesaleValues, setWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [febBaseSummary, setFebBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [febRevaValues, setFebRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [febWholesaleValues, setFebWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);

  const [aprBaseSummary, setAprBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [aprRevaValues, setAprRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [aprWholesaleValues, setAprWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);

  const [mayBaseSummary, setMayBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [mayRevaValues, setMayRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [mayWholesaleValues, setMayWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  // Function to sort data based on current sort settings
  const sortDataFunction = useCallback((data: RepData[]): RepData[] => {
    return sortRepData(data, sortBy, sortOrder);
  }, [sortBy, sortOrder]);

  // Define loadDataFromSupabase before using it
  const loadDataFromSupabase = useCallback(async () => {
    setIsLoading(true);
    console.log(`Loading data for ${selectedMonth} from Supabase...`);
    
    try {
      // For simplicity, we'll load the same data for all months in this demo
      // In a real application, you would modify this to fetch month-specific data
      const data = await fetchRepPerformanceData();
      
      if (!data) {
        console.error('Failed to fetch data from Supabase');
        setIsLoading(false);
        return false;
      }
      
      // Store the fetched data
      saveRepPerformanceData(data);
      
      // Set the data based on the selected month
      // For demonstration, we're setting the same data for all months
      // In a real app, you would use different API calls or parameters for each month
      
      // February data
      setFebRepData(data.febRepData || []);
      setFebRevaData(data.febRevaData || []);
      setFebWholesaleData(data.febWholesaleData || []);
      setFebBaseSummary(data.febBaseSummary || defaultBaseSummary);
      setFebRevaValues(data.febRevaValues || defaultRevaValues);
      setFebWholesaleValues(data.febWholesaleValues || defaultWholesaleValues);
      
      // March data
      setRepData(data.repData || []);
      setRevaData(data.revaData || []);
      setWholesaleData(data.wholesaleData || []);
      setBaseSummary(data.baseSummary || defaultBaseSummary);
      setRevaValues(data.revaValues || defaultRevaValues);
      setWholesaleValues(data.wholesaleValues || defaultWholesaleValues);
      
      // April data
      setAprRepData(data.repData || []);
      setAprRevaData(data.revaData || []);
      setAprWholesaleData(data.wholesaleData || []);
      setAprBaseSummary(data.baseSummary || defaultBaseSummary);
      setAprRevaValues(data.revaValues || defaultRevaValues);
      setAprWholesaleValues(data.wholesaleValues || defaultWholesaleValues);
      
      // May data
      setMayRepData(data.repData || []); 
      setMayRevaData(data.revaData || []);
      setMayWholesaleData(data.wholesaleData || []);
      setMayBaseSummary(data.baseSummary || defaultBaseSummary);
      setMayRevaValues(data.revaValues || defaultRevaValues);
      setMayWholesaleValues(data.wholesaleValues || defaultWholesaleValues);
      
      // Set the change calculations
      setSummaryChanges(data.summaryChanges || defaultSummaryChanges);
      setRepChanges(data.repChanges || defaultRepChanges);
      
      // Update summary metrics based on the selected month
      updateSummaryMetrics();
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
      return false;
    }
  }, [selectedMonth]); // Add selectedMonth as a dependency to refresh data when month changes

  // Function to update summary metrics based on selected month and filters
  const updateSummaryMetrics = useCallback(() => {
    let currentBaseSummary: SummaryData;
    let currentRevaValues: SummaryData;
    let currentWholesaleValues: SummaryData;
    
    // Select the right data based on month
    switch (selectedMonth) {
      case 'February':
        currentBaseSummary = febBaseSummary;
        currentRevaValues = febRevaValues;
        currentWholesaleValues = febWholesaleValues;
        break;
      case 'April':
        currentBaseSummary = aprBaseSummary;
        currentRevaValues = aprRevaValues;
        currentWholesaleValues = aprWholesaleValues;
        break;
      case 'May':
        currentBaseSummary = mayBaseSummary;
        currentRevaValues = mayRevaValues;
        currentWholesaleValues = mayWholesaleValues;
        break;
      case 'March':
      default:
        currentBaseSummary = baseSummary;
        currentRevaValues = revaValues;
        currentWholesaleValues = wholesaleValues;
    }
    
    // Calculate totals based on which data sources are included
    let totalSpend = 0;
    let totalProfit = 0;
    let totalPacks = 0;
    let sumWeightedMargin = 0;
    
    if (includeRetail) {
      console.log('Adding Retail values:', currentBaseSummary);
      totalSpend += currentBaseSummary.totalSpend;
      totalProfit += currentBaseSummary.totalProfit;
      totalPacks += currentBaseSummary.totalPacks;
      sumWeightedMargin += currentBaseSummary.totalSpend * currentBaseSummary.averageMargin / 100;
    }
    
    if (includeReva) {
      console.log('Adding REVA values:', currentRevaValues);
      totalSpend += currentRevaValues.totalSpend;
      totalProfit += currentRevaValues.totalProfit;
      totalPacks += currentRevaValues.totalPacks;
      sumWeightedMargin += currentRevaValues.totalSpend * currentRevaValues.averageMargin / 100;
    }
    
    if (includeWholesale) {
      console.log('Adding Wholesale values:', currentWholesaleValues);
      totalSpend += currentWholesaleValues.totalSpend;
      totalProfit += currentWholesaleValues.totalProfit;
      totalPacks += currentWholesaleValues.totalPacks;
      sumWeightedMargin += currentWholesaleValues.totalSpend * currentWholesaleValues.averageMargin / 100;
    }
    
    // Calculate weighted average margin
    const weightedMargin = totalSpend > 0 ? (sumWeightedMargin / totalSpend) : 0;
    
    // Update summary in state
    const updatedSummary = {
      totalSpend,
      totalProfit,
      totalPacks,
      averageMargin: weightedMargin
    };
    
    console.log('Final calculated summary:', updatedSummary);
    
  }, [
    selectedMonth, 
    includeRetail, 
    includeReva, 
    includeWholesale,
    febBaseSummary, febRevaValues, febWholesaleValues,
    baseSummary, revaValues, wholesaleValues,
    aprBaseSummary, aprRevaValues, aprWholesaleValues,
    mayBaseSummary, mayRevaValues, mayWholesaleValues
  ]);

  // Load initial data
  useEffect(() => {
    // Try to load from local storage first
    const storedData = loadStoredRepPerformanceData();
    
    if (storedData) {
      console.log('Loaded data from localStorage:', storedData);
      
      // Set all the data from storage
      // February data
      setFebRepData(storedData.febRepData || []);
      setFebRevaData(storedData.febRevaData || []);
      setFebWholesaleData(storedData.febWholesaleData || []);
      setFebBaseSummary(storedData.febBaseSummary || defaultBaseSummary);
      setFebRevaValues(storedData.febRevaValues || defaultRevaValues);
      setFebWholesaleValues(storedData.febWholesaleValues || defaultWholesaleValues);
      
      // March data
      setRepData(storedData.repData || []);
      setRevaData(storedData.revaData || []);
      setWholesaleData(storedData.wholesaleData || []);
      setBaseSummary(storedData.baseSummary || defaultBaseSummary);
      setRevaValues(storedData.revaValues || defaultRevaValues);
      setWholesaleValues(storedData.wholesaleValues || defaultWholesaleValues);
      
      // April data
      setAprRepData(storedData.repData || []);
      setAprRevaData(storedData.revaData || []);
      setAprWholesaleData(storedData.wholesaleData || []);
      setAprBaseSummary(storedData.baseSummary || defaultBaseSummary);
      setAprRevaValues(storedData.revaValues || defaultRevaValues);
      setAprWholesaleValues(storedData.wholesaleValues || defaultWholesaleValues);
      
      // May data
      setMayRepData(storedData.repData || []);
      setMayRevaData(storedData.revaData || []);
      setMayWholesaleData(storedData.wholesaleData || []);
      setMayBaseSummary(storedData.baseSummary || defaultBaseSummary);
      setMayRevaValues(storedData.revaValues || defaultRevaValues);
      setMayWholesaleValues(storedData.wholesaleValues || defaultWholesaleValues);
      
      // Set changes
      setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
      setRepChanges(storedData.repChanges || defaultRepChanges);
    } else {
      // If no local data, load from API
      loadDataFromSupabase();
    }
  }, [loadDataFromSupabase]);

  // Update summary whenever filters change
  useEffect(() => {
    updateSummaryMetrics();
  }, [
    selectedMonth, 
    includeRetail, 
    includeReva, 
    includeWholesale,
    updateSummaryMetrics
  ]);

  // Function to load different months
  const loadMayData = async () => {
    console.log('Loading May data...');
    // In a real app, this would fetch May-specific data
    return true;
  };

  const loadAprilData = async () => {
    console.log('Loading April data...');
    // In a real app, this would fetch April-specific data
    return true;
  };

  // Get the current dataset based on selected month
  const getCurrentDataset = useCallback((type: string) => {
    switch (selectedMonth) {
      case 'February':
        if (type === 'rep') return febRepData;
        if (type === 'reva') return febRevaData;
        if (type === 'wholesale') return febWholesaleData;
        // For 'overall', we'll handle it differently
        break;
      case 'April':
        if (type === 'rep') return aprRepData;
        if (type === 'reva') return aprRevaData;
        if (type === 'wholesale') return aprWholesaleData;
        break;
      case 'May':
        if (type === 'rep') return mayRepData;
        if (type === 'reva') return mayRevaData;
        if (type === 'wholesale') return mayWholesaleData;
        break;
      case 'March':
      default:
        if (type === 'rep') return repData;
        if (type === 'reva') return revaData;
        if (type === 'wholesale') return wholesaleData;
    }
    
    // Default to empty array
    return [];
  }, [
    selectedMonth, 
    febRepData, febRevaData, febWholesaleData,
    repData, revaData, wholesaleData,
    aprRepData, aprRevaData, aprWholesaleData,
    mayRepData, mayRevaData, mayWholesaleData
  ]);

  // Get active data for a specific view type and optional month override
  const getActiveData = useCallback((type: string, monthOverride?: string): RepData[] => {
    const effectiveMonth = monthOverride || selectedMonth;
    
    // For 'overall' tab, combine the relevant datasets
    if (type === 'overall') {
      let dataToUse: RepData[] = [];
      
      switch (effectiveMonth) {
        case 'February':
          dataToUse = getCombinedRepData(
            febRepData, 
            febRevaData, 
            febWholesaleData,
            includeRetail,
            includeReva,
            includeWholesale
          );
          break;
        case 'April':
          dataToUse = getCombinedRepData(
            aprRepData, 
            aprRevaData, 
            aprWholesaleData,
            includeRetail,
            includeReva,
            includeWholesale
          );
          break;
        case 'May':
          dataToUse = getCombinedRepData(
            mayRepData, 
            mayRevaData, 
            mayWholesaleData,
            includeRetail,
            includeReva,
            includeWholesale
          );
          break;
        case 'March':
        default:
          dataToUse = getCombinedRepData(
            repData, 
            revaData, 
            wholesaleData,
            includeRetail,
            includeReva,
            includeWholesale
          );
      }
      
      return sortDataFunction(dataToUse);
    }
    
    // For specific department tabs, check if we should include that data type
    switch (type) {
      case 'rep':
        if (!includeRetail) return [];
        break;
      case 'reva':
        if (!includeReva) return [];
        break;
      case 'wholesale':
        if (!includeWholesale) return [];
        break;
    }
    
    // Get the appropriate dataset based on month and type
    let currentDataset: RepData[] = [];
    
    switch (effectiveMonth) {
      case 'February':
        if (type === 'rep') currentDataset = febRepData;
        if (type === 'reva') currentDataset = febRevaData;
        if (type === 'wholesale') currentDataset = febWholesaleData;
        break;
      case 'April':
        if (type === 'rep') currentDataset = aprRepData;
        if (type === 'reva') currentDataset = aprRevaData;
        if (type === 'wholesale') currentDataset = aprWholesaleData;
        break;
      case 'May':
        if (type === 'rep') currentDataset = mayRepData;
        if (type === 'reva') currentDataset = mayRevaData;
        if (type === 'wholesale') currentDataset = mayWholesaleData;
        break;
      case 'March':
      default:
        if (type === 'rep') currentDataset = repData;
        if (type === 'reva') currentDataset = revaData;
        if (type === 'wholesale') currentDataset = wholesaleData;
    }
    
    return sortDataFunction(currentDataset);
  }, [
    selectedMonth,
    repData, revaData, wholesaleData,
    febRepData, febRevaData, febWholesaleData,
    aprRepData, aprRevaData, aprWholesaleData,
    mayRepData, mayRevaData, mayWholesaleData,
    includeRetail, includeReva, includeWholesale,
    sortDataFunction
  ]);

  // Handle sorting column click
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending order
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Get value from February for comparison, with support for any rep and metric type
  const getFebValue = useCallback((repName: string, metricType: string, currentValue: number, changePercent: number): string => {
    if (Math.abs(changePercent) < 0.1) return formatCurrency(currentValue, 0);
    
    const previousValue = currentValue / (1 + (changePercent / 100));
    
    if (metricType === 'margin') {
      return formatPercent(previousValue);
    } else if (metricType === 'packs') {
      return formatNumber(previousValue);
    } else {
      return formatCurrency(previousValue, 0);
    }
  }, []);

  // Calculate summary based on filter settings
  const summary = useMemo(() => {
    let currentBaseSummary: SummaryData;
    let currentRevaValues: SummaryData;
    let currentWholesaleValues: SummaryData;
    
    switch (selectedMonth) {
      case 'February':
        currentBaseSummary = febBaseSummary;
        currentRevaValues = febRevaValues;
        currentWholesaleValues = febWholesaleValues;
        break;
      case 'April':
        currentBaseSummary = aprBaseSummary;
        currentRevaValues = aprRevaValues;
        currentWholesaleValues = aprWholesaleValues;
        break;
      case 'May':
        currentBaseSummary = mayBaseSummary;
        currentRevaValues = mayRevaValues;
        currentWholesaleValues = mayWholesaleValues;
        break;
      case 'March':
      default:
        currentBaseSummary = baseSummary;
        currentRevaValues = revaValues;
        currentWholesaleValues = wholesaleValues;
    }
    
    // Calculate totals based on which data sources are included
    let totalSpend = 0;
    let totalProfit = 0;
    let totalPacks = 0;
    let sumWeightedMargin = 0;
    
    if (includeRetail) {
      totalSpend += currentBaseSummary.totalSpend;
      totalProfit += currentBaseSummary.totalProfit;
      totalPacks += currentBaseSummary.totalPacks;
      sumWeightedMargin += currentBaseSummary.totalSpend * currentBaseSummary.averageMargin / 100;
    }
    
    if (includeReva) {
      totalSpend += currentRevaValues.totalSpend;
      totalProfit += currentRevaValues.totalProfit;
      totalPacks += currentRevaValues.totalPacks;
      sumWeightedMargin += currentRevaValues.totalSpend * currentRevaValues.averageMargin / 100;
    }
    
    if (includeWholesale) {
      totalSpend += currentWholesaleValues.totalSpend;
      totalProfit += currentWholesaleValues.totalProfit;
      totalPacks += currentWholesaleValues.totalPacks;
      sumWeightedMargin += currentWholesaleValues.totalSpend * currentWholesaleValues.averageMargin / 100;
    }
    
    // Calculate weighted average margin
    const averageMargin = totalSpend > 0 ? (sumWeightedMargin / totalSpend) : 0;
    
    return {
      totalSpend,
      totalProfit,
      totalPacks,
      averageMargin
    };
  }, [
    selectedMonth, 
    includeRetail, includeReva, includeWholesale,
    febBaseSummary, febRevaValues, febWholesaleValues,
    baseSummary, revaValues, wholesaleValues,
    aprBaseSummary, aprRevaValues, aprWholesaleValues,
    mayBaseSummary, mayRevaValues, mayWholesaleValues
  ]);

  return {
    // State values
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
    
    // Data values
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
    mayWholesaleData,
    
    // Summary values
    summary,
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
    mayWholesaleValues,
    
    // Change values
    summaryChanges,
    repChanges,
    
    // Methods for data loading and processing
    loadDataFromSupabase,
    
    // Method to get the appropriate data for each tab/view
    getActiveData,
    
    // Method to sort data based on current sort settings
    sortData: sortDataFunction,
    
    // Method to handle sorting column click
    handleSort,
    
    // Method to get February value for comparison
    getFebValue
  };
};
