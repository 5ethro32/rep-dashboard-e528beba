
import React, { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';

interface DirectSummaryMetricsProps {
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
}

interface DepartmentStats {
  department: string;
  total_spend: number;
  total_profit: number;
  total_packs: number;
  margin: number;
}

const DirectSummaryMetrics: React.FC<DirectSummaryMetricsProps> = ({ 
  includeRetail, 
  includeReva, 
  includeWholesale 
}) => {
  const [stats, setStats] = useState<DepartmentStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDirectStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Query to get aggregated stats by department from sales_data
        const { data, error } = await supabase
          .from('sales_data')
          .select(`
            rep_type,
            profit,
            spend,
            packs
          `);

        if (error) throw new Error(error.message);
        
        if (!data || data.length === 0) {
          setStats([]);
          setIsLoading(false);
          console.log('No data found in sales_data');
          return;
        }

        console.log('Raw sales data:', data);
        
        // Group and calculate stats by department
        const deptMap = new Map<string, DepartmentStats>();
        
        data.forEach(item => {
          const dept = item.rep_type || 'Unknown';
          const spend = Number(item.spend) || 0;
          const profit = Number(item.profit) || 0;
          const packs = Number(item.packs) || 0;
          
          if (!deptMap.has(dept)) {
            deptMap.set(dept, {
              department: dept,
              total_spend: 0,
              total_profit: 0,
              total_packs: 0,
              margin: 0
            });
          }
          
          const current = deptMap.get(dept)!;
          current.total_spend += spend;
          current.total_profit += profit;
          current.total_packs += packs;
          current.margin = current.total_spend > 0 ? (current.total_profit / current.total_spend) * 100 : 0;
          
          deptMap.set(dept, current);
        });
        
        const deptStats = Array.from(deptMap.values());
        setStats(deptStats);
        console.log('Processed department stats:', deptStats);
        
      } catch (err) {
        console.error('Error fetching direct stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectStats();
  }, [includeRetail, includeReva, includeWholesale]);

  // Calculate totals based on department filters
  const calculateFilteredTotals = () => {
    let totalSpend = 0;
    let totalProfit = 0;
    let totalPacks = 0;
    
    stats.forEach(stat => {
      if (
        (stat.department === 'RETAIL' && includeRetail) ||
        (stat.department === 'REVA' && includeReva) ||
        (stat.department === 'Wholesale' && includeWholesale)
      ) {
        totalSpend += stat.total_spend;
        totalProfit += stat.total_profit;
        totalPacks += stat.total_packs;
      }
    });
    
    const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
    
    return {
      totalSpend,
      totalProfit,
      totalPacks,
      averageMargin
    };
  };

  const filteredTotals = calculateFilteredTotals();

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-3 text-white">Direct Supabase Metrics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-slide-in-up">
        <MetricCard
          title="Direct Revenue"
          value={formatCurrency(filteredTotals.totalSpend || 0, 0)}
          subtitle={`Departments: ${[
            includeRetail ? 'RETAIL' : '', 
            includeReva ? 'REVA' : '', 
            includeWholesale ? 'Wholesale' : ''
          ].filter(Boolean).join(', ')}`}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Direct Profit"
          value={formatCurrency(filteredTotals.totalProfit || 0, 0)}
          subtitle="From sales_data"
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Direct Margin"
          value={formatPercent(filteredTotals.averageMargin || 0)}
          subtitle="From sales_data"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Direct Packs"
          value={formatNumber(filteredTotals.totalPacks || 0)}
          subtitle="From sales_data"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default DirectSummaryMetrics;
