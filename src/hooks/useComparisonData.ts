
import { RepData } from '@/types/rep-performance.types';

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
  febWholesaleRepData: RepData[] | undefined,
  marchRollingRetailData?: RepData[],
  marchRollingRevaData?: RepData[],
  marchRollingWholesaleData?: RepData[]
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
    
    const safeMarchRollingRetailData = marchRollingRetailData || [];
    const safeMarchRollingRevaData = marchRollingRevaData || [];
    const safeMarchRollingWholesaleData = marchRollingWholesaleData || [];

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

    // Get current month's data
    let currentData: RepData[] = [];
    let previousData: RepData[] = [];
    
    switch (selectedMonth) {
      case 'April':
        switch (tab) {
          case 'overall':
            currentData = [...safeAprRepData, ...safeAprRevaRepData, ...safeAprWholesaleRepData];
            previousData = [...safeMarchRollingRetailData, ...safeMarchRollingRevaData, ...safeMarchRollingWholesaleData];
            break;
          case 'rep':
            currentData = safeAprRepData;
            previousData = safeMarchRollingRetailData;
            break;
          case 'reva':
            currentData = safeAprRevaRepData;
            previousData = safeMarchRollingRevaData;
            break;
          case 'wholesale':
            currentData = safeAprWholesaleRepData;
            previousData = safeMarchRollingWholesaleData;
            break;
        }
        break;
        
      case 'March':
        switch (tab) {
          case 'overall':
            currentData = [...safeMarchRepData, ...safeMarchRevaRepData, ...safeMarchWholesaleRepData];
            previousData = [...safeFebRepData, ...safeFebRevaRepData, ...safeFebWholesaleRepData];
            break;
          case 'rep':
            currentData = safeMarchRepData;
            previousData = safeFebRepData;
            break;
          case 'reva':
            currentData = safeMarchRevaRepData;
            previousData = safeFebRevaRepData;
            break;
          case 'wholesale':
            currentData = safeMarchWholesaleRepData;
            previousData = safeFebWholesaleRepData;
            break;
        }
        break;
        
      case 'February':
        currentData = safeFebRepData;
        previousData = [];
        break;
    }
    
    // Log data for validation
    logDataValidation('Current Month', currentData, currentData);
    logDataValidation('Previous Month', previousData, previousData);
    
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
