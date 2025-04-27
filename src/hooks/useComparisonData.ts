
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
