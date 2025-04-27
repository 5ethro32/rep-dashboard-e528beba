
import { RepData } from '@/types/rep-performance.types';

export const useComparisonData = (
  selectedMonth: string,
  aprRepData: RepData[],
  marchRepData: RepData[],
  febRepData: RepData[]
) => {
  const getCurrentAndPreviousData = (tab: string) => {
    switch (selectedMonth) {
      case 'April':
        return {
          currentData: aprRepData,
          previousData: marchRepData
        };
      case 'March':
        return {
          currentData: marchRepData,
          previousData: febRepData
        };
      case 'February':
        return {
          currentData: febRepData,
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
