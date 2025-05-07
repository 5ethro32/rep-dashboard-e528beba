
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RepData, SalesDataItem, SummaryData } from '@/types/rep-performance.types';
import { 
  processRepData, 
  calculateSummaryFromData, 
  getCombinedRepData, 
  sortRepData 
} from '@/utils/rep-data-processing';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  defaultRepData,
  defaultRevaData,
  defaultWholesaleData,
  defaultBaseSummary,
  defaultRevaValues,
  defaultWholesaleValues,
  defaultSummaryChanges,
  defaultRepChanges
} from '@/data/rep-performance-default-data';

export const useRepPerformanceData = (selectedUserId: string | null = "all") => {
  const [baseRepData, setBaseRepData] = useState<RepData[]>([]);
  const [revaRepData, setRevaRepData] = useState<RepData[]>([]);
  const [wholesaleRepData, setWholesaleRepData] = useState<RepData[]>([]);
  const [febBaseRepData, setFebBaseRepData] = useState<RepData[]>([]);
  const [febRevaRepData, setFebRevaRepData] = useState<RepData[]>([]);
  const [febWholesaleRepData, setFebWholesaleRepData] = useState<RepData[]>([]);
  const [aprBaseRepData, setAprBaseRepData] = useState<RepData[]>([]);
  const [aprRevaRepData, setAprRevaRepData] = useState<RepData[]>([]);
  const [aprWholesaleRepData, setAprWholesaleRepData] = useState<RepData[]>([]);
  const [mayBaseRepData, setMayBaseRepData] = useState<RepData[]>([]);
  const [mayRevaRepData, setMayRevaRepData] = useState<RepData[]>([]);
  const [mayWholesaleRepData, setMayWholesaleRepData] = useState<RepData[]>([]);
  const [baseSummary, setBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [revaValues, setRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [wholesaleValues, setWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [febBaseSummary, setFebBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [febRevaValues, setFebRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [febWholesaleValues, setFebWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [aprBaseSummary, setAprBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [aprRevaValues, setAprRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [aprWholesaleValues, setAprWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [mayBaseSummary, setMayBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [mayRevaValues, setMayRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [mayWholesaleValues, setMayWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [baseData, setBaseData] = useState<SalesDataItem[]>([]);
  const [revaData, setRevaData] = useState<SalesDataItem[]>([]);
  const [wholesaleData, setWholesaleData] = useState<SalesDataItem[]>([]);
  const [febBaseData, setFebBaseData] = useState<SalesDataItem[]>([]);
  const [febRevaData, setFebRevaData] = useState<SalesDataItem[]>([]);
  const [febWholesaleData, setFebWholesaleData] = useState<SalesDataItem[]>([]);
  const [aprBaseData, setAprBaseData] = useState<SalesDataItem[]>([]);
  const [aprRevaData, setAprRevaData] = useState<SalesDataItem[]>([]);
  const [aprWholesaleData, setAprWholesaleData] = useState<SalesDataItem[]>([]);
  const [mayBaseData, setMayBaseData] = useState<SalesDataItem[]>([]);
  const [mayRevaData, setMayRevaData] = useState<SalesDataItem[]>([]);
  const [mayWholesaleData, setMayWholesaleData] = useState<SalesDataItem[]>([]);
  const [repChanges, setRepChanges] = useState<Record<string, any>>(defaultRepChanges);
  const [summaryChanges, setSummaryChanges] = useState<any>(defaultSummaryChanges);
  
  const { user } = useAuth();

  // Helper functions to compute values and filter data by user
  const filterDataByUser = useCallback((data: SalesDataItem[], userId: string | null = "all") => {
    if (!userId || userId === "all") {
      return data;
    }
    
    return data.filter(item => {
      // Access only properties that exist on SalesDataItem
      const repName = item.rep_name;
      return repName === userId;
    });
  }, []);

  // Load base data from mock or Supabase
  const loadDataFromSupabase = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch data from Supabase
      const { data: marchData, error: marchError } = await supabase
        .from('sales_data')
        .select('*')
        .eq('month', 'March');
        
      const { data: aprilData, error: aprilError } = await supabase
        .from('sales_data')
        .select('*')
         .eq('month', 'April');
         
      const { data: mayData, error: mayError } = await supabase
        .from('sales_data')
        .select('*')
        .eq('month', 'May');
        
      const { data: februaryData, error: februaryError } = await supabase
        .from('sales_data')
        .select('*')
        .eq('month', 'February');

      if (marchError || aprilError || mayError || februaryError) {
        throw new Error(marchError?.message || aprilError?.message || mayError?.message || februaryError?.message || 'Failed to load data from Supabase');
      }
      
      if (!marchData || !aprilData || !mayData || !februaryData) {
        console.warn('No data found in Supabase');
        setIsLoading(false);
        return;
      }
      
      // Assign data to the appropriate state variables
      const baseData = marchData;
      const aprBaseData = aprilData;
      const mayBaseData = mayData;
      const febBaseData = februaryData;
      
      // Filter REVA and Wholesale data
      const revaData = baseData.filter(item => item.rep_type === 'REVA');
      const wholesaleData = baseData.filter(item => item.rep_type === 'Wholesale');
      const febRevaData = febBaseData.filter(item => item.rep_type === 'REVA');
      const febWholesaleData = febBaseData.filter(item => item.rep_type === 'Wholesale');
      const aprRevaData = aprBaseData.filter(item => item.rep_type === 'REVA');
      const aprWholesaleData = aprBaseData.filter(item => item.rep_type === 'Wholesale');
      const mayRevaData = mayBaseData.filter(item => item.rep_type === 'REVA');
      const mayWholesaleData = mayBaseData.filter(item => item.rep_type === 'Wholesale');
      
      setBaseData(baseData);
      setRevaData(revaData);
      setWholesaleData(wholesaleData);
      setFebBaseData(febBaseData);
      setFebRevaData(febRevaData);
      setFebWholesaleData(febWholesaleData);
      setAprBaseData(aprBaseData);
      setAprRevaData(aprRevaData);
      setAprWholesaleData(aprWholesaleData);
      setMayBaseData(mayBaseData);
      setMayRevaData(mayRevaData);
      setMayWholesaleData(mayWholesaleData);
      
      // After loading data from Supabase, apply the user filter
      const filteredBaseData = filterDataByUser(baseData, selectedUserId);
      const filteredRevaData = filterDataByUser(revaData, selectedUserId);
      const filteredWholesaleData = filterDataByUser(wholesaleData, selectedUserId);
      const filteredFebBaseData = filterDataByUser(febBaseData, selectedUserId);
      const filteredFebRevaData = filterDataByUser(febRevaData, selectedUserId);
      const filteredFebWholesaleData = filterDataByUser(febWholesaleData, selectedUserId);
      const filteredAprBaseData = filterDataByUser(aprBaseData, selectedUserId);
      const filteredAprRevaData = filterDataByUser(aprRevaData, selectedUserId);
      const filteredAprWholesaleData = filterDataByUser(aprWholesaleData, selectedUserId);
      const filteredMayBaseData = filterDataByUser(mayBaseData, selectedUserId);
      const filteredMayRevaData = filterDataByUser(mayRevaData, selectedUserId);
      const filteredMayWholesaleData = filterDataByUser(mayWholesaleData, selectedUserId);
      
      // Process the filtered data
      const processedBaseData = processRepData(filteredBaseData);
      const processedRevaData = processRepData(filteredRevaData);
      const processedWholesaleData = processRepData(filteredWholesaleData);
      const processedFebBaseData = processRepData(filteredFebBaseData);
      const processedFebRevaData = processRepData(filteredFebRevaData);
      const processedFebWholesaleData = processRepData(filteredFebWholesaleData);
      const processedAprBaseData = processRepData(filteredAprBaseData);
      const processedAprRevaData = processRepData(filteredAprRevaData);
      const processedAprWholesaleData = processRepData(filteredAprWholesaleData);
      const processedMayBaseData = processRepData(filteredMayBaseData);
      const processedMayRevaData = processRepData(filteredMayRevaData);
      const processedMayWholesaleData = processRepData(filteredMayWholesaleData);

      setBaseRepData(processedBaseData);
      setRevaRepData(processedRevaData);
      setWholesaleRepData(processedWholesaleData);
      setFebBaseRepData(processedFebBaseData);
      setFebRevaRepData(processedFebRevaData);
      setFebWholesaleRepData(processedFebWholesaleData);
      setAprBaseRepData(processedAprBaseData);
      setAprRevaRepData(processedAprRevaData);
      setAprWholesaleRepData(processedAprWholesaleData);
      setMayBaseRepData(processedMayBaseData);
      setMayRevaRepData(processedMayRevaData);
      setMayWholesaleRepData(processedMayWholesaleData);

      // Calculate summaries from the processed data
      const baseSummaryData = calculateSummaryFromData(processedBaseData);
      const revaSummaryData = calculateSummaryFromData(processedRevaData);
      const wholesaleSummaryData = calculateSummaryFromData(processedWholesaleData);
      const febBaseSummaryData = calculateSummaryFromData(processedFebBaseData);
      const febRevaSummaryData = calculateSummaryFromData(processedFebRevaData);
      const febWholesaleSummaryData = calculateSummaryFromData(processedFebWholesaleData);
      const aprBaseSummaryData = calculateSummaryFromData(processedAprBaseData);
      const aprRevaSummaryData = calculateSummaryFromData(processedAprRevaData);
      const aprWholesaleSummaryData = calculateSummaryFromData(processedAprWholesaleData);
      const mayBaseSummaryData = calculateSummaryFromData(processedMayBaseData);
      const mayRevaSummaryData = calculateSummaryFromData(processedMayRevaData);
      const mayWholesaleSummaryData = calculateSummaryFromData(processedMayWholesaleData);

      setBaseSummary(baseSummaryData);
      setRevaValues(revaSummaryData);
      setWholesaleValues(wholesaleSummaryData);
      setFebBaseSummary(febBaseSummaryData);
      setFebRevaValues(febRevaSummaryData);
      setFebWholesaleValues(febWholesaleSummaryData);
      setAprBaseSummary(aprBaseSummaryData);
      setAprRevaValues(aprRevaSummaryData);
      setAprWholesaleValues(aprWholesaleSummaryData);
      setMayBaseSummary(mayBaseSummaryData);
      setMayRevaValues(mayRevaSummaryData);
      setMayWholesaleValues(mayWholesaleSummaryData);
      
      // Calculate changes
      const calculateChanges = (current: SummaryData, previous: SummaryData) => {
        return {
          totalSpend: previous.totalSpend !== 0 ? ((current.totalSpend - previous.totalSpend) / previous.totalSpend) * 100 : 0,
          totalProfit: previous.totalProfit !== 0 ? ((current.totalProfit - previous.totalProfit) / previous.totalProfit) * 100 : 0,
          averageMargin: previous.averageMargin !== 0 ? ((current.averageMargin - previous.averageMargin) / previous.averageMargin) * 100 : 0,
          totalPacks: previous.totalPacks !== 0 ? ((current.totalPacks - previous.totalPacks) / previous.totalPacks) * 100 : 0
        };
      };
      
      setSummaryChanges(calculateChanges(baseSummary, febBaseSummary));
      
      // Calculate rep changes
      const calculateRepChanges = (currentData: RepData[], previousData: RepData[]) => {
        const changes: Record<string, any> = {};
        
        currentData.forEach(currentRep => {
          const previousRep = previousData.find(rep => rep.rep === currentRep.rep);
          
          if (previousRep) {
            changes[currentRep.rep] = {
              spend: previousRep.spend !== 0 ? ((currentRep.spend - previousRep.spend) / previousRep.spend) * 100 : 0,
              profit: previousRep.profit !== 0 ? ((currentRep.profit - previousRep.profit) / previousRep.profit) * 100 : 0,
              margin: previousRep.margin !== 0 ? ((currentRep.margin - previousRep.margin) / previousRep.margin) * 100 : 0,
              packs: previousRep.packs !== 0 ? ((currentRep.packs - previousRep.packs) / previousRep.packs) * 100 : 0,
              activeAccounts: previousRep.activeAccounts !== 0 ? ((currentRep.activeAccounts - previousRep.activeAccounts) / previousRep.activeAccounts) * 100 : 0,
              totalAccounts: previousRep.totalAccounts !== 0 ? ((currentRep.totalAccounts - previousRep.totalAccounts) / previousRep.totalAccounts) * 100 : 0
            };
          }
        });
        
        return changes;
      };
      
      setRepChanges(calculateRepChanges(baseRepData, febBaseRepData));
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId, filterDataByUser]);

  useEffect(() => {
    loadDataFromSupabase();
  }, [loadDataFromSupabase]);

  const sortData = useCallback((data: any[]) => {
    return sortRepData(data, sortBy, sortOrder);
  }, [sortBy, sortOrder]);

  // GetActiveData function now accounts for user filtering
  const getActiveData = useCallback((tabValue: string, month: string = selectedMonth) => {
    let data: RepData[] = [];
    
    switch (month) {
      case 'February':
        switch (tabValue) {
          case 'overall':
            data = getCombinedRepData(
              febBaseRepData,
              febRevaRepData,
              febWholesaleRepData,
              includeRetail,
              includeReva,
              includeWholesale
            );
            break;
          case 'rep':
            data = febBaseRepData;
            break;
          case 'reva':
            data = febRevaRepData;
            break;
          case 'wholesale':
            data = febWholesaleRepData;
            break;
          default:
            data = [];
            break;
        }
        break;
      case 'April':
        switch (tabValue) {
          case 'overall':
            data = getCombinedRepData(
              aprBaseRepData,
              aprRevaRepData,
              aprWholesaleRepData,
              includeRetail,
              includeReva,
              includeWholesale
            );
            break;
          case 'rep':
            data = aprBaseRepData;
            break;
          case 'reva':
            data = aprRevaRepData;
            break;
          case 'wholesale':
            data = aprWholesaleRepData;
            break;
          default:
            data = [];
            break;
        }
        break;
      case 'May':
        switch (tabValue) {
          case 'overall':
            data = getCombinedRepData(
              mayBaseRepData,
              mayRevaRepData,
              mayWholesaleRepData,
              includeRetail,
              includeReva,
              includeWholesale
            );
            break;
          case 'rep':
            data = mayBaseRepData;
            break;
          case 'reva':
            data = mayRevaRepData;
            break;
          case 'wholesale':
            data = mayWholesaleRepData;
            break;
          default:
            data = [];
            break;
        }
        break;
      default:
        switch (tabValue) {
          case 'overall':
            data = getCombinedRepData(
              baseRepData,
              revaRepData,
              wholesaleRepData,
              includeRetail,
              includeReva,
              includeWholesale
            );
            break;
          case 'rep':
            data = baseRepData;
            break;
          case 'reva':
            data = revaRepData;
            break;
          case 'wholesale':
            data = wholesaleRepData;
            break;
          default:
            data = [];
            break;
        }
        break;
    }
    
    return data;
  }, [
    selectedMonth,
    includeRetail,
    includeReva,
    includeWholesale,
    baseRepData,
    revaRepData,
    wholesaleRepData,
    febBaseRepData,
    febRevaRepData,
    febWholesaleRepData,
    aprBaseRepData,
    aprRevaRepData,
    aprWholesaleRepData,
    mayBaseRepData,
    mayRevaRepData,
    mayWholesaleRepData
  ]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  const getFebValue = (repName: string, metricType: string, currentValue: number, changePercent: number) => {
    const febRep = febBaseRepData.find(rep => rep.rep === repName);
    if (!febRep) return 'No data';
    
    const previousValue = febRep[metricType as keyof RepData] as number;
    return previousValue ? previousValue.toString() : 'No data';
  };

  return {
    includeRetail,
    setIncludeRetail,
    includeReva,
    setIncludeReva,
    includeWholesale,
    setIncludeWholesale,
    sortBy,
    sortOrder,
    summary: baseSummary,
    summaryChanges,
    repChanges,
    getActiveData,
    sortData,
    handleSort,
    isLoading,
    loadDataFromSupabase,
    getFebValue,
    selectedMonth,
    setSelectedMonth,
    baseSummary,
    revaValues,
    wholesaleValues,
    aprBaseSummary,
    aprRevaValues,
    aprWholesaleValues,
    febBaseSummary,
    febRevaValues,
    febWholesaleValues,
    mayBaseSummary,
    mayRevaValues,
    mayWholesaleValues,
  };
};
