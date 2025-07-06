import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DailyRepPerformanceDebug = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching from Daily_Data table...');
      
      // Try to fetch all data from Daily_Data table
      const { data: dailyData, error: fetchError } = await supabase
        .from('Daily_Data')
        .select('*')
        .limit(10);
      
      if (fetchError) {
        console.error('Supabase error:', fetchError);
        setError(fetchError.message);
      } else {
        console.log('Fetched data:', dailyData);
        setData(dailyData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create some mock data for testing
  const mockRepData = [
    { rep: 'John Smith', revenue: 150000, profit: 45000, margin: 30, orders: 120 },
    { rep: 'Jane Doe', revenue: 120000, profit: 36000, margin: 30, orders: 95 },
    { rep: 'Bob Johnson', revenue: 95000, profit: 23750, margin: 25, orders: 78 },
    { rep: 'Alice Williams', revenue: 88000, profit: 26400, margin: 30, orders: 65 },
    { rep: 'Tom Brown', revenue: 76000, profit: 15200, margin: 20, orders: 55 },
  ];

  const mockDepartmentData = [
    { department: 'Retail', revenue: 300000, profit: 90000, margin: 30, orders: 250 },
    { department: 'REVA', revenue: 150000, profit: 37500, margin: 25, orders: 120 },
    { department: 'Wholesale', revenue: 79000, profit: 18900, margin: 24, orders: 43 },
  ];

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Daily Rep Performance - Debug Page</h1>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Database Connection Test</h2>
          <div className="space-y-2">
            <p>Status: {loading ? 'Loading...' : error ? 'Error' : 'Success'}</p>
            {error && <p className="text-red-500">Error: {error}</p>}
            <p>Records found: {data.length}</p>
            <Button onClick={fetchData} disabled={loading}>
              Retry Fetch
            </Button>
          </div>
          
          {data.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Sample Data:</h3>
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(data[0], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Charts with Mock Data</h2>
          <p className="text-sm text-gray-400 mb-4">
            These charts use mock data to demonstrate they're working correctly:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Import and use the chart components with mock data */}
            <div className="h-[300px] border border-gray-700 rounded p-4">
              <p className="text-center text-gray-400">Profit Distribution Chart</p>
              <p className="text-center text-xs text-gray-500 mt-2">
                Would show bar chart with rep profits
              </p>
            </div>
            
            <div className="h-[300px] border border-gray-700 rounded p-4">
              <p className="text-center text-gray-400">Margin Comparison Chart</p>
              <p className="text-center text-xs text-gray-500 mt-2">
                Would show bar chart with rep margins
              </p>
            </div>
            
            <div className="h-[300px] border border-gray-700 rounded p-4">
              <p className="text-center text-gray-400">Rep Profit Share Chart</p>
              <p className="text-center text-xs text-gray-500 mt-2">
                Would show donut chart with profit percentages
              </p>
            </div>
            
            <div className="h-[300px] border border-gray-700 rounded p-4">
              <p className="text-center text-gray-400">Department Profit Share Chart</p>
              <p className="text-center text-xs text-gray-500 mt-2">
                Would show donut chart with department breakdown
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Mock Data for Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Rep Data:</h3>
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(mockRepData, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Department Data:</h3>
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(mockDepartmentData, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyRepPerformanceDebug;