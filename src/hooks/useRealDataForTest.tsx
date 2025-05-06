import { useState, useEffect } from 'react';
import { 
  getMonthlyMetricsByDept, 
  getMonthlyComparison, 
  getAvailableMonths, 
  getAllDepartments,
  getMonthData
} from '@/utils/unified-data-service';
import { DepartmentMetric } from '@/hooks/useDepartmentMetrics';

// Interface for rep performance data
export interface RepPerformanceData {
  rep: string;
  spend: number;
  profit: number;
  margin: number;
  packs: number;
  activeAccounts: number;
  totalAccounts: number;
}

export interface TestDataState {
  // Department metrics
  retailMetrics: DepartmentMetric | null;
  revaMetrics: DepartmentMetric | null;
  wholesaleMetrics: DepartmentMetric | null;
  
  // Rep performance data
  repData: RepPerformanceData[];
  revaData: RepPerformanceData[];
  wholesaleData: RepPerformanceData[];
  
  // Changes between months
  changes: {
    retail?: Record<string, number>;
    reva?: Record<string, number>;
    wholesale?: Record<string, number>;
  };
  
  // Actual previous month metrics (for accurate comparisons)
  previousMonthMetrics: {
    retail?: DepartmentMetric | null;
    reva?: DepartmentMetric | null;
    wholesale?: DepartmentMetric | null;
  };
  
