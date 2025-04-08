
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

    // DIAGNOSTIC: Get total count from SQL directly for comparison
    const { data: totalCountFromSql, error: countError } = await supabase
      .rpc('get_total_count', {});
      
    if (!countError) {
      console.log('SQL Direct Count:', totalCountFromSql);
      console.log('JS allDataFromDb Count:', allDataFromDb.length);
      
      if (totalCountFromSql !== allDataFromDb.length) {
        console.warn('WARNING: SQL count and JS data count do not match!');
      }
    }
    
    // DIAGNOSTIC: Get department counts directly from SQL
    const { data: deptCountsFromSql, error: deptCountError } = await supabase
      .rpc('get_department_counts', {});
      
    if (!deptCountError) {
      console.log('Department counts from SQL:', deptCountsFromSql);
    }
    
    // DIAGNOSTIC: Count wholesale records directly from SQL
    const { data: wholesaleCountFromSql, error: wholesaleCountError } = await supabase
      .rpc('get_wholesale_count', {});
      
    if (!wholesaleCountError) {
      console.log('Wholesale count from SQL:', wholesaleCountFromSql);
    }
    
    // DIAGNOSTIC: Get all unique Department values directly from SQL
    const { data: uniqueDepartments, error: uniqueDeptsError } = await supabase
      .rpc('get_unique_departments', {});
      
    if (!uniqueDeptsError) {
      console.log('All unique Department values from SQL:', uniqueDepartments);
    }
    
    // Debug: Log the raw data structure from Supabase
    if (allDataFromDb.length > 0) {
      console.log('First raw data item:', allDataFromDb[0]);
      
      // Log all unique Department values to debug case sensitivity issues
      const departmentValues = new Set();
      allDataFromDb.forEach(item => {
        if (item.Department) departmentValues.add(item.Department);
      });
      console.log('All unique Department values in raw data:', [...departmentValues]);
      
      // Calculate the total raw profit to verify data
      const rawTotalProfit = allDataFromDb.reduce((sum, item) => {
        const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
        return sum + profit;
      }, 0);
      
      console.log('Raw total profit from database:', rawTotalProfit);
      
      // Count rows and profit by department to debug
      const deptStats = {};
      allDataFromDb.forEach(item => {
        const dept = item.Department || 'Unknown';
        if (!deptStats[dept]) {
          deptStats[dept] = { count: 0, profit: 0 };
        }
        deptStats[dept].count++;
        deptStats[dept].profit += (typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0));
      });
      console.log('Department statistics (raw data):', deptStats);
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
        rep_type: item.Department || 'RETAIL',
        original_dept: item.Department, // Keep this for debugging
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
    console.log('Department counts in mapped data:', deptCounts);
    
    // Log profit by department after mapping
    const mappedDeptProfits = {};
    mappedData.forEach(item => {
      const dept = item.rep_type;
      if (!mappedDeptProfits[dept]) {
        mappedDeptProfits[dept] = 0;
      }
      mappedDeptProfits[dept] += item.profit;
    });
    console.log('Department profits after mapping:', mappedDeptProfits);
    
    // DIAGNOSTIC: Let's compare the sum from JS vs what we get from SQL for Wholesale
    const wholesaleSumFromJs = mappedData
      .filter(item => item.rep_type === 'Wholesale')
      .reduce((sum, item) => sum + item.profit, 0);
      
    console.log('Wholesale sum calculated in JS (strict match):', wholesaleSumFromJs);
    
    // Try with case-insensitive matching
    const wholesaleSumFromJsCaseInsensitive = mappedData
      .filter(item => item.rep_type && item.rep_type.toLowerCase() === 'wholesale')
      .reduce((sum, item) => sum + item.profit, 0);
      
    console.log('Wholesale sum with case-insensitive match in JS:', wholesaleSumFromJsCaseInsensitive);
    
    // IMPORTANT: Fix for inconsistent case in department names
    // We need to correctly identify all wholesale records
    // They may be stored with different cases (like "Wholesale", "wholesale", "WHOLESALE")
    const repDataFromDb = mappedData.filter(item => 
      item.rep_type === 'RETAIL' || 
      item.rep_type.toUpperCase() === 'RETAIL');
      
    const revaDataFromDb = mappedData.filter(item => 
      item.rep_type === 'REVA' || 
      item.rep_type.toUpperCase() === 'REVA');
      
    // DIAGNOSTIC: Get array of all wholesale records to check their values
    const allWholesaleRecords = mappedData.filter(item => 
      item.rep_type === 'Wholesale' || 
      item.rep_type.toLowerCase() === 'wholesale' ||
      item.rep_type.toUpperCase() === 'WHOLESALE');
    
    // Log the first few wholesale records for debugging
    if (allWholesaleRecords.length > 0) {
      console.log('First 5 wholesale records:', allWholesaleRecords.slice(0, 5));
      console.log('Wholesale records with highest profit:', 
        [...allWholesaleRecords].sort((a, b) => b.profit - a.profit).slice(0, 5));
    }
    
    // DIAGNOSTIC: Try fetching the wholesale directly via SQL
    try {
      const { data: directWholesaleData, error: directWholesaleError } = await supabase
        .rpc('get_wholesale_data', {});
        
      if (!directWholesaleError && directWholesaleData) {
        console.log('Direct wholesale data from SQL (first 5):', 
          directWholesaleData.slice(0, 5));
          
        // Calculate the sum directly from this data
        const directWholesaleSum = directWholesaleData.reduce(
          (sum, item) => sum + Number(item.profit || 0), 0);
          
        console.log('Direct wholesale sum calculated from SQL data:', directWholesaleSum);
      }
    } catch (directError) {
      console.error('Error fetching direct wholesale data:', directError);
    }
    
    // Use the filtered data for further processing
    const wholesaleDataFromDb = allWholesaleRecords;
    
    console.log('Retail data count:', repDataFromDb.length);
    console.log('REVA data count:', revaDataFromDb.length);
    console.log('Wholesale data count:', wholesaleDataFromDb.length);
    
    // Log profit metrics to verify department filtering
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
