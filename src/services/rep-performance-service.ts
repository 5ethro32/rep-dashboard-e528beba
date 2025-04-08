
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem } from '@/types/rep-performance.types';
import { processRepData, calculateSummaryFromData } from '@/utils/rep-data-processing';

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    const { data: repDataFromDb, error: repError } = await supabase
      .from('sales_data')
      .select('*')
      .eq('rep_type', 'RETAIL')
      .eq('reporting_period', '2025-03');
    
    if (repError) throw new Error(`Error fetching rep data: ${repError.message}`);
    
    const { data: revaDataFromDb, error: revaError } = await supabase
      .from('sales_data')
      .select('*')
      .eq('rep_type', 'REVA')
      .eq('reporting_period', '2025-03');
    
    if (revaError) throw new Error(`Error fetching REVA data: ${revaError.message}`);
    
    const { data: wholesaleDataFromDb, error: wholesaleError } = await supabase
      .from('sales_data')
      .select('*')
      .eq('rep_type', 'WHOLESALE')
      .eq('reporting_period', '2025-03');
    
    if (wholesaleError) throw new Error(`Error fetching wholesale data: ${wholesaleError.message}`);
    
    const processedRepData = processRepData(repDataFromDb as SalesDataItem[] || []);
    const processedRevaData = processRepData(revaDataFromDb as SalesDataItem[] || []);
    const processedWholesaleData = processRepData(wholesaleDataFromDb as SalesDataItem[] || []);
    
    const calculatedSummary = calculateSummaryFromData(processedRepData);
    const calculatedRevaValues = calculateSummaryFromData(processedRevaData);
    const calculatedWholesaleValues = calculateSummaryFromData(processedWholesaleData);
    
    return {
      repData: processedRepData,
      revaData: processedRevaData,
      wholesaleData: processedWholesaleData,
      baseSummary: calculatedSummary,
      revaValues: calculatedRevaValues,
      wholesaleValues: calculatedWholesaleValues
    };
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    toast({
      title: "Error loading data",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    throw error;
  }
};

export const saveRepPerformanceData = (data: any) => {
  try {
    localStorage.setItem('repPerformanceData', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    return false;
  }
};

export const loadStoredRepPerformanceData = () => {
  try {
    const storedData = localStorage.getItem('repPerformanceData');
    if (storedData) {
      return JSON.parse(storedData);
    }
    return null;
  } catch (error) {
    console.error('Error parsing stored data:', error);
    return null;
  }
};
