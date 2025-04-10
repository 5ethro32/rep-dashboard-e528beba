import { useState, useEffect } from 'react';
import { calculateSummary, calculateDeptSummary, loadDataFromSupabase as loadDataUtil } from '@/utils/rep-performance-utils';
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
  const [selectedMonth, setSelectedMonth] = useState('April');
  
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
      
      setAprRepData(storedData.aprRepData || defaultRepData);
      setAprRevaData(storedData.aprRevaData || defaultRevaData);
      setAprWholesaleData(storedData.aprWholesaleData || defaultWholesaleData);
      setAprBaseSummary(storedData.aprBaseSummary || defaultBaseSummary);
      setAprRevaValues(storedData.aprRevaValues || defaultRevaValues);
      setAprWholesaleValues(storedData.aprWholesaleValues || defaultWholesaleValues);
      
      setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
      setRepChanges(storedData.repChanges || defaultRepChanges);
    }
    
    loadAprilData();
  }, []);

  useEffect(() => {
    console.log("Recalculating combined data based on toggle changes:", { includeRetail, includeReva, includeWholesale, selectedMonth });

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
      
      // Log April data for debugging
      if (currentRepData.length > 0 || currentRevaData.length > 0 || currentWholesaleData.length > 0) {
        console.log("April data counts:", {
          repDataCount: currentRepData.length,
          revaDataCount: currentRevaData.length,
          wholesaleDataCount: currentWholesaleData.length
        });
        
        // Calculate April totals directly for verification
        const aprRetailTotal = includeRetail ? currentRepData.reduce((sum, item) => sum + item.profit, 0) : 0;
        const aprRevaTotal = includeReva ? currentRevaData.reduce((sum, item) => sum + item.profit, 0) : 0;
        const aprWholesaleTotal = includeWholesale ? currentWholesaleData.reduce((sum, item) => sum + item.profit, 0) : 0;
        const aprDirectTotal = aprRetailTotal + aprRevaTotal + aprWholesaleTotal;
        
        console.log("April direct profit calculations:", {
          aprRetailTotal,
          aprRevaTotal,
          aprWholesaleTotal,
          aprDirectTotal
        });
      }
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

    if (selectedMonth === 'February') {
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
      
      const invertedSummaryChanges = {
        totalSpend: summaryChanges.totalSpend ? -summaryChanges.totalSpend / (1 + summaryChanges.totalSpend / 100) * 100 : 0,
        totalProfit: summaryChanges.totalProfit ? -summaryChanges.totalProfit / (1 + summaryChanges.totalProfit / 100) * 100 : 0,
        averageMargin: -summaryChanges.averageMargin,
        totalPacks: summaryChanges.totalPacks ? -summaryChanges.totalPacks / (1 + summaryChanges.totalPacks / 100) * 100 : 0,
        totalAccounts: summaryChanges.totalAccounts ? -summaryChanges.totalAccounts / (1 + summaryChanges.totalAccounts / 100) * 100 : 0,
        activeAccounts: summaryChanges.activeAccounts ? -summaryChanges.activeAccounts / (1 + summaryChanges.activeAccounts / 100) * 100 : 0
      };
      
      setSummaryChanges(invertedSummaryChanges);
      setRepChanges(invertedChanges);
    } else if (selectedMonth === 'April') {
      const aprilToMarchChanges: Record<string, any> = {};
      
      Object.keys(repChanges).forEach(rep => {
        if (repChanges[rep]) {
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
      
      // Calculate current summary for April with active filters
      const aprSummary = calculateSummary(
        aprBaseSummary,
        aprRevaValues,
        aprWholesaleValues,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      // Calculate March summary with active filters
      const marSummary = calculateSummary(
        baseSummary,
        revaValues,
        wholesaleValues,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      // Log the summary calculations for debugging
      console.log("April summary calculations:", {
        aprSummary,
        marSummary,
        aprBaseSummary,
        aprRevaValues,
        aprWholesaleValues,
        includeRetail,
        includeReva,
        includeWholesale
      });
      
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
      
      setSummaryChanges(aprilSummaryChanges);
      setRepChanges(aprilToMarchChanges);
    } else {
      const storedData = loadStoredRepPerformanceData();
      if (storedData) {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
      }
    }
  }, [includeRetail, includeReva, includeWholesale, selectedMonth, repData, revaData, wholesaleData, febRepData, febRevaData, febWholesaleData, aprRepData, aprRevaData, aprWholesaleData]);

  const getActiveData = (tabValue: string) => {
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
      
      // Debug the April data
      console.log("April data used in getActiveData:", {
        repData: aprRepData,
        revaData: aprRevaData,
        wholesaleData: aprWholesaleData
      });
      
      // Calculate April total profit from data sources
      const aprTotalProfit = aprRepData.reduce((sum, item) => sum + item.profit, 0) +
                           aprRevaData.reduce((sum, item) => sum + item.profit, 0) +
                           aprWholesaleData.reduce((sum, item) => sum + item.profit, 0);
      console.log("Calculated April profit from source data:", aprTotalProfit);
    }
    
    // For April data, always recalculate the combined data to ensure consistency
    if (selectedMonth === 'April') {
      const aprCombinedData = getCombinedRepData(
        currentRepData,
        currentRevaData,
        currentWholesaleData,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
      // Log the combined data total profit
      const aprCombinedProfit = aprCombinedData.reduce((sum, item) => sum + item.profit, 0);
      console.log(`April combined data for ${tabValue} tab - total profit:`, aprCombinedProfit);
      
      switch (tabValue) {
        case 'rep':
          return includeRetail ? currentRepData : [];
        case 'reva':
          return includeReva ? currentRevaData : [];
        case 'wholesale':
          return includeWholesale ? currentWholesaleData : [];
        case 'overall':
        default:
          return aprCombinedData;
      }
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

  const getFebValue = (repName: string, metricType: string, currentValue: number, changePercent: number) => {
    if (!repName || Math.abs(changePercent) < 0.1) return '';
    
    const comparisonRepData = 
      selectedMonth === 'March' ? febRepData : 
      selectedMonth === 'April' ? repData : febRepData;
      
    const comparisonRevaData = 
      selectedMonth === 'March' ? febRevaData : 
      selectedMonth === 'April' ? revaData : febRevaData;
      
    const comparisonWholesaleData = 
      selectedMonth === 'March' ? febWholesaleData : 
      selectedMonth === 'April' ? wholesaleData : febWholesaleData;
    
    const comparisonRetailRep = comparisonRepData.find(r => r.rep === repName);
    const comparisonRevaRep = comparisonRevaData.find(r => r.rep === repName);
    const comparisonWholesaleRep = comparisonWholesaleData.find(r => r.rep === repName);
    
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

  const loadAprilData = async () => {
    setIsLoading(true);
    try {
      const { count, error: countError } = await supabase
        .from('mtd_daily')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw new Error(`Error getting count: ${countError.message}`);
      
      if (!count || count === 0) {
        toast({
          title: "No April data found",
          description: "The MTD Daily table appears to be empty.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
      
      console.log(`Found ${count} total records in mtd_daily`);
      
      let allRecords = [];
      const pageSize = 1000;
      const pages = Math.ceil(count / pageSize);
      
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('mtd_daily')
          .select('*')
          .range(from, to);
        
        if (pageError) throw new Error(`Error fetching page ${page}: ${pageError.message}`);
        if (pageData) allRecords = [...allRecords, ...pageData];
        
        console.log(`Fetched page ${page + 1}/${pages} with ${pageData?.length || 0} records`);
      }
      
      const mtdData = allRecords;
      
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
      
      const transformData = (data: any[]): RepData[] => {
        const repMap = new Map<string, RepData>();
        
        console.log(`Processing ${data.length} raw April sales data items`);
        
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
              totalAccounts: 0,
              profitPerActiveShop: 0,
              profitPerPack: 0,
              activeRatio: 0
            });
          }
          
          const currentRep = repMap.get(repName)!;
          
          // Ensure consistent handling of numeric values
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          const packs = typeof item.Packs === 'string' ? parseInt(item.Packs) : Number(item.Packs || 0);
          
          // Log data for debugging for some samples
          if (repName === 'Craig McDowall' || repName === 'Michael McKay') {
            console.log(`April data for ${repName}:`, { spend, profit, packs });
          }
          
          currentRep.spend += spend;
          currentRep.profit += profit;
          currentRep.packs += packs;
          
          if (item["Account Ref"]) {
            currentRep.totalAccounts += 1;
            if (spend > 0) {
              currentRep.activeAccounts += 1;
            }
          }
          
          // Update the rep with new values
          repMap.set(repName, currentRep);
        });
        
        // Calculate derived metrics after all data is processed
        return Array.from(repMap.values()).map(rep => {
          // Calculate margin after all spending is summed
          rep.margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
          rep.profitPerActiveShop = rep.activeAccounts > 0 ? rep.profit / rep.activeAccounts : 0;
          rep.profitPerPack = rep.packs > 0 ? rep.profit / rep.packs : 0;
          rep.activeRatio = rep.totalAccounts > 0 ? (rep.activeAccounts / rep.totalAccounts) * 100 : 0;
          return rep;
        });
      };
      
      const retailData = mtdData.filter(item => !item.Department || item.Department === 'RETAIL');
      const revaData = mtdData.filter(item => item.Department === 'REVA');
      const wholesaleData = mtdData.filter(item => 
        item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
      );
      
      console.log("April data breakdown by department:", {
        retailCount: retailData.length,
        revaCount: revaData.length,
        wholesaleCount: wholesaleData.length
      });
      
      const aprRetailData = transformData(retailData);
      const aprRevaData = transformData(revaData);
      const aprWholesaleData = transformData(wholesaleData);
      
      // Calculate total profit by department for verification
      const retailProfit = aprRetailData.reduce((sum, item) => sum + item.profit, 0);
      const revaProfit = aprRevaData.reduce((sum, item) => sum + item.profit, 0);
      const wholesaleProfit = aprWholesaleData.reduce((sum, item) => sum + item.profit, 0);
      const totalProfit = retailProfit + revaProfit + wholesaleProfit;
      
      console.log("April profit by department:", {
        retailProfit,
        revaProfit,
        wholesaleProfit,
        totalProfit
      });
      
      const aprRetailSummary = calculateDeptSummary(retailData);
      const aprRevaSummary = calculateDeptSummary(revaData);
      const aprWholesaleSummary = calculateDeptSummary(wholesaleData);
      
      // Verify the summary calculations match our calculated totals
      console.log("April summary calculations:", {
        retailSummary: aprRetailSummary,
        revaSummary: aprRevaSummary,
        wholesaleSummary: aprWholesaleSummary,
        combinedProfit: aprRetailSummary.totalProfit + aprRevaSummary.totalProfit + aprWholesaleSummary.totalProfit
      });
      
      setAprRepData(aprRetailData);
      setAprRevaData(aprRevaData);
      setAprWholesaleData(aprWholesaleData);
      setAprBaseSummary(aprRetailSummary);
      setAprRevaValues(aprRevaSummary);
      setAprWholesaleValues(aprWholesaleSummary);
      
      const combinedAprilData = getCombinedRepData(
        aprRetailData,
        aprRevaData,
        aprWholesaleData,
        includeRetail,
        includeReva,
        includeWholesale
      );
      
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
        description: `Loaded ${mtdData.length} April MTD records from the database.`,
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
    loadDataFromSupabase: loadAprilData,
    isLoading,
    getFebValue,
    selectedMonth,
    setSelectedMonth
  };
};
