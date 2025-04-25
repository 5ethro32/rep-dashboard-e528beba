import { useState, useEffect } from 'react';
import { calculateSummary, calculateDeptSummary } from '@/utils/rep-performance-utils';
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
      if (repChanges) {
        setRepChanges(repChanges);
      }
      
      if (summaryChanges) {
        setSummaryChanges(summaryChanges);
      }
    } else {
      const storedData = loadStoredRepPerformanceData();
      if (storedData) {
        setSummaryChanges(storedData.summaryChanges || defaultSummaryChanges);
        setRepChanges(storedData.repChanges || defaultRepChanges);
      }
    }
  }, [includeRetail, includeReva, includeWholesale, selectedMonth, repData, revaData, wholesaleData, febRepData, febRevaData, febWholesaleData, aprRepData, aprRevaData, aprWholesaleData]);

  const loadAprilData = async () => {
    setIsLoading(true);
    try {
      console.group('Loading April Data Using Direct SQL');
      console.log('Getting MTD Daily and March Rolling data with direct SQL bypass...');
      
      // Use direct SQL to get ALL MTD records without pagination
      const { data: mtdDataDirect, error: mtdDirectError } = await supabase.rpc('fetch_all_mtd_data');
      
      if (mtdDirectError) {
        console.error('Direct SQL error for MTD data:', mtdDirectError);
        
        // Fall back to chunked approach as a last resort
        console.log('Attempting chunked data loading as fallback...');
        let allMtdData: any[] = [];
        let offset = 0;
        const chunkSize = 5000;
        let hasMore = true;
        
        while (hasMore) {
          const { data: chunkData, error: chunkError } = await supabase
            .from('mtd_daily')
            .select('*')
            .range(offset, offset + chunkSize - 1);
          
          if (chunkError) {
            console.error(`Error fetching chunk at offset ${offset}:`, chunkError);
            break;
          }
          
          if (chunkData && chunkData.length > 0) {
            allMtdData = [...allMtdData, ...chunkData];
            offset += chunkSize;
            console.log(`Loaded chunk of ${chunkData.length} records, total: ${allMtdData.length}`);
            
            if (chunkData.length < chunkSize) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        
        console.log(`Chunked loading completed with ${allMtdData.length} total MTD records`);
        
        // Load March Rolling data using same chunked approach
        let allMarchRollingData: any[] = [];
        offset = 0;
        hasMore = true;
        
        while (hasMore) {
          const { data: chunkData, error: chunkError } = await supabase
            .from('march_rolling')
            .select('*')
            .range(offset, offset + chunkSize - 1);
          
          if (chunkError) {
            console.error(`Error fetching March Rolling chunk at offset ${offset}:`, chunkError);
            break;
          }
          
          if (chunkData && chunkData.length > 0) {
            allMarchRollingData = [...allMarchRollingData, ...chunkData];
            offset += chunkSize;
            console.log(`Loaded March Rolling chunk of ${chunkData.length} records, total: ${allMarchRollingData.length}`);
            
            if (chunkData.length < chunkSize) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        
        console.log(`Chunked loading completed with ${allMarchRollingData.length} total March Rolling records`);
        
        // If we got data from our chunked approach, use it
        if (allMtdData.length > 0) {
          toast({
            title: "Chunked data loading successful",
            description: `Loaded ${allMtdData.length} April MTD records and ${allMarchRollingData.length} March Rolling records using chunked loading.`,
          });
          
          // Process the chunked data
          const retailData = allMtdData.filter(item => !item.Department || item.Department === 'RETAIL');
          const revaData = allMtdData.filter(item => item.Department === 'REVA');
          const wholesaleData = allMtdData.filter(item => 
            item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
          );
          
          const transformData = (data: any[], isDepartmentData = false): RepData[] => {
            console.log(`Transforming ${data.length} records`);
            const repMap = new Map<string, {
              rep: string;
              spend: number;
              profit: number;
              packs: number;
              activeAccounts: Set<string>;
              totalAccounts: Set<string>;
              profitPerActiveShop: number;
              profitPerPack: number;
              activeRatio: number;
            }>();
            
            data.forEach(item => {
              let repName;
              
              if (isDepartmentData && item['Sub-Rep'] && item['Sub-Rep'].trim() !== '') {
                repName = item['Sub-Rep'];
              } else if (item.Rep === 'REVA' || item.Rep === 'Wholesale' || item.Rep === 'WHOLESALE') {
                return;
              } else {
                repName = item.Rep;
              }
              
              if (!repName) {
                console.log('Found item without Rep name:', item);
                return;
              }
              
              if (!repMap.has(repName)) {
                repMap.set(repName, {
                  rep: repName,
                  spend: 0,
                  profit: 0,
                  packs: 0,
                  activeAccounts: new Set(),
                  totalAccounts: new Set(),
                  profitPerActiveShop: 0,
                  profitPerPack: 0,
                  activeRatio: 0
                });
              }
              
              const currentRep = repMap.get(repName)!;
              
              const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
              const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
              const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
              
              currentRep.spend += spend;
              currentRep.profit += profit;
              currentRep.packs += packs;
              
              if (item["Account Ref"]) {
                currentRep.totalAccounts.add(item["Account Ref"]);
                if (spend > 0) {
                  currentRep.activeAccounts.add(item["Account Ref"]);
                }
              }
              
              repMap.set(repName, currentRep);
            });
            
            console.log(`Transformed data into ${repMap.size} unique reps`);
            return Array.from(repMap.values()).map(rep => {
              const margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
              
              return {
                rep: rep.rep,
                spend: rep.spend,
                profit: rep.profit,
                margin: margin,
                packs: rep.packs,
                activeAccounts: rep.activeAccounts.size,
                totalAccounts: rep.totalAccounts.size,
                profitPerActiveShop: rep.profitPerActiveShop,
                profitPerPack: rep.profitPerPack,
                activeRatio: rep.activeRatio
              };
            }).filter(rep => {
              return rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0;
            });
          };
          
          const aprRetailData = transformData(retailData);
          const aprRevaData = transformData(revaData, true);
          const aprWholesaleData = transformData(wholesaleData, true);
          
          const marchRetailData = allMarchRollingData?.filter(item => !item.Department || item.Department === 'RETAIL') || [];
          const marchRevaData = allMarchRollingData?.filter(item => item.Department === 'REVA') || [];
          const marchWholesaleData = allMarchRollingData?.filter(item => 
            item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
          ) || [];

          const marchRetailRepData = transformData(marchRetailData);
          const marchRevaRepData = transformData(marchRevaData, true);
          const marchWholesaleRepData = transformData(marchWholesaleData, true);
          
          console.log(`Transformed Rep Data - Retail: ${aprRetailData.length}, REVA: ${aprRevaData.length}, Wholesale: ${aprWholesaleData.length}`);
          console.log(`Transformed March Rep Data - Retail: ${marchRetailRepData.length}, REVA: ${marchRevaRepData.length}, Wholesale: ${marchWholesaleRepData.length}`);
          
          const aprRetailSummary = calculateDeptSummary(retailData);
          const aprRevaSummary = calculateDeptSummary(revaData);
          const aprWholesaleSummary = calculateDeptSummary(wholesaleData);
          
          const marchRetailSummary = calculateDeptSummary(marchRetailData);
          const marchRevaSummary = calculateDeptSummary(marchRevaData);
          const marchWholesaleSummary = calculateDeptSummary(marchWholesaleData);
          
          console.log('April Department Summaries:');
          console.log('Retail:', aprRetailSummary);
          console.log('REVA:', aprRevaSummary);
          console.log('Wholesale:', aprWholesaleSummary);
          
          console.log('March Department Summaries:');
          console.log('Retail:', marchRetailSummary);
          console.log('REVA:', marchRevaSummary);
          console.log('Wholesale:', marchWholesaleSummary);
          
          setAprRepData(aprRetailData);
          setAprRevaData(aprRevaData);
          setAprWholesaleData(aprWholesaleData);
          setAprBaseSummary(aprRetailSummary);
          setAprRevaValues(aprRevaSummary);
          setAprWholesaleValues(aprWholesaleSummary);
          
          const calculateChanges = (aprData: RepData[], marchData: RepData[]): RepChangesRecord => {
            const changes: RepChangesRecord = {};
            
            aprData.forEach(aprRep => {
              const marchRep = marchData.find(r => r.rep === aprRep.rep);
              
              if (marchRep) {
                changes[aprRep.rep] = {
                  profit: marchRep.profit > 0 ? ((aprRep.profit - marchRep.profit) / marchRep.profit) * 100 : 0,
                  spend: marchRep.spend > 0 ? ((aprRep.spend - marchRep.spend) / marchRep.spend) * 100 : 0,
                  margin: aprRep.margin - marchRep.margin,
                  packs: marchRep.packs > 0 ? ((aprRep.packs - marchRep.packs) / marchRep.packs) * 100 : 0,
                  activeAccounts: marchRep.activeAccounts > 0 ? ((aprRep.activeAccounts - marchRep.activeAccounts) / marchRep.activeAccounts) * 100 : 0,
                  totalAccounts: marchRep.totalAccounts > 0 ? ((aprRep.totalAccounts - marchRep.totalAccounts) / marchRep.totalAccounts) * 100 : 0,
                  profitPerActiveShop: marchRep.profitPerActiveShop > 0 ? 
                    ((aprRep.profitPerActiveShop - marchRep.profitPerActiveShop) / marchRep.profitPerActiveShop) * 100 : 0,
                  profitPerPack: marchRep.profitPerPack > 0 ? 
                    ((aprRep.profitPerPack - marchRep.profitPerPack) / marchRep.profitPerPack) * 100 : 0,
                  activeRatio: marchRep.activeRatio > 0 ? 
                    aprRep.activeRatio - marchRep.activeRatio : 0
                };
              }
            });
            
            return changes;
          };
          
          const aprAllData = getCombinedRepData(
            aprRetailData,
            aprRevaData,
            aprWholesaleData,
            true, true, true
          );
          
          const marchAllData = getCombinedRepData(
            marchRetailRepData,
            marchRevaRepData,
            marchWholesaleRepData,
            true, true, true
          );
          
          const aprilMarchChanges = calculateChanges(aprAllData, marchAllData);
          
          const aprSummary = calculateSummary(
            aprRetailSummary,
            aprRevaSummary,
            aprWholesaleSummary,
            true, true, true
          );
          
          const marchSummary = calculateSummary(
            marchRetailSummary,
            marchRevaSummary,
            marchWholesaleSummary,
            true, true, true
          );
          
          const aprilSummaryChanges = {
            totalSpend: marchSummary.totalSpend > 0 ? 
              ((aprSummary.totalSpend - marchSummary.totalSpend) / marchSummary.totalSpend) * 100 : 0,
            totalProfit: marchSummary.totalProfit > 0 ? 
              ((aprSummary.totalProfit - marchSummary.totalProfit) / marchSummary.totalProfit) * 100 : 0,
            averageMargin: aprSummary.averageMargin - marchSummary.averageMargin,
            totalPacks: marchSummary.totalPacks > 0 ? 
              ((aprSummary.totalPacks - marchSummary.totalPacks) / marchSummary.totalPacks) * 100 : 0,
            totalAccounts: marchSummary.totalAccounts > 0 ? 
              ((aprSummary.totalAccounts - marchSummary.totalAccounts) / marchSummary.totalAccounts) * 100 : 0,
            activeAccounts: marchSummary.activeAccounts > 0 ? 
              ((aprSummary.activeAccounts - marchSummary.activeAccounts) / marchSummary.activeAccounts) * 100 : 0
          };
          
          if (selectedMonth === 'April') {
            setRepChanges(aprilMarchChanges);
            setSummaryChanges(aprilSummaryChanges);
          }
          
          const combinedAprilData = getCombinedRepData(
            aprRetailData,
            aprRevaData,
            aprWholesaleData,
            includeRetail,
            includeReva,
            includeWholesale
          );
          
          console.log('Combined April Data length:', combinedAprilData.length);
          console.log('Combined April Total Profit:', combinedAprilData.reduce((sum, item) => sum + item.profit, 0));
          
          const currentData = loadStoredRepPerformanceData() || {};
          saveRepPerformanceData({
            ...currentData,
            aprRepData: aprRetailData,
            aprRevaData: aprRevaData,
            aprWholesaleData: aprWholesaleData,
            aprBaseSummary: aprRetailSummary,
            aprRevaValues: aprRevaSummary,
            aprWholesaleValues: aprWholesaleSummary,
            marchRollingRetailData: marchRetailRepData,
            marchRollingRevaData: marchRevaRepData,
            marchRollingWholesaleData: marchWholesaleRepData,
            marchRollingRetailSummary: marchRetailSummary,
            marchRollingRevaSummary: marchRevaSummary,
            marchRollingWholesaleSummary: marchWholesaleSummary,
            aprilMarchChanges: aprilMarchChanges,
            aprilSummaryChanges: aprilSummaryChanges
          });
          
          if (selectedMonth === 'April') {
            setOverallData(combinedAprilData);
          }
          
          toast({
            title: "April data loaded successfully",
            description: `Loaded ${allMtdData.length} April MTD records and ${allMarchRollingData.length} March Rolling records using chunked loading.`,
          });
          
          console.groupEnd();
          setIsLoading(false);
          return true;
        }
        
        // If chunked approach failed to get any data, show error
        toast({
          title: "Error loading April data",
          description: "All methods to bypass the 1000 record limit failed. Please contact support.",
          variant: "destructive",
        });
        console.groupEnd();
        setIsLoading(false);
        return false;
      }
      
      const mtdRecordCount = mtdDataDirect?.length || 0;
      console.log(`Direct SQL MTD query returned ${mtdRecordCount} records`);
      
      // Load March Rolling data using direct SQL
      const { data: marchRollingDataDirect, error: marchRollingDirectError } = await supabase.rpc('fetch_all_march_rolling_data');
      
      if (marchRollingDirectError) {
        console.error('Direct SQL error for March Rolling data:', marchRollingDirectError);
        // Fall back to regular API method with high limit
        const { data: marchRollingData, error: marchRollingError } = await supabase
          .from('march_rolling')
          .select('*')
          .limit(100000); // Explicitly set a very high limit to override default 1000
        
        if (marchRollingError) {
          console.error('Error fetching March Rolling data:', marchRollingError);
          throw new Error(`Error getting March Rolling data: ${marchRollingError.message}`);
        }
        
        const mtdRecordCount = mtdDataDirect?.length || 0;
        console.log(`MTD Daily full data fetch - Records found: ${mtdRecordCount}`);
        
        // If no mtd data is found, show error
        if (!mtdDataDirect || mtdDataDirect.length === 0) {
          console.warn('No records retrieved from MTD Daily table');
          
          toast({
            title: "No April data found",
            description: "The MTD Daily table appears to be empty. Using March data instead.",
            variant: "destructive",
          });
          setIsLoading(false);
          return false;
        }
        
        console.log('Fetched all April MTD records total count:', mtdDataDirect.length);
        console.log('Sample MTD data:', mtdDataDirect.slice(0, 3));
        
        // Process the April data
        const retailData = mtdDataDirect.filter(item => !item.Department || item.Department === 'RETAIL');
        const revaData = mtdDataDirect.filter(item => item.Department === 'REVA');
        const wholesaleData = mtdDataDirect.filter(item => 
          item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
        );
        
        console.log(`April data breakdown - Retail: ${retailData.length}, REVA: ${revaData.length}, Wholesale: ${wholesaleData.length}`);
        
        const transformData = (data: any[], isDepartmentData = false): RepData[] => {
          console.log(`Transforming ${data.length} records`);
          const repMap = new Map<string, {
            rep: string;
            spend: number;
            profit: number;
            packs: number;
            activeAccounts: Set<string>;
            totalAccounts: Set<string>;
            profitPerActiveShop: number;
            profitPerPack: number;
            activeRatio: number;
          }>();
          
          data.forEach(item => {
            let repName;
            
            if (isDepartmentData && item['Sub-Rep'] && item['Sub-Rep'].trim() !== '') {
              repName = item['Sub-Rep'];
            } else if (item.Rep === 'REVA' || item.Rep === 'Wholesale' || item.Rep === 'WHOLESALE') {
              return;
            } else {
              repName = item.Rep;
            }
            
            if (!repName) {
              console.log('Found item without Rep name:', item);
              return;
            }
            
            if (!repMap.has(repName)) {
              repMap.set(repName, {
                rep: repName,
                spend: 0,
                profit: 0,
                packs: 0,
                activeAccounts: new Set(),
                totalAccounts: new Set(),
                profitPerActiveShop: 0,
                profitPerPack: 0,
                activeRatio: 0
              });
            }
            
            const currentRep = repMap.get(repName)!;
            
            const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
            const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
            const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
            
            currentRep.spend += spend;
            currentRep.profit += profit;
            currentRep.packs += packs;
            
            if (item["Account Ref"]) {
              currentRep.totalAccounts.add(item["Account Ref"]);
              if (spend > 0) {
                currentRep.activeAccounts.add(item["Account Ref"]);
              }
            }
            
            repMap.set(repName, currentRep);
          });
          
          console.log(`Transformed data into ${repMap.size} unique reps`);
          return Array.from(repMap.values()).map(rep => {
            const margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
            
            return {
              rep: rep.rep,
              spend: rep.spend,
              profit: rep.profit,
              margin: margin,
              packs: rep.packs,
              activeAccounts: rep.activeAccounts.size,
              totalAccounts: rep.totalAccounts.size,
              profitPerActiveShop: rep.profitPerActiveShop,
              profitPerPack: rep.profitPerPack,
              activeRatio: rep.activeRatio
            };
          }).filter(rep => {
            return rep.spend > 0 || rep.profit > 0 || rep.packs > 0 || rep.activeAccounts > 0;
          });
        };
        
        const aprRetailData = transformData(retailData);
        const aprRevaData = transformData(revaData, true);
        const aprWholesaleData = transformData(wholesaleData, true);
        
        const marchRetailData = marchRollingData?.filter(item => !item.Department || item.Department === 'RETAIL') || [];
        const marchRevaData = marchRollingData?.filter(item => item.Department === 'REVA') || [];
        const marchWholesaleData = marchRollingData?.filter(item => 
          item.Department === 'Wholesale' || item.Department === 'WHOLESALE'
        ) || [];

        const marchRetailRepData = transformData(marchRetailData);
        const marchRevaRepData = transformData(marchRevaData, true);
        const marchWholesaleRepData = transformData(marchWholesaleData, true);
        
        console.log(`Transformed Rep Data - Retail: ${aprRetailData.length}, REVA: ${aprRevaData.length}, Wholesale: ${aprWholesaleData.length}`);
        console.log(`Transformed March Rep Data - Retail: ${marchRetailRepData.length}, REVA: ${marchRevaRepData.length}, Wholesale: ${marchWholesaleRepData.length}`);
        
        const aprRetailSummary = calculateDeptSummary(retailData);
        const aprRevaSummary = calculateDeptSummary(revaData);
        const aprWholesaleSummary = calculateDeptSummary(wholesaleData);
        
        const marchRetailSummary = calculateDeptSummary(marchRetailData);
        const marchRevaSummary = calculateDeptSummary(marchRevaData);
        const marchWholesaleSummary = calculateDeptSummary(marchWholesaleData);
        
        console.log('April Department Summaries:');
        console.log('Retail:', aprRetailSummary);
        console.log('REVA:', aprRevaSummary);
        console.log('Wholesale:', aprWholesaleSummary);
        
        console.log('March Department Summaries:');
        console.log('Retail:', marchRetailSummary);
        console.log('REVA:', marchRevaSummary);
        console.log('Wholesale:', marchWholesaleSummary);
        
        setAprRepData(aprRetailData);
        setAprRevaData(aprRevaData);
        setAprWholesaleData(aprWholesaleData);
        setAprBaseSummary(aprRetailSummary);
        setAprRevaValues(aprRevaSummary);
        setAprWholesaleValues(aprWholesaleSummary);
        
        const calculateChanges = (aprData: RepData[], marchData: RepData[]): RepChangesRecord => {
          const changes: RepChangesRecord = {};
          
          aprData.forEach(aprRep => {
            const marchRep = marchData.find(r => r.rep === aprRep.rep);
            
            if (marchRep) {
              changes[aprRep.rep] = {
                profit: marchRep.profit > 0 ? ((aprRep.profit - marchRep.profit) / marchRep.profit) * 100 : 0,
                spend: marchRep.spend > 0 ? ((aprRep.spend - marchRep.spend) / marchRep.spend) * 100 : 0,
                margin: aprRep.margin - marchRep.margin,
                packs: marchRep.packs > 0 ? ((aprRep.packs - marchRep.packs) / marchRep.packs) * 100 : 0,
                activeAccounts: marchRep.activeAccounts > 0 ? ((aprRep.activeAccounts - marchRep.activeAccounts) / marchRep.activeAccounts) * 100 : 0,
                totalAccounts: marchRep.totalAccounts > 0 ? ((aprRep.totalAccounts - marchRep.totalAccounts) / marchRep.
