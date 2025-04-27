import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SalesDataItem, RepData, SummaryData, MarchRollingData, SalesData } from '@/types/rep-performance.types';
import { DepartmentProcessedData } from '@/types/rep-comparison.types';
import { processRepData, calculateSummary, calculateRawMtdSummary, calculateSummaryFromData } from '@/utils/rep-data-processing';

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

// Function to process raw data into structured RepData objects
function processRawData(data: (MarchRollingData | SalesData)[]): RepData[] {
  const repMap = new Map<string, {
    rep: string;
    spend: number;
    profit: number;
    packs: number;
    activeAccounts: Set<string>;
    totalAccounts: Set<string>;
  }>();

  data.forEach(item => {
    // Handle both data structures
    const repName = 
      'rep_name' in item ? item.rep_name :
      'Rep' in item ? item.Rep :
      'Unknown';
    
    const subRep = 
      'sub_rep' in item ? item.sub_rep :
      'Sub-Rep' in item ? item['Sub-Rep'] :
      undefined;
    
    const spend = 
      'spend' in item ? Number(item.spend) :
      'Spend' in item ? Number(item.Spend) :
      0;
    
    const profit = 
      'profit' in item ? Number(item.profit) :
      'Profit' in item ? Number(item.Profit) :
      0;
    
    const packs = 
      'packs' in item ? Number(item.packs) :
      'Packs' in item ? Number(item.Packs) :
      0;
    
    const accountRef = 
      'account_ref' in item ? item.account_ref :
      'Account Ref' in item ? item['Account Ref'] :
      'Unknown';

    // Process the rep data
    if (!repMap.has(repName)) {
      repMap.set(repName, {
        rep: repName,
        spend: 0,
        profit: 0,
        packs: 0,
        activeAccounts: new Set(),
        totalAccounts: new Set()
      });
    }

    const currentRep = repMap.get(repName)!;
    currentRep.spend += spend;
    currentRep.profit += profit;
    currentRep.packs += packs;
    currentRep.totalAccounts.add(accountRef);
    if (spend > 0) {
      currentRep.activeAccounts.add(accountRef);
    }

    // If there's a sub-rep, process their data too
    if (subRep) {
      if (!repMap.has(subRep)) {
        repMap.set(subRep, {
          rep: subRep,
          spend: 0,
          profit: 0,
          packs: 0,
          activeAccounts: new Set(),
          totalAccounts: new Set()
        });
      }

      const currentSubRep = repMap.get(subRep)!;
      currentSubRep.spend += spend;
      currentSubRep.profit += profit;
      currentSubRep.packs += packs;
      currentSubRep.totalAccounts.add(accountRef);
      if (spend > 0) {
        currentSubRep.activeAccounts.add(accountRef);
      }
    }
  });

  return Array.from(repMap.values()).map(rep => ({
    rep: rep.rep,
    spend: rep.spend,
    profit: rep.profit,
    margin: rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0,
    packs: rep.packs,
    activeAccounts: rep.activeAccounts.size,
    totalAccounts: rep.totalAccounts.size,
    profitPerActiveShop: rep.activeAccounts.size > 0 ? rep.profit / rep.activeAccounts.size : 0,
    profitPerPack: rep.packs > 0 ? rep.profit / rep.packs : 0,
    activeRatio: rep.totalAccounts.size > 0 ? (rep.activeAccounts.size / rep.totalAccounts.size) * 100 : 0
  }));
}

export const fetchRepPerformanceData = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    
    console.log('Fetching rep performance data using pagination...');
    
    // Fetch data from all tables
    const mtdData = await fetchAllRecords('mtd_daily');
    const marchRawData = await fetchAllRecords('sales_data'); // Renamed to avoid conflict
    const februaryData = await fetchAllRecords('sales_data_februrary');
    const marchRollingData = await fetchAllRecords('march_rolling');
    
    console.log('Data samples:', {
      mtd: mtdData?.[0],
      marchRolling: marchRollingData?.[0],
      march: marchRawData?.[0], // Updated variable name
      february: februaryData?.[0]
    });

    // Process department data - returns correctly typed DepartmentProcessedData
    const processDepartmentData = (data: any[]): DepartmentProcessedData => ({
      retail: processRepData(processDataByDepartment(data)),
      reva: processRepData(processDataByDepartment(data, 'REVA')),
      wholesale: processRepData(processDataByDepartment(data, 'WHOLESALE'))
    });

    // Process all datasets
    const aprData = processDepartmentData(mtdData);
    const marchRollingProcessed = processDepartmentData(marchRollingData);
    const marchProcessedData = processDepartmentData(marchRawData); // Renamed to avoid conflict
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
    const rawMarchSummary = calculateRawMtdSummary(marchRawData || []); // Updated variable name
    const rawFebSummary = calculateRawMtdSummary(februaryData || []);

    // Calculate filtered summaries
    const calculateFilteredSummaries = (data: DepartmentProcessedData) => ({
      retail: calculateSummaryFromData(data.retail),
      reva: calculateSummaryFromData(data.reva),
      wholesale: calculateSummaryFromData(data.wholesale)
    });

    const aprSummaries = calculateFilteredSummaries(aprData);
    const marchRollingSummaries = calculateFilteredSummaries(marchRollingProcessed);
    const marchSummaries = calculateFilteredSummaries(marchProcessedData); // Updated variable name
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
    const marchRepChanges = calculateRepChanges(marchProcessedData.retail, febData.retail); // Updated variable name

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
      marchRepData: marchProcessedData.retail,
      marchRevaData: marchProcessedData.reva,
      marchWholesaleData: marchProcessedData.wholesale,
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
