
import { RepData } from '@/types/rep-performance.types';

export const useComparisonData = (
  selectedMonth: string,
  aprRepData: RepData[] | undefined,
  marchRepData: RepData[] | undefined,
  febRepData: RepData[] | undefined
) => {
  const getCurrentAndPreviousData = (tab: string) => {
    // Ensure we have defined arrays to work with
    const safeAprRepData = aprRepData || [];
    const safeMarchRepData = marchRepData || [];
    const safeFebRepData = febRepData || [];

    const logDataValidation = (current: RepData[], previous: RepData[]) => {
      console.log(`Data validation for ${selectedMonth} comparison:`, {
        currentMonth: selectedMonth,
        previousMonth: selectedMonth === 'April' ? 'March' : selectedMonth === 'March' ? 'February' : 'None',
        tab,
        currentDataCount: current.length,
        previousDataCount: previous.length,
      });
    };

    const filterByDepartment = (data: RepData[], department: 'retail' | 'reva' | 'wholesale') => {
      switch (department) {
        case 'retail':
          return data.filter(d => !['REVA', 'Wholesale'].includes(d.rep));
        case 'reva':
          return data.filter(d => d.rep === 'REVA');
        case 'wholesale':
          return data.filter(d => d.rep === 'Wholesale');
      }
    };

    const getFilteredCurrentData = (rawData: RepData[]) => {
      switch (tab) {
        case 'rep':
          return filterByDepartment(rawData, 'retail');
        case 'reva':
          return filterByDepartment(rawData, 'reva');
        case 'wholesale':
          return filterByDepartment(rawData, 'wholesale');
        default:
          return rawData;
      }
    };

    // Debug function to track data across different stages
    const debugRepData = (stage: string, current: RepData[], previous: RepData[]) => {
      console.log(`[${stage}] Data validation for ${selectedMonth}, tab: ${tab}:`, {
        currentData: {
          total: current.length,
          retail: current.filter(d => !['REVA', 'Wholesale'].includes(d.rep)).length,
          reva: current.filter(d => d.rep === 'REVA').length,
          wholesale: current.filter(d => d.rep === 'Wholesale').length
        },
        previousData: {
          total: previous.length,
          retail: previous.filter(d => !['REVA', 'Wholesale'].includes(d.rep)).length,
          reva: previous.filter(d => d.rep === 'REVA').length,
          wholesale: previous.filter(d => d.rep === 'Wholesale').length
        }
      });
    };

    switch (selectedMonth) {
      case 'April': {
        const currentData = getFilteredCurrentData(safeAprRepData);
        const previousData = safeMarchRepData; // No filtering for previous data
        
        logDataValidation(currentData, previousData);
        debugRepData('April vs March', currentData, previousData);
        
        return { currentData, previousData };
      }
      case 'March': {
        const currentData = getFilteredCurrentData(safeMarchRepData);
        const previousData = safeFebRepData; // No filtering for previous data
        
        logDataValidation(currentData, previousData);
        debugRepData('March vs February', currentData, previousData);
        
        return { currentData, previousData };
      }
      case 'February': {
        const currentData = getFilteredCurrentData(safeFebRepData);
        logDataValidation(currentData, []);
        debugRepData('February (no comparison)', currentData, []);
        
        return {
          currentData,
          previousData: []
        };
      }
      default:
        return {
          currentData: [],
          previousData: []
        };
    }
  };

  return {
    getCurrentAndPreviousData
  };
};
