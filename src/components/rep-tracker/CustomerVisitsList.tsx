
import React, { useState } from 'react';
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
import { Edit2, Trash2 } from 'lucide-react';

interface Customer {
  account_name: string;
  account_ref: string;
}

interface CustomerVisitsListProps {
  weekStartDate: Date;
  weekEndDate: Date;
  customers: Customer[];
  isLoadingCustomers: boolean;
}

// Sample data for demonstration purposes
const sampleVisits = [
  {
    id: '1',
    date: new Date('2025-02-10'),
    type: 'Customer Visit',
    customerName: 'Halliday Largs',
    customerRef: 'HL001',
    contact: 'David',
    hasOrder: true,
    profit: 110.00,
    comments: 'Olanz 10mg, pro buccal, trazodones.',
  },
  {
    id: '2',
    date: new Date('2025-02-10'),
    type: 'Customer Visit',
    customerName: 'AA Hagan',
    customerRef: 'AA002',
    contact: 'Paul',
    hasOrder: false,
    profit: 0,
    comments: 'Left aah offers. Followed up. Future potential REVA.',
  },
  {
    id: '3',
    date: new Date('2025-02-10'),
    type: 'Customer Visit',
    customerName: 'Reekie',
    customerRef: 'RE003',
    contact: 'Martyn',
    hasOrder: true,
    profit: 141.23,
    comments: 'Olanz 10mg, traz 150 & 50mg.',
  },
  {
    id: '4',
    date: new Date('2025-02-11'),
    type: 'Outbound Call',
    customerName: 'TN Crosby',
    customerRef: 'TN004',
    contact: 'Michael',
    hasOrder: true,
    profit: 54.66,
    comments: 'Olanz 10mg & 2.5 tran acid trazodones',
  },
  {
    id: '5',
    date: new Date('2025-02-13'),
    type: 'Customer Visit',
    customerName: 'Office in AM',
    customerRef: 'OFFICE',
    contact: '',
    hasOrder: false,
    profit: 0,
    comments: '',
  },
];

const CustomerVisitsList: React.FC<CustomerVisitsListProps> = ({
  weekStartDate,
  weekEndDate,
  customers,
  isLoadingCustomers,
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'ordered', 'no-order'

  // Filter visits based on selected filter
  const filteredVisits = sampleVisits.filter(visit => {
    if (filter === 'all') return true;
    if (filter === 'ordered') return visit.hasOrder;
    if (filter === 'no-order') return !visit.hasOrder;
    return true;
  });

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
                <TableHead className="text-white font-medium">Date</TableHead>
                <TableHead className="text-white font-medium">Type</TableHead>
                <TableHead className="text-white font-medium">Customer</TableHead>
                <TableHead className="text-white font-medium">Contact</TableHead>
                <TableHead className="text-white font-medium">Order</TableHead>
                <TableHead className="text-white font-medium">Profit (£)</TableHead>
                <TableHead className="text-white font-medium">Comments</TableHead>
                <TableHead className="text-white font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.map((visit) => (
                <TableRow 
                  key={visit.id}
                  className="hover:bg-black/20 border-b border-gray-800 text-white"
                >
                  <TableCell>{visit.date.toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>{visit.type}</TableCell>
                  <TableCell>{visit.customerName}</TableCell>
                  <TableCell>{visit.contact}</TableCell>
                  <TableCell>{visit.hasOrder ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {visit.hasOrder ? formatCurrency(visit.profit) : 'N/A'}
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
              ))}
              {filteredVisits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-white/60">
                    No visits found for this week.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CustomerVisitsList;
