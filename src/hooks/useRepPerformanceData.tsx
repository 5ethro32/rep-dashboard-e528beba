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
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [marchSummaryChanges, setMarchSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);
  const [marchRepChanges, setMarchRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    updateDisplayedDataForMonth();
  }, [selectedMonth]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRepPerformanceData(selectedMonth);
      
      console.log("Loaded performance data:", data);
      
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
      setFebBaseSummary(data.febBaseSummary);
      setFebRevaValues(data.febRevaValues);
      setFebWholesaleValues(data.febWholesaleValues);
      
      setSummaryChanges(data.summaryChanges);
      setMarchSummaryChanges(data.marchSummaryChanges);
      setRepChanges(data.repChanges);
      setMarchRepChanges(data.marchRepChanges);
      
      const combinedData = getCombinedRepData(
        data.repData,
        data.revaData,
        data.wholesaleData,
        true,
        true,
        true
      );
      
      setOverallData(combinedData);
      
      // Call updateDisplayedDataForMonth after loading all data
      // This ensures metric cards reflect the currently selected month
      updateDisplayedDataForMonth();
      
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
  
  const currentSummary = calculateDirectSummary(
    selectedMonth === 'April' ? aprBaseSummary : 
      selectedMonth === 'March' ? marchBaseSummary : febBaseSummary,
    selectedMonth === 'April' ? aprRevaValues : 
      selectedMonth === 'March' ? marchRevaValues : febRevaValues,
    selectedMonth === 'April' ? aprWholesaleValues : 
      selectedMonth === 'March' ? marchWholesaleValues : febWholesaleValues,
    isRawDataMonth
  );
  
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
    setSelectedMonth,
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
    febWholesaleRepData
  };
};
