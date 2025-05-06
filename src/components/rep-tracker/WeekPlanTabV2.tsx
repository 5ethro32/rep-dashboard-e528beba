
import React, { useState } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AddPlanDialog from './AddPlanDialog';
import { PlusCircle, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import EditPlanDialog from './EditPlanDialog';
import { usePlanMutation } from '@/hooks/usePlanMutation';

interface WeekPlanTabV2Props {
  weekStartDate: Date;
  weekEndDate: Date;
  customers: Array<{
    account_name: string;
    account_ref: string;
  }>;
  onAddPlanSuccess?: () => void;
  userId?: string | null;
}

interface PlanItem {
  id: string;
  customer_name: string;
  customer_ref: string;
  planned_date: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

const WeekPlanTabV2: React.FC<WeekPlanTabV2Props> = ({ 
  weekStartDate, 
  weekEndDate,
  customers,
  onAddPlanSuccess,
  userId
}) => {
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { deletePlanMutation } = usePlanMutation(onSuccess);
  
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStartDate, i));
  }
  
  function onSuccess() {
    queryClient.invalidateQueries({
      queryKey: ['week-plans'],
      exact: false,
      refetchType: 'all'
    });
    
    if (onAddPlanSuccess) {
      onAddPlanSuccess();
    }
  }
  
  const { data: weekPlans, isLoading } = useQuery({
    queryKey: ['week-plans', format(weekStartDate, 'yyyy-MM-dd'), format(weekEndDate, 'yyyy-MM-dd'), userId],
    queryFn: async () => {
      let query = supabase
        .from('week_plans')
        .select('*')
        .gte('planned_date', format(weekStartDate, 'yyyy-MM-dd'))
        .lte('planned_date', format(weekEndDate, 'yyyy-MM-dd'));
      
      // Only filter by user_id if there's one specified or if current user is not admin
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (user?.id) {
        // Default to current user's plans if no user specified
        query = query.eq('user_id', user.id);
      }
        
      query = query.order('planned_date', { ascending: true });
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching week plans:', error);
        throw error;
      }
      
      return data as PlanItem[];
    },
    meta: {
      onError: (error: Error) => {
        console.error('Error in week plans query:', error);
        toast({
          title: 'Error',
          description: 'Failed to load week plans. Please try again later.',
          variant: 'destructive',
        });
      }
    }
  });
  
  const getPlansByDay = (day: Date) => {
    if (!weekPlans) return [];
    
    const dateString = format(day, 'yyyy-MM-dd');
    return weekPlans.filter(plan => plan.planned_date === dateString);
  };
  
  const handleOpenPlanDialog = (date: Date) => {
    // Only allow adding plans if viewing your own data
    if (userId && userId !== user?.id) {
      toast({
        title: "View Only Mode",
        description: "You can only add plans to your own calendar.",
        variant: "default"
      });
      return;
    }
    
    setSelectedDate(date);
    setShowAddPlan(true);
  };
  
  const handleDeletePlan = (planId: string, userId: string) => {
    // Only admins or plan owners can delete
    if (userId !== user?.id) {
      toast({
        title: "Access Denied",
        description: "You can only delete your own plans.",
        variant: "destructive"
      });
      return;
    }
    
    deletePlanMutation.mutate(planId);
  };
  
  const handleEditPlan = (plan: PlanItem) => {
    // Only admins or plan owners can edit
    if (plan.user_id !== user?.id) {
      toast({
        title: "Access Denied",
        description: "You can only edit your own plans.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingPlan(plan);
  };
  
  const handleAddPlanSuccess = () => {
    setShowAddPlan(false);
    onSuccess();
  };
  
  const isViewingOthersData = userId && userId !== user?.id;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Weekly Planning</h2>
        {!isViewingOthersData && (
          <Button 
            variant="outline" 
            className="bg-finance-red text-white hover:bg-finance-red/90 border-0"
            onClick={() => handleOpenPlanDialog(new Date())}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        )}
      </div>
      
      {isViewingOthersData && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-md">
          <p className="text-sm text-yellow-300">
            <strong>View Only Mode:</strong> You are viewing another user's plans and cannot make changes.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, i) => (
          <div 
            key={i} 
            className={`bg-black/30 border border-gray-800 rounded-lg overflow-hidden`}
          >
            <div className="bg-black/50 p-3 text-center border-b border-gray-800">
              <p className="font-medium text-white">
                {format(day, 'EEEE')}
              </p>
              <p className="text-sm text-white/70">
                {format(day, 'dd MMM')}
              </p>
            </div>
            
            <div className="p-3 min-h-[120px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-20">
                  <p className="text-sm text-white/70">Loading plans...</p>
                </div>
              ) : getPlansByDay(day).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 border border-dashed border-gray-800 rounded-md">
                  <CalendarDays className="h-5 w-5 text-gray-600 mb-1" />
                  <p className="text-xs text-gray-500">No plans</p>
                  {!isViewingOthersData && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-1 text-xs h-7 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                      onClick={() => handleOpenPlanDialog(day)}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {getPlansByDay(day).map((plan) => (
                    <div key={plan.id} className="p-2 bg-gray-900/50 border border-gray-800 rounded-md text-sm">
                      <div className="font-medium">{plan.customer_name}</div>
                      {plan.notes && <div className="text-xs text-gray-400 mt-1">{plan.notes}</div>}
                      {!isViewingOthersData && (
                        <div className="flex space-x-2 mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                            onClick={() => handleEditPlan(plan)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
                            onClick={() => handleDeletePlan(plan.id, plan.user_id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {showAddPlan && selectedDate && (
        <AddPlanDialog 
          isOpen={showAddPlan}
          onClose={() => setShowAddPlan(false)}
          onSuccess={handleAddPlanSuccess}
          date={selectedDate}
          customers={customers}
        />
      )}
      
      {editingPlan && (
        <EditPlanDialog
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={() => {
            onSuccess();
            setEditingPlan(null);
          }}
          plan={editingPlan}
          customers={customers}
        />
      )}
    </div>
  );
};

export default WeekPlanTabV2;
