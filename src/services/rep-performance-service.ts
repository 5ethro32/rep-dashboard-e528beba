import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData, MarchRollingData, SalesData } from '@/types/rep-performance.types';
import { processRepData, calculateSummary, calculateRawMtdSummary, calculateSummaryFromData, processRawData } from '@/utils/rep-data-processing';

// Define valid table and view names for type safety
// Tables
type DbTableName = 'mtd_daily' | 'sales_data' | 'sales_data_februrary' | 'march_rolling' | 'customer_visits' | 'profiles' | 'week_plans';
// Views
type DbViewName = 'combined_rep_performance';

// Helper function to fetch all records from a table using pagination
async function fetchAllRecords(tableName: DbTableName) {
  let allRecords: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(`Error fetching ${tableName} data:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allRecords = [...allRecords, ...data];
      page++;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`Fetched ${allRecords.length} total records from ${tableName}`);
  return allRecords;
}

// Helper function for views if needed in the future
async function fetchAllViewRecords(viewName: DbViewName) {
  let allRecords: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(`Error fetching ${viewName} view data:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allRecords = [...allRecords, ...data];
      page++;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`Fetched ${allRecords.length} total records from ${viewName} view`);
  return allRecords;
}

// Helper function to normalize department names for comparison
const normalizeDepartment = (dept?: string): string => {
  if (!dept) return '';
  return dept.trim().toUpperCase();
};

