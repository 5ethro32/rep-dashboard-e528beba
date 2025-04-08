
import { useState, useEffect } from 'react';
import { calculateSummary } from '@/utils/rep-performance-utils';
import { toast } from '@/components/ui/use-toast';
import { getCombinedRepData, sortRepData } from '@/utils/rep-data-processing';
import { fetchRepPerformanceData, saveRepPerformanceData, loadStoredRepPerformanceData } from '@/services/rep-performance-service';
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

export const useRepPerformanceData = () => {
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  
  // Current month data
  const [overallData, setOverallData] = useState(defaultOverallData);
  const [repData, setRepData] = useState(defaultRepData);
  const [revaData, setRevaData] = useState(defaultRevaData);
  const [wholesaleData, setWholesaleData] = useState(defaultWholesaleData);
  const [baseSummary, setBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [revaValues, setRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [wholesaleValues, setWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  // Previous month data (February)
  const [febRepData, setFebRepData] = useState(defaultRepData);
  const [febRevaData, setFebRevaData] = useState(defaultRevaData);
  const [febWholesaleData, setFebWholesaleData] = useState(defaultWholesaleData);
  const [febBaseSummary, setFebBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [febRevaValues, setFebRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [febWholesaleValues, setFebWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  // Change data
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  // Load from localStorage on initialization
  useEffect(() => {
    const storedData = loadStoredRepPerformanceData();
    
    if (storedData) {
      // Current month data
      setOverallData(storedData.overallData || defaultOverallData);
      setRepData(storedData.repData || defaultRepData);
      setRevaData(storedData.revaData || defaultRevaData);
      setWholesaleData(storedData.wholesaleData || defaultWholesaleData);
      setBaseSummary(storedData.baseSummary || defaultBaseSummary);
      setRevaValues(storedData.revaValues || defaultRevaValues);
      setWholesaleValues(storedData.wholesaleValues || defaultWholesaleValues);
      
      // Previous month data (February)
      setFebRepData(storedData.febRepData || defaultRepData);
      setFebRevaData(storedData.febRevaData || defaultRevaData);
      setFebWholesaleData(storedData.febWholesaleData || defaultWholesaleData);
      setFebBaseSummary(storedData.febBaseSummary || defaultBaseSummary);
      setFebRevaValues(storedData.febRevaValues || defaultRevaValues);
      setFebWholesaleValues(storedData.febWholesaleValues || defaultWholesaleValues);
      
      // Change data
      setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
      setRepChanges(storedData.repChanges || defaultRepChanges);
    }
  }, []);

  // Recalculate combined data when toggle or rep data changes
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
      // Fetch data from Supabase
      const data = await fetchRepPerformanceData();
      
      // Update state with fetched data - current month
      setRepData(data.repData);
      setRevaData(data.revaData);
      setWholesaleData(data.wholesaleData);
      
      // Fix: Add all required properties when setting SummaryData state
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
      
      // Update state with fetched data - previous month (February)
      setFebRepData(data.febRepData);
      setFebRevaData(data.febRevaData);
      setFebWholesaleData(data.febWholesaleData);
      
      // Fix: Add all required properties for February SummaryData
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
      
      // Update changes
      setSummaryChanges(data.summaryChanges);
      setRepChanges(data.repChanges);
      
      // Calculate combined data based on current toggle states
      const combinedData = getCombinedRepData(
        data.repData,
        data.revaData,
        data.wholesaleData,
        includeRetail,
        includeReva,
        includeWholesale
      );
      setOverallData(combinedData);

      // Save data to localStorage
      saveRepPerformanceData({
        // Current month
        overallData: combinedData,
        repData: data.repData,
        revaData: data.revaData,
        wholesaleData: data.wholesaleData,
        baseSummary: data.baseSummary,
        revaValues: data.revaValues,
        wholesaleValues: data.wholesaleValues,
        
        // Previous month
        febRepData: data.febRepData,
        febRevaData: data.febRevaData,
        febWholesaleData: data.febWholesaleData,
        febBaseSummary: data.febBaseSummary,
        febRevaValues: data.febRevaValues,
        febWholesaleValues: data.febWholesaleValues,
        
        // Changes
        summaryChanges: data.summaryChanges,
        repChanges: data.repChanges
      });

      console.log("Successfully loaded data from Supabase");
      toast({
        title: "Data loaded successfully",
        description: "The latest performance data has been loaded with February comparison.",
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

  // Calculate summary based on toggle states
  const summary = calculateSummary(
    baseSummary, 
    revaValues, 
    wholesaleValues,
    includeRetail,
    includeReva, 
    includeWholesale
  );

  console.log("Current summary values:", summary);
  console.log("Current summary changes:", summaryChanges);

  return {
    // Toggle states
    includeRetail,
    setIncludeRetail,
    includeReva,
    setIncludeReva,
    includeWholesale,
    setIncludeWholesale,
    
    // Sort states
    sortBy,
    sortOrder,
    
    // Data
    summary,
    summaryChanges,
    repChanges,
    
    // Actions
    getActiveData,
    sortData,
    handleSort,
    loadDataFromSupabase,
    isLoading
  };
};
