import { useState, useEffect } from 'react';
import { calculateSummary } from '@/utils/rep-performance-utils';
import { toast } from '@/components/ui/use-toast';
import { getCombinedRepData, sortRepData } from '@/utils/rep-data-processing';
import { fetchRepPerformanceData, saveRepPerformanceData, loadStoredRepPerformanceData } from '@/services/rep-performance-service';
import { RepData, SummaryData, RepChangesRecord } from '@/types/rep-performance.types';
import { supabase } from '@/integrations/supabase/client';
import {
  defaultOverallData,
  defaultRepData,
  defaultRevaData,
  defaultWholesaleData,
  defaultBaseSummary,
  defaultRevaValues,
  defaultWholesaleValues,
  defaultSummaryChanges,
  defaultRepChanges
} from '@/data/rep-performance-default-data';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';

export const useRepPerformanceData = () => {
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [sortBy, setSortBy] = useState('profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('March');
  
  const [overallData, setOverallData] = useState(defaultOverallData);
  const [repData, setRepData] = useState(defaultRepData);
  const [revaData, setRevaData] = useState(defaultRevaData);
  const [wholesaleData, setWholesaleData] = useState(defaultWholesaleData);
  const [baseSummary, setBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [revaValues, setRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [wholesaleValues, setWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [febRepData, setFebRepData] = useState(defaultRepData);
  const [febRevaData, setFebRevaData] = useState(defaultRevaData);
  const [febWholesaleData, setFebWholesaleData] = useState(defaultWholesaleData);
  const [febBaseSummary, setFebBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [febRevaValues, setFebRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [febWholesaleValues, setFebWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  // Add April data states
  const [aprRepData, setAprRepData] = useState(defaultRepData);
  const [aprRevaData, setAprRevaData] = useState(defaultRevaData);
  const [aprWholesaleData, setAprWholesaleData] = useState(defaultWholesaleData);
  const [aprBaseSummary, setAprBaseSummary] = useState<SummaryData>(defaultBaseSummary);
  const [aprRevaValues, setAprRevaValues] = useState<SummaryData>(defaultRevaValues);
  const [aprWholesaleValues, setAprWholesaleValues] = useState<SummaryData>(defaultWholesaleValues);
  
  const [summaryChanges, setSummaryChanges] = useState(defaultSummaryChanges);
  const [repChanges, setRepChanges] = useState<RepChangesRecord>(defaultRepChanges);

  useEffect(() => {
    const storedData = loadStoredRepPerformanceData();
    
    if (storedData) {
      setOverallData(storedData.overallData || defaultOverallData);
      setRepData(storedData.repData || defaultRepData);
      setRevaData(storedData.revaData || defaultRevaData);
      setWholesaleData(storedData.wholesaleData || defaultWholesaleData);
      setBaseSummary(storedData.baseSummary || defaultBaseSummary);
      setRevaValues(storedData.revaValues || defaultRevaValues);
      setWholesaleValues(storedData.wholesaleValues || defaultWholesaleValues);
      
      setFebRepData(storedData.febRepData || defaultRepData);
      setFebRevaData(storedData.febRevaData || defaultRevaData);
      setFebWholesaleData(storedData.febWholesaleData || defaultWholesaleData);
      setFebBaseSummary(storedData.febBaseSummary || defaultBaseSummary);
      setFebRevaValues(storedData.febRevaValues || defaultRevaValues);
      setFebWholesaleValues(storedData.febWholesaleValues || defaultWholesaleValues);
      
      // Load April data if available
      setAprRepData(storedData.aprRepData || defaultRepData);
      setAprRevaData(storedData.aprRevaData || defaultRevaData);
      setAprWholesaleData(storedData.aprWholesaleData || defaultWholesaleData);
      setAprBaseSummary(storedData.aprBaseSummary || defaultBaseSummary);
      setAprRevaValues(storedData.aprRevaValues || defaultRevaValues);
      setAprWholesaleValues(storedData.aprWholesaleValues || defaultWholesaleValues);
      
      setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
      setRepChanges(storedData.repChanges || defaultRepChanges);
    }
    
    // If April is selected by default, load April data
    if (selectedMonth === 'April') {
      loadAprilData();
    }
  }, []);

  useEffect(() => {
    console.log("Recalculating combined data based on toggle changes:", { includeRetail, includeReva, includeWholesale, selectedMonth });

    // Use different data sources based on selectedMonth
    let currentRepData = repData;
    let currentRevaData = revaData;
    let currentWholesaleData = wholesaleData;
    
    if (selectedMonth === 'February') {
      currentRepData = febRepData;
      currentRevaData = febRevaData;
      currentWholesaleData = febWholesaleData;
    } else if (selectedMonth === 'April') {
      currentRepData = aprRepData;
      currentRevaData = aprRevaData;
      currentWholesaleData = aprWholesaleData;
    }
    
    const combinedData = getCombinedRepData(
      currentRepData,
      currentRevaData,
      currentWholesaleData,
      includeRetail,
      includeReva,
      includeWholesale
    );
    
    setOverallData(combinedData);

    // If showing February data, reverse the changes direction
    if (selectedMonth === 'February') {
      // Invert the change percentages
      const invertedChanges: Record<string, any> = {};
      Object.keys(repChanges).forEach(rep => {
        if (repChanges[rep]) {
          invertedChanges[rep] = {
            profit: repChanges[rep].profit ? -repChanges[rep].profit / (1 + repChanges[rep].profit / 100) * 100 : 0,
            spend: repChanges[rep].spend ? -repChanges[rep].spend / (1 + repChanges[rep].spend / 100) * 100 : 0,
            margin: -repChanges[rep].margin,
            packs: repChanges[rep].packs ? -repChanges[rep].packs / (1 + repChanges[rep].packs / 100) * 100 : 0,
            activeAccounts: repChanges[rep].activeAccounts ? -repChanges[rep].activeAccounts / (1 + repChanges[rep].activeAccounts / 100) * 100 : 0,
            totalAccounts: repChanges[rep].totalAccounts ? -repChanges[rep].totalAccounts / (1 + repChanges[rep].totalAccounts / 100) * 100 : 0
          };
        }
      });
      
      // Update summary changes by inverting them as well
      const invertedSummaryChanges = {
        totalSpend: summaryChanges.totalSpend ? -summaryChanges.totalSpend / (1 + summaryChanges.totalSpend / 100) * 100 : 0,
        totalProfit: summaryChanges.totalProfit ? -summaryChanges.totalProfit / (1 + summaryChanges.totalProfit / 100) * 100 : 0,
        averageMargin: -summaryChanges.averageMargin,
        totalPacks: summaryChanges.totalPacks ? -summaryChanges.totalPacks / (1 + summaryChanges.totalPacks / 100) * 100 : 0,
        totalAccounts: summaryChanges.totalAccounts ? -summaryChanges.totalAccounts / (1 + summaryChanges.totalAccounts / 100) * 100 : 0,
        activeAccounts: summaryChanges.activeAccounts ? -summaryChanges.activeAccounts / (1 + summaryChanges.activeAccounts / 100) * 100 : 0
      };
      
      // Temporarily update the changes when viewing February data
      // (but don't save them permanently)
      setSummaryChanges(invertedSummaryChanges);
      setRepChanges(invertedChanges);
    } else if (selectedMonth === 'April') {
      // For April, compare with March data
      // This is similar to the existing February logic but comparing April to March instead
      const aprilToMarchChanges: Record<string, any> = {};
      
      // Calculate changes from March to April for each rep
      Object.keys(repChanges).forEach(rep => {
        if (repChanges[rep]) {
          // Find rep in both April and March data
          const aprRep = combinedData.find(r => r.rep === rep);
          const marRep = getCombinedRepData(
            repData,
            revaData,
            wholesaleData,
            includeRetail,
            includeReva,
            includeWholesale
          ).find(r => r.rep === rep);
          
          if (aprRep && marRep) {
            // Calculate percentage changes
            const profitChange = marRep.profit > 0 ? ((aprRep.profit - marRep.profit) / marRep.profit) * 100 : 0;
            const spendChange = marRep.spend > 0 ? ((aprRep.spend - marRep.spend) / marRep.spend) * 100 : 0;
            const marginChange = aprRep.margin - marRep.margin;
            const packsChange = marRep.packs > 0 ? ((aprRep.packs - marRep.packs) / marRep.packs) * 100 : 0;
            const activeAccountsChange = marRep.activeAccounts > 0 ? 
              ((aprRep.activeAccounts - marRep.activeAccounts) / marRep.activeAccounts) * 100 : 0;
            const totalAccountsChange = marRep.totalAccounts > 0 ? 
              ((aprRep.totalAccounts - marRep.totalAccounts) / marRep.totalAccounts) * 100 : 0;
            
            aprilToMarchChanges[rep] = {
              profit: profitChange,
              spend: spendChange,
              margin: marginChange,
              packs: packsChange,
              activeAccounts: activeAccountsChange,
              totalAccounts: totalAccountsChange
            };
          }
        }
      });
      
      // Calculate summary changes from March to April
      const aprSummary = calculateSummary(
        aprBaseSummary,
        aprRevaValues,
        aprWholesaleValues,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      const marSummary = calculateSummary(
        baseSummary,
        revaValues,
        wholesaleValues,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      const aprilSummaryChanges = {
        totalSpend: marSummary.totalSpend > 0 ? 
          ((aprSummary.totalSpend - marSummary.totalSpend) / marSummary.totalSpend) * 100 : 0,
        totalProfit: marSummary.totalProfit > 0 ? 
          ((aprSummary.totalProfit - marSummary.totalProfit) / marSummary.totalProfit) * 100 : 0,
        averageMargin: aprSummary.averageMargin - marSummary.averageMargin,
        totalPacks: marSummary.totalPacks > 0 ? 
          ((aprSummary.totalPacks - marSummary.totalPacks) / marSummary.totalPacks) * 100 : 0,
        totalAccounts: marSummary.totalAccounts > 0 ? 
          ((aprSummary.totalAccounts - marSummary.totalAccounts) / marSummary.totalAccounts) * 100 : 0,
        activeAccounts: marSummary.activeAccounts > 0 ? 
          ((aprSummary.activeAccounts - marSummary.activeAccounts) / marSummary.activeAccounts) * 100 : 0
      };
      
      // Update the changes for April view
      setSummaryChanges(aprilSummaryChanges);
      setRepChanges(aprilToMarchChanges);
    } else {
      // Restore original changes from stored data when viewing March
      const storedData = loadStoredRepPerformanceData();
      if (storedData) {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
      }
    }
  }, [includeRetail, includeReva, includeWholesale, selectedMonth, repData, revaData, wholesaleData, febRepData, febRevaData, febWholesaleData, aprRepData, aprRevaData, aprWholesaleData]);

  // Load April data from mtd_daily
  const loadAprilData = async () => {
    setIsLoading(true);
    try {
      // Fetch data from mtd_daily table
      const { data: mtdData, error: mtdError } = await supabase
        .from('mtd_daily')
        .select('*');
      
      if (mtdError) throw new Error(`Error fetching April data: ${mtdError.message}`);
      
      if (!mtdData || mtdData.length === 0) {
        toast({
          title: "No April data found",
          description: "The MTD Daily table appears to be empty.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
      
      console.log('Fetched April MTD records:', mtdData.length);
      
      // Transform mtd_daily data to match expected format
      const transformData = (data: any[]): RepData[] => {
        // Group by Rep
        const repMap = new Map<string, RepData>();
        
        data.forEach(item => {
          const repName = item.Rep;
          const department = item.Department || 'RETAIL';
          
          if (!repName) return;
          
          if (!repMap.has(repName)) {
            repMap.set(repName, {
              rep: repName,
              spend: 0,
              profit: 0,
              packs: 0,
              margin: 0,
              activeAccounts: 0,
              totalAccounts: 0
            });
          }
          
          const currentRep = repMap.get(repName)!;
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
          
          currentRep.spend += spend;
          currentRep.profit += profit;
          currentRep.packs += packs;
          
          // Track unique accounts
          if (item["Account Ref"]) {
            currentRep.totalAccounts += 1;
            if (spend > 0) {
              currentRep.activeAccounts += 1;
            }
          }
          
          // Update margin after spend and profit are updated
          currentRep.margin = currentRep.spend > 0 ? (currentRep.profit / currentRep.spend) * 100 : 0;
          
          repMap.set(repName, currentRep);
        });
        
        return Array.from(repMap.values());
      };
      
      // Group data by department
      const retailData = mtdData.filter(item => !item.Department || item.Department === 'RETAIL');
      const revaData = mtdData.filter(item => item.Department === 'REVA');
      const wholesaleData = mtdData.filter(item => 
        item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
      );
      
      // Transform data by department
      const aprRetailData = transformData(retailData);
      const aprRevaData = transformData(revaData);
      const aprWholesaleData = transformData(wholesaleData);
      
      // Calculate summary values for each department
      const calculateDeptSummary = (data: any[]): SummaryData => {
        let totalSpend = 0;
        let totalProfit = 0;
        let totalPacks = 0;
        const accountsSet = new Set<string>();
        const activeAccountsSet = new Set<string>();
        
        data.forEach(item => {
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
          
          totalSpend += spend;
          totalProfit += profit;
          totalPacks += packs;
          
          if (item["Account Ref"]) {
            accountsSet.add(item["Account Ref"]);
            if (spend > 0) {
              activeAccountsSet.add(item["Account Ref"]);
            }
          }
        });
        
        return {
          totalSpend,
          totalProfit,
          totalPacks,
          totalAccounts: accountsSet.size,
          activeAccounts: activeAccountsSet.size,
          averageMargin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0
        };
      };
      
      const aprRetailSummary = calculateDeptSummary(retailData);
      const aprRevaSummary = calculateDeptSummary(revaData);
      const aprWholesaleSummary = calculateDeptSummary(wholesaleData);
      
      // Set April data states
      setAprRepData(aprRetailData);
      setAprRevaData(aprRevaData);
      setAprWholesaleData(aprWholesaleData);
      setAprBaseSummary(aprRetailSummary);
      setAprRevaValues(aprRevaSummary);
      setAprWholesaleValues(aprWholesaleSummary);
      
      // Combine all April data
      const combinedAprilData = getCombinedRepData(
        aprRetailData,
        aprRevaData,
        aprWholesaleData,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      // Save April data to localStorage
      const currentData = loadStoredRepPerformanceData() || {};
      saveRepPerformanceData({
        ...currentData,
        aprRepData: aprRetailData,
        aprRevaData: aprRevaData,
        aprWholesaleData: aprWholesaleData,
        aprBaseSummary: aprRetailSummary,
        aprRevaValues: aprRevaSummary,
        aprWholesaleValues: aprWholesaleSummary
      });
      
      if (selectedMonth === 'April') {
        setOverallData(combinedAprilData);
      }
      
      toast({
        title: "April data loaded successfully",
        description: "April MTD data has been loaded from the mtd_daily table.",
      });
      
      return true;
    } catch (error) {
      console.error('Error loading April data:', error);
      toast({
        title: "Error loading April data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      if (selectedMonth === 'April') {
        return await loadAprilData();
      }
      
      const data = await fetchRepPerformanceData();
      
      setRepData(data.repData);
      setRevaData(data.revaData);
      setWholesaleData(data.wholesaleData);
      
      setBaseSummary({
        totalSpend: data.baseSummary.totalSpend,
        totalProfit: data.baseSummary.totalProfit,
        totalPacks: data.baseSummary.totalPacks,
        totalAccounts: data.baseSummary.totalAccounts,
        activeAccounts: data.baseSummary.activeAccounts,
        averageMargin: data.baseSummary.averageMargin
      });
      
      setRevaValues({
        totalSpend: data.revaValues.totalSpend,
        totalProfit: data.revaValues.totalProfit,
        totalPacks: data.revaValues.totalPacks,
        totalAccounts: data.revaValues.totalAccounts,
        activeAccounts: data.revaValues.activeAccounts,
        averageMargin: data.revaValues.averageMargin
      });
      
      setWholesaleValues({
        totalSpend: data.wholesaleValues.totalSpend,
        totalProfit: data.wholesaleValues.totalProfit,
        totalPacks: data.wholesaleValues.totalPacks,
        totalAccounts: data.wholesaleValues.totalAccounts,
        activeAccounts: data.wholesaleValues.activeAccounts,
        averageMargin: data.wholesaleValues.averageMargin
      });
      
      setFebRepData(data.febRepData);
      setFebRevaData(data.febRevaData);
      setFebWholesaleData(data.febWholesaleData);
      
      setFebBaseSummary({
        totalSpend: data.febBaseSummary.totalSpend,
        totalProfit: data.febBaseSummary.totalProfit,
        totalPacks: data.febBaseSummary.totalPacks,
        totalAccounts: data.febBaseSummary.totalAccounts,
        activeAccounts: data.febBaseSummary.activeAccounts,
        averageMargin: data.febBaseSummary.averageMargin
      });
      
      setFebRevaValues({
        totalSpend: data.febRevaValues.totalSpend,
        totalProfit: data.febRevaValues.totalProfit,
        totalPacks: data.febRevaValues.totalPacks,
        totalAccounts: data.febRevaValues.totalAccounts,
        activeAccounts: data.febRevaValues.activeAccounts,
        averageMargin: data.febRevaValues.averageMargin
      });
      
      setFebWholesaleValues({
        totalSpend: data.febWholesaleValues.totalSpend,
        totalProfit: data.febWholesaleValues.totalProfit,
        totalPacks: data.febWholesaleValues.totalPacks,
        totalAccounts: data.febWholesaleValues.totalAccounts,
        activeAccounts: data.febWholesaleValues.activeAccounts,
        averageMargin: data.febWholesaleValues.averageMargin
      });
      
      setSummaryChanges({
        totalSpend: data.summaryChanges.totalSpend,
        totalProfit: data.summaryChanges.totalProfit,
        totalPacks: data.summaryChanges.totalPacks,
        averageMargin: data.summaryChanges.averageMargin,
        totalAccounts: data.summaryChanges.totalAccounts || 0,
        activeAccounts: data.summaryChanges.activeAccounts || 0
      });
      
      setRepChanges(data.repChanges);
      
      const combinedData = getCombinedRepData(
        data.repData,
        data.revaData,
        data.wholesaleData,
        includeRetail,
        includeReva,
        includeWholesale
      );
      setOverallData(combinedData);

      saveRepPerformanceData({
        overallData: combinedData,
        repData: data.repData,
        revaData: data.revaData,
        wholesaleData: data.wholesaleData,
        baseSummary: data.baseSummary,
        revaValues: data.revaValues,
        wholesaleValues: data.wholesaleValues,
        
        febRepData: data.febRepData,
        febRevaData: data.febRevaData,
        febWholesaleData: data.febWholesaleData,
        febBaseSummary: data.febBaseSummary,
        febRevaValues: data.febRevaValues,
        febWholesaleValues: data.febWholesaleValues,
        
        summaryChanges: data.summaryChanges,
        repChanges: data.repChanges
      });

      // Load April data as well
      await loadAprilData();
      
      console.log("Successfully loaded data from Supabase");
      toast({
        title: "Data loaded successfully",
        description: "The latest performance data has been loaded with comparison data.",
      });
      return true;
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveData = (tabValue: string) => {
    // Use different data sources based on selectedMonth
    let currentRepData = repData;
    let currentRevaData = revaData;
    let currentWholesaleData = wholesaleData;
    
    if (selectedMonth === 'February') {
      currentRepData = febRepData;
      currentRevaData = febRevaData;
      currentWholesaleData = febWholesaleData;
    } else if (selectedMonth === 'April') {
      currentRepData = aprRepData;
      currentRevaData = aprRevaData;
      currentWholesaleData = aprWholesaleData;
    }
    
    switch (tabValue) {
      case 'rep':
        return includeRetail ? currentRepData : [];
      case 'reva':
        return includeReva ? currentRevaData : [];
      case 'wholesale':
        return includeWholesale ? currentWholesaleData : [];
      case 'overall':
      default:
        return overallData;
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortData = (data: RepData[]) => {
    return sortRepData(data, sortBy, sortOrder);
  };

  // Calculate summary based on selected month
  const summary = calculateSummary(
    selectedMonth === 'March' ? baseSummary : 
    selectedMonth === 'February' ? febBaseSummary : aprBaseSummary,
    selectedMonth === 'March' ? revaValues : 
    selectedMonth === 'February' ? febRevaValues : aprRevaValues,
    selectedMonth === 'March' ? wholesaleValues : 
    selectedMonth === 'February' ? febWholesaleValues : aprWholesaleValues,
    includeRetail,
    includeReva, 
    includeWholesale
  );

  console.log("Current summary values:", summary);
  console.log("Current summary changes:", summaryChanges);

  const getFebValue = (repName: string, metricType: string, currentValue: number, changePercent: number) => {
    if (!repName || Math.abs(changePercent) < 0.1) return '';
    
    // For February, we use March data to show comparison
    // For April, we use March data to show comparison
    const comparisonRepData = 
      selectedMonth === 'March' ? febRepData : 
      selectedMonth === 'April' ? repData : febRepData;
      
    const comparisonRevaData = 
      selectedMonth === 'March' ? febRevaData : 
      selectedMonth === 'April' ? revaData : febRevaData;
      
    const comparisonWholesaleData = 
      selectedMonth === 'March' ? febWholesaleData : 
      selectedMonth === 'April' ? wholesaleData : febWholesaleData;
    
    let previousValue = 0;
    
    switch (metricType) {
      case 'spend':
        previousValue = (comparisonRetailRep?.spend || 0) + 
                        (includeReva ? (comparisonRevaRep?.spend || 0) : 0) + 
                        (includeWholesale ? (comparisonWholesaleRep?.spend || 0) : 0);
        return formatCurrency(previousValue);
        
      case 'profit':
        previousValue = (comparisonRetailRep?.profit || 0) + 
                        (includeReva ? (comparisonRevaRep?.profit || 0) : 0) + 
                        (includeWholesale ? (comparisonWholesaleRep?.profit || 0) : 0);
        return formatCurrency(previousValue);
        
      case 'margin':
        const totalComparisonSpend = (comparisonRetailRep?.spend || 0) + 
                             (includeReva ? (comparisonRevaRep?.spend || 0) : 0) + 
                             (includeWholesale ? (comparisonWholesaleRep?.spend || 0) : 0);
                             
        const totalComparisonProfit = (comparisonRetailRep?.profit || 0) + 
                              (includeReva ? (comparisonRevaRep?.profit || 0) : 0) + 
                              (includeWholesale ? (comparisonWholesaleRep?.profit || 0) : 0);
                              
        previousValue = totalComparisonSpend > 0 ? (totalComparisonProfit / totalComparisonSpend) * 100 : 0;
        return formatPercent(previousValue);
        
      case 'packs':
        previousValue = (comparisonRetailRep?.packs || 0) + 
                        (includeReva ? (comparisonRevaRep?.packs || 0) : 0) + 
                        (includeWholesale ? (comparisonWholesaleRep?.packs || 0) : 0);
        return formatNumber(previousValue);
        
      case 'activeAccounts':
        previousValue = (comparisonRetailRep?.activeAccounts || 0) + 
                        (includeReva ? (comparisonRevaRep?.activeAccounts || 0) : 0) + 
                        (includeWholesale ? (comparisonWholesaleRep?.activeAccounts || 0) : 0);
        return formatNumber(previousValue);
        
      default:
        return '';
    }
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
    
    summary,
    summaryChanges,
    repChanges,
    
    getActiveData,
    sortData,
    handleSort,
    loadDataFromSupabase,
    isLoading,
    getFebValue,
    selectedMonth,
    setSelectedMonth
  };
};
