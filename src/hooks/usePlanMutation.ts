
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
          
          // Check if this is an array and if the new plan's date is within the range of this query
          if (Array.isArray(data)) {
            // Determine if this query key includes date range parameters
            const queryKey = query.queryKey as string[];
            if (queryKey.length >= 3) {
              const startDateStr = queryKey[1]; // Assuming format is ['week-plans', startDate, endDate]
              const endDateStr = queryKey[2];
              
              try {
                const startDate = new Date(startDateStr);
                const endDate = new Date(endDateStr);
                const planDate = new Date(newPlan.planned_date);
                
                // Only add the plan to this query if it's in the date range
                if (planDate >= startDate && planDate <= endDate) {
                  queryClient.setQueryData(query.queryKey, [...data, newPlan]);
                }
              } catch (e) {
                // If we can't parse the dates, just add the plan to be safe
                queryClient.setQueryData(query.queryKey, [...data, newPlan]);
              }
            } else {
              // If there's no date range specified, just add the plan
              queryClient.setQueryData(query.queryKey, [...data, newPlan]);
            }
          }
        });
        
        // Force a complete refresh of all week-plans queries
        queryClient.invalidateQueries({ 
          queryKey: ['week-plans'],
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
