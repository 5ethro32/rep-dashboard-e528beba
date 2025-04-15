
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
}> = ({ weekStartDate, weekEndDate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: weekPlans, isLoading } = useQuery({
    queryKey: ['week-plans', weekStartDate, weekEndDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('week_plans')
        .select('*')
        .gte('planned_date', weekStartDate.toISOString())
        .lte('planned_date', weekEndDate.toISOString())
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
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Week Plan</h3>
        <Button 
          onClick={() => {
            // TODO: Implement add plan dialog
            toast({
              title: "Coming soon",
              description: "Add plan functionality will be implemented soon!"
            });
          }}
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
                <h4 className="font-semibold mb-2 text-white">
                  {day} - {format(currentDate, 'dd/MM')}
                </h4>
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
    </div>
  );
};

export default WeekPlanTab;
