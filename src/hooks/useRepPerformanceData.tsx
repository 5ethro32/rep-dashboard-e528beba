import { useState, useEffect, useCallback } from 'react';
import { calculateSummary } from '@/utils/rep-performance-utils';
import { toast } from '@/components/ui/use-toast';
import { getCombinedRepData, sortRepData, calculateRawMtdSummary } from '@/utils/rep-data-processing';
import { fetchRepPerformanceData } from '@/services/rep-performance-service';
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

const calculateDirectSummary = (
  baseSummary: SummaryData, 
  revaValues: SummaryData, 
  wholesaleValues: SummaryData,
  isRawData: boolean
) => {
  if (isRawData) {
    console.log("Using raw summary data directly:", baseSummary);
    return baseSummary;
  }
  
  return calculateSummary(
    baseSummary,
    revaValues,
    wholesaleValues,
    true,
    true,
    true
  );
};

export const useRepPerformanceData = () => {
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [monthChangeInProgress, setMonthChangeInProgress] = useState(false);
  
  const [overallData, setOverallData] = useState(defaultOverallData);
  const [repData, setRepData] = useState(defaultRepData);
  const [revaData, setRevaData] = useState(defaultRevaData);
  const [wholesaleData, setWholesaleData] = useState(defaultWholesaleData);
  
  const [aprBaseSummary, setAprBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [aprRevaValues, setAprRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [aprWholesaleValues, setAprWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [aprRepData, setAprRepData] = useState<RepData[]>(defaultRepData);
  const [aprRevaRepData, setAprRevaRepData] = useState<RepData[]>(defaultRevaData);
  const [aprWholesaleRepData, setAprWholesaleRepData] = useState<RepData[]>(defaultWholesaleData);
  
  const [marchBaseSummary, setMarchBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [marchRevaValues, setMarchRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [marchWholesaleValues, setMarchWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [marchRepData, setMarchRepData] = useState<RepData[]>(defaultRepData);
  const [marchRevaRepData, setMarchRevaRepData] = useState<RepData[]>(defaultRevaData);
  const [marchWholesaleRepData, setMarchWholesaleRepData] = useState<RepData[]>(defaultWholesaleData);
  
  const [febBaseSummary, setFebBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [febRevaValues, setFebRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [febWholesaleValues, setFebWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [febRepData, setFebRepData] = useState<RepData[]>(defaultRepData);
  const [febRevaRepData, setFebRevaRepData] = useState<RepData[]>(defaultRevaData);
  const [febWholesaleRepData, setFebWholesaleRepData] = useState<RepData[]>(defaultWholesaleData);
  
  // CRITICAL FIX: Ensure we have a dedicated state for raw February summary that's always properly calculated
  const [rawFebSummary, setRawFebSummary] = useState<SummaryData>(defaultBaseSummary);
  
  // State for summary changes - separate for each month to avoid race conditions
  const [aprSummaryChanges, setAprSummaryChanges] = useState(defaultSummaryChanges);
  const [marchSummaryChanges, setMarchSummaryChanges] = useState(defaultSummaryChanges);
  
  // State for rep changes - separate for each month to avoid race conditions
  const [aprRepChanges, setAprRepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  const [marchRepChanges, setMarchRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  // Enhanced initial load to always fetch fresh data
  useEffect(() => {
    console.log('RepPerformanceData: Initial component mount, loading fresh data');
    loadData();
  }, []); // Empty dependency array ensures this runs only once on mount
  
  // Enhanced loadData function - now the central source for data fetching
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Always pass the current selectedMonth to ensure we get the right data
      console.log(`Loading fresh data for ${selectedMonth} from database...`);
      const data = await fetchRepPerformanceData(selectedMonth);
      
      console.log(`Successfully loaded fresh data for ${selectedMonth}:`, data);

      // Store data based on which month we loaded
      if (selectedMonth === 'April') {
        setAprRepData(data.repData || defaultRepData);
        setAprRevaRepData(data.revaData || defaultRevaData);
        setAprWholesaleRepData(data.wholesaleData || defaultWholesaleData);
        setAprBaseSummary(data.baseSummary || defaultBaseSummary);
        setAprRevaValues(data.revaValues || defaultRevaValues);
        setAprWholesaleValues(data.wholesaleValues || defaultWholesaleValues);
        setAprSummaryChanges(data.summaryChanges || defaultSummaryChanges);
        setAprRepChanges(data.repChanges || defaultRepChanges);
        
        // Set the active data for the current view
        setRepData(data.repData || defaultRepData);
        setRevaData(data.revaData || defaultRevaData);
        setWholesaleData(data.wholesaleData || defaultWholesaleData);
        
        const combinedData = getCombinedRepData(
          data.repData || defaultRepData,
          data.revaData || defaultRevaData,
          data.wholesaleData || defaultWholesaleData,
          true, true, true
        );
        
        setOverallData(combinedData);
      } 
      else if (selectedMonth === 'March') {
        setMarchRepData(data.repData || defaultRepData);
        setMarchRevaRepData(data.revaData || defaultRevaData);
        setMarchWholesaleRepData(data.wholesaleData || defaultWholesaleData);
        setMarchBaseSummary(data.baseSummary || defaultBaseSummary);
        setMarchRevaValues(data.revaValues || defaultRevaValues);
        setMarchWholesaleValues(data.wholesaleValues || defaultWholesaleValues);
        setMarchSummaryChanges(data.summaryChanges || defaultSummaryChanges);
        setMarchRepChanges(data.repChanges || defaultRepChanges);
        
        // Set the active data for the current view
        setRepData(data.repData || defaultRepData);
        setRevaData(data.revaData || defaultRevaData);
        setWholesaleData(data.wholesaleData || defaultWholesaleData);
        
        const combinedData = getCombinedRepData(
          data.repData || defaultRepData,
          data.revaData || defaultRevaData,
          data.wholesaleData || defaultWholesaleData,
          true, true, true
        );
        
        setOverallData(combinedData);
      } 
      else if (selectedMonth === 'February') {
        setFebRepData(data.repData || defaultRepData);
        setFebRevaRepData(data.revaData || defaultRevaData);
        setFebWholesaleRepData(data.wholesaleData || defaultWholesaleData);
        setFebBaseSummary(data.baseSummary || defaultBaseSummary);
        setFebRevaValues(data.revaValues || defaultRevaValues);
        setFebWholesaleValues(data.wholesaleValues || defaultWholesaleValues);
        
        if (data.rawFebSummary) {
          setRawFebSummary(data.rawFebSummary);
        }
        
        // Set the active data for the current view
        setRepData(data.repData || defaultRepData);
        setRevaData(data.revaData || defaultRevaData);
        setWholesaleData(data.wholesaleData || defaultWholesaleData);
        
        const combinedData = getCombinedRepData(
          data.repData || defaultRepData,
          data.revaData || defaultRevaData,
          data.wholesaleData || defaultWholesaleData,
          true, true, true
        );
        
        setOverallData(combinedData);
      }
      
      setDataLoaded(true);
      console.log(`Data loading for ${selectedMonth} completed successfully`);
      return true;
    } catch (error) {
      console.error(`Error loading data for ${selectedMonth}:`, error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
      setMonthChangeInProgress(false);
    }
  };
  
  // Simplified month change handler - now triggers full data refresh
  const setSelectedMonthAndLoad = useCallback((month: string) => {
    if (month === selectedMonth) return; // No change needed
    
    console.log(`Month selection changing from ${selectedMonth} to ${month}`);
    
    // Set loading flags immediately
    setIsLoading(true);
    setMonthChangeInProgress(true);
    
    // Update the month first
    setSelectedMonth(month);
    
    // Trigger a complete data refresh with the new month
    // This runs asynchronously and will update the UI when complete
    loadData();
  }, [selectedMonth]);

  // This function is only used for internal state updates, not for fetching
  const updateDisplayedDataForMonth = () => {
    console.log(`Updating displayed data for month: ${selectedMonth}`);
    
    if (selectedMonth === 'April') {
      setRepData(aprRepData);
      setRevaData(aprRevaRepData);
      setWholesaleData(aprWholesaleRepData);
      
      const combinedData = getCombinedRepData(
        aprRepData,
        aprRevaRepData,
        aprWholesaleRepData,
        true,
        true,
        true
      );
      
      setOverallData(combinedData);
      
    } else if (selectedMonth === 'March') {
      setRepData(marchRepData);
      setRevaData(marchRevaRepData);
      setWholesaleData(marchWholesaleRepData);
      
      const combinedData = getCombinedRepData(
        marchRepData,
        marchRevaRepData,
        marchWholesaleRepData,
        true,
        true,
        true
      );
      
      setOverallData(combinedData);
      
    } else if (selectedMonth === 'February') {
      setRepData(febRepData);
      setRevaData(febRevaRepData);
      setWholesaleData(febWholesaleRepData);
      
      const combinedData = getCombinedRepData(
        febRepData,
        febRevaRepData,
        febWholesaleRepData,
        true,
        true,
        true
      );
      
      setOverallData(combinedData);
    }
  };
  
  const getActiveData = (tab: string) => {
    if (tab === 'overall') {
      return overallData;
    } else if (tab === 'rep') {
      return repData;
    } else if (tab === 'reva') {
      return revaData;
    } else if (tab === 'wholesale') {
      return wholesaleData;
    }
    return overallData;
  };

  const sortData = (data: RepData[]) => {
    return sortRepData(data, sortBy, sortOrder);
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };
  
  const getFebValue = (repName: string, metricType: string, metricValue: number, changeValue: number): string => {
    if (!repName || !metricType || metricValue === undefined || changeValue === undefined) {
      return "0";
    }
    
    const rep = febRepData.find(rep => rep.rep === repName);
    if (rep && rep[metricType as keyof RepData] !== undefined) {
      const value = rep[metricType as keyof RepData] as number;
      return value.toString();
    }
    
    if (changeValue !== 0) {
      const previousValue = metricValue / (1 + (changeValue / 100));
      return previousValue.toFixed(2);
    }
    
    return (metricValue - changeValue).toString();
  };
  
  const isRawDataMonth = selectedMonth === 'April' || selectedMonth === 'March';
  
  // Ensure we properly calculate the direct summaries for each month
  const currentSummary = calculateDirectSummary(
    selectedMonth === 'April' ? aprBaseSummary : 
      selectedMonth === 'March' ? marchBaseSummary : febBaseSummary,
    selectedMonth === 'April' ? aprRevaValues : 
      selectedMonth === 'March' ? marchRevaValues : febRevaValues,
    selectedMonth === 'April' ? aprWholesaleValues : 
      selectedMonth === 'March' ? marchWholesaleValues : febWholesaleValues,
    isRawDataMonth
  );
  
  // CRITICAL FIX: Always use raw February data directly for March comparison
  const febDirectSummary = rawFebSummary;
  
  // Get the correct summary changes based on selected month
  const currentChanges = selectedMonth === 'April' ? aprSummaryChanges : 
                      selectedMonth === 'March' ? marchSummaryChanges : 
                      defaultSummaryChanges;
  
  // Get the correct rep changes based on selected month
  const currentRepChanges = selectedMonth === 'April' ? aprRepChanges : 
                         selectedMonth === 'March' ? marchRepChanges : 
                         defaultRepChanges;
  
  return {
    sortBy,
    sortOrder,
    summary: currentSummary,
    summaryChanges: currentChanges,
    repChanges: currentRepChanges,
    getActiveData,
    sortData,
    handleSort,
    isLoading,
    loadDataFromSupabase: loadData,
    getFebValue,
    selectedMonth,
    setSelectedMonth: setSelectedMonthAndLoad,
    dataLoaded,
    monthChangeInProgress,
    baseSummary: selectedMonth === 'April' ? aprBaseSummary : 
                selectedMonth === 'March' ? marchBaseSummary : febBaseSummary,
    revaValues: selectedMonth === 'April' ? aprRevaValues : 
               selectedMonth === 'March' ? marchRevaValues : febRevaValues,
    wholesaleValues: selectedMonth === 'April' ? aprWholesaleValues : 
                    selectedMonth === 'March' ? marchWholesaleValues : febWholesaleValues,
    aprRepData,
    marchRepData,
    febRepData,
    aprRevaRepData,
    marchRevaRepData,
    febRevaRepData,
    aprWholesaleRepData,
    marchWholesaleRepData,
    febWholesaleRepData,
    marchBaseSummary,
    febBaseSummary,
    febDirectSummary,
    rawFebSummary
  };
};
