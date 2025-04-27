
import { RepData } from '@/types/rep-performance.types';
import { getCombinedRepData } from '@/utils/rep-data-processing';

export const useComparisonData = (
  selectedMonth: string,
  aprRepData: RepData[] | undefined,
  marchRepData: RepData[] | undefined,
  febRepData: RepData[] | undefined,
  aprRevaRepData: RepData[] | undefined,
  marchRevaRepData: RepData[] | undefined,
  febRevaRepData: RepData[] | undefined,
  aprWholesaleRepData: RepData[] | undefined,
  marchWholesaleRepData: RepData[] | undefined,
  febWholesaleRepData: RepData[] | undefined
) => {
  const getCurrentAndPreviousData = (tab: string) => {
    // Ensure we have defined arrays to work with
    const safeAprRepData = aprRepData || [];
    const safeAprRevaRepData = aprRevaRepData || [];
    const safeAprWholesaleRepData = aprWholesaleRepData || [];
    
    const safeMarchRepData = marchRepData || [];
    const safeMarchRevaRepData = marchRevaRepData || [];
    const safeMarchWholesaleRepData = marchWholesaleRepData || [];
    
    const safeFebRepData = febRepData || [];
    const safeFebRevaRepData = febRevaRepData || [];
    const safeFebWholesaleRepData = febWholesaleRepData || [];

    const logDataValidation = (stage: string, data: RepData[], filteredData: RepData[]) => {
      console.log(`[${stage}] Data validation:`, {
        monthAndTab: `${selectedMonth}-${tab}`,
        beforeFilter: {
          dataCount: data.length,
          retailCount: data.filter(d => !['REVA', 'Wholesale'].includes(d.rep)).length,
          revaCount: data.filter(d => d.rep === 'REVA').length,
          wholesaleCount: data.filter(d => d.rep === 'Wholesale').length
        },
        afterFilter: {
          dataCount: filteredData.length,
          retailCount: filteredData.filter(d => !['REVA', 'Wholesale'].includes(d.rep)).length,
          revaCount: filteredData.filter(d => d.rep === 'REVA').length,
          wholesaleCount: filteredData.filter(d => d.rep === 'Wholesale').length
        }
      });
    };

    // Helper function to filter data based on tab
    const filterDataByTab = (data: RepData[], tab: string): RepData[] => {
      switch (tab) {
        case 'rep':
          return data.filter(d => !['REVA', 'Wholesale'].includes(d.rep));
        case 'reva':
          return data.filter(d => d.rep === 'REVA');
        case 'wholesale':
          return data.filter(d => d.rep === 'Wholesale');
        default:
          return data;
      }
    };

    // Get combined and filtered data for current month
    const getCurrentData = () => {
      let combinedData: RepData[] = [];
      
      switch (selectedMonth) {
        case 'April':
          combinedData = getCombinedRepData(
            safeAprRepData,
            safeAprRevaRepData,
            safeAprWholesaleRepData,
            tab === 'overall' || tab === 'rep',
            tab === 'overall' || tab === 'reva',
            tab === 'overall' || tab === 'wholesale'
          );
          break;
        case 'March':
          combinedData = getCombinedRepData(
            safeMarchRepData,
            safeMarchRevaRepData,
            safeMarchWholesaleRepData,
            tab === 'overall' || tab === 'rep',
            tab === 'overall' || tab === 'reva',
            tab === 'overall' || tab === 'wholesale'
          );
          break;
        case 'February':
          combinedData = getCombinedRepData(
            safeFebRepData,
            safeFebRevaRepData,
            safeFebWholesaleRepData,
            tab === 'overall' || tab === 'rep',
            tab === 'overall' || tab === 'reva',
            tab === 'overall' || tab === 'wholesale'
          );
          break;
      }
      
      return filterDataByTab(combinedData, tab);
    };

    // Get combined and filtered data for previous month based on selected month
    const getPreviousData = () => {
      let combinedData: RepData[] = [];
      
      // For April, use march_rolling data instead of regular March data
      if (selectedMonth === 'April') {
        console.log('Using march_rolling data for April comparison');
        combinedData = getCombinedRepData(
          safeMarchRepData, // This should be march_rolling data
          safeMarchRevaRepData,
          safeMarchWholesaleRepData,
          tab === 'overall' || tab === 'rep',
          tab === 'overall' || tab === 'reva',
          tab === 'overall' || tab === 'wholesale'
        );
        
        // Log march_rolling data for validation
        console.log('March Rolling data validation:', {
          total: combinedData.length,
          retail: combinedData.filter(d => !['REVA', 'Wholesale'].includes(d.rep)).length,
          reva: combinedData.filter(d => d.rep === 'REVA').length,
          wholesale: combinedData.filter(d => d.rep === 'Wholesale').length
        });
      } else if (selectedMonth === 'March') {
        combinedData = getCombinedRepData(
          safeFebRepData,
          safeFebRevaRepData,
          safeFebWholesaleRepData,
          tab === 'overall' || tab === 'rep',
          tab === 'overall' || tab === 'reva',
          tab === 'overall' || tab === 'wholesale'
        );
      }
      
      return filterDataByTab(combinedData, tab);
    };

    const currentData = getCurrentData();
    const previousData = getPreviousData();

    // Log data for validation
    logDataValidation('Current Month', currentData, filterDataByTab(currentData, tab));
    logDataValidation('Previous Month', previousData, filterDataByTab(previousData, tab));

    // Debug specific rep data
    const debugRepData = (repName: string) => {
      const currentRep = currentData.find(d => d.rep === repName);
      const previousRep = previousData.find(d => d.rep === repName);
      
      if (currentRep || previousRep) {
        console.log(`[${selectedMonth}-${tab}] Data for ${repName}:`, {
          current: currentRep ? {
            profit: currentRep.profit,
            spend: currentRep.spend,
            packs: currentRep.packs,
            margin: currentRep.margin
          } : 'Not found',
          previous: previousRep ? {
            profit: previousRep.profit,
            spend: previousRep.spend,
            packs: previousRep.packs,
            margin: previousRep.margin
          } : 'Not found'
        });
      }
    };

    // Debug Craig McDowall's data specifically
    debugRepData('Craig McDowall');

    return { currentData, previousData };
  };

  return {
    getCurrentAndPreviousData
  };
};
