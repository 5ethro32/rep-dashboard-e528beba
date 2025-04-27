
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
        currentDataCount: current.length,
        previousDataCount: previous.length,
      });
    };

    const filterForTab = (data: RepData[]) => {
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

    // Debug Craig's data consistently across all comparisons
    const debugRepData = (current: RepData[], previous: RepData[]) => {
      const craigCurrent = current.find(rep => rep.rep === 'Craig McDowall');
      const craigPrevious = previous.find(rep => rep.rep === 'Craig McDowall');
      console.log(`Comparison data for ${selectedMonth}:`, {
        tab,
        craigCurrentData: craigCurrent ? {
          rep: craigCurrent.rep,
          profit: craigCurrent.profit,
          spend: craigCurrent.spend
        } : 'Not found in current data',
        craigPreviousData: craigPrevious ? {
          rep: craigPrevious.rep,
          profit: craigPrevious.profit,
          spend: craigPrevious.spend
        } : 'Not found in previous data'
      });
    };

    switch (selectedMonth) {
      case 'April': {
        // Use the same logic as March comparison - filter current data only
        const currentData = filterForTab(safeAprRepData);
        const previousData = safeMarchRepData; // No filtering on comparison data
        logDataValidation(currentData, previousData);
        debugRepData(currentData, previousData);
        return { currentData, previousData };
      }
      case 'March': {
        const currentData = filterForTab(safeMarchRepData);
        const previousData = safeFebRepData; // Already using this pattern here
        logDataValidation(currentData, previousData);
        debugRepData(currentData, previousData);
        return { currentData, previousData };
      }
      case 'February': {
        const currentData = filterForTab(safeFebRepData);
        logDataValidation(currentData, []);
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
