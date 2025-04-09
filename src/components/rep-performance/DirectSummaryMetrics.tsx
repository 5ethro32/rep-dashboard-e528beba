
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
  const [rawRetailSum, setRawRetailSum] = useState<number | null>(null);
  const [rawWholesaleSum, setRawWholesaleSum] = useState<number | null>(null);
  const [rawRevaSum, setRawRevaSum] = useState<number | null>(null);
  const [rawTotalSum, setRawTotalSum] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDirectStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch retail data
        const { data: retailData, error: retailError } = await supabase
          .rpc('get_april_mtd_data_by_department', { dept: 'RETAIL' });
        
        if (retailError) throw new Error(`RETAIL query error: ${retailError.message}`);
        
        // Fetch REVA data
        const { data: revaData, error: revaError } = await supabase
          .rpc('get_april_mtd_data_by_department', { dept: 'REVA' });
          
        if (revaError) throw new Error(`REVA query error: ${revaError.message}`);
        
        // Fetch wholesale data
        const { data: wholesaleData, error: wholesaleError } = await supabase
          .rpc('get_april_mtd_data_by_department', { dept: 'Wholesale' });
          
        if (wholesaleError) throw new Error(`Wholesale query error: ${wholesaleError.message}`);
        
        // Process all data
        const combinedData = [
          ...(Array.isArray(retailData) ? retailData : []),
          ...(Array.isArray(revaData) ? revaData : []),
          ...(Array.isArray(wholesaleData) ? wholesaleData : [])
        ];
        
        // Group and calculate stats by department
        const deptMap = new Map<string, DepartmentStats>();
        
        combinedData.forEach(item => {
          const dept = item.Department || 'Unknown';
          const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
          const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
          const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
          
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
        
        // Calculate raw sums
        const retailStats = deptStats.find(s => s.department === 'RETAIL');
        const revaStats = deptStats.find(s => s.department === 'REVA');
        const wholesaleStats = deptStats.find(s => s.department === 'Wholesale');
        
        setRawRetailSum(retailStats?.total_profit || 0);
        setRawRevaSum(revaStats?.total_profit || 0);
        setRawWholesaleSum(wholesaleStats?.total_profit || 0);
        setRawTotalSum((retailStats?.total_profit || 0) + (revaStats?.total_profit || 0) + (wholesaleStats?.total_profit || 0));
        
      } catch (err) {
        console.error('Error fetching direct stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDirectStats();
  }, []);

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
      <h3 className="text-lg font-medium mb-3 text-white">April 2025 MTD Metrics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-slide-in-up">
        <MetricCard
          title="April MTD Revenue"
          value={formatCurrency(filteredTotals.totalSpend || 0, 0)}
          subtitle={`Departments: ${[
            includeRetail ? 'RETAIL' : '', 
            includeReva ? 'REVA' : '', 
            includeWholesale ? 'Wholesale' : ''
          ].filter(Boolean).join(', ')}`}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="April MTD Profit"
          value={formatCurrency(filteredTotals.totalProfit || 0, 0)}
          subtitle="Month to date"
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="April MTD Margin"
          value={formatPercent(filteredTotals.averageMargin || 0)}
          subtitle="Month to date"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="April MTD Packs"
          value={formatNumber(filteredTotals.totalPacks || 0)}
          subtitle="Month to date"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default DirectSummaryMetrics;