  // Changes by rep
  repChanges: Record<string, any>;
  
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to provide real data for the test dashboard
 * Combines department metrics and rep performance data
 */
export const useRealDataForTest = (selectedMonth: string) => {
  const [state, setState] = useState<TestDataState>({
    retailMetrics: null,
    revaMetrics: null,
    wholesaleMetrics: null,
    repData: [],
    revaData: [],
    wholesaleData: [],
    changes: {},
    previousMonthMetrics: {},
    repChanges: {},
    isLoading: true,
    error: null
  });
  
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  // Load data when month changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedMonth) return;
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        console.log(`Loading data for ${selectedMonth}`);
        
        // Get available months
        const months = await getAvailableMonths();
        setAvailableMonths(months);
        
        // Direct fetch to Supabase for ALL months (unified approach)
        try {
          console.log(`Using direct query method for ${selectedMonth} data`);
          
          // Direct fetch to Supabase with pagination
          let allData = [];
          let hasMoreData = true;
          let offset = 0;
          const pageSize = 1000;
          
          while (hasMoreData) {
            console.log(`Fetching hook data page ${offset/pageSize + 1}`);
            const response = await fetch(`https://ukshnjjmsrhgvkwrzoah.supabase.co/rest/v1/unified_sales_data?reporting_month=eq.${selectedMonth}&limit=${pageSize}&offset=${offset}`, {
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              console.error(`API error: ${response.status}`);
              throw new Error(`API error: ${response.status}`);
            }
            
            const pageData = await response.json();
            console.log(`Got page with ${pageData.length} records`);
            
            allData = [...allData, ...pageData];
            
            if (pageData.length < pageSize) {
              hasMoreData = false;
            } else {
              offset += pageSize;
            }
          }
          
          console.log(`Total hook data records: ${allData.length}`);
          const monthData = allData;
          
          // Calculate some totals for logging
          const totalSpend = monthData.reduce((sum: number, item: any) => sum + Number(item.spend || 0), 0);
          const totalProfit = monthData.reduce((sum: number, item: any) => sum + Number(item.profit || 0), 0);
          
          console.log(`Direct ${selectedMonth} data totals: spend=${totalSpend}, profit=${totalProfit}`);
          
          // Determine previous month
          const monthOrder = ['February', 'March', 'April', 'May'];
          const currentIndex = monthOrder.indexOf(selectedMonth);
          const previousMonth = currentIndex > 0 ? monthOrder[currentIndex - 1] : null;
          
          // Get previous month data if available
          let previousMonthData: any[] = [];
          let previousMonthMetrics: Record<string, DepartmentMetric | null> = {};
          
          if (previousMonth) {
            // Fetch previous month data with pagination
            let allPrevData: any[] = [];
            let hasMorePrevData = true;
            let prevOffset = 0;
            const prevPageSize = 1000;
            
            try {
              console.log(`Fetching previous month (${previousMonth}) data with pagination`);
              
              while (hasMorePrevData) {
                const prevResponse = await fetch(`https://ukshnjjmsrhgvkwrzoah.supabase.co/rest/v1/unified_sales_data?reporting_month=eq.${previousMonth}&limit=${prevPageSize}&offset=${prevOffset}`, {
                  headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI',
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (prevResponse.ok) {
                  const pageData = await prevResponse.json();
                  console.log(`Got page with ${pageData.length} records for previous month`);
                  
                  allPrevData = [...allPrevData, ...pageData];
                  
                  if (pageData.length < prevPageSize) {
                    hasMorePrevData = false;
                  } else {
                    prevOffset += prevPageSize;
                  }
                } else {
                  console.error(`Error fetching previous month page: ${prevResponse.status}`);
                  hasMorePrevData = false;
                }
              }
              
              previousMonthData = allPrevData;
              console.log(`Previous month (${previousMonth}) data count: ${previousMonthData.length}`);
              
              // Process previous month data into department metrics
              // This gives us actual metrics to display instead of calculated values
              const departments = ['retail', 'reva', 'wholesale'];
              
              for (const dept of departments) {
                const deptRecords = previousMonthData.filter((item: any) => 
                  (item.department || '').toLowerCase().includes(dept));
                
                const totalSpend = deptRecords.reduce((sum: number, item: any) => 
                  sum + Number(item.spend || 0), 0);
                  
                const totalProfit = deptRecords.reduce((sum: number, item: any) => 
                  sum + Number(item.profit || 0), 0);
                  
                const totalPacks = deptRecords.reduce((sum: number, item: any) => 
                  sum + Number(item.packs || 0), 0);
                  
                // Get unique accounts and reps
                const uniqueAccounts = new Set<string>();
                const uniqueReps = new Set<string>();
                
                deptRecords.forEach((item: any) => {
                  if (item.account_ref) uniqueAccounts.add(item.account_ref);
                  if (item.rep_name) uniqueReps.add(item.rep_name);
                });
                
                previousMonthMetrics[dept] = {
                  department: dept,
                  recordCount: deptRecords.length,
                  totalSpend,
                  totalProfit,
                  totalPacks,
                  totalAccounts: uniqueAccounts.size,
                  repCount: uniqueReps.size,
                  averageMargin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0
                };
              }
              
              console.log('Previous month metrics processed:', previousMonthMetrics);
            } catch (error) {
              console.error(`Error fetching previous month (${previousMonth}) data:`, error);
            }
          }
          
          // Process raw data into rep performance metrics
          console.log('Processing rep data directly...');
          const { repData, revaData, wholesaleData, repChanges } = processRepData(
            monthData, 
            previousMonthData
          );
          
          // Calculate department metrics directly from the raw data
          const departments = ['retail', 'reva', 'wholesale'];
          const deptMetrics: Record<string, any> = {};
          const deptChanges: Record<string, Record<string, number>> = {};
          
          // Process current month metrics by department
          for (const dept of departments) {
            const deptRecords = monthData.filter((item: any) => 
              (item.department || '').toLowerCase().includes(dept));
            
            const totalSpend = deptRecords.reduce((sum: number, item: any) => 
              sum + Number(item.spend || 0), 0);
              
            const totalProfit = deptRecords.reduce((sum: number, item: any) => 
              sum + Number(item.profit || 0), 0);
              
            const totalPacks = deptRecords.reduce((sum: number, item: any) => 
              sum + Number(item.packs || 0), 0);
              
            // Get unique accounts and reps
            const uniqueAccounts = new Set<string>();
            const uniqueReps = new Set<string>();
            
            deptRecords.forEach((item: any) => {
              if (item.account_ref) uniqueAccounts.add(item.account_ref);
              if (item.rep_name) uniqueReps.add(item.rep_name);
            });
            
            deptMetrics[dept] = {
              department: dept,
              recordCount: deptRecords.length,
              totalSpend,
              totalProfit,
              totalPacks,
              totalAccounts: uniqueAccounts.size,
              repCount: uniqueReps.size,
              averageMargin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0
            };
            
            // Calculate changes if previous month data exists
            if (previousMonth && previousMonthData.length > 0) {
              const prevDeptRecords = previousMonthData.filter((item: any) => 
                (item.department || '').toLowerCase().includes(dept));
              
              const prevTotalSpend = prevDeptRecords.reduce((sum: number, item: any) => 
                sum + Number(item.spend || 0), 0);
                
              const prevTotalProfit = prevDeptRecords.reduce((sum: number, item: any) => 
                sum + Number(item.profit || 0), 0);
                
              const prevTotalPacks = prevDeptRecords.reduce((sum: number, item: any) => 
                sum + Number(item.packs || 0), 0);
                
              const prevUniqueAccounts = new Set<string>();
              prevDeptRecords.forEach((item: any) => {
                if (item.account_ref) prevUniqueAccounts.add(item.account_ref);
              });
              
              // Calculate percent changes
              const percentChange = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
              };
              
              deptChanges[dept] = {
                totalSpend: percentChange(totalSpend, prevTotalSpend),
                totalProfit: percentChange(totalProfit, prevTotalProfit),
                totalPacks: percentChange(totalPacks, prevTotalPacks),
                totalAccounts: percentChange(uniqueAccounts.size, prevUniqueAccounts.size),
                averageMargin: percentChange(
                  deptMetrics[dept].averageMargin,
                  prevTotalSpend > 0 ? (prevTotalProfit / prevTotalSpend) * 100 : 0
                )
              };
            } else {
              // No previous month data, set changes to 0
              deptChanges[dept] = {
                totalSpend: 0,
                totalProfit: 0,
                totalPacks: 0,
                totalAccounts: 0,
                averageMargin: 0
              };
            }
          }
          
          console.log('Department metrics processed directly:', deptMetrics);
          console.log('Department changes calculated directly:', deptChanges);
          
          // Update state with direct calculation results
          setState({
            retailMetrics: deptMetrics['retail'] || null,
            revaMetrics: deptMetrics['reva'] || null,
            wholesaleMetrics: deptMetrics['wholesale'] || null,
            repData,
            revaData,
            wholesaleData,
            changes: {
              retail: deptChanges['retail'] || {},
              reva: deptChanges['reva'] || {},
              wholesale: deptChanges['wholesale'] || {}
            },
            previousMonthMetrics,
            repChanges,
            isLoading: false,
            error: null
          });
          
        } catch (error) {
          console.error(`Error in direct data loading for ${selectedMonth}:`, error);
          
          // Fallback to the original method if direct approach fails
          const monthData = await getMonthData(selectedMonth);
          console.log(`Raw data count: ${monthData.length}`);
        
          // Debug raw data
          const debugData = {
            dataCount: monthData.length,
            firstTenRecords: monthData.slice(0, 10),
            spendSum: monthData.reduce((sum, item) => sum + Number(item.spend || 0), 0),
            profitSum: monthData.reduce((sum, item) => sum + Number(item.profit || 0), 0),
            sampleRecords: {}
          };
          
          // Find records with non-zero values for debugging
          const nonZeroSpend = monthData.find(item => Number(item.spend) > 0);
          const nonZeroProfit = monthData.find(item => Number(item.profit) > 0);
          
          if (nonZeroSpend) {
            debugData.sampleRecords['nonZeroSpend'] = nonZeroSpend;
          }
          
          if (nonZeroProfit) {
            debugData.sampleRecords['nonZeroProfit'] = nonZeroProfit;
          }
          
          // Check data types of spend and profit fields
          if (monthData.length > 0) {
            const sample = monthData[0];
            debugData.sampleRecords['typeInfo'] = {
              spendType: typeof sample.spend,
              spendValue: sample.spend,
              profitType: typeof sample.profit,
              profitValue: sample.profit
            };
          }
          
          setDebugInfo(debugData);
          
          // Get department metrics with comparison to previous month
          console.log(`Fetching metrics comparison for ${selectedMonth}`);
          const comparison = await getMonthlyComparison(selectedMonth);
          
          // Update state with metrics and changes
          if (comparison && comparison.current) {
            // Extract department metrics
            const retailMetrics = comparison.current.find(m => m.department === 'retail') || null;
            const revaMetrics = comparison.current.find(m => m.department === 'reva') || null;
            const wholesaleMetrics = comparison.current.find(m => m.department === 'wholesale') || null;
            
            console.log('Metrics from standard method:', {
              retail: retailMetrics,
              reva: revaMetrics,
              wholesale: wholesaleMetrics
            });
            
            // Get changes between months
            const changes = comparison.changes || {};
            
            // Get previous month for rep data comparison
            const monthOrder = ['February', 'March', 'April', 'May'];
            const currentIndex = monthOrder.indexOf(selectedMonth);
            const previousMonth = currentIndex > 0 ? monthOrder[currentIndex - 1] : null;
            
            let previousMonthData: any[] = [];
            if (previousMonth) {
              previousMonthData = await getMonthData(previousMonth);
            }
            
            // Process raw data into rep performance metrics
            const { repData, revaData, wholesaleData, repChanges } = processRepData(
              monthData,
              previousMonthData
            );
            
            // Update state with the metrics and data
            setState({
              retailMetrics,
              revaMetrics,
              wholesaleMetrics,
              repData,
              revaData,
              wholesaleData,
              changes,
              previousMonthMetrics: {
                retail: retailMetrics || null,
                reva: revaMetrics || null,
                wholesale: wholesaleMetrics || null
              },
              repChanges,
              isLoading: false,
              error: null
            });
          } else {
            console.error('Comparison data not available');
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: new Error('Could not load comparison data')
            }));
          }
        }
      } catch (outerError) {
        console.error(`Error in loadData for ${selectedMonth}:`, outerError);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: outerError instanceof Error ? outerError : new Error('Unknown error loading data')
        }));
      }
    };
    
    loadData();
  }, [selectedMonth]);
  
  // Process raw data into rep performance metrics
  const processRepData = (currentData: any[], previousData: any[]) => {
    // Group by rep and department
    const retailByRep: Record<string, any[]> = {};
    const revaByRep: Record<string, any[]> = {};
    const wholesaleByRep: Record<string, any[]> = {};
    
    // Group previous data by rep and department
    const prevRetailByRep: Record<string, any[]> = {};
    const prevRevaByRep: Record<string, any[]> = {};
    const prevWholesaleByRep: Record<string, any[]> = {};
    
    // Add debug logging
    console.log('Data sample before grouping:');
    if (currentData.length > 0) {
      console.log('Sample record:', JSON.stringify(currentData[0], null, 2));
      
      // Log distribution by department
      const deptCounts: Record<string, number> = {};
      currentData.forEach(record => {
        const dept = (record.department || '').toLowerCase();
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      console.log('Records by department:', deptCounts);
      
      // Log spend and profit sums to check for zeroes
      let totalSpend = 0;
      let totalProfit = 0;
      
      // CRITICAL FIX: Explicitly convert values to numbers before summing
      currentData.forEach(record => {
        // Ensure we're working with numbers, not strings
        const spend = typeof record.spend === 'string' 
          ? parseFloat(record.spend) 
          : Number(record.spend || 0);
          
        const profit = typeof record.profit === 'string'
          ? parseFloat(record.profit)
          : Number(record.profit || 0);
          
        // Add to running totals
        if (!isNaN(spend)) totalSpend += spend;
        if (!isNaN(profit)) totalProfit += profit;
      });
      
      console.log('Total raw spend (converted):', totalSpend);
      console.log('Total raw profit (converted):', totalProfit);
    }
    
    // Process current month data
    currentData.forEach(record => {
      const repName = record.rep_name;
      const dept = (record.department || '').toLowerCase();
      
      if (!repName) return;
      
      // CRITICAL FIX: Ensure spend and profit are proper numbers
      // First handle string values (from JSON or DB strings)
      const spend = typeof record.spend === 'string' 
        ? parseFloat(record.spend) 
        : Number(record.spend || 0);
        
      const profit = typeof record.profit === 'string'
        ? parseFloat(record.profit)
        : Number(record.profit || 0);
        
      const packs = typeof record.packs === 'string'
        ? parseInt(record.packs)
        : Number(record.packs || 0);
      
      // Update the record with the numeric values
      record.spend = isNaN(spend) ? 0 : spend;
      record.profit = isNaN(profit) ? 0 : profit;
      record.packs = isNaN(packs) ? 0 : packs;
      
      if (isNaN(spend) || isNaN(profit)) {
        console.warn('Found NaN values:', { repName, dept, spend: record.spend, profit: record.profit });
      }
      
      if (dept.includes('reva')) {
        if (!revaByRep[repName]) revaByRep[repName] = [];
        revaByRep[repName].push(record);
      } else if (dept.includes('wholesale')) {
        if (!wholesaleByRep[repName]) wholesaleByRep[repName] = [];
        wholesaleByRep[repName].push(record);
      } else {
        // Default to retail
        if (!retailByRep[repName]) retailByRep[repName] = [];
        retailByRep[repName].push(record);
      }
    });
    
    // Process previous month data with the same numeric conversion
    previousData.forEach(record => {
      const repName = record.rep_name;
      const dept = (record.department || '').toLowerCase();
      
      if (!repName) return;
      
      // CRITICAL FIX: Ensure spend and profit are proper numbers for previous month too
      record.spend = typeof record.spend === 'string' 
        ? parseFloat(record.spend) 
        : Number(record.spend || 0);
        
      record.profit = typeof record.profit === 'string'
        ? parseFloat(record.profit)
        : Number(record.profit || 0);
        
      record.packs = typeof record.packs === 'string'
        ? parseInt(record.packs)
        : Number(record.packs || 0);
      
      if (dept.includes('reva')) {
        if (!prevRevaByRep[repName]) prevRevaByRep[repName] = [];
        prevRevaByRep[repName].push(record);
      } else if (dept.includes('wholesale')) {
        if (!prevWholesaleByRep[repName]) prevWholesaleByRep[repName] = [];
        prevWholesaleByRep[repName].push(record);
      } else {
        // Default to retail
        if (!prevRetailByRep[repName]) prevRetailByRep[repName] = [];
        prevRetailByRep[repName].push(record);
      }
    });
    
    // Log department breakdown
    console.log('Rep counts by department:');
    console.log('Retail reps:', Object.keys(retailByRep).length);
    console.log('REVA reps:', Object.keys(revaByRep).length);
    console.log('Wholesale reps:', Object.keys(wholesaleByRep).length);
    
    // Aggregate rep data
    const repData = Object.keys(retailByRep).map(rep => {
      const records = retailByRep[rep];
      // CRITICAL FIX: Ensure we use the properly converted number values
      const totalSpend = records.reduce((sum, r) => sum + r.spend, 0);
      const totalProfit = records.reduce((sum, r) => sum + r.profit, 0);
      const totalPacks = records.reduce((sum, r) => sum + r.packs, 0);
      
      // Get unique account references
      const accountRefs = new Set<string>();
      const activeAccountRefs = new Set<string>();
      
      records.forEach(r => {
        if (r.account_ref) {
          accountRefs.add(r.account_ref);
          if (r.spend > 0) {
            activeAccountRefs.add(r.account_ref);
          }
        }
      });
      
      // Debug for first rep
      if (rep === Object.keys(retailByRep)[0]) {
        console.log('First rep details (retail):', {
          rep,
          recordCount: records.length,
          totalSpend,
          totalProfit,
          totalPacks,
          accounts: accountRefs.size,
          activeAccounts: activeAccountRefs.size
        });
      }
      
      return {
        rep,
        spend: totalSpend,
        profit: totalProfit,
        margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
        packs: totalPacks,
        activeAccounts: activeAccountRefs.size,
        totalAccounts: accountRefs.size
      };
    });
    
    // Aggregate REVA data
    const revaData = Object.keys(revaByRep).map(rep => {
      const records = revaByRep[rep];
      // Use the properly converted number values
      const totalSpend = records.reduce((sum, r) => sum + r.spend, 0);
      const totalProfit = records.reduce((sum, r) => sum + r.profit, 0);
      const totalPacks = records.reduce((sum, r) => sum + r.packs, 0);
      
      // Get unique account references
      const accountRefs = new Set<string>();
      const activeAccountRefs = new Set<string>();
      
      records.forEach(r => {
        if (r.account_ref) {
          accountRefs.add(r.account_ref);
          if (r.spend > 0) {
            activeAccountRefs.add(r.account_ref);
          }
        }
      });
      
      return {
        rep,
        spend: totalSpend,
        profit: totalProfit,
        margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
        packs: totalPacks,
        activeAccounts: activeAccountRefs.size,
        totalAccounts: accountRefs.size
      };
    });
    
    // Aggregate wholesale data
    const wholesaleData = Object.keys(wholesaleByRep).map(rep => {
      const records = wholesaleByRep[rep];
      // Use the properly converted number values 
      const totalSpend = records.reduce((sum, r) => sum + r.spend, 0);
      const totalProfit = records.reduce((sum, r) => sum + r.profit, 0);
      const totalPacks = records.reduce((sum, r) => sum + r.packs, 0);
      
      // Get unique account references
      const accountRefs = new Set<string>();
      const activeAccountRefs = new Set<string>();
      
      records.forEach(r => {
        if (r.account_ref) {
          accountRefs.add(r.account_ref);
          if (r.spend > 0) {
            activeAccountRefs.add(r.account_ref);
          }
        }
      });
      
      return {
        rep,
        spend: totalSpend,
        profit: totalProfit,
        margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
        packs: totalPacks,
        activeAccounts: activeAccountRefs.size,
        totalAccounts: accountRefs.size
      };
    });
    
    // Calculate rep changes
    const repChanges: Record<string, any> = {};
    
    // Calculate percentage changes for retail reps
    repData.forEach(current => {
      const rep = current.rep;
      
      // Find previous data for this rep
      const prevRecords = prevRetailByRep[rep] || [];
      
      if (prevRecords.length === 0) {
        // No previous data, no changes
        repChanges[rep] = {
          profit: 0,
          spend: 0,
          margin: 0,
          packs: 0,
          activeAccounts: 0,
          totalAccounts: 0
        };
        return;
      }
      
      // Calculate previous metrics
      // Use the properly converted number values
      const prevSpend = prevRecords.reduce((sum, r) => sum + r.spend, 0);
      const prevProfit = prevRecords.reduce((sum, r) => sum + r.profit, 0);
      const prevPacks = prevRecords.reduce((sum, r) => sum + r.packs, 0);
      
      // Get unique previous account references
      const prevAccountRefs = new Set<string>();
      const prevActiveAccountRefs = new Set<string>();
      
      prevRecords.forEach(r => {
        if (r.account_ref) {
          prevAccountRefs.add(r.account_ref);
          if (r.spend > 0) {
            prevActiveAccountRefs.add(r.account_ref);
          }
        }
      });
      
      const prevMargin = prevSpend > 0 ? (prevProfit / prevSpend) * 100 : 0;
      
      // Calculate percentage changes
      const percentChange = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };
      
      repChanges[rep] = {
        profit: percentChange(current.profit, prevProfit),
        spend: percentChange(current.spend, prevSpend),
        margin: current.margin - prevMargin,
        packs: percentChange(current.packs, prevPacks),
        activeAccounts: percentChange(current.activeAccounts, prevActiveAccountRefs.size),
        totalAccounts: percentChange(current.totalAccounts, prevAccountRefs.size)
      };
    });
    
    return { repData, revaData, wholesaleData, repChanges };
  };
  
  // Calculate combined metrics based on included departments
  const getCombinedMetrics = () => {
    const { retailMetrics, revaMetrics, wholesaleMetrics } = state;
    
    // Initialize with zeros
    let totalSpend = 0;
    let totalProfit = 0;
    let totalPacks = 0;
    let totalAccounts = 0;
    
    // CRITICAL FIX: Log raw metric values before conversion
    console.log('Raw metrics before combining:', {
      retailMetrics: retailMetrics ? {
        spend: retailMetrics.totalSpend,
        spendType: typeof retailMetrics.totalSpend,
        profit: retailMetrics.totalProfit,
        profitType: typeof retailMetrics.totalProfit,
        packs: retailMetrics.totalPacks,
        packsType: typeof retailMetrics.totalPacks
      } : null,
      revaMetrics: revaMetrics ? {
        spend: revaMetrics.totalSpend,
        spendType: typeof revaMetrics.totalSpend,
        profit: revaMetrics.totalProfit,
        profitType: typeof revaMetrics.totalProfit,
        packs: revaMetrics.totalPacks,
        packsType: typeof revaMetrics.totalPacks
      } : null,
      wholesaleMetrics: wholesaleMetrics ? {
        spend: wholesaleMetrics.totalSpend,
        spendType: typeof wholesaleMetrics.totalSpend,
        profit: wholesaleMetrics.totalProfit,
        profitType: typeof wholesaleMetrics.totalProfit,
        packs: wholesaleMetrics.totalPacks,
        packsType: typeof wholesaleMetrics.totalPacks
      } : null
    });
    
    // Add retail metrics if included
    if (includeRetail && retailMetrics) {
      // CRITICAL FIX: Ensure values are proper numbers with explicit conversion
      const retailSpend = Number(retailMetrics.totalSpend || 0);
      const retailProfit = Number(retailMetrics.totalProfit || 0);
      const retailPacks = Number(retailMetrics.totalPacks || 0);
      const retailAccounts = Number(retailMetrics.totalAccounts || 0);
      
      console.log('Adding retail metrics:', {
        rawSpend: retailMetrics.totalSpend,
        convertedSpend: retailSpend,
        rawProfit: retailMetrics.totalProfit,
        convertedProfit: retailProfit
      });
      
      totalSpend += retailSpend;
      totalProfit += retailProfit;
      totalPacks += retailPacks;
      totalAccounts += retailAccounts;
    }
    
    // Add REVA metrics if included
    if (includeReva && revaMetrics) {
      // CRITICAL FIX: Ensure values are proper numbers with explicit conversion
      const revaSpend = Number(revaMetrics.totalSpend || 0);
      const revaProfit = Number(revaMetrics.totalProfit || 0);
      const revaPacks = Number(revaMetrics.totalPacks || 0);
      const revaAccounts = Number(revaMetrics.totalAccounts || 0);
      
      console.log('Adding REVA metrics:', {
        rawSpend: revaMetrics.totalSpend,
        convertedSpend: revaSpend,
        rawProfit: revaMetrics.totalProfit,
        convertedProfit: revaProfit
      });
      
      totalSpend += revaSpend;
      totalProfit += revaProfit;
      totalPacks += revaPacks;
      totalAccounts += revaAccounts;
    }
    
    // Add wholesale metrics if included
    if (includeWholesale && wholesaleMetrics) {
      // CRITICAL FIX: Ensure values are proper numbers with explicit conversion
      const wholesaleSpend = Number(wholesaleMetrics.totalSpend || 0);
      const wholesaleProfit = Number(wholesaleMetrics.totalProfit || 0);
      const wholesalePacks = Number(wholesaleMetrics.totalPacks || 0);
      const wholesaleAccounts = Number(wholesaleMetrics.totalAccounts || 0);
      
      console.log('Adding wholesale metrics:', {
        rawSpend: wholesaleMetrics.totalSpend,
        convertedSpend: wholesaleSpend,
        rawProfit: wholesaleMetrics.totalProfit,
        convertedProfit: wholesaleProfit
      });
      
      totalSpend += wholesaleSpend;
      totalProfit += wholesaleProfit;
      totalPacks += wholesalePacks;
      totalAccounts += wholesaleAccounts;
    }
    
    // Calculate margin from the combined values
    const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
    
    // Log computed metrics with extra visibility
    console.log('COMBINED METRICS FINAL:', {
      totalSpend,
      totalProfit,
      totalPacks,
      totalAccounts,
      averageMargin,
      includeRetail,
      includeReva,
      includeWholesale
    });
    
    return {
      totalSpend,
      totalProfit,
      totalPacks,
      totalAccounts,
      averageMargin
    };
  };
  
  // Calculate combined changes based on included departments
  const getCombinedChanges = () => {
    const { changes } = state;
    
    // Initialize with zeros
    let totalSpendChange = 0;
    let totalProfitChange = 0;
    let totalPacksChange = 0;
    let marginChange = 0;
    let countIncluded = 0;
    
    // CRITICAL FIX: Log raw change values before conversion
    console.log('Raw changes before combining:', {
      retailChanges: changes.retail,
      revaChanges: changes.reva,
      wholesaleChanges: changes.wholesale
    });
    
    // Add retail changes if included
    if (includeRetail && changes.retail) {
      // CRITICAL FIX: Ensure values are proper numbers with explicit conversion
      const retailSpendChange = Number(changes.retail.totalSpend || 0);
      const retailProfitChange = Number(changes.retail.totalProfit || 0);
      const retailPacksChange = Number(changes.retail.totalPacks || 0);
      const retailMarginChange = Number(changes.retail.averageMargin || 0);
      
      console.log('Adding retail changes:', {
        rawSpendChange: changes.retail.totalSpend,
        convertedSpendChange: retailSpendChange,
        rawProfitChange: changes.retail.totalProfit,
        convertedProfitChange: retailProfitChange
      });
      
      totalSpendChange += retailSpendChange;
      totalProfitChange += retailProfitChange;
      totalPacksChange += retailPacksChange;
      marginChange += retailMarginChange;
      countIncluded++;
    }
    
    // Add REVA changes if included
    if (includeReva && changes.reva) {
      // CRITICAL FIX: Ensure values are proper numbers with explicit conversion
      const revaSpendChange = Number(changes.reva.totalSpend || 0);
      const revaProfitChange = Number(changes.reva.totalProfit || 0);
      const revaPacksChange = Number(changes.reva.totalPacks || 0);
      const revaMarginChange = Number(changes.reva.averageMargin || 0);
      
      console.log('Adding REVA changes:', {
        rawSpendChange: changes.reva.totalSpend,
        convertedSpendChange: revaSpendChange,
        rawProfitChange: changes.reva.totalProfit,
        convertedProfitChange: revaProfitChange
      });
      
      totalSpendChange += revaSpendChange;
      totalProfitChange += revaProfitChange;
      totalPacksChange += revaPacksChange;
      marginChange += revaMarginChange;
      countIncluded++;
    }
    
    // Add wholesale changes if included
    if (includeWholesale && changes.wholesale) {
      // CRITICAL FIX: Ensure values are proper numbers with explicit conversion
      const wholesaleSpendChange = Number(changes.wholesale.totalSpend || 0);
      const wholesaleProfitChange = Number(changes.wholesale.totalProfit || 0);
      const wholesalePacksChange = Number(changes.wholesale.totalPacks || 0);
      const wholesaleMarginChange = Number(changes.wholesale.averageMargin || 0);
      
      console.log('Adding wholesale changes:', {
        rawSpendChange: changes.wholesale.totalSpend,
        convertedSpendChange: wholesaleSpendChange,
        rawProfitChange: changes.wholesale.totalProfit,
        convertedProfitChange: wholesaleProfitChange
      });
      
      totalSpendChange += wholesaleSpendChange;
      totalProfitChange += wholesaleProfitChange;
      totalPacksChange += wholesalePacksChange;
      marginChange += wholesaleMarginChange;
      countIncluded++;
    }
    
    // Average the changes if we have included departments
    if (countIncluded > 0) {
      totalSpendChange /= countIncluded;
      totalProfitChange /= countIncluded;
      totalPacksChange /= countIncluded;
      marginChange /= countIncluded;
    }
    
    // Log the computed changes for debugging
    console.log('COMBINED CHANGES FINAL:', {
      totalSpendChange,
      totalProfitChange,
      totalPacksChange,
      marginChange,
      countIncluded
    });
    
    return {
      totalSpend: totalSpendChange,
      totalProfit: totalProfitChange,
      totalPacks: totalPacksChange,
      averageMargin: marginChange
    };
  };
  
  // Get combined rep data based on department toggles
  const getCombinedRepData = () => {
    const { repData, revaData, wholesaleData } = state;
    
    // Start with a map to combine data by rep
    const repMap: Record<string, any> = {};
    
    // Add retail data if included
    if (includeRetail) {
      repData.forEach(data => {
        repMap[data.rep] = {
          rep: data.rep,
          spend: data.spend,
          profit: data.profit,
          packs: data.packs,
          activeAccounts: data.activeAccounts,
          totalAccounts: data.totalAccounts
        };
      });
    }
    
    // Add REVA data if included
    if (includeReva) {
      revaData.forEach(data => {
        if (!repMap[data.rep]) {
          repMap[data.rep] = {
            rep: data.rep,
            spend: 0,
            profit: 0,
            packs: 0,
            activeAccounts: 0,
            totalAccounts: 0
          };
        }
        
        repMap[data.rep].spend += data.spend;
        repMap[data.rep].profit += data.profit;
        repMap[data.rep].packs += data.packs;
        repMap[data.rep].activeAccounts += data.activeAccounts;
        repMap[data.rep].totalAccounts += data.totalAccounts;
      });
    }
    
    // Add wholesale data if included
    if (includeWholesale) {
      wholesaleData.forEach(data => {
        if (!repMap[data.rep]) {
          repMap[data.rep] = {
            rep: data.rep,
            spend: 0,
            profit: 0,
            packs: 0,
            activeAccounts: 0,
            totalAccounts: 0
          };
        }
        
        repMap[data.rep].spend += data.spend;
        repMap[data.rep].profit += data.profit;
        repMap[data.rep].packs += data.packs;
        repMap[data.rep].activeAccounts += data.activeAccounts;
        repMap[data.rep].totalAccounts += data.totalAccounts;
      });
    }
    
    // Calculate margins for combined data
    const combinedData = Object.values(repMap).map(data => ({
      ...data,
      margin: data.spend > 0 ? (data.profit / data.spend) * 100 : 0
    }));
    
    // Log combined rep data stats
    const totalSpend = combinedData.reduce((sum, rep) => sum + rep.spend, 0);
    const totalProfit = combinedData.reduce((sum, rep) => sum + rep.profit, 0);
    
    console.log('Combined rep data stats:', {
      repCount: combinedData.length,
      totalSpend,
      totalProfit
    });
    
    return combinedData;
  };
  
  // Sorting function for rep data
  const sortRepData = (data: RepPerformanceData[]) => {
    return [...data].sort((a, b) => {
      const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
      if (a[sortBy as keyof RepPerformanceData] < b[sortBy as keyof RepPerformanceData]) {
        return -1 * sortMultiplier;
      }
      if (a[sortBy as keyof RepPerformanceData] > b[sortBy as keyof RepPerformanceData]) {
        return 1 * sortMultiplier;
      }
      return 0;
    });
  };
  
  // Handle sorting changes
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  // Get previous value based on current value and percent change
  const getPreviousValue = (repName: string, metricType: string, currentValue: number) => {
    const change = state.repChanges[repName]?.[metricType];
    
    if (!change || Math.abs(change) < 0.1) {
      return currentValue;
    }
    
    if (metricType === 'margin') {
      return currentValue - change;
    }
    
    return currentValue / (1 + change / 100);
  };
  
  return {
    ...state,
    includeRetail,
    setIncludeRetail,
    includeReva,
    setIncludeReva,
    includeWholesale,
    setIncludeWholesale,
    sortBy,
    sortOrder,
    handleSort,
    combinedMetrics: getCombinedMetrics(),
    combinedChanges: getCombinedChanges(),
    availableMonths,
    combinedRepData: sortRepData(getCombinedRepData()),
    sortRepData,
    getPreviousValue,
    debugInfo
  };
};

export default useRealDataForTest; 