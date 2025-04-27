
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
    const craigPreviousData = tab === 'overall' && selectedMonth === 'April' ? 
      safeMarchRepData.find(rep => rep.rep === 'Craig McDowall') :
      safeMarchRepData.find(rep => rep.rep === 'Craig McDowall');
    
    console.log(`Tab: ${tab}, Month: ${selectedMonth}, Craig's current data:`, craigCurrentData);
    console.log(`Tab: ${tab}, Month: ${selectedMonth}, Craig's previous data:`, craigPreviousData);
    
    switch (selectedMonth) {
      case 'April':
        // Now using sales_data (marchRepData) instead of march_rolling for April comparison
        return {
          currentData: safeAprRepData,
          previousData: tab === 'overall' ? safeMarchRepData : 
                       tab === 'rep' ? safeMarchRepData.filter(d => !['REVA', 'Wholesale'].includes(d.rep)) :
                       tab === 'reva' ? safeMarchRepData.filter(d => d.rep === 'REVA') :
                       safeMarchRepData.filter(d => d.rep === 'Wholesale')
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

