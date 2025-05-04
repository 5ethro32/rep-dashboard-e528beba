import { useState, useEffect } from 'react';
import { 
  getDummyMonthlyComparison, 
  getDummyAvailableMonths,
  getDummyDepartments,
  DummyDepartmentMetric
} from '@/utils/dummy-data-service';

export interface DummyMetricsState {
  retailMetrics: DummyDepartmentMetric | null;
  revaMetrics: DummyDepartmentMetric | null;
  wholesaleMetrics: DummyDepartmentMetric | null;
  changes: {
    retail?: Record<string, number>;
    reva?: Record<string, number>;
    wholesale?: Record<string, number>;
  };
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to provide dummy department-level metrics
 * Mimics the structure of the real useDepartmentMetrics hook
 */
export const useDummyData = (selectedMonth: string) => {
  const [state, setState] = useState<DummyMetricsState>({
    retailMetrics: null,
    revaMetrics: null,
    wholesaleMetrics: null,
    changes: {},
    isLoading: true,
    error: null
  });
  
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  
  // Load dummy metrics data when month changes
  useEffect(() => {
    const loadDummyMetrics = () => {
      if (!selectedMonth) return;
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Simulate network delay
        setTimeout(() => {
          // Get dummy metrics with comparison to previous month
          const comparison = getDummyMonthlyComparison(selectedMonth);
          
          if (!comparison || !comparison.current) {
            throw new Error(`Failed to load metrics for ${selectedMonth}`);
          }
          
          const { current, changes } = comparison;
          
          // Find metrics for each department
          const retailMetrics = current.find(m => m.department === 'retail') || null;
          const revaMetrics = current.find(m => m.department === 'reva') || null;
          const wholesaleMetrics = current.find(m => m.department === 'wholesale') || null;
          
          setState({
            retailMetrics,
            revaMetrics,
            wholesaleMetrics,
            changes: {
              retail: changes['retail'] || {},
              reva: changes['reva'] || {},
              wholesale: changes['wholesale'] || {}
            },
            isLoading: false,
            error: null
          });
        }, 500); // 500ms delay to simulate network
      } catch (error) {
        console.error('Error loading dummy metrics:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error : new Error('Unknown error loading dummy metrics') 
        }));
      }
    };
    
    loadDummyMetrics();
  }, [selectedMonth]);
  
  // Calculate combined metrics based on included departments
  const getCombinedMetrics = () => {
    const { retailMetrics, revaMetrics, wholesaleMetrics } = state;
    
    // Initialize with zeros
    let totalSpend = 0;
    let totalProfit = 0;
    let totalPacks = 0;
    let totalAccounts = 0;
    
    // Add retail metrics if included
    if (includeRetail && retailMetrics) {
      totalSpend += retailMetrics.totalSpend;
      totalProfit += retailMetrics.totalProfit;
      totalPacks += retailMetrics.totalPacks;
      totalAccounts += retailMetrics.totalAccounts;
    }
    
    // Add REVA metrics if included
    if (includeReva && revaMetrics) {
      totalSpend += revaMetrics.totalSpend;
      totalProfit += revaMetrics.totalProfit;
      totalPacks += revaMetrics.totalPacks;
      totalAccounts += revaMetrics.totalAccounts;
    }
    
    // Add wholesale metrics if included
    if (includeWholesale && wholesaleMetrics) {
      totalSpend += wholesaleMetrics.totalSpend;
      totalProfit += wholesaleMetrics.totalProfit;
      totalPacks += wholesaleMetrics.totalPacks;
      totalAccounts += wholesaleMetrics.totalAccounts;
    }
    
    // Calculate margin from the combined values
    const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
    
    return {
      totalSpend,
      totalProfit,
      totalPacks,
      totalAccounts,
      averageMargin
    };
  };
  
  // Calculate combined changes based on included departments
  const getCombinedChanges = () => {
    const { changes } = state;
    
    // Initialize with zeros
    let totalSpendChange = 0;
    let totalProfitChange = 0;
    let totalPacksChange = 0;
    let marginChange = 0;
    let countIncluded = 0;
    
    // Add retail changes if included
    if (includeRetail && changes.retail) {
      totalSpendChange += changes.retail.totalSpend || 0;
      totalProfitChange += changes.retail.totalProfit || 0;
      totalPacksChange += changes.retail.totalPacks || 0;
      marginChange += changes.retail.averageMargin || 0;
      countIncluded++;
    }
    
    // Add REVA changes if included
    if (includeReva && changes.reva) {
      totalSpendChange += changes.reva.totalSpend || 0;
      totalProfitChange += changes.reva.totalProfit || 0;
      totalPacksChange += changes.reva.totalPacks || 0;
      marginChange += changes.reva.averageMargin || 0;
      countIncluded++;
    }
    
    // Add wholesale changes if included
    if (includeWholesale && changes.wholesale) {
      totalSpendChange += changes.wholesale.totalSpend || 0;
      totalProfitChange += changes.wholesale.totalProfit || 0;
      totalPacksChange += changes.wholesale.totalPacks || 0;
      marginChange += changes.wholesale.averageMargin || 0;
      countIncluded++;
    }
    
    // Average the changes if we have included departments
    if (countIncluded > 0) {
      totalSpendChange /= countIncluded;
      totalProfitChange /= countIncluded;
      totalPacksChange /= countIncluded;
      marginChange /= countIncluded;
    }
    
    return {
      totalSpend: totalSpendChange,
      totalProfit: totalProfitChange,
      totalPacks: totalPacksChange,
      averageMargin: marginChange
    };
  };
  
  return {
    ...state,
    includeRetail,
    setIncludeRetail,
    includeReva,
    setIncludeReva,
    includeWholesale,
    setIncludeWholesale,
    combinedMetrics: getCombinedMetrics(),
    combinedChanges: getCombinedChanges(),
    availableMonths: getDummyAvailableMonths(),
    availableDepartments: getDummyDepartments()
  };
};

export default useDummyData; 