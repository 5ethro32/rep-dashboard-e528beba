
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
        // Query to get aggregated stats by department
        const { data, error } = await supabase
          .from('mtd_daily')
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
        setStats(deptStats);
        
        // Use direct SQL RPC calls for accurate department totals
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
        // Instead of using the SQL functions which may be looking at sales_data_march table,
        // we'll aggregate directly from mtd_daily
        const { data: retailData, error: retailError } = await supabase
          .from('mtd_daily')
          .select('Profit')
          .eq('Department', 'RETAIL');
          
        if (retailError) throw new Error(`RETAIL query error: ${retailError.message}`);
        
        let retailSum = 0;
        if (retailData && retailData.length > 0) {
          retailSum = retailData.reduce((sum, row) => {
            const profit = typeof row.Profit === 'string' ? parseFloat(row.Profit) : Number(row.Profit || 0);
            return sum + profit;
          }, 0);
        }
        setRawRetailSum(retailSum);
        
        // Wholesale department sum
        const { data: wholesaleData, error: wholesaleError } = await supabase
          .from('mtd_daily')
          .select('Profit')
          .eq('Department', 'Wholesale');
          
        if (wholesaleError) throw new Error(`Wholesale query error: ${wholesaleError.message}`);
        
        let wholesaleSum = 0;
        if (wholesaleData && wholesaleData.length > 0) {
          wholesaleSum = wholesaleData.reduce((sum, row) => {
            const profit = typeof row.Profit === 'string' ? parseFloat(row.Profit) : Number(row.Profit || 0);
            return sum + profit;
          }, 0);
        }
        setRawWholesaleSum(wholesaleSum);
        
        // REVA department sum
        const { data: revaData, error: revaError } = await supabase
          .from('mtd_daily')
          .select('Profit')
          .eq('Department', 'REVA');
          
        if (revaError) throw new Error(`REVA query error: ${revaError.message}`);
        
        let revaSum = 0;
        if (revaData && revaData.length > 0) {
          revaSum = revaData.reduce((sum, row) => {
            const profit = typeof row.Profit === 'string' ? parseFloat(row.Profit) : Number(row.Profit || 0);
            return sum + profit;
          }, 0);
        }
        setRawRevaSum(revaSum);
        
        // Total sum
        const totalSum = retailSum + wholesaleSum + revaSum;
        setRawTotalSum(totalSum);
        
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
