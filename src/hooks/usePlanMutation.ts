
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
      console.log("Attempting to create new plan with data:", data);
      
      const { data: insertedData, error } = await supabase
        .from('week_plans')
        .insert([data])
        .select('*')
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      
      console.log("Plan created successfully:", insertedData);
      // Return the inserted data so we can use it for optimistic updates
      return insertedData;
    },
    meta: {
      onSuccess: (newPlan) => {
        console.log("Create mutation success callback with data:", newPlan);
        
        // Get all relevant week-plans queries and update them optimistically
        const queryCache = queryClient.getQueryCache();
        
        // Find queries that might contain this data
        const weekPlanQueries = queryCache.findAll({
          predicate: query => {
            // Check if query key is an array and starts with 'week-plans'
            if (Array.isArray(query.queryKey) && query.queryKey[0] === 'week-plans') {
              return true;
            }
            return false;
          }
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
        
        // Immediately invalidate and refetch all week-plans queries
        // This ensures the optimistic update is replaced with real data
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

// Add an update plan mutation function
export function useUpdatePlanMutation(onSuccess: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlanFormData & { id: string }) => {
      console.log("Attempting to update plan with data:", data);
      
      const { data: updatedData, error } = await supabase
        .from('week_plans')
        .update({
          planned_date: data.planned_date,
          customer_ref: data.customer_ref,
          customer_name: data.customer_name,
          notes: data.notes
        })
        .eq('id', data.id)
        .select('*')
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      
      console.log("Plan updated successfully:", updatedData);
      return updatedData;
    },
    meta: {
      onSuccess: (updatedPlan) => {
        console.log("Update mutation success callback with data:", updatedPlan);
        
        // Update the cache immediately for a responsive UI experience
        const queryCache = queryClient.getQueryCache();
        
        // Find queries that might contain this data
        const weekPlanQueries = queryCache.findAll({
          predicate: query => {
            return Array.isArray(query.queryKey) && query.queryKey[0] === 'week-plans';
          }
        });
        
        // Update each relevant query in the cache
        weekPlanQueries.forEach(query => {
          const data = queryClient.getQueryData(query.queryKey);
          
          // Check if this is an array and update the plan in the cache
          if (Array.isArray(data)) {
            queryClient.setQueryData(
              query.queryKey, 
              data.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan)
            );
          }
        });
        
        // Then invalidate and refetch all week-plans queries to ensure data consistency
        queryClient.invalidateQueries({ 
          queryKey: ['week-plans'],
          refetchType: 'all'
        });
        
        // Show toast notification like in Customer Visits
        toast({
          title: 'Plan Updated',
          description: 'Week plan has been updated successfully.',
        });
        
        // Call the success callback after everything is done
        onSuccess();
      },
      onError: (error: Error) => {
        console.error("Error updating plan:", error);
        toast({
          title: 'Error',
          description: 'Failed to update plan. Please try again.',
          variant: 'destructive',
        });
      },
    },
  });
}
