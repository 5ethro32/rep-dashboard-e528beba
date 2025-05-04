import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getMonthData, getMonthlyMetricsByDept } from '@/utils/unified-data-service';
import useDepartmentMetrics from '@/hooks/useDepartmentMetrics';

const DataDebug = () => {
  const [selectedMonth, setSelectedMonth] = useState('May');
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  // Use our metrics hook
  const metrics = useDepartmentMetrics(selectedMonth);
  
  // Check Supabase connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('unified_sales_data').select('id').limit(1);
        if (error) {
          throw error;
        }
        setConnectionStatus('connected');
      } catch (err) {
        console.error('Supabase connection error:', err);
        setConnectionStatus('error');
      }
    };
    
    checkConnection();
  }, []);
  
  // Load raw data for testing
  const loadRawData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Loading raw data for ${selectedMonth}...`);
      const data = await getMonthData(selectedMonth);
      setRawData(data);
      console.log(`Loaded ${data.length} records for ${selectedMonth}`);
    } catch (err) {
      console.error('Error loading raw data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load department metrics for testing
  const loadDeptMetrics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Loading department metrics for ${selectedMonth}...`);
      const data = await getMonthlyMetricsByDept(selectedMonth);
      console.log(`Retrieved department metrics:`, data);
    } catch (err) {
      console.error('Error loading department metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Data Debug Page</h1>
      
      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supabase Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div 
              className={`w-4 h-4 rounded-full ${
                connectionStatus === 'checking' ? 'bg-yellow-500' :
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`} 
            />
            <span>
              {connectionStatus === 'checking' ? 'Checking connection...' :
               connectionStatus === 'connected' ? 'Connected to Supabase' : 'Connection error'}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Month Selection */}
      <div className="flex gap-2 mb-4">
        {['February', 'March', 'April', 'May'].map(month => (
          <Button 
            key={month}
            variant={selectedMonth === month ? 'default' : 'outline'} 
            onClick={() => setSelectedMonth(month)}
          >
            {month}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button onClick={loadRawData} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load Raw Data'}
        </Button>
        <Button onClick={loadDeptMetrics} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load Department Metrics'}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {/* Department Metrics Debug */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Department Metrics Hook State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {metrics.isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {metrics.error ? metrics.error.message : 'None'}</p>
            <p><strong>Retail Metrics:</strong> {metrics.retailMetrics ? 'Available' : 'Not available'}</p>
            <p><strong>REVA Metrics:</strong> {metrics.revaMetrics ? 'Available' : 'Not available'}</p>
            <p><strong>Wholesale Metrics:</strong> {metrics.wholesaleMetrics ? 'Available' : 'Not available'}</p>
            
            {metrics.retailMetrics && (
              <div className="mt-4">
                <h3 className="font-semibold">Retail Data:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(metrics.retailMetrics, null, 2)}
                </pre>
              </div>
            )}
            
            {metrics.revaMetrics && (
              <div className="mt-4">
                <h3 className="font-semibold">REVA Data:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(metrics.revaMetrics, null, 2)}
                </pre>
              </div>
            )}
            
            {metrics.wholesaleMetrics && (
              <div className="mt-4">
                <h3 className="font-semibold">Wholesale Data:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(metrics.wholesaleMetrics, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-semibold">Combined Metrics:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(metrics.combinedMetrics, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Raw Data Preview */}
      {rawData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Data Preview ({rawData.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-60">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(rawData[0]).slice(0, 5).map(key => (
                      <th key={key} className="px-2 py-1 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      {Object.values(row).slice(0, 5).map((value, i) => (
                        <td key={i} className="px-2 py-1">{value?.toString() || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {rawData.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold">First Record:</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(rawData[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataDebug; 