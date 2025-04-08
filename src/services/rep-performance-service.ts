
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
    
    // Use direct SQL queries for accurate department profit totals
    const { data: retailProfitData, error: retailProfitError } = await supabase
      .rpc('get_retail_profit');
    
    const { data: revaProfitData, error: revaProfitError } = await supabase
      .rpc('get_reva_profit');
      
    const { data: wholesaleProfitData, error: wholesaleProfitError } = await supabase
      .rpc('get_wholesale_profit');

    if (retailProfitError || revaProfitError || wholesaleProfitError) {
      console.error("Error fetching profit data:", { 
        retailProfitError, 
        revaProfitError, 
        wholesaleProfitError 
      });
    }
    
    console.log('Profit data from SQL functions:', {
      retailProfit: retailProfitData,
      revaProfit: revaProfitData,
      wholesaleProfit: wholesaleProfitData
    });
    
    // Instead of fetching all data at once, fetch by department to avoid pagination issues
    // RETAIL data
    const { data: retailData, error: retailError } = await fetchAllDepartmentData('RETAIL');
    if (retailError) throw new Error(`Error fetching RETAIL data: ${retailError.message}`);
    console.log('Fetched RETAIL records:', retailData?.length || 0);
    
    // REVA data
    const { data: revaData, error: revaError } = await fetchAllDepartmentData('REVA');
    if (revaError) throw new Error(`Error fetching REVA data: ${revaError.message}`);
    console.log('Fetched REVA records:', revaData?.length || 0);
    
    // Wholesale data
    const { data: wholesaleData, error: wholesaleError } = await fetchAllDepartmentData('Wholesale');
    if (wholesaleError) throw new Error(`Error fetching Wholesale data: ${wholesaleError.message}`);
    console.log('Fetched Wholesale records:', wholesaleData?.length || 0);
    
    // Count total records for verification
    const totalCount = (retailData?.length || 0) + (revaData?.length || 0) + (wholesaleData?.length || 0);
    console.log('Total fetched records:', totalCount);
    
    // Verify data completeness by comparing with direct SQL totals
    const retailProfit = calculateTotalProfit(retailData || []);
    const revaProfit = calculateTotalProfit(revaData || []);
    const wholesaleProfit = calculateTotalProfit(wholesaleData || []);
    
    console.log('Calculated profits from fetched data:', {
      retailProfit,
      revaProfit,
      wholesaleProfit,
      total: retailProfit + revaProfit + wholesaleProfit
    });
    
    // Compare with SQL direct calculations
    console.log('SQL direct profits:', {
      retailProfit: retailProfitData,
      revaProfit: revaProfitData,
      wholesaleProfit: wholesaleProfitData,
      total: (retailProfitData || 0) + (revaProfitData || 0) + (wholesaleProfitData || 0)
    });
    
    // Check for discrepancies
    const retailDiscrepancy = Math.abs((retailProfitData || 0) - retailProfit);
    const revaDiscrepancy = Math.abs((revaProfitData || 0) - revaProfit);
    const wholesaleDiscrepancy = Math.abs((wholesaleProfitData || 0) - wholesaleProfit);
    
    console.log('Profit discrepancies:', {
      retailDiscrepancy,
      revaDiscrepancy,
      wholesaleDiscrepancy
    });
    
    if (wholesaleDiscrepancy > 1000 || retailDiscrepancy > 1000 || revaDiscrepancy > 1000) {
      console.warn('SIGNIFICANT PROFIT DISCREPANCY DETECTED! Some data may be missing.');
      toast({
        title: "Data Discrepancy Warning",
        description: "There's a significant difference between SQL and JavaScript calculations. Some data may be missing.",
        variant: "destructive",
      });
    }
    
    // Process all data
    const allDataFromDb = [...(retailData || []), ...(revaData || []), ...(wholesaleData || [])];
    
    if (!allDataFromDb || allDataFromDb.length === 0) {
      throw new Error('No data found for the specified period.');
    }
    
    console.log('Total combined data rows:', allDataFromDb.length);
    
    // Map the data to our standard format, handling special cases for REVA and Wholesale
    const mappedData = allDataFromDb.map((item: any) => {
      // Parse numerical values properly, ensuring they're numbers and not strings
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      const cost = typeof item.Cost === 'string' ? parseFloat(item.Cost) : Number(item.Cost || 0);
      const credit = typeof item.Credit === 'string' ? parseFloat(item.Credit) : Number(item.Credit || 0);
      const margin = typeof item.Margin === 'string' ? parseFloat(item.Margin) : Number(item.Margin || 0);
      const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
      
      // Determine the rep name to use
      // For REVA and Wholesale, use the Sub-Rep field if available instead of the Rep field
      let repName = item.Rep || '';
      const subRep = item['Sub-Rep'] || '';
      const department = item.Department || 'RETAIL';
      
      // If this is a REVA or Wholesale item and we have a Sub-Rep, use that as the rep name
      if ((department === 'REVA' || department === 'Wholesale') && subRep) {
        repName = subRep;
      }
      
      return {
        id: item.id ? (typeof item.id === 'string' ? parseInt(item.id) : item.id) : 0,
        reporting_period: 'March 2025',
        rep_name: repName,
        sub_rep: subRep,
        account_ref: item['Account Ref'] || '',
        account_name: item['Account Name'] || '',
        spend: spend,
        cost: cost,
        credit: credit,
        profit: profit,
        margin: margin,
        packs: packs,
        rep_type: department,
        original_dept: department,
        import_date: new Date().toISOString()
      };
    });
    
    // Filter data by department for further processing
    const repDataFromDb = mappedData.filter(item => item.rep_type === 'RETAIL');
    const revaDataFromDb = mappedData.filter(item => item.rep_type === 'REVA');
    const wholesaleDataFromDb = mappedData.filter(item => item.rep_type === 'Wholesale');
    
    // Log department data counts
    console.log('Filtered department counts:', {
      retail: repDataFromDb.length,
      reva: revaDataFromDb.length,
      wholesale: wholesaleDataFromDb.length
    });
    
    // Process the data to RepData format
    const processedRepData = processRepData(repDataFromDb as SalesDataItem[] || []);
    const processedRevaData = processRepData(revaDataFromDb as SalesDataItem[] || []);
    const processedWholesaleData = processRepData(wholesaleDataFromDb as SalesDataItem[] || []);
    
    // Calculate summary data
    const calculatedSummary = calculateSummaryFromData(processedRepData);
    const revaSummary = calculateSummaryFromData(processedRevaData);
    const wholesaleSummary = calculateSummaryFromData(processedWholesaleData);
    
    // Adjust calculated summaries to match SQL totals for accuracy
    if (retailProfitData) calculatedSummary.totalProfit = Number(retailProfitData);
    if (revaProfitData) revaSummary.totalProfit = Number(revaProfitData);
    if (wholesaleProfitData) wholesaleSummary.totalProfit = Number(wholesaleProfitData);
    
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

// Helper function to calculate total profit from a dataset
const calculateTotalProfit = (data: any[]): number => {
  return data.reduce((sum, item) => {
    const profit = typeof item.Profit === 'string' 
      ? parseFloat(item.Profit) 
      : Number(item.Profit || 0);
    return sum + profit;
  }, 0);
};

// Helper function to fetch all records for a specific department
const fetchAllDepartmentData = async (department: string) => {
  // This function fetches data in chunks to avoid pagination limits
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMoreData = true;
  
  while (hasMoreData) {
    const { data, error, count } = await supabase
      .from('sales_data_march')
      .select('*', { count: 'exact' })
      .eq('Department', department)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) {
      return { data: null, error };
    }
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      page++;
      
      // Check if we've fetched all available data
      hasMoreData = data.length === PAGE_SIZE;
    } else {
      hasMoreData = false;
    }
  }
  
  return { data: allData, error: null };
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
