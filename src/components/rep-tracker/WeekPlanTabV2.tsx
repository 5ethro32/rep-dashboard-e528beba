
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isToday, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarPlus, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddPlanDialog from './AddPlanDialog';
import EditPlanDialog from './EditPlanDialog';
import { useDeletePlanMutation } from '@/hooks/usePlanMutation';
import { toast } from '@/components/ui/use-toast';

interface PlanItem {
  id: string;
  planned_date: string;
  customer_ref: string;
  customer_name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  notes?: string;
}

interface WeekDayData {
  date: Date;
  formattedDate: string;
  dayOfWeek: string;
  isToday: boolean;
  plans: PlanItem[];
}

interface WeekPlanTabV2Props {
  weekStartDate: Date;
  weekEndDate: Date;
  customers: Array<{ account_name: string; account_ref: string }>;
  onAddPlanSuccess?: () => void;
  selectedUserId?: string;
  readOnly?: boolean;
}

const WeekPlanTabV2: React.FC<WeekPlanTabV2Props> = ({
  weekStartDate,
  weekEndDate,
  customers,
  onAddPlanSuccess,
  selectedUserId,
  readOnly = false
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingForDate, setAddingForDate] = useState<Date | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  
  const deletePlanMutation = useDeletePlanMutation(() => {
    // Refetch plans after deletion
    refetch();
  });

  // Get the week days
  const weekDays: WeekDayData[] = [];
  let currentDate = new Date(weekStartDate);
  while (currentDate <= weekEndDate) {
    weekDays.push({
      date: new Date(currentDate),
      formattedDate: format(currentDate, 'yyyy-MM-dd'),
      dayOfWeek: format(currentDate, 'EEEE'),
      isToday: isToday(currentDate),
      plans: [] // Will be populated with query data
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fetch plans for the week
  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['week-plans', weekStartDate.toISOString(), weekEndDate.toISOString(), selectedUserId],
    queryFn: async () => {
      let query = supabase
        .from('week_plans')
        .select('*')
        .gte('planned_date', format(weekStartDate, 'yyyy-MM-dd'))
        .lte('planned_date', format(weekEndDate, 'yyyy-MM-dd'));
        
      // Filter by selected user if provided
      if (selectedUserId) {
        query = query.eq('user_id', selectedUserId);
      }
      
      const { data, error } = await query.order('created_at');
      
      if (error) {
        throw error;
      }
      
      return data as PlanItem[];
    }
  });

  // Distribute plans to specific days
  if (plans) {
    plans.forEach(plan => {
      const planDate = parseISO(plan.planned_date);
      const dayIndex = weekDays.findIndex(day => isSameDay(day.date, planDate));
      if (dayIndex >= 0) {
        weekDays[dayIndex].plans.push(plan);
      }
    });
  }

  const handleDeletePlan = (planId: string) => {
    deletePlanMutation.mutate(planId);
  };

  const handleAddNewClick = (date: Date) => {
    setAddingForDate(date);
    setShowAddDialog(true);
  };

  const handleAddDialogClose = () => {
    setShowAddDialog(false);
    setAddingForDate(null);
  };

  const handleEditPlanClick = (plan: PlanItem) => {
    setEditingPlan(plan);
  };

  const handleEditDialogClose = () => {
    setEditingPlan(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Week Plan</h2>
        
        {!readOnly && (
          <Button 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => handleAddNewClick(new Date())}
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Add Plan</span>
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <Card key={i} className="bg-card/30 border-muted">
              <CardHeader className="pb-2">
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-1"></div>
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          {weekDays.map((day) => (
            <Card 
              key={day.formattedDate}
              className={cn(
                "border-muted",
                day.isToday && "border-finance-red/50 bg-red-950/10"
              )}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{day.dayOfWeek}</CardTitle>
                    <p className="text-sm text-muted-foreground">{format(day.date, 'MMM d')}</p>
                  </div>
                  {!readOnly && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => handleAddNewClick(day.date)}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      <span className="sr-only">Add plan for {day.dayOfWeek}</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 space-y-2">
                {day.plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No plans</p>
                ) : (
                  day.plans.map((plan) => (
                    <div 
                      key={plan.id}
                      className="p-2 border border-muted rounded-md text-sm relative bg-card/30"
                    >
                      <div className="font-medium mb-1 pr-6">{plan.customer_name}</div>
                      {plan.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{plan.notes}</p>
                      )}
                      
                      {!readOnly && (
                        <div className="absolute top-1 right-1 flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 opacity-70 hover:opacity-100"
                            onClick={() => handleEditPlanClick(plan)}
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="sr-only">Edit plan</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 text-destructive opacity-70 hover:opacity-100"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Delete plan</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Plan Dialog */}
      {showAddDialog && addingForDate && (
        <AddPlanDialog
          isOpen={showAddDialog}
          onClose={handleAddDialogClose}
          onSuccess={() => {
            if (onAddPlanSuccess) {
              onAddPlanSuccess();
            }
            refetch();
          }}
          customers={customers}
          initialDate={format(addingForDate, 'yyyy-MM-dd')}
        />
      )}
      
      {/* Edit Plan Dialog */}
      {editingPlan && (
        <EditPlanDialog
          isOpen={!!editingPlan}
          onClose={handleEditDialogClose}
          plan={{
            id: editingPlan.id,
            planned_date: editingPlan.planned_date,
            customer_ref: editingPlan.customer_ref,
            customer_name: editingPlan.customer_name,
            notes: editingPlan.notes || ''
          }}
          customers={customers}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default WeekPlanTabV2;
