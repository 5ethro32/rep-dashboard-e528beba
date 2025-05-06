
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TableSummary {
  tableName: string;
  recordCount: number;
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
}

const DataVerification = () => {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('May');
  const [unifiedData, setUnifiedData] = useState<any[]>([]);
  const [legacyData, setLegacyData] = useState<any[]>([]);
  
  const monthToTableMap: Record<string, string> = {
    'February': 'sales_data_februrary',
    'March': 'sales_data',
    'April': 'mtd_daily',
    'May': 'May_Data'
  };
  
  const fetchTableStats = async () => {
    setLoading(true);
    try {
      // 1. Get the table names first
      const tableNames = ['unified_sales_data', 'sales_data_februrary', 'sales_data', 'mtd_daily', 'May_Data'];
      
      // 2. Get stats for each table
      const tableStatsPromises = tableNames.map(async (tableName) => {
        // Use direct query instead of RPC since get_table_stats isn't in the type definitions
        let recordCount = 0;
        let totalSpend = 0;
        let totalProfit = 0;
        let totalPacks = 0;
        
        try {
          // Count records first
          const { count, error: countError } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true });
            
          if (countError) {
            console.error(`Error counting ${tableName}:`, countError);
          } else {
            recordCount = count || 0;
          }
          
          // Now get aggregated metrics using direct SQL query instead of RPC
          const { data: metricsData, error: metricsError } = await supabase
            .rpc('execute_sql', { 
              sql_query: `
                SELECT 
                  SUM(CASE WHEN "Spend" IS NOT NULL THEN "Spend" 
                       WHEN spend IS NOT NULL THEN spend ELSE 0 END) as total_spend,
                  SUM(CASE WHEN "Profit" IS NOT NULL THEN "Profit" 
                       WHEN profit IS NOT NULL THEN profit ELSE 0 END) as total_profit,
                  SUM(CASE WHEN "Packs" IS NOT NULL THEN "Packs" 
                       WHEN packs IS NOT NULL THEN packs ELSE 0 END) as total_packs
                FROM ${tableName}
              ` 
            } as any);
            
          if (metricsError) {
            console.error(`Error getting metrics for ${tableName}:`, metricsError);
          } else if (metricsData && metricsData[0]) {
            totalSpend = metricsData[0].total_spend || 0;
            totalProfit = metricsData[0].total_profit || 0;
            totalPacks = metricsData[0].total_packs || 0;
          }
        } catch (err) {
          console.error(`Error processing ${tableName}:`, err);
        }
        
        return {
          tableName,
          recordCount,
          totalSpend,
          totalProfit,
          totalPacks
        };
      });
      
      const tableStats = await Promise.all(tableStatsPromises);
      setTables(tableStats);
    } catch (error) {
      console.error('Error fetching table stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMonthData = async (month: string) => {
    setLoading(true);
    try {
      // Fetch data from unified table for this month
      const { data: unifiedData, error: unifiedError } = await supabase
        .from('unified_sales_data')
        .select('*')
        .eq('reporting_month', month)
        .limit(10);
        
      if (unifiedError) {
        console.error(`Error fetching unified data for ${month}:`, unifiedError);
      } else {
        setUnifiedData(unifiedData || []);
      }
      
      // Fetch data from original month's table
      const tableName = monthToTableMap[month];
      
      const { data: legacyData, error: legacyError } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(10);
        
      if (legacyError) {
        console.error(`Error fetching legacy data from ${tableName}:`, legacyError);
      } else {
        setLegacyData(legacyData || []);
      }
    } catch (error) {
      console.error('Error fetching month data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get total values from unified table by month
  const getMonthTotals = async () => {
    setLoading(true);
    try {
      const months = ['February', 'March', 'April', 'May'];
      
      const totalsPromises = months.map(async (month) => {
        // Use direct SQL query instead of RPC
        const { data, error } = await supabase
          .rpc('execute_sql', { 
            sql_query: `
              SELECT 
                COUNT(*) as record_count,
                SUM(spend) as total_spend,
                SUM(profit) as total_profit,
                SUM(packs) as total_packs
              FROM unified_sales_data
              WHERE reporting_month = '${month}'
            `
          } as any);
        
        if (error) {
          console.error(`Error getting totals for ${month}:`, error);
          return { month, recordCount: 0, totalSpend: 0, totalProfit: 0, totalPacks: 0 };
        }
        
        return { 
          month, 
          recordCount: data?.[0]?.record_count || 0,
          totalSpend: data?.[0]?.total_spend || 0,
          totalProfit: data?.[0]?.total_profit || 0,
          totalPacks: data?.[0]?.total_packs || 0 
        };
      });
      
      const results = await Promise.all(totalsPromises);
      console.table(results);
    } catch (error) {
      console.error('Error getting month totals:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const runDirectQuery = async () => {
    setLoading(true);
    try {
      // Query to check department values in unified table vs original tables
      const { data, error } = await supabase
        .rpc('execute_sql', { 
          sql_query: `
            SELECT 
              reporting_month as month,
              department, 
              COUNT(*) as record_count,
              SUM(spend) as total_spend,
              SUM(profit) as total_profit
            FROM unified_sales_data
            GROUP BY reporting_month, department
            ORDER BY reporting_month, department
          `
        } as any);
      
      if (error) {
        console.error('Error with direct SQL query:', error);
      } else {
        console.log('Department breakdown by month:');
        console.table(data);
      }
    } catch (error) {
      console.error('Error running direct query:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTableStats();
  }, []);
  
  useEffect(() => {
    if (selectedMonth) {
      fetchMonthData(selectedMonth);
    }
  }, [selectedMonth]);
  
  return (
    <div className="p-6 space-y-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold">Database Verification</h2>
      
      <div className="flex space-x-4">
        <Button 
          onClick={fetchTableStats} 
          disabled={loading}
          variant="outline"
        >
          Refresh Table Stats
        </Button>
        
        <Button 
          onClick={getMonthTotals} 
          disabled={loading}
          variant="outline"
        >
          Get Month Totals
        </Button>
        
        <Button 
          onClick={runDirectQuery} 
          disabled={loading}
          variant="outline"
        >
          Check Department Breakdown
        </Button>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Table Statistics</h3>
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Table</th>
                <th className="border p-2 text-right">Records</th>
                <th className="border p-2 text-right">Total Spend</th>
                <th className="border p-2 text-right">Total Profit</th>
                <th className="border p-2 text-right">Total Packs</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => (
                <tr key={table.tableName}>
                  <td className="border p-2">{table.tableName}</td>
                  <td className="border p-2 text-right">{table.recordCount}</td>
                  <td className="border p-2 text-right">£{table.totalSpend?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '0.00'}</td>
                  <td className="border p-2 text-right">£{table.totalProfit?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '0.00'}</td>
                  <td className="border p-2 text-right">{table.totalPacks?.toLocaleString() || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Sample Data Comparison</h3>
        <div className="mb-4">
          <Select 
            value={selectedMonth} 
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="February">February</SelectItem>
              <SelectItem value="March">March</SelectItem>
              <SelectItem value="April">April</SelectItem>
              <SelectItem value="May">May</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unified data */}
          <div>
            <h4 className="font-medium mb-2">Unified Table ({unifiedData.length} records)</h4>
            {unifiedData.length > 0 ? (
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(unifiedData[0], null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No unified data</p>
            )}
          </div>
          
          {/* Legacy data */}
          <div>
            <h4 className="font-medium mb-2">Original Table ({legacyData.length} records)</h4>
            {legacyData.length > 0 ? (
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(legacyData[0], null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No legacy data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVerification;
