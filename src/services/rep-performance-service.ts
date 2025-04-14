import { saveRepPerformanceData, loadStoredRepPerformanceData } from '@/services/storage/local-storage-service';
import { fetchDepartmentData } from './database/department-service';
import { calculateTotalProfit, calculateSummaryChanges, calculateRepChanges } from './database/calculation-service';
import { loadAprilData } from './database/mtd-service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { processRepData, calculateSummaryFromData } from '@/utils/rep-data-processing';
import { SalesDataItem, RepData, SummaryData } from '@/types/rep-performance.types';

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data from Supabase...');
    
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
    
    const { data: retailData, error: retailError } = await fetchDepartmentData('RETAIL', true);
    if (retailError) throw new Error(`Error fetching RETAIL data: ${retailError.message}`);
    console.log('Fetched RETAIL records:', retailData?.length || 0);
    
    const { data: revaData, error: revaError } = await fetchDepartmentData('REVA', true);
    if (revaError) throw new Error(`Error fetching REVA data: ${revaError.message}`);
    console.log('Fetched REVA records:', revaData?.length || 0);
    
    const { data: wholesaleData, error: wholesaleError } = await fetchDepartmentData('Wholesale', true);
    if (wholesaleError) throw new Error(`Error fetching Wholesale data: ${wholesaleError.message}`);
    console.log('Fetched Wholesale records:', wholesaleData?.length || 0);
    
    let finalWholesaleData = wholesaleData;
    if (!wholesaleData || wholesaleData.length === 0) {
      const { data: upperWholesaleData, error: upperWholesaleError } = await fetchDepartmentData('WHOLESALE', true);
      if (!upperWholesaleError) {
        finalWholesaleData = upperWholesaleData;
        console.log('Fetched WHOLESALE (uppercase) records:', upperWholesaleData?.length || 0);
      }
    }

    const { data: febRetailData, error: febRetailError } = await fetchDepartmentData('RETAIL', false);
    if (febRetailError) throw new Error(`Error fetching February RETAIL data: ${febRetailError.message}`);
    console.log('Fetched February RETAIL records:', febRetailData?.length || 0);
    
    const { data: febRevaData, error: febRevaError } = await fetchDepartmentData('REVA', false);
    if (febRevaError) throw new Error(`Error fetching February REVA data: ${febRevaError.message}`);
    console.log('Fetched February REVA records:', febRevaData?.length || 0);
    
    const { data: febWholesaleData, error: febWholesaleError } = await fetchDepartmentData('Wholesale', false);
    if (febWholesaleError) throw new Error(`Error fetching February Wholesale data: ${febWholesaleError.message}`);
    console.log('Fetched February Wholesale records:', febWholesaleData?.length || 0);
    
    const totalCount = (retailData?.length || 0) + (revaData?.length || 0) + (finalWholesaleData?.length || 0);
    console.log('Total fetched records (March):', totalCount);

    const totalFebCount = (febRetailData?.length || 0) + (febRevaData?.length || 0) + (febWholesaleData?.length || 0);
    console.log('Total fetched records (February):', totalFebCount);
    
    const allDataFromDb = [...(retailData || []), ...(revaData || []), ...(finalWholesaleData || [])];
    
    const allFebDataFromDb = [...(febRetailData || []), ...(febRevaData || []), ...(febWholesaleData || [])];
    
    if (!allDataFromDb || allDataFromDb.length === 0) {
      throw new Error('No data found for March.');
    }
    
    console.log('Total combined data rows (March):', allDataFromDb.length);
    console.log('Total combined data rows (February):', allFebDataFromDb.length || 0);
    
    const mappedData = allDataFromDb.map((item: any) => {
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      const cost = typeof item.Cost === 'string' ? parseFloat(item.Cost) : Number(item.Cost || 0);
      const credit = typeof item.Credit === 'string' ? parseFloat(item.Credit) : Number(item.Credit || 0);
      const margin = typeof item.Margin === 'string' ? parseFloat(item.Margin) : Number(item.Margin || 0);
      const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
      
      let repName = item.Rep || '';
      const subRep = item['Sub-Rep'] || '';
      const department = item.Department || 'RETAIL';
      
      if ((department === 'REVA' || department === 'Wholesale' || department === 'WHOLESALE') && subRep) {
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

    const mappedFebData = allFebDataFromDb.map((item: any) => {
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      const cost = typeof item.Cost === 'string' ? parseFloat(item.Cost) : Number(item.Cost || 0);
      const credit = typeof item.Credit === 'string' ? parseFloat(item.Credit) : Number(item.Credit || 0);
      const margin = typeof item.Margin === 'string' ? parseFloat(item.Margin) : Number(item.Margin || 0);
      const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
      
      let repName = item.Rep || '';
      const subRep = item['Sub-Rep'] || '';
      const department = item.Department || 'RETAIL';
      
      if ((department === 'REVA' || department === 'Wholesale') && subRep) {
        repName = subRep;
      }
      
      return {
        id: item.id ? (typeof item.id === 'string' ? parseInt(item.id) : item.id) : 0,
        reporting_period: 'February 2025',
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
    
    const repDataFromDb = mappedData.filter(item => item.rep_type === 'RETAIL');
    const revaDataFromDb = mappedData.filter(item => item.rep_type === 'REVA');
    const wholesaleDataFromDb = mappedData.filter(item => item.rep_type === 'Wholesale' || item.rep_type === 'WHOLESALE');
    
    const febRepDataFromDb = mappedFebData.filter(item => item.rep_type === 'RETAIL');
    const febRevaDataFromDb = mappedFebData.filter(item => item.rep_type === 'REVA');
    const febWholesaleDataFromDb = mappedFebData.filter(item => item.rep_type === 'Wholesale');
    
    const processedRepData = processRepData(repDataFromDb as SalesDataItem[] || []);
    const processedRevaData = processRepData(revaDataFromDb as SalesDataItem[] || []);
    const processedWholesaleData = processRepData(wholesaleDataFromDb as SalesDataItem[] || []);
    
    const processedFebRepData = processRepData(febRepDataFromDb as SalesDataItem[] || []);
    const processedFebRevaData = processRepData(febRevaDataFromDb as SalesDataItem[] || []);
    const processedFebWholesaleData = processRepData(febWholesaleDataFromDb as SalesDataItem[] || []);
    
    const calculatedSummary = calculateSummaryFromData(processedRepData);
    const revaSummary = calculateSummaryFromData(processedRevaData);
    const wholesaleSummary = calculateSummaryFromData(processedWholesaleData);
    
    const calculatedFebSummary = calculateSummaryFromData(processedFebRepData);
    const revaFebSummary = calculateSummaryFromData(processedFebRevaData);
    const wholesaleFebSummary = calculateSummaryFromData(processedFebWholesaleData);
    
    const summaryChanges = calculateSummaryChanges(
      calculatedSummary, 
      revaSummary,
      wholesaleSummary,
      calculatedFebSummary,
      revaFebSummary,
      wholesaleFebSummary
    );

    const repChanges = calculateRepChanges(
      processedRepData,
      processedRevaData,
      processedWholesaleData,
      processedFebRepData,
      processedFebRevaData,
      processedFebWholesaleData
    );
    
    return {
      repData: processedRepData,
      revaData: processedRevaData,
      wholesaleData: processedWholesaleData,
      baseSummary: calculatedSummary,
      revaValues: revaSummary,
      wholesaleValues: wholesaleSummary,
      
      febRepData: processedFebRepData,
      febRevaData: processedFebRevaData,
      febWholesaleData: processedFebWholesaleData,
      febBaseSummary: calculatedFebSummary,
      febRevaValues: revaFebSummary,
      febWholesaleValues: wholesaleFebSummary,
      
      summaryChanges,
      repChanges
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

export {
  saveRepPerformanceData,
  loadStoredRepPerformanceData,
  loadAprilData,
  calculateTotalProfit,
  calculateSummaryChanges,
  calculateRepChanges
};
