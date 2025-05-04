import { useState, useEffect } from 'react';
import { getMonthlyMetrics, getComparisonData } from '@/utils/unified-data-service';
import { useTimePeriod } from '@/contexts/TimePeriodContext';

export type MetricType = 'spend' | 'profit' | 'margin' | 'packs' | 'accounts';

// Shape of our metric data
export interface MetricData {
  value: number;
  previousValue: number;
  changePercent: number;
  changeDirection: 'increase' | 'decrease' | 'neutral';
  formattedValue: string;
  formattedPreviousValue: string;
  formattedChange: string;
  isLoading: boolean;
}

// Formatter functions
type FormatterFunction = (value: number) => string;

const defaultFormatters: Record<MetricType, FormatterFunction> = {
  spend: (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value),
  profit: (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value),
  margin: (value) => new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 }).format(value / 100),
  packs: (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value),
  accounts: (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value)
};

// Hook options
interface UseMetricDataOptions {
  metricType: MetricType;
  formatter?: FormatterFunction;
  currentPeriod?: string;
  previousPeriod?: string;
  departmentFilter?: string;
  repFilter?: string;
  disableAutoFetch?: boolean;
}

/**
 * Hook to fetch and format metric data from the unified data source
 */
export const useMetricData = ({
  metricType,
  formatter,
  currentPeriod,
  previousPeriod,
  departmentFilter,
  repFilter,
  disableAutoFetch = false
}: UseMetricDataOptions): [MetricData, () => Promise<void>] => {
  // Get period context if not explicitly provided
  const periodContext = useTimePeriod();
  
  // Use provided periods or fall back to context
  const activePeriod = currentPeriod || periodContext.currentPeriod;
  const comparePeriod = previousPeriod || periodContext.previousPeriod;
  
  // Default state
  const [metricData, setMetricData] = useState<MetricData>({
    value: 0,
    previousValue: 0,
    changePercent: 0,
    changeDirection: 'neutral',
    formattedValue: '-',
    formattedPreviousValue: '-',
    formattedChange: '0%',
    isLoading: true
  });
  
  // Format function to use
  const formatValue = formatter || defaultFormatters[metricType];
  
  // Function to fetch data
  const fetchData = async () => {
    if (!activePeriod) return;
    
    setMetricData(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Get current period stats
      const currentStats = await getMonthlyMetrics(activePeriod);
      
      // If we don't have comparison period, just load current data
      if (!comparePeriod || activePeriod === comparePeriod) {
        // Find the right metric value from the stats
        let value = 0;
        if (currentStats) {
          if (metricType === 'spend') value = currentStats.total_spend || 0;
          else if (metricType === 'profit') value = currentStats.total_profit || 0;
          else if (metricType === 'margin') {
            // Calculate margin as percentage from spend and profit
            value = currentStats.total_spend > 0
              ? (currentStats.total_profit / currentStats.total_spend) * 100
              : 0;
          }
          else if (metricType === 'accounts') value = currentStats.unique_accounts || 0;
        }
        
        setMetricData({
          value,
          previousValue: value,
          changePercent: 0,
          changeDirection: 'neutral',
          formattedValue: formatValue(value),
          formattedPreviousValue: formatValue(value),
          formattedChange: '0%',
          isLoading: false
        });
      } else {
        // We have a comparison period, get that data too
        const previousStats = await getMonthlyMetrics(comparePeriod);
        
        // Find the right metric values
        let currentValue = 0;
        let previousValue = 0;
        
        if (currentStats) {
          if (metricType === 'spend') currentValue = currentStats.total_spend || 0;
          else if (metricType === 'profit') currentValue = currentStats.total_profit || 0;
          else if (metricType === 'margin') {
            currentValue = currentStats.total_spend > 0
              ? (currentStats.total_profit / currentStats.total_spend) * 100
              : 0;
          }
          else if (metricType === 'packs') {
            // For packs, we need to load all records, since we don't store this in stats view
            const allData = await getComparisonData(activePeriod, comparePeriod);
            
            // Calculate total packs with filters
            currentValue = allData.current.reduce((sum, record) => {
              // Apply filters if needed
              if (departmentFilter && record.department !== departmentFilter) return sum;
              if (repFilter && record.rep_name !== repFilter) return sum;
              return sum + (record.packs || 0);
            }, 0);
            
            previousValue = allData.previous.reduce((sum, record) => {
              if (departmentFilter && record.department !== departmentFilter) return sum;
              if (repFilter && record.rep_name !== repFilter) return sum;
              return sum + (record.packs || 0);
            }, 0);
          }
          else if (metricType === 'accounts') currentValue = currentStats.unique_accounts || 0;
        }
        
        if (previousStats && metricType !== 'packs') {
          if (metricType === 'spend') previousValue = previousStats.total_spend || 0;
          else if (metricType === 'profit') previousValue = previousStats.total_profit || 0;
          else if (metricType === 'margin') {
            previousValue = previousStats.total_spend > 0
              ? (previousStats.total_profit / previousStats.total_spend) * 100
              : 0;
          }
          else if (metricType === 'accounts') previousValue = previousStats.unique_accounts || 0;
        }
        
        // Calculate change percentage
        let changePercent = 0;
        if (previousValue !== 0) {
          changePercent = ((currentValue - previousValue) / previousValue) * 100;
        }
        
        // Determine change direction
        let changeDirection: 'increase' | 'decrease' | 'neutral' = 'neutral';
        if (changePercent > 0.1) changeDirection = 'increase';
        else if (changePercent < -0.1) changeDirection = 'decrease';
        
        setMetricData({
          value: currentValue,
          previousValue,
          changePercent,
          changeDirection,
          formattedValue: formatValue(currentValue),
          formattedPreviousValue: formatValue(previousValue),
          formattedChange: `${Math.abs(changePercent).toFixed(1)}%`,
          isLoading: false
        });
      }
    } catch (error) {
      console.error(`Error fetching ${metricType} metric:`, error);
      setMetricData(prev => ({ 
        ...prev, 
        isLoading: false,
        formattedValue: 'Error',
        formattedPreviousValue: 'Error' 
      }));
    }
  };
  
  // Auto-fetch data when dependencies change
  useEffect(() => {
    if (disableAutoFetch) return;
    
    if (activePeriod) {
      fetchData();
    }
  }, [activePeriod, comparePeriod, metricType, departmentFilter, repFilter, disableAutoFetch]);
  
  return [metricData, fetchData];
}; 