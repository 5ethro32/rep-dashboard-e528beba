
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/rep-performance-utils';
import { CustomerSelector } from './CustomerSelector';
import { Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomerHistoryTableProps {
  customers: Array<{
    account_name: string;
    account_ref: string;
  }>;
  userId?: string | null;
}

interface VisitHistory {
  id: string;
  date: string;
  customer_name: string;
  customer_ref: string;
  visit_type: string;
  has_order: boolean;
  profit?: number;
  comments?: string;
  contact_name?: string;
}

const CustomerHistoryTable: React.FC<CustomerHistoryTableProps> = ({ customers, userId }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const { user } = useAuth();
  
  const { data: visits, isLoading } = useQuery({
    queryKey: ['customer-history', selectedCustomer, userId],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      
      let query = supabase
        .from('customer_visits')
        .select('*')
        .eq('customer_ref', selectedCustomer);
        
      // If userId is provided, filter by it
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // Otherwise use the current user's ID
        query = query.eq('user_id', user?.id);
      }
        
      // Order by date descending (most recent first)
      query = query.order('date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as VisitHistory[];
    },
    enabled: !!selectedCustomer,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching customer visit history:', error);
      }
    }
  });
  
  const { data: customerTotals } = useQuery({
    queryKey: ['customer-totals', selectedCustomer, userId],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      
      let query = supabase
        .from('customer_visits')
        .select('*')
        .eq('customer_ref', selectedCustomer);
        
      // If userId is provided, filter by it
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // Otherwise use the current user's ID
        query = query.eq('user_id', user?.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const totalVisits = data.length;
      const ordersWithProfit = data.filter(v => v.has_order && v.profit);
      const totalOrders = ordersWithProfit.length;
      const totalProfit = ordersWithProfit.reduce((sum, v) => sum + (v.profit || 0), 0);
      const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
      
      return {
        totalVisits,
        totalOrders,
        totalProfit,
        conversionRate
      };
    },
    enabled: !!selectedCustomer,
    meta: {
      onError: (error: Error) => {
        console.error('Error calculating customer totals:', error);
      }
    }
  });
  
  const selectedCustomerName = selectedCustomer 
    ? customers.find(c => c.account_ref === selectedCustomer)?.account_name 
    : '';
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold mb-4">Customer Visit History</h2>
        
        <div className="max-w-sm mb-6">
          <CustomerSelector 
            customers={customers} 
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
            placeholder="Select a customer to view history"
          />
        </div>
      </div>
      
      {selectedCustomer && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-black/30 border border-gray-800 p-3 md:p-4 rounded-lg">
            <div className="text-sm text-gray-400">Total Visits</div>
            <div className="text-xl font-semibold mt-1">{customerTotals?.totalVisits || 0}</div>
          </div>
          
          <div className="bg-black/30 border border-gray-800 p-3 md:p-4 rounded-lg">
            <div className="text-sm text-gray-400">Orders</div>
            <div className="text-xl font-semibold mt-1">{customerTotals?.totalOrders || 0}</div>
          </div>
          
          <div className="bg-black/30 border border-gray-800 p-3 md:p-4 rounded-lg">
            <div className="text-sm text-gray-400">Profit</div>
            <div className="text-xl font-semibold mt-1">{formatCurrency(customerTotals?.totalProfit || 0)}</div>
          </div>
          
          <div className="bg-black/30 border border-gray-800 p-3 md:p-4 rounded-lg">
            <div className="text-sm text-gray-400">Conversion Rate</div>
            <div className="text-xl font-semibold mt-1">{(customerTotals?.conversionRate || 0).toFixed(1)}%</div>
          </div>
        </div>
      )}
      
      {selectedCustomer ? (
        <div className="border border-gray-800 rounded-md overflow-hidden">
          <Table className="w-full">
            <TableHeader className="bg-black/30">
              <TableRow className="hover:bg-transparent border-b border-gray-800">
                <TableHead className="text-white font-medium">Date</TableHead>
                <TableHead className="text-white font-medium">Visit Type</TableHead>
                <TableHead className="text-white font-medium">Contact</TableHead>
                <TableHead className="text-white font-medium">Order</TableHead>
                <TableHead className="text-white font-medium">Profit</TableHead>
                <TableHead className="text-white font-medium">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-white/60">
                    Loading visit history...
                  </TableCell>
                </TableRow>
              ) : visits && visits.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  {visits.map((visit) => (
                    <TableRow 
                      key={visit.id}
                      className="hover:bg-black/20 border-b border-gray-800 text-white"
                    >
                      <TableCell>{format(parseISO(visit.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{visit.visit_type}</TableCell>
                      <TableCell>{visit.contact_name || '—'}</TableCell>
                      <TableCell>
                        {visit.has_order ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {visit.has_order && visit.profit ? formatCurrency(visit.profit) : '—'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {visit.comments || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </ScrollArea>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-white/60">
                    No visits found for this customer.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-black/30 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Select a customer to view their visit history.</p>
        </div>
      )}
    </div>
  );
};

export default CustomerHistoryTable;
