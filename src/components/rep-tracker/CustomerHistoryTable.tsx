
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CalendarX2 } from 'lucide-react';
import { SimpleCustomerSelect } from './SimpleCustomerSelect';
import { Card } from '@/components/ui/card';

interface CustomerHistoryTableProps {
  customers: Array<{ account_name: string; account_ref: string }>;
  selectedUserId?: string;
}

interface Visit {
  id: string;
  date: string;
  customer_ref: string;
  customer_name: string;
  visit_type: string;
  has_order: boolean;
  profit: number;
  notes?: string;
  user_id: string;
}

const CustomerHistoryTable: React.FC<CustomerHistoryTableProps> = ({ customers, selectedUserId }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  
  const { data: visits, isLoading } = useQuery({
    queryKey: ['customer-history', selectedCustomerId, selectedUserId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      
      let query = supabase
        .from('customer_visits')
        .select('*')
        .eq('customer_ref', selectedCustomerId)
        .order('date', { ascending: false });
        
      // Filter by user if specified
      if (selectedUserId) {
        query = query.eq('user_id', selectedUserId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as Visit[];
    },
    enabled: !!selectedCustomerId,
  });

  const filteredCustomers = searchInput
    ? customers.filter(c => 
        c.account_name.toLowerCase().includes(searchInput.toLowerCase()))
    : customers;

  const handleCustomerSelect = (ref: string, name: string) => {
    setSelectedCustomerId(ref);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Customer Visit History</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 lg:col-span-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="bg-background pl-9"
              placeholder="Search customers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        
        <div className="md:col-span-7 lg:col-span-8">
          <SimpleCustomerSelect
            customers={filteredCustomers.slice(0, 100)} // Limit for performance
            onSelect={handleCustomerSelect}
            selectedCustomer=""
            showInitialValue={false}
          />
        </div>
      </div>
      
      {selectedCustomerId ? (
        isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-10 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        ) : !visits?.length ? (
          <Card className="bg-card/30 border-muted p-8 flex flex-col items-center justify-center text-center">
            <CalendarX2 className="h-10 w-10 mb-3 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No visit history</h3>
            <p className="text-muted-foreground">
              No visits have been recorded for this customer{selectedUserId ? " by this user" : ""}.
            </p>
          </Card>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead>Order Placed</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">{format(parseISO(visit.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{visit.visit_type}</TableCell>
                    <TableCell>
                      {visit.has_order ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell className="text-right">
                      {visit.has_order ? (
                        <span className="text-green-500">
                          £{visit.profit.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <Card className="bg-card/30 border-muted p-8 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-medium mb-2">Select a customer</h3>
          <p className="text-muted-foreground">
            Choose a customer to view their visit history.
          </p>
        </Card>
      )}
    </div>
  );
};

export default CustomerHistoryTable;
