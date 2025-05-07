
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, Pencil, Trash2, CheckCircle2, CalendarX2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import EditVisitDialog from './EditVisitDialog';

interface CustomerVisitsListProps {
  weekStartDate: Date;
  weekEndDate: Date;
  customers: Array<{ account_name: string; account_ref: string }>;
  isLoadingCustomers: boolean;
  onDataChange: () => void;
  onAddVisit: () => void;
  selectedUserId?: string;
  readOnly?: boolean;
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
  visit_value: number;
}

const CustomerVisitsList: React.FC<CustomerVisitsListProps> = ({
  weekStartDate,
  weekEndDate,
  customers,
  isLoadingCustomers,
  onDataChange,
  onAddVisit,
  selectedUserId,
  readOnly = false
}) => {
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  const { data: visits, isLoading, refetch } = useQuery({
    queryKey: ['customer-visits', weekStartDate.toISOString(), weekEndDate.toISOString(), selectedUserId],
    queryFn: async () => {
      let query = supabase
        .from('customer_visits')
        .select('*')
        .gte('date', weekStartDate.toISOString())
        .lte('date', weekEndDate.toISOString());
        
      // Filter by user if specified
      if (selectedUserId) {
        query = query.eq('user_id', selectedUserId);
      }
        
      const { data, error } = await query.order('date');
      
      if (error) {
        throw error;
      }
      
      return data as Visit[];
    },
  });

  const handleEditVisit = (visit: Visit) => {
    setEditingVisit(visit);
  };

  const handleEditClose = () => {
    setEditingVisit(null);
  };

  const handleDeleteVisit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_visits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Visit deleted successfully',
      });
      
      refetch();
      onDataChange();
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete visit. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditSuccess = () => {
    refetch();
    onDataChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Customer Visits</h2>
        
        {!readOnly && (
          <Button
            onClick={onAddVisit}
            size="sm"
            variant="outline"
            className="flex gap-1 items-center"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Add Visit</span>
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card/30 border-muted">
              <CardHeader className="pb-2">
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-1"></div>
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded animate-pulse"></div>
              </CardContent>
              <CardFooter>
                <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : visits && visits.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-380px)] pr-4">
          <div className="space-y-4">
            {visits.map((visit) => (
              <Card key={visit.id} className="bg-card/30 border-muted">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="text-base">{visit.customer_name}</CardTitle>
                      <CardDescription>
                        {format(parseISO(visit.date), 'EEEE, MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge variant={visit.has_order ? "default" : "outline"} className={
                      visit.has_order 
                        ? "bg-green-600 hover:bg-green-600 text-white" 
                        : "border-muted text-muted-foreground"
                    }>
                      {visit.has_order ? 'Order Placed' : 'No Order'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Visit Type</p>
                      <p className="font-medium">{visit.visit_type}</p>
                    </div>
                    
                    {visit.has_order && (
                      <div>
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className="font-medium text-green-500">£{visit.profit.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    )}
                  </div>
                  
                  {visit.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{visit.notes}</p>
                    </div>
                  )}
                </CardContent>
                
                {!readOnly && (
                  <CardFooter className="pt-0">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEditVisit(visit)}
                        className="h-8"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteVisit(visit.id)}
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="bg-card/30 border-muted p-8 flex flex-col items-center justify-center text-center">
          <CalendarX2 className="h-10 w-10 mb-3 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No visits recorded</h3>
          <p className="text-muted-foreground mb-4">
            No customer visits have been logged for this week yet.
          </p>
          
          {!readOnly && (
            <Button
              onClick={onAddVisit}
              variant="outline"
              className="flex gap-1 items-center"
            >
              <CalendarPlus className="h-4 w-4" />
              <span>Add Your First Visit</span>
            </Button>
          )}
        </Card>
      )}
      
      {/* Edit Visit Dialog */}
      {editingVisit && (
        <EditVisitDialog
          isOpen={!!editingVisit}
          onClose={handleEditClose}
          visit={editingVisit}
          customers={customers}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default CustomerVisitsList;
