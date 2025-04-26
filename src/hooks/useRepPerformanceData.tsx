
import { useState, useEffect } from 'react';
import { calculateSummary, calculateDeptSummary } from '@/utils/rep-performance-utils';
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
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';

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
  
  // March data states
  const [marchBaseSummary, setMarchBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [marchRevaValues, setMarchRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [marchWholesaleValues, setMarchWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  // February data states
  const [febBaseSummary, setFebBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [febRevaValues, setFebRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [febWholesaleValues, setFebWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  // February data states
  const [febRepData, setFebRepData] = useState<RepData[]>(defaultRepData);
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [marchSummaryChanges, setMarchSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  const [marchRepChanges, setMarchRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRepPerformanceData();
      
      // Set April data
      setRepData(data.repData);
      setRevaData(data.revaData);
      setWholesaleData(data.wholesaleData);
      setAprBaseSummary(data.baseSummary);
      setAprRevaValues(data.revaValues);
      setAprWholesaleValues(data.wholesaleValues);
      
      // Set March data
      setMarchBaseSummary(data.marchBaseSummary);
      setMarchRevaValues(data.marchRevaValues);
      setMarchWholesaleValues(data.marchWholesaleValues);
      
      // Set February data
      setFebBaseSummary(data.febBaseSummary);
      setFebRevaValues(data.febRevaValues);
      setFebWholesaleValues(data.febWholesaleValues);
      
      // Set February rep data
      setFebRepData(data.febRepData || defaultRepData);
      
      // Set changes data
      setSummaryChanges(data.summaryChanges);
      setMarchSummaryChanges(data.marchSummaryChanges);
      setRepChanges(data.repChanges);
      setMarchRepChanges(data.marchRepChanges);
      
      // Update overall data based on selected month
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
    return (metricValue - changeValue).toString();
  };
  
  // Determine if we should use raw direct calculation for the selected month
  const isRawDataMonth = selectedMonth === 'April' || selectedMonth === 'March';
  
  return {
    sortBy,
    sortOrder,
    summary: calculateDirectSummary(
      selectedMonth === 'April' ? aprBaseSummary : 
        selectedMonth === 'March' ? marchBaseSummary : febBaseSummary,
      selectedMonth === 'April' ? aprRevaValues : 
        selectedMonth === 'March' ? marchRevaValues : febRevaValues,
      selectedMonth === 'April' ? aprWholesaleValues : 
        selectedMonth === 'March' ? marchWholesaleValues : febWholesaleValues,
      isRawDataMonth
    ),
    summaryChanges: selectedMonth === 'April' ? summaryChanges : 
                   selectedMonth === 'March' ? marchSummaryChanges : 
                   defaultSummaryChanges,
    repChanges: selectedMonth === 'April' ? repChanges : 
                selectedMonth === 'March' ? marchRepChanges : 
                defaultRepChanges,
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