// Helper function to process data by department
const processDataByDepartment = (data: any[], department?: string) => {
  return data?.filter(item => {
    const itemDept = normalizeDepartment(item.Department || item.rep_type);
    const targetDept = normalizeDepartment(department);
    
    if (!department) {
      return !itemDept || itemDept === 'RETAIL';
    }
    return itemDept === targetDept;
  }) || [];
};

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data using pagination...');
    
    // Fetch data from all tables
    const mtdData = await fetchAllRecords('mtd_daily');
    const marchData = await fetchAllRecords('sales_data');
    const februaryData = await fetchAllRecords('sales_data_februrary');
    const marchRollingData = await fetchAllRecords('march_rolling');
    
    console.log('Data samples:', {
      mtd: mtdData?.[0],
      marchRolling: marchRollingData?.[0],
      march: marchData?.[0],
      february: februaryData?.[0]
    });

    // Process department data
    const processDepartmentData = (data: any[]) => ({
      retail: processRepData(processDataByDepartment(data)),
      reva: processRepData(processDataByDepartment(data, 'REVA')),
      wholesale: processRepData(processDataByDepartment(data, 'WHOLESALE'))
    });

    // Process all datasets
    const aprData = processDepartmentData(mtdData);
    const marchRollingProcessed = processDepartmentData(marchRollingData);
    const marchData = processDepartmentData(marchData);
    const febData = processDepartmentData(februaryData);

    console.log('Processed data counts:', {
      april: {
        retail: aprData.retail.length,
        reva: aprData.reva.length,
        wholesale: aprData.wholesale.length
      },
      marchRolling: {
        retail: marchRollingProcessed.retail.length,
        reva: marchRollingProcessed.reva.length,
        wholesale: marchRollingProcessed.wholesale.length
      }
    });

    // Calculate summaries
    const rawAprSummary = calculateRawMtdSummary(mtdData || []);
    const rawMarchRollingSummary = calculateRawMtdSummary(marchRollingData || []);
    const rawMarchSummary = calculateRawMtdSummary(marchData || []);
    const rawFebSummary = calculateRawMtdSummary(februaryData || []);

    // Calculate filtered summaries
    const calculateFilteredSummaries = (data: { retail: RepData[], reva: RepData[], wholesale: RepData[] }) => ({
      retail: calculateSummaryFromData(data.retail),
      reva: calculateSummaryFromData(data.reva),
      wholesale: calculateSummaryFromData(data.wholesale)
    });

    const aprSummaries = calculateFilteredSummaries(aprData);
    const marchRollingSummaries = calculateFilteredSummaries(marchRollingProcessed);
    const marchSummaries = calculateFilteredSummaries(marchData);
    const febSummaries = calculateFilteredSummaries(febData);

    // Calculate changes
    const calculateChanges = (current: number, previous: number): number => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // April vs March Rolling changes
    const aprVsMarchChanges = {
      totalSpend: calculateChanges(rawAprSummary.totalSpend, rawMarchRollingSummary.totalSpend),
      totalProfit: calculateChanges(rawAprSummary.totalProfit, rawMarchRollingSummary.totalProfit),
      averageMargin: calculateChanges(rawAprSummary.averageMargin, rawMarchRollingSummary.averageMargin),
      totalPacks: calculateChanges(rawAprSummary.totalPacks, rawMarchRollingSummary.totalPacks),
      totalAccounts: calculateChanges(rawAprSummary.totalAccounts, rawMarchRollingSummary.totalAccounts),
      activeAccounts: calculateChanges(rawAprSummary.activeAccounts, rawMarchRollingSummary.activeAccounts)
    };

    // March vs February changes
    const marchVsFebChanges = {
      totalSpend: calculateChanges(rawMarchSummary.totalSpend, rawFebSummary.totalSpend),
      totalProfit: calculateChanges(rawMarchSummary.totalProfit, rawFebSummary.totalProfit),
      averageMargin: calculateChanges(rawMarchSummary.averageMargin, rawFebSummary.averageMargin),
      totalPacks: calculateChanges(rawMarchSummary.totalPacks, rawFebSummary.totalPacks),
      totalAccounts: calculateChanges(rawMarchSummary.totalAccounts, rawFebSummary.totalAccounts),
      activeAccounts: calculateChanges(rawMarchSummary.activeAccounts, rawFebSummary.activeAccounts)
    };

    // Calculate rep-level changes
    const calculateRepChanges = (currentData: RepData[], previousData: RepData[]) => {
      console.log(`Calculating changes between datasets: current=${currentData.length} reps, previous=${previousData.length} reps`);
      
      const changes: Record<string, any> = {};
      
      currentData.forEach(current => {
        const currentRepName = current.rep.toLowerCase().trim();
        const previous = previousData.find(prev => prev.rep.toLowerCase().trim() === currentRepName);
        
        if (previous) {
          const calculateChange = (currentValue: number, previousValue: number) => {
            if (previousValue === 0) return currentValue > 0 ? 100 : 0;
            const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
            return Math.max(Math.min(change, 500), -500);
          };
          
          changes[current.rep] = {
            spend: calculateChange(current.spend, previous.spend),
            profit: calculateChange(current.profit, previous.profit),
            margin: calculateChange(current.margin, previous.margin),
            packs: calculateChange(current.packs, previous.packs),
            activeAccounts: calculateChange(current.activeAccounts, previous.activeAccounts),
            totalAccounts: calculateChange(current.totalAccounts, previous.totalAccounts),
            profitPerActiveShop: calculateChange(current.profitPerActiveShop, previous.profitPerActiveShop),
            profitPerPack: calculateChange(current.profitPerPack, previous.profitPerPack),
            activeRatio: calculateChange(current.activeRatio, previous.activeRatio)
          };
        }
      });
      
      return changes;
    };

    // Calculate changes
    const aprRepChanges = calculateRepChanges(aprData.retail, marchRollingProcessed.retail);
    const marchRepChanges = calculateRepChanges(marchData.retail, febData.retail);

    // Debug logging for changes
    console.log('Change calculations:', {
      aprVsMarch: {
        totalProfit: {
          current: rawAprSummary.totalProfit,
          previous: rawMarchRollingSummary.totalProfit,
          change: aprVsMarchChanges.totalProfit
        }
      },
      marchVsFeb: {
        totalProfit: {
          current: rawMarchSummary.totalProfit,
          previous: rawFebSummary.totalProfit,
          change: marchVsFebChanges.totalProfit
        }
      }
    });

    return {
      // April data
      repData: aprData.retail,
      revaData: aprData.reva,
      wholesaleData: aprData.wholesale,
      baseSummary: rawAprSummary,
      revaValues: aprSummaries.reva,
      wholesaleValues: aprSummaries.wholesale,
      
      // March data
      marchRepData: marchData.retail,
      marchRevaData: marchData.reva,
      marchWholesaleData: marchData.wholesale,
      marchBaseSummary: rawMarchSummary,
      marchRevaValues: marchSummaries.reva,
      marchWholesaleValues: marchSummaries.wholesale,
      
      // February data
      febRepData: febData.retail,
      febRevaData: febData.reva,
      febWholesaleData: febData.wholesale,
      febBaseSummary: rawFebSummary,
      febRevaValues: febSummaries.reva,
      febWholesaleValues: febSummaries.wholesale,
      
      // March Rolling data for April comparisons
      marchRollingRetailData: marchRollingProcessed.retail,
      marchRollingRevaData: marchRollingProcessed.reva,
      marchRollingWholesaleData: marchRollingProcessed.wholesale,
      
      // Changes
      summaryChanges: aprVsMarchChanges,
      marchSummaryChanges: marchVsFebChanges,
      repChanges: aprRepChanges,
      marchRepChanges: marchRepChanges
    };
  } catch (error) {
    console.error('Error loading data:', error);
    toast({
      title: "Error loading data",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    throw error;
  }
};
