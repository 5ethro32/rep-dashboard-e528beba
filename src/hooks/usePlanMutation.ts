
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface PlanFormData {
  planned_date: string;
  customer_ref: string;
  customer_name: string;
  notes: string;
}

export function usePlanMutation(onSuccess: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlanFormData & { user_id: string }) => {
      const { data: insertedData, error } = await supabase
        .from('week_plans')
        .insert([data])
        .select('*')
        .single();

      if (error) throw error;
      
      // Return the inserted data so we can use it for optimistic updates
      return insertedData;
    },
    meta: {
      onSuccess: (newPlan) => {
        // Optimistically update all week-plans queries by adding the new plan
        // We'll update any query keys that start with 'week-plans'
        const queryCache = queryClient.getQueryCache();
        const weekPlanQueries = queryCache.findAll({
          queryKey: ['week-plans'], 
          exact: false
        });
        
        weekPlanQueries.forEach(query => {
          const data = queryClient.getQueryData(query.queryKey);
          if (Array.isArray(data)) {
            queryClient.setQueryData(query.queryKey, [...data, newPlan]);
          }
        });
        
        // Force a complete refresh of all week-plans queries with aggressive invalidation
        queryClient.invalidateQueries({ 
          queryKey: ['week-plans'],
          exact: false,
          refetchType: 'all'
        });
        
        toast({
          title: 'Plan Added',
          description: 'Week plan has been added successfully.',
        });
        
        // Call the success callback to trigger additional UI updates
        onSuccess();
      },
      onError: (error: Error) => {
        console.error("Error adding plan:", error);
        toast({
          title: 'Error',
          description: 'Failed to add plan. Please try again.',
          variant: 'destructive',
        });
      },
    },
  });
}
