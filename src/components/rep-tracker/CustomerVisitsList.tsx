
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/rep-performance-utils';
import { Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CustomerVisitsListProps {
  weekStartDate: Date;
  weekEndDate: Date;
  customers: Array<{
    account_name: string;
    account_ref: string;
  }>;
  isLoadingCustomers: boolean;
}

type SortField = 'date' | 'customer_name' | 'profit';
type SortOrder = 'asc' | 'desc';

const CustomerVisitsList: React.FC<CustomerVisitsListProps> = ({
  weekStartDate,
  weekEndDate,
  customers,
  isLoadingCustomers,
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'ordered', 'no-order'
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Fetch visits from Supabase
  const { data: visits, isLoading } = useQuery({
    queryKey: ['customer-visits', weekStartDate, weekEndDate, sortField, sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_visits')
        .select('*')
        .gte('date', weekStartDate.toISOString())
        .lte('date', weekEndDate.toISOString())
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      return data;
    },
    meta: {
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: 'Failed to load visits',
          variant: 'destructive',
        });
      },
    },
  });

  // Filter visits based on selected filter
  const filteredVisits = visits?.filter(visit => {
    if (filter === 'all') return true;
    if (filter === 'ordered') return visit.has_order;
    if (filter === 'no-order') return !visit.has_order;
    return true;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between mb-4">
        <h2 className="text-xl font-semibold mb-2 md:mb-0">Customer Visits</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/60">Filter:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px] bg-black/30 border-gray-700 text-white">
              <SelectValue placeholder="Filter visits" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="all">All Visits</SelectItem>
              <SelectItem value="ordered">With Orders</SelectItem>
              <SelectItem value="no-order">No Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-gray-800 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-black/30">
              <TableRow className="hover:bg-transparent border-b border-gray-800">
                <TableHead className="text-white font-medium">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('date')}
                    className="text-white font-medium hover:text-white"
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-white font-medium">Type</TableHead>
                <TableHead className="text-white font-medium">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('customer_name')}
                    className="text-white font-medium hover:text-white"
                  >
                    Customer
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-white font-medium">Contact</TableHead>
                <TableHead className="text-white font-medium">Order</TableHead>
                <TableHead className="text-white font-medium">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('profit')}
                    className="text-white font-medium hover:text-white"
                  >
                    Profit (£)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-white font-medium">Comments</TableHead>
                <TableHead className="text-white font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-white/60">
                    Loading visits...
                  </TableCell>
                </TableRow>
              ) : filteredVisits?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-white/60">
                    No visits found for this week.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisits?.map((visit) => (
                  <TableRow 
                    key={visit.id}
                    className="hover:bg-black/20 border-b border-gray-800 text-white"
                  >
                    <TableCell>{new Date(visit.date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>{visit.visit_type}</TableCell>
                    <TableCell>{visit.customer_name}</TableCell>
                    <TableCell>{visit.contact_name}</TableCell>
                    <TableCell>{visit.has_order ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {visit.has_order ? formatCurrency(visit.profit) : 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {visit.comments}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-400">
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CustomerVisitsList;
