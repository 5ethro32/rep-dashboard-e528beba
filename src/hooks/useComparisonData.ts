
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

    // Filter by department function - only applied to current month data
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

    // Debug function for comprehensive data validation
    const debugRepData = (stage: string, current: RepData[], previous: RepData[]) => {
      // Count reps by department in each dataset
      const currentRetail = current.filter(d => !['REVA', 'Wholesale'].includes(d.rep));
      const currentReva = current.filter(d => d.rep === 'REVA');
      const currentWholesale = current.filter(d => d.rep === 'Wholesale');
      
      const previousRetail = previous.filter(d => !['REVA', 'Wholesale'].includes(d.rep));
      const previousReva = previous.filter(d => d.rep === 'REVA');
      const previousWholesale = previous.filter(d => d.rep === 'Wholesale');

      console.log(`[${stage}] Data validation for ${selectedMonth}, tab: ${tab}:`, {
        currentData: {
          total: current.length,
          retail: currentRetail.length,
          retailProfit: currentRetail.reduce((sum, rep) => sum + rep.profit, 0),
          reva: currentReva.length,
          revaProfit: currentReva.reduce((sum, rep) => sum + rep.profit, 0),
          wholesale: currentWholesale.length,
          wholesaleProfit: currentWholesale.reduce((sum, rep) => sum + rep.profit, 0)
        },
        previousData: {
          total: previous.length,
          retail: previousRetail.length,
          retailProfit: previousRetail.reduce((sum, rep) => sum + rep.profit, 0),
          reva: previousReva.length,
          revaProfit: previousReva.reduce((sum, rep) => sum + rep.profit, 0),
          wholesale: previousWholesale.length,
          wholesaleProfit: previousWholesale.reduce((sum, rep) => sum + rep.profit, 0)
        }
      });

      // Sample individual reps for verification
      if (previous.length > 0) {
        const samplePreviousReps = previous.slice(0, Math.min(3, previous.length))
          .map(r => ({ rep: r.rep, profit: r.profit, spend: r.spend }));
        console.log(`Sample previous month reps for ${tab}:`, samplePreviousReps);
      }

      // Check if any specific rep appears in both datasets for comparison
      if (current.length > 0 && previous.length > 0) {
        const commonReps = current.filter(c => 
          previous.some(p => p.rep === c.rep && !['REVA', 'Wholesale'].includes(c.rep))
        ).slice(0, 3);
        
        if (commonReps.length > 0) {
          console.log(`Common reps between ${selectedMonth} and previous month:`, 
            commonReps.map(r => ({
              rep: r.rep,
              currentProfit: r.profit,
              previousProfit: previous.find(p => p.rep === r.rep)?.profit || 0
            }))
          );
        } else {
          console.log(`No common reps found between ${selectedMonth} and previous month for ${tab}`);
        }
      }
    };

    // We must properly handle each month comparison scenario differently
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
