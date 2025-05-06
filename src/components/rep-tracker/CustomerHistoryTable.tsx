
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, UserCog } from 'lucide-react';
import { ImprovedCustomerSelector } from './ImprovedCustomerSelector';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/utils/rep-performance-utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerVisit {
  id: string;
  date: string;
  customer_name: string;
  customer_ref: string;
  visit_type: string;
  has_order: boolean;
  profit: number;
  comments: string | null;
  contact_name: string | null;
}

interface CustomerHistoryTableProps {
  customers: Array<{ account_name: string; account_ref: string }>;
  userId?: string;
}

const CustomerHistoryTable: React.FC<CustomerHistoryTableProps> = ({ customers, userId }) => {
  const [selectedCustomerRef, setSelectedCustomerRef] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const { user } = useAuth();

  // If no userId is provided, use the current user's ID
  const targetUserId = userId || user?.id;
  
  // Check if viewing another user's data
  const isViewingOtherUser = user?.id !== userId && !!userId;

  // Query to fetch all visits for a specific customer
  const { data: customerVisits, isLoading } = useQuery({
    queryKey: ['customer-history', selectedCustomerRef, targetUserId],
    queryFn: async (): Promise<CustomerVisit[]> => {
      if (!selectedCustomerRef || !targetUserId) return [];
      
      const { data, error } = await supabase
        .from('customer_visits')
        .select('*')
        .eq('customer_ref', selectedCustomerRef)
        .eq('user_id', targetUserId)
        .order('date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedCustomerRef && !!targetUserId
  });

  const handleCustomerSelect = (ref: string, name: string) => {
    setSelectedCustomerRef(ref);
    setSelectedCustomerName(name);
  };

  // Function to format the date for display
  const formatVisitDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEE, MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Customer Visit History
          {isViewingOtherUser && (
            <Badge variant="outline" className="ml-2 bg-amber-800/30 text-amber-300 border-amber-500/50">
              <UserCog size={14} className="mr-1" />
              Viewing Only
            </Badge>
          )}
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <ImprovedCustomerSelector
              customers={customers}
              selectedCustomer={selectedCustomerName}
              onSelect={handleCustomerSelect}
              placeholder="Select a customer to view their visit history..."
            />
          </div>
        </div>

        {selectedCustomerRef && (
          <Card className="p-4 border-gray-800 bg-black/20">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-finance-red border-t-transparent rounded-full"></div>
              </div>
            ) : customerVisits && customerVisits.length > 0 ? (
              <Table>
                <TableCaption>
                  Visit history for {selectedCustomerName} - {customerVisits.length} total visits
                </TableCaption>
                <TableHeader>
                  <TableRow className="bg-gray-900/50 hover:bg-gray-900">
                    <TableHead>Date</TableHead>
                    <TableHead>Visit Type</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerVisits.map((visit) => (
                    <TableRow key={visit.id} className="border-gray-800 hover:bg-gray-900/50">
                      <TableCell className="font-medium">{formatVisitDate(visit.date)}</TableCell>
                      <TableCell>{visit.visit_type}</TableCell>
                      <TableCell>
                        {visit.has_order ? (
                          <Badge className="bg-green-600">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-700">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className={`${visit.profit > 0 ? "text-finance-red" : "text-gray-400"}`}>
                        {formatCurrency(visit.profit)}
                      </TableCell>
                      <TableCell>{visit.contact_name || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {visit.comments || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-8 text-gray-500">
                {selectedCustomerRef ? 
                  "No visits found for this customer." : 
                  "Select a customer to view their visit history."}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomerHistoryTable;
