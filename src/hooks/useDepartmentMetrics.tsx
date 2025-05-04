import { useState, useEffect } from 'react';
import { getMonthlyMetricsByDept, getMonthlyComparison } from '@/utils/unified-data-service';

export interface DepartmentMetric {
  department: string;
  recordCount: number;
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
  totalAccounts: number;
  repCount: number;
  averageMargin: number;
}

export interface MetricsState {
  retailMetrics: DepartmentMetric | null;
  revaMetrics: DepartmentMetric | null;
  wholesaleMetrics: DepartmentMetric | null;
  changes: {
    retail?: Record<string, number>;
    reva?: Record<string, number>;
    wholesale?: Record<string, number>;
  };
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to provide department-level metrics with proper SQL aggregation
 * for the dashboard metric cards and visualizations
 */
export const useDepartmentMetrics = (selectedMonth: string) => {
  const [state, setState] = useState<MetricsState>({
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
  
  // Load department metrics when month changes
  useEffect(() => {
    const loadDepartmentMetrics = async () => {
      if (!selectedMonth) return;
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        console.log(`DEBUG - Loading department metrics for ${selectedMonth}`);
        
        // Get metrics with comparison to previous month
        const comparison = await getMonthlyComparison(selectedMonth);
        
        if (!comparison || !comparison.current) {
          throw new Error(`Failed to load metrics for ${selectedMonth}`);
        }
        
        const { current, changes } = comparison;
        
        console.log(`DEBUG - Department comparison data for ${selectedMonth}:`, {
          departmentCount: current.length,
          changesObj: changes
        });
        
        // Find metrics for each department
        const retailMetrics = current.find(m => m.department === 'retail') || null;
        const revaMetrics = current.find(m => m.department === 'reva') || null;
        const wholesaleMetrics = current.find(m => m.department === 'wholesale') || null;
        
        // Log if any expected departments are missing
        if (!retailMetrics) console.warn(`No retail metrics found for ${selectedMonth}`);
        if (!revaMetrics) console.warn(`No REVA metrics found for ${selectedMonth}`);
        if (!wholesaleMetrics) console.warn(`No wholesale metrics found for ${selectedMonth}`);
        
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
        
        console.log('DEBUG - Department metrics loaded:', {
          retail: retailMetrics,
          reva: revaMetrics,
          wholesale: wholesaleMetrics
        });
      } catch (error) {
        console.error('Error loading department metrics:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error : new Error('Unknown error loading metrics') 
        }));
      }
    };
    
    loadDepartmentMetrics();
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
    combinedChanges: getCombinedChanges()
  };
};

export default useDepartmentMetrics; 