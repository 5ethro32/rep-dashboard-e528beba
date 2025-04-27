
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

    const getFilteredPreviousData = (rawData: RepData[]) => {
      // For previous month data, we apply the same department filtering
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

    // Debug function to track Craig's data across different stages
    const debugRepData = (stage: string, current: RepData[], previous: RepData[]) => {
      const craigCurrent = current.find(rep => rep.rep === 'Craig McDowall');
      const craigPrevious = previous.find(rep => rep.rep === 'Craig McDowall');
      
      console.log(`[${stage}] Comparison data for ${selectedMonth}, tab: ${tab}:`, {
        craigCurrentData: craigCurrent ? {
          rep: craigCurrent.rep,
          profit: craigCurrent.profit,
          spend: craigCurrent.spend,
          packs: craigCurrent.packs,
        } : 'Not found in current data',
        craigPreviousData: craigPrevious ? {
          rep: craigPrevious.rep,
          profit: craigPrevious.profit,
          spend: craigPrevious.spend,
          packs: craigPrevious.packs,
        } : 'Not found in previous data'
      });
    };

    switch (selectedMonth) {
      case 'April': {
        const currentData = getFilteredCurrentData(safeAprRepData);
        const previousData = getFilteredPreviousData(safeMarchRepData);
        
        logDataValidation(currentData, previousData);
        debugRepData('April vs March', currentData, previousData);
        
        return { currentData, previousData };
      }
      case 'March': {
        const currentData = getFilteredCurrentData(safeMarchRepData);
        const previousData = getFilteredPreviousData(safeFebRepData);
        
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
