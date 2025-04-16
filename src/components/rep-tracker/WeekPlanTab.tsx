
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AddPlanDialog from './AddPlanDialog';
import EditPlanDialog from './EditPlanDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WeekPlan {
  id: string;
  planned_date: string;
  customer_name: string;
  customer_ref: string;
  notes: string | null;
}

const WeekPlanTab: React.FC<{
  weekStartDate: Date;
  weekEndDate: Date;
  customers: Array<{ account_name: string; account_ref: string }>;
}> = ({ weekStartDate, weekEndDate, customers }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPlan, setSelectedPlan] = useState<WeekPlan | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Use a specific query key for the current week's data
  const weekPlansQueryKey = ['week-plans', weekStartDate.toISOString(), weekEndDate.toISOString()];
  
  const { data: weekPlans, isLoading, refetch } = useQuery({
    queryKey: weekPlansQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('week_plans')
        .select('*')
        .gte('planned_date', weekStartDate.toISOString().split('T')[0])
        .lte('planned_date', weekEndDate.toISOString().split('T')[0])
        .order('planned_date');

      if (error) throw error;
      return data as WeekPlan[];
    },
    meta: {
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: 'Failed to load week plans',
          variant: 'destructive',
        });
      },
    },
    // Set these options to ensure we always get fresh data
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0 // This replaces cacheTime in React Query v5
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('week_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      // Return the deleted plan ID for use in optimistic updates
      return planId;
    },
    meta: {
      onSuccess: (deletedId) => {
        // Force an immediate refetch after deletion
        queryClient.invalidateQueries({ 
          queryKey: ['week-plans'],
          refetchType: 'all'
        });
        
        // Explicitly refetch the current week's plans
        refetch();
        
        toast({
          title: 'Plan Deleted',
          description: 'Week plan has been deleted successfully.',
        });
        
        setDeleteConfirmOpen(false);
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: 'Failed to delete plan',
          variant: 'destructive',
        });
      },
    },
  });

  const handleDelete = (planId: string) => {
    setPlanToDelete(planId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (planToDelete) {
      // Immediately update the UI (optimistic update)
      if (weekPlans) {
        queryClient.setQueryData(
          weekPlansQueryKey, 
          (oldData: WeekPlan[] | undefined) => {
            if (!oldData) return [];
            return oldData.filter(plan => plan.id !== planToDelete);
          }
        );
      }
      
      // Then perform the actual deletion
      deletePlanMutation.mutate(planToDelete);
    }
  };

  const handleAddPlan = (date?: Date) => {
    setSelectedDate(date);
    setIsAddPlanOpen(true);
  };

  const handleEditPlan = (plan: WeekPlan) => {
    setSelectedPlan(plan);
    setIsEditPlanOpen(true);
  };

  const handleAddPlanSuccess = () => {
    // Close the dialog first
    setIsAddPlanOpen(false);
    
    // Force an immediate refetch of all week plans data and explicit refetch
    queryClient.invalidateQueries({ 
      queryKey: ['week-plans'],
      refetchType: 'all'
    });
    
    // Explicitly refetch the current week's data
    refetch();
  };

  const handleEditPlanSuccess = () => {
    setIsEditPlanOpen(false);
    queryClient.invalidateQueries({ 
      queryKey: ['week-plans'],
      refetchType: 'all'
    });
    refetch();
  };

  // Days of the week for the plan
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Week Plan</h3>
        <Button 
          onClick={() => handleAddPlan()}
          className="bg-finance-red hover:bg-finance-red/80"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day, index) => {
          const currentDate = new Date(weekStartDate);
          currentDate.setDate(weekStartDate.getDate() + index);
          const dayPlans = weekPlans?.filter(
            plan => new Date(plan.planned_date).toDateString() === currentDate.toDateString()
          ) || [];

          return (
            <Card key={day} className="border-gray-800 bg-black/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-white">
                    {day} - {format(currentDate, 'dd/MM')}
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleAddPlan(currentDate)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {dayPlans.map(plan => (
                    <div 
                      key={plan.id} 
                      className="p-2 rounded bg-black/30 border border-gray-800"
                    >
                      <p className="font-medium">{plan.customer_name}</p>
                      {plan.notes && (
                        <p className="text-sm text-gray-400 mt-1">{plan.notes}</p>
                      )}
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {dayPlans.length === 0 && (
                    <p className="text-sm text-gray-500">No visits planned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddPlanDialog 
        isOpen={isAddPlanOpen}
        onClose={() => setIsAddPlanOpen(false)}
        customers={customers}
        selectedDate={selectedDate}
        onSuccess={handleAddPlanSuccess}
      />

      <EditPlanDialog
        isOpen={isEditPlanOpen}
        onClose={() => setIsEditPlanOpen(false)}
        plan={selectedPlan}
        customers={customers}
        onSuccess={handleEditPlanSuccess}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WeekPlanTab;
