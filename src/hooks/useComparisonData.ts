
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

    const logDataValidation = (stage: string, data: RepData[]) => {
      console.log(`[${stage}] Data validation:`, {
        monthAndTab: `${selectedMonth}-${tab}`,
        dataCount: data.length,
        retailCount: data.filter(d => !['REVA', 'Wholesale'].includes(d.rep)).length,
        revaCount: data.filter(d => d.rep === 'REVA').length,
        wholesaleCount: data.filter(d => d.rep === 'Wholesale').length
      });
    };

    // Get combined data for current month
    const getCurrentData = () => {
      let combinedData: RepData[] = [];
      
      switch (selectedMonth) {
        case 'April':
          combinedData = getCombinedRepData(
            safeAprRepData,
            safeAprRevaRepData,
            safeAprWholesaleRepData,
            true, true, true
          );
          break;
        case 'March':
          combinedData = getCombinedRepData(
            safeMarchRepData,
            safeMarchRevaRepData,
            safeMarchWholesaleRepData,
            true, true, true
          );
          break;
        case 'February':
          combinedData = getCombinedRepData(
            safeFebRepData,
            safeFebRevaRepData,
            safeFebWholesaleRepData,
            true, true, true
          );
          break;
      }
      
      // Filter by department after combining
      switch (tab) {
        case 'rep':
          return combinedData.filter(d => !['REVA', 'Wholesale'].includes(d.rep));
        case 'reva':
          return combinedData.filter(d => d.rep === 'REVA');
        case 'wholesale':
          return combinedData.filter(d => d.rep === 'Wholesale');
        default:
          return combinedData;
      }
    };

    // Get combined data for previous month
    const getPreviousData = () => {
      switch (selectedMonth) {
        case 'April':
          return getCombinedRepData(
            safeMarchRepData,
            safeMarchRevaRepData,
            safeMarchWholesaleRepData,
            true, true, true
          );
        case 'March':
          return getCombinedRepData(
            safeFebRepData,
            safeFebRevaRepData,
            safeFebWholesaleRepData,
            true, true, true
          );
        default:
          return [];
      }
    };

    const currentData = getCurrentData();
    const previousData = getPreviousData();

    // Log data for validation
    logDataValidation('Current Month', currentData);
    logDataValidation('Previous Month', previousData);

    // Debug specific rep data
    const debugRepData = (repName: string) => {
      const currentRep = currentData.find(d => d.rep === repName);
      const previousRep = previousData.find(d => d.rep === repName);
      
      if (currentRep || previousRep) {
        console.log(`Data for ${repName}:`, {
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
