import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface DateRange {
  from: Date;
  to: Date;
}

interface Filters {
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  includeEDI: boolean;
  includeTelesales: boolean;
}

interface SummaryData {
  revenue: number;
  profit: number;
  margin: number;
  orders: number;
}

interface RepData {
  rep: string;
  revenue: number;
  profit: number;
  margin: number;
  orders: number;
  department?: string;
  telesalesProfit?: number;
  telesalesProfitPercentage?: number;
}

interface DepartmentData {
  department: string;
  revenue: number;
  profit: number;
  margin: number;
  orders: number;
}

export const useDailyRepPerformanceData = () => {
  // State for date range - default to current month
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // State for filters
  const [filters, setFilters] = useState<Filters>({
    includeRetail: true,
    includeReva: true,
    includeWholesale: true,
    includeEDI: true,
    includeTelesales: true
  });

  // State for data
  const [rawData, setRawData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    isLoading: false,
    isRefreshing: false,
    error: null as string | null
  });

  // State for table sorting
  const [repTableSorting, setRepTableSorting] = useState({
    sortBy: 'profit' as string,
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // Fetch data from Daily_Data table
  const fetchData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, isLoading: true, error: null }));

      // Build query for main data
      let query = supabase
        .from('Daily_Data')
        .select('*')
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'));

      // Apply department filters
      const departments = [];
      if (filters.includeRetail) departments.push('Retail');
      if (filters.includeReva) departments.push('REVA');
      if (filters.includeWholesale) departments.push('Wholesale');
      
      if (departments.length > 0 && departments.length < 3) {
        query = query.in('department', departments);
      }

      // Apply method filters
      const methods = [];
      if (filters.includeEDI) methods.push('EDI');
      if (filters.includeTelesales) methods.push('Telesales');
      
      if (methods.length === 1) {
        query = query.eq('method', methods[0]);
      } else if (methods.length === 0) {
        // If no methods selected, return empty data
        setRawData([]);
        setLoading(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data, error } = await query;

      if (error) throw error;

      setRawData(data || []);

      // Fetch comparison data (previous period)
      // For now, we'll skip comparison data to get the basic implementation working
      setComparisonData([]);

    } catch (error) {
      console.error('Error fetching daily data:', error);
      setLoading(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch data' 
      }));
      toast({
        title: 'Error',
        description: 'Failed to fetch daily performance data',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, isLoading: false }));
    }
  }, [dateRange, filters]);

  // Calculate summary metrics
  const summary = useMemo<SummaryData>(() => {
    if (!rawData.length) {
      return { revenue: 0, profit: 0, margin: 0, orders: 0 };
    }

    const totals = rawData.reduce((acc, row) => ({
      revenue: acc.revenue + (row.sales || 0),
      profit: acc.profit + (row.profit || 0),
      orders: acc.orders + (row.orders || 0)
    }), { revenue: 0, profit: 0, orders: 0 });

    const margin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

    return { ...totals, margin };
  }, [rawData]);

  // Calculate rep table data
  const repTableData = useMemo<RepData[]>(() => {
    if (!rawData.length) return [];

    // Group by rep
    const repGroups = rawData.reduce((acc, row) => {
      const rep = row.rep || 'Unknown';
      if (!acc[rep]) {
        acc[rep] = {
          rep,
          revenue: 0,
          profit: 0,
          orders: 0,
          telesalesProfit: 0,
          department: row.department
        };
      }
      
      acc[rep].revenue += row.sales || 0;
      acc[rep].profit += row.profit || 0;
      acc[rep].orders += row.orders || 0;
      
      if (row.method === 'Telesales') {
        acc[rep].telesalesProfit += row.profit || 0;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate margins
    return Object.values(repGroups).map((rep: any) => ({
      ...rep,
      margin: rep.revenue > 0 ? (rep.profit / rep.revenue) * 100 : 0,
      telesalesProfitPercentage: rep.profit > 0 ? (rep.telesalesProfit / rep.profit) * 100 : 0
    }));
  }, [rawData]);

  // Calculate department data for charts
  const departmentData = useMemo<DepartmentData[]>(() => {
    if (!rawData.length) return [];

    // Group by department
    const deptGroups = rawData.reduce((acc, row) => {
      const dept = row.department || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = {
          department: dept,
          revenue: 0,
          profit: 0,
          orders: 0
        };
      }
      
      acc[dept].revenue += row.sales || 0;
      acc[dept].profit += row.profit || 0;
      acc[dept].orders += row.orders || 0;
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate margins
    return Object.values(deptGroups).map((dept: any) => ({
      ...dept,
      margin: dept.revenue > 0 ? (dept.profit / dept.revenue) * 100 : 0
    }));
  }, [rawData]);

  // Sort rep table data
  const sortedRepTableData = useMemo(() => {
    const sorted = [...repTableData];
    sorted.sort((a, b) => {
      const aValue = a[repTableSorting.sortBy as keyof RepData] || 0;
      const bValue = b[repTableSorting.sortBy as keyof RepData] || 0;
      
      if (repTableSorting.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return sorted;
  }, [repTableData, repTableSorting]);

  // Initialize data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh function
  const refreshData = useCallback(async () => {
    setLoading(prev => ({ ...prev, isRefreshing: true }));
    await fetchData();
    setLoading(prev => ({ ...prev, isRefreshing: false }));
  }, [fetchData]);

  // Validation function
  const validateData = useCallback(() => {
    return {
      hasData: rawData.length > 0,
      totalRecords: rawData.length,
      dateRange: `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
    };
  }, [rawData, dateRange]);

  // Fetch rep data for a specific department (for drill-down)
  const fetchRepDataForDepartment = useCallback(async (department: string) => {
    // Implementation for department drill-down if needed
    console.log('Fetching data for department:', department);
  }, []);

  return {
    // Date and filters
    dateRange,
    setDateRange,
    filters,
    setFilters,
    
    // Summary data
    summary,
    summaryChanges: {}, // Placeholder for comparison
    
    // Table data
    repTableData: sortedRepTableData,
    repTableComparison: [], // Placeholder for comparison
    repTableSorting,
    setRepTableSorting,
    
    // Department data for charts
    departmentData,
    
    // Loading state
    loading,
    
    // Functions
    refreshData,
    fetchRepDataForDepartment,
    
    // Computed values
    hasData: rawData.length > 0,
    hasComparison: comparisonData.length > 0,
    hasRepTableData: repTableData.length > 0,
    totalRecords: rawData.length,
    validateData,
    
    // Period info
    comparisonPeriod: 'Previous Period' // Placeholder
  };
};