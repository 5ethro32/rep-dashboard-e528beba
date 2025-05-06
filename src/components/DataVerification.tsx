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
        const { data, error } = await supabase.rpc('get_table_stats', { table_name: tableName });
        
        if (error) {
          console.error(`Error getting stats for ${tableName}:`, error);
          
          // Fallback to direct SQL count query if RPC fails
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          if (countError) {
            console.error(`Error counting ${tableName}:`, countError);
            return {
              tableName,
              recordCount: 0,
              totalSpend: 0,
              totalProfit: 0,
              totalPacks: 0
            };
          }
          
          return {
            tableName,
            recordCount: count || 0,
            totalSpend: 0,
            totalProfit: 0,
            totalPacks: 0
          };
        }
        
        return {
          tableName,
          ...data[0]
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
        .from(tableName)
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
        // Get totals from unified table
        const { data, error } = await supabase.rpc('get_month_totals', { 
          month_name: month 
        });
        
        if (error) {
          console.error(`Error getting totals for ${month}:`, error);
          
          // Fallback to direct SQL query
          const sqlQuery = `
            SELECT 
              COUNT(*) as record_count,
              SUM(spend) as total_spend,
              SUM(profit) as total_profit,
              SUM(packs) as total_packs
            FROM unified_sales_data
            WHERE reporting_month = '${month}'
          `;
          
          const { data: sqlData, error: sqlError } = await supabase.rpc('select', { 
            query: sqlQuery 
          });
          
          if (sqlError) {
            console.error(`Error with SQL query for ${month}:`, sqlError);
            return { month, recordCount: 0, totalSpend: 0, totalProfit: 0, totalPacks: 0 };
          }
          
          return { 
            month, 
            recordCount: sqlData?.[0]?.record_count || 0,
            totalSpend: sqlData?.[0]?.total_spend || 0,
            totalProfit: sqlData?.[0]?.total_profit || 0,
            totalPacks: sqlData?.[0]?.total_packs || 0 
          };
        }
        
        return { month, ...data[0] };
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
      const sqlQuery = `
        SELECT 
          reporting_month as month,
          department, 
          COUNT(*) as record_count,
          SUM(spend) as total_spend,
          SUM(profit) as total_profit
        FROM unified_sales_data
        GROUP BY reporting_month, department
        ORDER BY reporting_month, department
      `;
      
      const { data, error } = await supabase.rpc('select', { query: sqlQuery });
      
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