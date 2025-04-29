
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
  const [isLoading, setIsLoading] = useState(false);
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
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [marchSummaryChanges, setMarchSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  const [marchRepChanges, setMarchRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  // Modified to ensure complete data load at app startup
  useEffect(() => {
    const initialLoad = async () => {
      await loadData();
      setDataLoaded(true);
    };
    
    initialLoad();
  }, []);
  
  // Modified to handle month changes properly
  // Removed the useEffect dependency on selectedMonth to prevent automatic triggering
  // We'll manage month changes explicitly with the enhanced setSelectedMonth function
  
  // Enhanced loadData function that returns a promise to allow proper sequencing
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRepPerformanceData(selectedMonth);
      
      console.log(`Loaded fresh performance data for ${selectedMonth}:`, data);
      
      // Store the raw summaries separately to ensure we have the correct data for each month
      setAprRepData(data.repData);
      setAprRevaRepData(data.revaData);
      setAprWholesaleRepData(data.wholesaleData);
      setAprBaseSummary(data.baseSummary);
      setAprRevaValues(data.revaValues);
      setAprWholesaleValues(data.wholesaleValues);
      
      setMarchRepData(data.marchRepData);
      setMarchRevaRepData(data.marchRevaData);
      setMarchWholesaleRepData(data.marchWholesaleData);
      setMarchBaseSummary(data.marchBaseSummary);
      setMarchRevaValues(data.marchRevaValues);
      setMarchWholesaleValues(data.marchWholesaleValues);
      
      setFebRepData(data.febRepData || defaultRepData);
      setFebRevaRepData(data.febRevaData || defaultRevaData);
      setFebWholesaleRepData(data.febWholesaleData || defaultWholesaleData);
      
      // Make sure the February summary data is correctly loaded
      console.log("February base summary data:", data.febBaseSummary);
      setFebBaseSummary(data.febBaseSummary);
      setFebRevaValues(data.febRevaValues);
      setFebWholesaleValues(data.febWholesaleValues);
      
      // CRITICAL FIX: Ensure rawFebSummary is properly set and verified
      if (data.rawFebSummary) {
        setRawFebSummary(data.rawFebSummary);
        console.log("RAW February Summary (for direct comparison) from API:", data.rawFebSummary);
      } else {
        // If not provided by the service, calculate it directly from the February data
        // This ensures we always have a valid raw February summary calculated the same way
        console.warn("Raw February summary missing in API response, calculating directly from February data");
        
        // Combine all February data for calculation
        const allFebData = [
          ...(data.febRepData || []),
          ...(data.febRevaData || []),
          ...(data.febWholesaleData || [])
        ];
        
        // Calculate raw summary with February-specific processing
        const calculatedRawFebSummary = calculateRawMtdSummary(allFebData, 'February');
        setRawFebSummary(calculatedRawFebSummary);
        console.log("Calculated RAW February Summary:", calculatedRawFebSummary);
      }
      
      setSummaryChanges(data.summaryChanges);
      setMarchSummaryChanges(data.marchSummaryChanges);
      setRepChanges(data.repChanges);
      setMarchRepChanges(data.marchRepChanges);
      
      // Update displayed data after loading fresh data
      updateDisplayedDataForMonth();
      
      return true; // Indicate successful data load
    } catch (error) {
      console.error(`Error loading data for ${selectedMonth}:`, error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false; // Indicate failed data load
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enhanced setSelectedMonth that coordinates the data loading process
  const setSelectedMonthAndLoad = useCallback(async (month: string) => {
    if (month === selectedMonth) return; // No change needed
    
    // Set loading and month change flags
    setIsLoading(true);
    setMonthChangeInProgress(true);
    
    // Update the month first
    setSelectedMonth(month);
    
    console.log(`Month selection changed to: ${month} - Loading fresh data`);
    
    // Load data for new month
    await loadData();
    
    // After data is fully loaded, update display
    updateDisplayedDataForMonth();
    
    // Reset flags
    setMonthChangeInProgress(false);
    setIsLoading(false);
    
    console.log(`Month change to ${month} completed successfully`);
  }, [selectedMonth]);
  
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
  
  // CRITICAL FIX: Always use raw February data directly instead of calculating it
  // This ensures the February comparison data is the same as when viewing February directly
  const febDirectSummary = rawFebSummary;
  
  console.log("February direct summary for March comparison (using raw data directly):", febDirectSummary);
  
  const currentChanges = selectedMonth === 'April' ? summaryChanges : 
                      selectedMonth === 'March' ? marchSummaryChanges : 
                      defaultSummaryChanges;
  
  const currentRepChanges = selectedMonth === 'April' ? repChanges : 
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
    // CRITICAL FIX: Add raw February summary to the return value
    rawFebSummary
  };
};
