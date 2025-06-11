import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Edit2, Trash2, ArrowUpDown, PlusCircle, Calendar, Eye, EyeOff, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditVisitDialog from './EditVisitDialog';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomerVisitsListProps {
  weekStartDate: Date;
  weekEndDate: Date;
  customers: Array<{
    account_name: string;
    account_ref: string;
  }>;
  isLoadingCustomers: boolean;
  onDataChange?: () => void;
  onAddVisit: () => void;
  selectedUserId?: string | null;  // New prop for selected user
  isViewingOwnData?: boolean;      // New prop to indicate if viewing own data
}

type SortField = 'date' | 'customer_name' | 'profit';
type SortOrder = 'asc' | 'desc';

interface Visit {
  id: string;
  date: string;
  customer_name: string;
  customer_ref: string;
  contact_name?: string;
  visit_type: string;
  has_order: boolean;
  profit?: number;
  comments?: string;
  user_id: string;
  week_plan_id?: string;
  created_at?: string;
  updated_at?: string;
}

const CustomerVisitsList: React.FC<CustomerVisitsListProps> = ({
  weekStartDate,
  weekEndDate,
  customers,
  isLoadingCustomers,
  onDataChange,
  onAddVisit,
  selectedUserId,
  isViewingOwnData = true  // Default to viewing own data
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'ordered', 'no-order', 'planned'
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  const [visitToEdit, setVisitToEdit] = useState<Visit | null>(null);
  // New state to track expanded rows for viewing full comments
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = selectedUserId || user?.id;
  const isMobile = useIsMobile();
  
  // Check if this is the "All Data" view (Aver's Planner)
  const isAllDataView = selectedUserId === "all";

  const { data: visits, isLoading } = useQuery({
    queryKey: ['customer-visits', weekStartDate, weekEndDate, sortField, sortOrder, userId],
    queryFn: async () => {
      const query = supabase
        .from('customer_visits')
        .select('*')
        .gte('date', weekStartDate.toISOString())
        .lte('date', weekEndDate.toISOString());
        
      // Only filter by user_id if we have a selected user
      if (userId && userId !== "all") {
        query.eq('user_id', userId);
      }
      
      query.order(sortField, { ascending: sortOrder === 'asc' });
      
      const { data, error } = await query;

      if (error) throw error;
      return data as Visit[];
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
    refetchInterval: 0,
    staleTime: 0,
  });

  const deleteVisitMutation = useMutation({
    mutationFn: async (visitId: string) => {
      // First check if this is from a week plan
      const { data: visitData } = await supabase
        .from('customer_visits')
        .select('week_plan_id')
        .eq('id', visitId)
        .single();
        
      const { error } = await supabase
        .from('customer_visits')
        .delete()
        .eq('id', visitId);

      if (error) throw error;
      
      return { visitId, weekPlanId: visitData?.week_plan_id };
    },
    onSuccess: ({visitId, weekPlanId}) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-visits'],
        exact: false,
        refetchType: 'all'
      });
      
      // If this visit was from a week plan, show a different message
      const toastTitle = weekPlanId ? 'Planned Visit Deleted' : 'Visit Deleted';
      const toastDescription = weekPlanId 
        ? 'The visit has been deleted, but the original plan still exists in the Week Plan tab.'
        : 'The visit has been successfully deleted.';
      
      if (onDataChange) {
        onDataChange();
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
      });
      setVisitToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete visit. Please try again.',
        variant: 'destructive',
      });
      console.error("Error deleting visit:", error);
    },
  });

  const handleDeleteConfirm = () => {
    if (visitToDelete) {
      deleteVisitMutation.mutate(visitToDelete);
    }
  };

  // Helper to determine if user can edit a particular visit (only their own visits)
  const canEditVisit = (visit: Visit) => {
    if (!isViewingOwnData) return false;
    if (isAllDataView) return user?.id === visit.user_id;
    return true;
  };

  // New helper to toggle expanded state for a row
  const toggleRowExpansion = (visitId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitId)) {
        newSet.delete(visitId);
      } else {
        newSet.add(visitId);
      }
      return newSet;
    });
  };

  const filteredVisits = visits?.filter(visit => {
    if (filter === 'all') return true;
    if (filter === 'ordered') return visit.has_order;
    if (filter === 'no-order') return !visit.has_order;
    if (filter === 'planned') return !!visit.week_plan_id;
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
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-black/30 border-gray-700 text-white">
              <SelectValue placeholder="Filter visits" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="all">All Visits</SelectItem>
              <SelectItem value="ordered">With Orders</SelectItem>
              <SelectItem value="no-order">No Orders</SelectItem>
              <SelectItem value="planned">From Week Plan</SelectItem>
            </SelectContent>
          </Select>
          
          {isViewingOwnData && !isAllDataView && (
            <Button 
              className="bg-finance-red hover:bg-finance-red/80"
              onClick={onAddVisit}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Visit
            </Button>
          )}
        </div>
      </div>

      {/* Modified table container with scrolling capability like rep dashboard */}
      <div className="-mx-3 md:mx-0 overflow-x-auto scrollbar-hide relative">
        <div className="min-w-full inline-block align-middle">
          <div className="border border-gray-800 rounded-md overflow-hidden">
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
                  <TableHead className="text-white font-medium">Source</TableHead>
                  {isAllDataView && (
                    <TableHead className="text-white font-medium">Rep</TableHead>
                  )}
                  <TableHead className="text-white font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAllDataView ? 10 : 9} className="text-center py-4 text-white/60">
                      Loading visits...
                    </TableCell>
                  </TableRow>
                ) : filteredVisits?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAllDataView ? 10 : 9} className="text-center py-4 text-white/60">
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{visit.customer_name}</span>
                          {visit.customer_ref === 'PROSPECT' && (
                            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                              Prospect
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{visit.contact_name}</TableCell>
                      <TableCell>{visit.has_order ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {visit.has_order ? formatCurrency(visit.profit) : 'N/A'}
                      </TableCell>
                      <TableCell className={expandedRows.has(visit.id) ? "" : "max-w-[200px] truncate"}>
                        {visit.comments || 'No comments'}
                      </TableCell>
                      <TableCell>
                        {visit.week_plan_id ? (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" /> 
                            Plan
                          </Badge>
                        ) : 'Manual'}
                      </TableCell>
                      {isAllDataView && (
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3" /> 
                            {visit.user_id === user?.id ? 'You' : ''}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {canEditVisit(visit) ? (
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-blue-400"
                              onClick={() => setVisitToEdit(visit)}
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-400"
                              onClick={() => setVisitToDelete(visit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 flex items-center justify-center text-gray-500 hover:text-white"
                            onClick={() => toggleRowExpansion(visit.id)}
                          >
                            {expandedRows.has(visit.id) ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">View Comments</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {isViewingOwnData && (
        <>
          <AlertDialog open={!!visitToDelete} onOpenChange={() => setVisitToDelete(null)}>
            <AlertDialogContent className="bg-gray-900 border border-gray-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Confirm Delete</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Are you sure you want to delete this visit record? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-gray-700 text-white hover:bg-gray-800">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteConfirm}
                  className="bg-finance-red hover:bg-finance-red/80 text-white"
                >
                  {deleteVisitMutation.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {visitToEdit && (
            <EditVisitDialog
              isOpen={!!visitToEdit}
              onClose={() => setVisitToEdit(null)}
              visit={visitToEdit}
              customers={customers}
              onSuccess={() => {
                queryClient.invalidateQueries({
                  queryKey: ['customer-visits'],
                  exact: false,
                  refetchType: 'all'
                });
                
                if (onDataChange) {
                  onDataChange();
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CustomerVisitsList;
