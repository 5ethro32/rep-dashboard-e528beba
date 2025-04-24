import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

type AllowedTable = 'mtd_daily' | 'sales_data' | 'sales_data_februrary' | 'march_rolling';

// Make sure to use default export
const AccountPerformance = () => {
  const [data, setData] = useState<any[]>([]);
  const [activeTable, setActiveTable] = useState<AllowedTable>('mtd_daily');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(activeTable)
          .select('*');

        if (tableError) {
          setError(tableError.message);
        } else {
          setData(tableData || []);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTable]);

  const handleTabChange = (table: AllowedTable) => {
    setActiveTable(table);
  };

  return (
    <div>
      <Tabs defaultValue={activeTable} className="w-[400px]">
        <TabsList>
          <TabsTrigger value="mtd_daily" onClick={() => handleTabChange('mtd_daily')}>MTD Daily</TabsTrigger>
          <TabsTrigger value="sales_data" onClick={() => handleTabChange('sales_data')}>Sales Data</TabsTrigger>
          <TabsTrigger value="sales_data_februrary" onClick={() => handleTabChange('sales_data_februrary')}>Sales Data February</TabsTrigger>
          <TabsTrigger value="march_rolling" onClick={() => handleTabChange('march_rolling')}>March Rolling</TabsTrigger>
        </TabsList>
        <TabsContent value="mtd_daily">
          {isLoading && <p>Loading MTD Daily data...</p>}
          {error && <p>Error: {error}</p>}
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Account ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.account_id}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="sales_data">
          {isLoading && <p>Loading Sales Data...</p>}
          {error && <p>Error: {error}</p>}
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Product ID</TableHead>
                  <TableHead>Sales Date</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.product_id}</TableCell>
                    <TableCell>{row.sales_date}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="sales_data_februrary">
        {isLoading && <p>Loading Sales Data February...</p>}
          {error && <p>Error: {error}</p>}
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Product ID</TableHead>
                  <TableHead>Sales Date</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.product_id}</TableCell>
                    <TableCell>{row.sales_date}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="march_rolling">
        {isLoading && <p>Loading March Rolling Data...</p>}
          {error && <p>Error: {error}</p>}
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Customer ID</TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.customer_id}</TableCell>
                    <TableCell>{row.transaction_date}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Add default export
export default AccountPerformance;
