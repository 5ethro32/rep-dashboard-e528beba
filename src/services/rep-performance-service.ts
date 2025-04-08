
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';
import { processRepData, calculateSummaryFromData } from '@/utils/rep-data-processing';

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data from Supabase...');
    
    // Fetch retail data - use rep_type consistently instead of rep_name
    const { data: repDataFromDb, error: repError } = await supabase
      .from('sales_data')
      .select('*')
      .eq('rep_type', 'RETAIL')
      .eq('reporting_period', 'March 2025');
    
    if (repError) throw new Error(`Error fetching rep data: ${repError.message}`);
    console.log('Retail data fetched:', repDataFromDb?.length || 0, 'rows');
    
    // Fetch REVA data
    const { data: revaDataFromDb, error: revaError } = await supabase
      .from('sales_data')
      .select('*')
      .eq('rep_type', 'REVA')
      .eq('reporting_period', 'March 2025');
    
    if (revaError) throw new Error(`Error fetching REVA data: ${revaError.message}`);
    console.log('REVA data fetched:', revaDataFromDb?.length || 0, 'rows');
    
    // Fetch wholesale data
    const { data: wholesaleDataFromDb, error: wholesaleError } = await supabase
      .from('sales_data')
      .select('*')
      .eq('rep_type', 'WHOLESALE')
      .eq('reporting_period', 'March 2025');
    
    if (wholesaleError) throw new Error(`Error fetching wholesale data: ${wholesaleError.message}`);
    console.log('Wholesale data fetched:', wholesaleDataFromDb?.length || 0, 'rows');
    
    // Debugging: Log sample data and rep_name/rep_type values to identify inconsistencies
    if (repDataFromDb && repDataFromDb.length > 0) {
      console.log('Sample retail data item:', repDataFromDb[0]);
      
      // Check for case inconsistencies in retail data
      const retailNameTypes = repDataFromDb.map(item => ({ 
        rep_name: item.rep_name, 
        rep_type: item.rep_type 
      }));
      console.log('Sample retail rep_name/rep_type pairs:', retailNameTypes.slice(0, 3));
    }
    
    if (revaDataFromDb && revaDataFromDb.length > 0) {
      console.log('Sample REVA data item:', revaDataFromDb[0]);
      
      // Log sub_rep values to help debug
      const subReps = revaDataFromDb.map(item => item.sub_rep).filter(Boolean);
      console.log('REVA sub_reps:', [...new Set(subReps)]);
      
      // Check for case inconsistencies in REVA data
      const revaNameTypes = revaDataFromDb.map(item => ({ 
        rep_name: item.rep_name, 
        rep_type: item.rep_type 
      }));
      console.log('Sample REVA rep_name/rep_type pairs:', revaNameTypes.slice(0, 3));
    }
    
    if (wholesaleDataFromDb && wholesaleDataFromDb.length > 0) {
      console.log('Sample wholesale data item:', wholesaleDataFromDb[0]);
      
      // Log sub_rep values to help debug
      const subReps = wholesaleDataFromDb.map(item => item.sub_rep).filter(Boolean);
      console.log('WHOLESALE sub_reps:', [...new Set(subReps)]);
      
      // Check for case inconsistencies in wholesale data
      const wholesaleNameTypes = wholesaleDataFromDb.map(item => ({ 
        rep_name: item.rep_name, 
        rep_type: item.rep_type 
      }));
      console.log('Sample wholesale rep_name/rep_type pairs:', wholesaleNameTypes.slice(0, 3));
    }
    
    // Process the retail data to RepData format
    const processedRepData = processRepData(repDataFromDb as SalesDataItem[] || []);
    
    // Calculate summary data
    const calculatedSummary = calculateSummaryFromData(processedRepData);
    
    // Process REVA and Wholesale data
    const processedRevaData = processRepData(revaDataFromDb as SalesDataItem[] || []);
    const processedWholesaleData = processRepData(wholesaleDataFromDb as SalesDataItem[] || []);
    
    // Calculate summaries for REVA and Wholesale
    const revaSummary = calculateSummaryFromData(processedRevaData);
    const wholesaleSummary = calculateSummaryFromData(processedWholesaleData);
    
    // Log processed data
    console.log('Processed retail data:', processedRepData.length, 'items');
    console.log('Retail summary:', calculatedSummary);
    
    return {
      repData: processedRepData,
      revaData: processedRevaData,
      wholesaleData: processedWholesaleData,
      baseSummary: calculatedSummary,
      revaValues: revaSummary,
      wholesaleValues: wholesaleSummary
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
