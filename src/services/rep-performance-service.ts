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
    
    // Use string literal for table name to bypass TypeScript restrictions
    const { data: allDataFromDb, error: dataError } = await supabase
      .from('sales_data_march')
      .select('*');
    
    if (dataError) throw new Error(`Error fetching data: ${dataError.message}`);
    console.log('Data fetched:', allDataFromDb?.length || 0, 'rows');
    
    if (!allDataFromDb || allDataFromDb.length === 0) {
      throw new Error('No data found for the specified period.');
    }
    
    // Map the sales_data_march table fields to our standard format
    const mappedData = allDataFromDb.map((item: any) => ({
      id: item.id ? (typeof item.id === 'string' ? parseInt(item.id) : item.id) : 0,
      reporting_period: 'March 2025', // Hardcode the reporting period since it's all March data
      rep_name: item.Rep || '',
      sub_rep: item['Sub-Rep'] || '',
      account_ref: item['Account Ref'] || '',
      account_name: item['Account Name'] || '',
      spend: Number(item.Spend) || 0,
      cost: Number(item.Cost) || 0,
      credit: Number(item.Credit) || 0,
      profit: Number(item.Profit) || 0,
      margin: Number(item.Margin) || 0,
      packs: Number(item.Packs) || 0,
      rep_type: item.Department || 'RETAIL',
      import_date: new Date().toISOString()
    }));
    
    // Debug: Log the structure of the first item
    if (mappedData.length > 0) {
      console.log('First item structure:', mappedData[0]);
    }
    
    // Separate data by rep_type
    const repDataFromDb = mappedData.filter(item => item.rep_type.toUpperCase() === 'RETAIL');
    const revaDataFromDb = mappedData.filter(item => item.rep_type.toUpperCase() === 'REVA');
    const wholesaleDataFromDb = mappedData.filter(item => item.rep_type.toUpperCase() === 'WHOLESALE');
    
    console.log('Retail data count:', repDataFromDb.length);
    console.log('REVA data count:', revaDataFromDb.length);
    console.log('Wholesale data count:', wholesaleDataFromDb.length);
    
    // Debugging: Log sample data and rep_name/rep_type values to identify inconsistencies
    if (repDataFromDb.length > 0) {
      console.log('Sample retail data item:', repDataFromDb[0]);
      
      // Check for case inconsistencies in retail data
      const retailNameTypes = repDataFromDb.map(item => ({ 
        rep_name: item.rep_name, 
        rep_type: item.rep_type 
      }));
      console.log('Sample retail rep_name/rep_type pairs:', retailNameTypes.slice(0, 3));
    }
    
    if (revaDataFromDb.length > 0) {
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
    
    if (wholesaleDataFromDb.length > 0) {
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
