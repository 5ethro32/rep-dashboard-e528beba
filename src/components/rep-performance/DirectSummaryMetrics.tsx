
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
        // Query to get aggregated stats by department from March Data
        const { data, error } = await supabase
          .from('March Data')
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
          console.log('No data found in March Data');
          return;
        }
        
        // Group and calculate stats by department
        const deptMap = new Map<string, DepartmentStats>();
        
        data.forEach(item => {
          // Normalize department names
          let dept = item.rep_type || 'Unknown';
          
          // Map both "Wholesale" and "WHOLESALE" to a single department name for consistency
          if (dept.toUpperCase() === 'WHOLESALE') {
            dept = 'Wholesale';
          }
          
          const spend = typeof item.spend === 'string' ? parseFloat(item.spend) : Number(item.spend || 0);
          const profit = typeof item.profit === 'string' ? parseFloat(item.profit) : Number(item.profit || 0);
          const packs = typeof item.packs === 'string' ? parseInt(item.packs as string) : Number(item.packs || 0);
          
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
        console.log('Fetched department stats:', deptStats);
        
        // Use RPC calls for accurate department totals
        await fetchDepartmentTotals();
        
      } catch (err) {
        console.error('Error fetching direct stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchDepartmentTotals = async () => {
      try {
        // Total profit across all departments
        const { data: totalData, error: totalError } = await supabase
          .rpc('get_total_profit');
          
        if (totalError) throw new Error(`Total query error: ${totalError.message}`);
        setRawTotalSum(totalData);
        
        // RETAIL department profit
        const { data: retailData, error: retailError } = await supabase
          .rpc('get_retail_profit');
          
        if (retailError) throw new Error(`RETAIL query error: ${retailError.message}`);
        setRawRetailSum(retailData);
        
        // Wholesale department profit
        const { data: wholesaleData, error: wholesaleError } = await supabase
          .rpc('get_wholesale_profit');
          
        if (wholesaleError) throw new Error(`Wholesale query error: ${wholesaleError.message}`);
        setRawWholesaleSum(wholesaleData);
        
        // REVA department profit
        const { data: revaData, error: revaError } = await supabase
          .rpc('get_reva_profit');
          
        if (revaError) throw new Error(`REVA query error: ${revaError.message}`);
        setRawRevaSum(revaData);
        
        console.log('Fetched department totals:', {
          total: totalData,
          retail: retailData,
          wholesale: wholesaleData,
          reva: revaData
        });
        
      } catch (err) {
        console.error('Error fetching raw department sums:', err);
      }
    };

    fetchDirectStats();
  }, []); // Only fetch once on mount

  // Calculate totals based on department filters and using SQL results for profit
  const calculateFilteredTotals = () => {
    // Use SQL values (more accurate) for profit when available
    const retailProfit = rawRetailSum !== null ? rawRetailSum : 
      stats.find(s => s.department === 'RETAIL')?.total_profit || 0;
      
    const revaProfit = rawRevaSum !== null ? rawRevaSum : 
      stats.find(s => s.department === 'REVA')?.total_profit || 0;
      
    const wholesaleProfit = rawWholesaleSum !== null ? rawWholesaleSum : 
      stats.find(s => s.department === 'Wholesale')?.total_profit || 0;
    
    // Calculate totals based on filters
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
        // Use SQL values for profit
        if (stat.department === 'RETAIL') {
          totalProfit += includeRetail ? retailProfit : 0;
        } else if (stat.department === 'REVA') {
          totalProfit += includeReva ? revaProfit : 0;
        } else if (stat.department === 'Wholesale') {
          totalProfit += includeWholesale ? wholesaleProfit : 0;
        } else {
          totalProfit += stat.total_profit;
        }
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
          subtitle="From Supabase query"
          valueClassName="text-finance-red"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Direct Margin"
          value={formatPercent(filteredTotals.averageMargin || 0)}
          subtitle="From Supabase query"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Direct Packs"
          value={formatNumber(filteredTotals.totalPacks || 0)}
          subtitle="From Supabase query"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default DirectSummaryMetrics;
