
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

interface RawQueryResult {
  department: string;
  sum: number;
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
        // Query to get aggregated stats by department
        const { data, error } = await supabase
          .from('sales_data_march')
          .select(`
            "Department",
            "Profit",
            "Spend",
            "Packs"
          `);

        if (error) throw new Error(error.message);
        
        if (!data || data.length === 0) {
          setStats([]);
          setIsLoading(false);
          return;
        }

        console.log('Direct Supabase raw data (first 20 items):', data.slice(0, 20));
        
        // Group and calculate stats by department
        const deptMap = new Map<string, DepartmentStats>();
        
        data.forEach(item => {
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
        console.log('Direct Supabase calculated stats by department:', deptStats);
        
        setStats(deptStats);
        
        // Run direct SQL queries for each department to compare results
        await fetchRawDepartmentSums();
        
      } catch (err) {
        console.error('Error fetching direct stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchRawDepartmentSums = async () => {
      try {
        // Total sum across all departments
        const { data: totalData, error: totalError } = await supabase
          .rpc('get_total_profit');
          
        if (totalError) throw new Error(`Total query error: ${totalError.message}`);
        console.log('Raw SQL query result for ALL departments:', totalData);
        setRawTotalSum(totalData);
        
        // RETAIL department sum
        const { data: retailData, error: retailError } = await supabase
          .rpc('get_retail_profit');
          
        if (retailError) throw new Error(`RETAIL query error: ${retailError.message}`);
        console.log('Raw SQL query result for RETAIL department:', retailData);
        setRawRetailSum(retailData);
        
        // Wholesale department sum
        const { data: wholesaleData, error: wholesaleError } = await supabase
          .rpc('get_wholesale_profit');
          
        if (wholesaleError) throw new Error(`Wholesale query error: ${wholesaleError.message}`);
        console.log('Raw SQL query result for Wholesale department:', wholesaleData);
        setRawWholesaleSum(wholesaleData);
        
        // REVA department sum
        const { data: revaData, error: revaError } = await supabase
          .rpc('get_reva_profit');
          
        if (revaError) throw new Error(`REVA query error: ${revaError.message}`);
        console.log('Raw SQL query result for REVA department:', revaData);
        setRawRevaSum(revaData);
        
      } catch (err) {
        console.error('Error fetching raw department sums:', err);
      }
    };

    fetchDirectStats();
  }, []); // Only fetch once on mount

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
      <div className="bg-amber-800/30 border border-amber-500/30 rounded-lg p-3 md:p-4 mb-4 text-sm">
        <p className="text-amber-200 font-medium">
          Direct SQL Query Results for Profit:
        </p>
        {error && <p className="text-red-400 mt-1">Error: {error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-amber-200">
          <div className="bg-amber-900/30 p-2 rounded">
            <p className="font-medium">Total (ALL):</p>
            <p>{rawTotalSum !== null ? formatCurrency(rawTotalSum, 2) : 'Loading...'}</p>
          </div>
          <div className="bg-amber-900/30 p-2 rounded">
            <p className="font-medium">RETAIL:</p>
            <p>{rawRetailSum !== null ? formatCurrency(rawRetailSum, 2) : 'Loading...'}</p>
          </div>
          <div className="bg-amber-900/30 p-2 rounded">
            <p className="font-medium">Wholesale:</p>
            <p>{rawWholesaleSum !== null ? formatCurrency(rawWholesaleSum, 2) : 'Loading...'}</p>
          </div>
          <div className="bg-amber-900/30 p-2 rounded">
            <p className="font-medium">REVA:</p>
            <p>{rawRevaSum !== null ? formatCurrency(rawRevaSum, 2) : 'Loading...'}</p>
          </div>
        </div>
        <p className="text-amber-200 font-medium mt-3">
          JS-Calculated Department Totals (from raw data):
        </p>
        <pre className="text-xs text-amber-200 mt-1 overflow-x-auto">
          {stats.map(stat => 
            `${stat.department}: Profit=${formatCurrency(stat.total_profit, 2)}, Spend=${formatCurrency(stat.total_spend, 2)}, Packs=${stat.total_packs}`
          ).join('\n')}
        </pre>
      </div>
      
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
