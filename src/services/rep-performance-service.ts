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
    
    // Use a type assertion to access the sales_data_march table
    const { data: allDataFromDb, error: dataError } = await supabase
      .from('sales_data_march')
      .select('*');
    
    if (dataError) throw new Error(`Error fetching data: ${dataError.message}`);
    console.log('Data fetched:', allDataFromDb?.length || 0, 'rows');
    
    if (!allDataFromDb || allDataFromDb.length === 0) {
      throw new Error('No data found for the specified period.');
    }
    
    // Debug: Log the raw data structure from Supabase
    if (allDataFromDb.length > 0) {
      console.log('First raw data item:', allDataFromDb[0]);
      
      // Calculate the total raw profit to verify data
      const rawTotalProfit = allDataFromDb.reduce((sum, item) => {
        const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
        return sum + profit;
      }, 0);
      
      console.log('Raw total profit from database:', rawTotalProfit);
    }
    
    // Map the sales_data_march table fields to our standard format
    const mappedData = allDataFromDb.map((item: any) => {
      // Parse numerical values properly, ensuring they're numbers and not strings
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      const cost = typeof item.Cost === 'string' ? parseFloat(item.Cost) : Number(item.Cost || 0);
      const credit = typeof item.Credit === 'string' ? parseFloat(item.Credit) : Number(item.Credit || 0);
      const margin = typeof item.Margin === 'string' ? parseFloat(item.Margin) : Number(item.Margin || 0);
      const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
      
      return {
        id: item.id ? (typeof item.id === 'string' ? parseInt(item.id) : item.id) : 0,
        reporting_period: 'March 2025', // Hardcode the reporting period since it's all March data
        rep_name: item.Rep || '',
        sub_rep: item['Sub-Rep'] || '',
        account_ref: item['Account Ref'] || '',
        account_name: item['Account Name'] || '',
        spend: spend,
        cost: cost,
        credit: credit,
        profit: profit,
        margin: margin,
        packs: packs,
        // Normalize department case for consistency
        rep_type: item.Department ? item.Department.toUpperCase() : 'RETAIL',
        import_date: new Date().toISOString()
      };
    });
    
    // Debug: Log the mapped data structure
    if (mappedData.length > 0) {
      console.log('First mapped item:', mappedData[0]);
      
      // Calculate total profit to verify mapping is correct
      const totalMappedProfit = mappedData.reduce((total, item) => total + item.profit, 0);
      console.log('Total calculated profit from mapped data:', totalMappedProfit);
    }
    
    // Count departments for debugging
    const deptCounts = {};
    mappedData.forEach(item => {
      const dept = item.rep_type;
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    console.log('Department counts:', deptCounts);
    
    // Separate data by rep_type (using normalized UPPERCASE comparison)
    const repDataFromDb = mappedData.filter(item => item.rep_type === 'RETAIL');
    const revaDataFromDb = mappedData.filter(item => item.rep_type === 'REVA');
    const wholesaleDataFromDb = mappedData.filter(item => item.rep_type === 'WHOLESALE');
    
    console.log('Retail data count:', repDataFromDb.length);
    console.log('REVA data count:', revaDataFromDb.length);
    console.log('Wholesale data count:', wholesaleDataFromDb.length);
    
    // Log segment profits to verify data split
    const retailProfit = repDataFromDb.reduce((sum, item) => sum + item.profit, 0);
    const revaProfit = revaDataFromDb.reduce((sum, item) => sum + item.profit, 0);
    const wholesaleProfit = wholesaleDataFromDb.reduce((sum, item) => sum + item.profit, 0);
    
    console.log('Retail total profit:', retailProfit);
    console.log('REVA total profit:', revaProfit);
    console.log('Wholesale total profit:', wholesaleProfit);
    console.log('Combined segment profit:', retailProfit + revaProfit + wholesaleProfit);
    
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
    
    // Log calculated summary values
    console.log('Retail summary calculated:', calculatedSummary);
    console.log('REVA summary calculated:', revaSummary);
    console.log('Wholesale summary calculated:', wholesaleSummary);
    
    // Log combined total profit for verification
    const combinedTotalProfit = calculatedSummary.totalProfit + revaSummary.totalProfit + wholesaleSummary.totalProfit;
    console.log('Combined total profit from all segments:', combinedTotalProfit);
    
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
