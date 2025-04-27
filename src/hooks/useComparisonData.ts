
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

    // Debug Craig's data
    const craigCurrentData = safeAprRepData.find(rep => rep.rep === 'Craig McDowall');
    const craigPreviousData = safeMarchRepData.find(rep => rep.rep === 'Craig McDowall');
    
    console.log(`Tab: ${tab}, Craig's current data:`, craigCurrentData);
    console.log(`Tab: ${tab}, Craig's previous data:`, craigPreviousData);
    
    switch (selectedMonth) {
      case 'April':
        return {
          currentData: safeAprRepData,
          previousData: safeMarchRepData
        };
      case 'March':
        return {
          currentData: safeMarchRepData,
          previousData: safeFebRepData
        };
      case 'February':
        return {
          currentData: safeFebRepData,
          previousData: []
        };
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
