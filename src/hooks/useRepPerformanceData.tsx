
import { useState, useEffect } from 'react';
import { calculateSummary } from '@/utils/rep-performance-utils';
import { toast } from '@/components/ui/use-toast';
import { getCombinedRepData, sortRepData } from '@/utils/rep-data-processing';
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

// Create a custom summary calculation function that uses the raw summary directly
const calculateDirectSummary = (
  baseSummary: SummaryData, 
  revaValues: SummaryData, 
  wholesaleValues: SummaryData,
  isRawData: boolean
) => {
  // For raw data months (April, March), when we're using raw all-inclusive data, 
  // we should return just the baseSummary
  if (isRawData) {
    console.log("Using raw summary data directly:", baseSummary);
    return baseSummary;
  }
  
  // For other months use the normal calculation but include all departments
  return calculateSummary(
    baseSummary,
    revaValues,
    wholesaleValues,
    true, // Always include retail
    true, // Always include REVA
    true  // Always include wholesale
  );
};

export const useRepPerformanceData = () => {
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('April');
  
  const [overallData, setOverallData] = useState(defaultOverallData);
  const [repData, setRepData] = useState(defaultRepData);
  const [revaData, setRevaData] = useState(defaultRevaData);
  const [wholesaleData, setWholesaleData] = useState(defaultWholesaleData);
  
  // April data states
  const [aprBaseSummary, setAprBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [aprRevaValues, setAprRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [aprWholesaleValues, setAprWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [aprRepData, setAprRepData] = useState<RepData[]>(defaultRepData);
  const [aprRevaRepData, setAprRevaRepData] = useState<RepData[]>(defaultRevaData);
  const [aprWholesaleRepData, setAprWholesaleRepData] = useState<RepData[]>(defaultWholesaleData);
  
  // March data states
  const [marchBaseSummary, setMarchBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [marchRevaValues, setMarchRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [marchWholesaleValues, setMarchWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [marchRepData, setMarchRepData] = useState<RepData[]>(defaultRepData);
  const [marchRevaRepData, setMarchRevaRepData] = useState<RepData[]>(defaultRevaData);
  const [marchWholesaleRepData, setMarchWholesaleRepData] = useState<RepData[]>(defaultWholesaleData);
  
  // February data states
  const [febBaseSummary, setFebBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [febRevaValues, setFebRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [febWholesaleValues, setFebWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [febRepData, setFebRepData] = useState<RepData[]>(defaultRepData);
  const [febRevaRepData, setFebRevaRepData] = useState<RepData[]>(defaultRevaData);
  const [febWholesaleRepData, setFebWholesaleRepData] = useState<RepData[]>(defaultWholesaleData);
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [marchSummaryChanges, setMarchSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  const [marchRepChanges, setMarchRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  useEffect(() => {
    loadData();
  }, []);
  
  // This effect updates the displayed data when the month changes
  useEffect(() => {
    updateDisplayedDataForMonth();
  }, [selectedMonth]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRepPerformanceData();
      
      console.log("Loaded performance data:", data);
      
      // Set April data
      setAprRepData(data.repData);
      setAprRevaRepData(data.revaData);
      setAprWholesaleRepData(data.wholesaleData);
      setAprBaseSummary(data.baseSummary);
      setAprRevaValues(data.revaValues);
      setAprWholesaleValues(data.wholesaleValues);
      
      // Set March data
      setMarchRepData(data.marchRepData);
      setMarchRevaRepData(data.marchRevaData);
      setMarchWholesaleRepData(data.marchWholesaleData);
      setMarchBaseSummary(data.marchBaseSummary);
      setMarchRevaValues(data.marchRevaValues);
      setMarchWholesaleValues(data.marchWholesaleValues);
      
      // Set February data
      setFebRepData(data.febRepData || defaultRepData);
      setFebRevaRepData(data.febRevaData || defaultRevaData);
      setFebWholesaleRepData(data.febWholesaleData || defaultWholesaleData);
      setFebBaseSummary(data.febBaseSummary);
      setFebRevaValues(data.febRevaValues);
      setFebWholesaleValues(data.febWholesaleValues);
      
      // Set changes data
      setSummaryChanges(data.summaryChanges);
      setMarchSummaryChanges(data.marchSummaryChanges);
      setRepChanges(data.repChanges);
      setMarchRepChanges(data.marchRepChanges);
      
      // Initial data based on April (default)
      setRepData(data.repData);
      setRevaData(data.revaData);
      setWholesaleData(data.wholesaleData);
      
      // Update overall data
      const combinedData = getCombinedRepData(
        data.repData,
        data.revaData,
        data.wholesaleData,
        true, // Always include retail
        true, // Always include REVA
        true  // Always include wholesale
      );
      
      setOverallData(combinedData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update displayed data based on selected month
  const updateDisplayedDataForMonth = () => {
    console.log(`Updating displayed data for month: ${selectedMonth}`);
    
    if (selectedMonth === 'April') {
      setRepData(aprRepData);
      setRevaData(aprRevaRepData);
      setWholesaleData(aprWholesaleRepData);
      
      // Update overall data for April
      const combinedData = getCombinedRepData(
        aprRepData,
        aprRevaRepData,
        aprWholesaleRepData,
        true, // Always include retail
        true, // Always include REVA
        true  // Always include wholesale
      );
      
      setOverallData(combinedData);
      
    } else if (selectedMonth === 'March') {
      setRepData(marchRepData);
      setRevaData(marchRevaRepData);
      setWholesaleData(marchWholesaleRepData);
      
      // Update overall data for March
      const combinedData = getCombinedRepData(
        marchRepData,
        marchRevaRepData,
        marchWholesaleRepData,
        true, // Always include retail
        true, // Always include REVA
        true  // Always include wholesale
      );
      
      setOverallData(combinedData);
      
    } else if (selectedMonth === 'February') {
      setRepData(febRepData);
      setRevaData(febRevaRepData);
      setWholesaleData(febWholesaleRepData);
      
      // Update overall data for February
      const combinedData = getCombinedRepData(
        febRepData,
        febRevaRepData,
        febWholesaleRepData,
        true, // Always include retail
        true, // Always include REVA
        true  // Always include wholesale
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
    
    // Fix: Calculate previous value more accurately based on current value and change percentage
    if (changeValue !== 0) {
      // If we have a change value, calculate the previous value
      const previousValue = metricValue / (1 + (changeValue / 100));
      return previousValue.toFixed(2);
    }
    
    return (metricValue - changeValue).toString();
  };
  
  // Determine if we should use raw direct calculation for the selected month
  const isRawDataMonth = selectedMonth === 'April' || selectedMonth === 'March';
  
  // Calculate current summary based on selected month
  const currentSummary = calculateDirectSummary(
    selectedMonth === 'April' ? aprBaseSummary : 
      selectedMonth === 'March' ? marchBaseSummary : febBaseSummary,
    selectedMonth === 'April' ? aprRevaValues : 
      selectedMonth === 'March' ? marchRevaValues : febRevaValues,
    selectedMonth === 'April' ? aprWholesaleValues : 
      selectedMonth === 'March' ? marchWholesaleValues : febWholesaleValues,
    isRawDataMonth
  );
  
  // Get the appropriate changes object based on selected month
  const currentChanges = selectedMonth === 'April' ? summaryChanges : 
                      selectedMonth === 'March' ? marchSummaryChanges : 
                      defaultSummaryChanges;
  
  // Current month's rep changes
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
    setSelectedMonth,
    baseSummary: selectedMonth === 'April' ? aprBaseSummary : 
                selectedMonth === 'March' ? marchBaseSummary : febBaseSummary,
    revaValues: selectedMonth === 'April' ? aprRevaValues : 
               selectedMonth === 'March' ? marchRevaValues : febRevaValues,
    wholesaleValues: selectedMonth === 'April' ? aprWholesaleValues : 
                    selectedMonth === 'March' ? marchWholesaleValues : febWholesaleValues,
  };
};
