
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
      
      // First create the week plan entry
      const { data: insertedPlan, error: planError } = await supabase
        .from('week_plans')
        .insert([data])
        .select('*')
        .single();

      if (planError) {
        console.error("Supabase insert error for week plan:", planError);
        throw planError;
      }
      
      console.log("Plan created successfully:", insertedPlan);
      
      // Now create a corresponding customer visit entry
      const visitData = {
        date: new Date(data.planned_date).toISOString(),
        customer_ref: data.customer_ref,
        customer_name: data.customer_name,
        user_id: data.user_id,
        visit_type: "Customer Visit", // Default visit type
        has_order: false, // Default value
        profit: 0, // Default value
        comments: data.notes, // Copy notes from plan
        week_plan_id: insertedPlan.id, // Reference to the week plan
      };
      
      const { data: insertedVisit, error: visitError } = await supabase
        .from('customer_visits')
        .insert([visitData])
        .select('*')
        .single();
        
      if (visitError) {
        console.error("Supabase insert error for customer visit:", visitError);
        // Even if customer visit creation fails, we still return the plan
        // as it was created successfully
      } else {
        console.log("Corresponding customer visit created successfully:", insertedVisit);
      }
      
      // Return the inserted plan data so we can use it for optimistic updates
      return insertedPlan;
    },
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
      
      // Also invalidate customer visits queries to ensure they are updated
      queryClient.invalidateQueries({ 
        queryKey: ['customer-visits'],
        exact: false,
        refetchType: 'all'
      });
      
      // Immediately invalidate and refetch all week-plans queries
      queryClient.invalidateQueries({ 
        queryKey: ['week-plans'],
        exact: false,
        refetchType: 'all'
      });
      
      toast({
        title: 'Plan Added',
        description: 'Week plan has been added successfully and a customer visit has been created.',
      });
      
      // Call the success callback to trigger additional UI updates
      onSuccess();
    },
    meta: {
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

// Update the update plan mutation function to also update the customer visit
export function useUpdatePlanMutation(onSuccess: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlanFormData & { id: string }) => {
      console.log("Attempting to update plan with data:", data);
      
      // First update the week plan
      const { data: updatedPlan, error: planError } = await supabase
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

      if (planError) {
        console.error("Supabase update error for week plan:", planError);
        throw planError;
      }
      
      console.log("Plan updated successfully:", updatedPlan);
      
      // Now check if there's a corresponding customer visit and update it
      const { data: relatedVisits } = await supabase
        .from('customer_visits')
        .select('*')
        .eq('week_plan_id', data.id);
      
      if (relatedVisits && relatedVisits.length > 0) {
        const visitToUpdate = relatedVisits[0];
        
        // Only update if the visit hasn't been marked as having an order yet
        // This prevents overwriting important order information
        if (!visitToUpdate.has_order) {
          const { error: visitError } = await supabase
            .from('customer_visits')
            .update({
              date: new Date(data.planned_date).toISOString(),
              customer_ref: data.customer_ref,
              customer_name: data.customer_name,
              comments: data.notes
            })
            .eq('id', visitToUpdate.id);
            
          if (visitError) {
            console.error("Supabase update error for customer visit:", visitError);
            // We continue even if customer visit update fails
          } else {
            console.log("Corresponding customer visit updated successfully");
          }
        }
      }
      
      return updatedPlan;
    },
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
      
      // Also invalidate customer visits queries
      queryClient.invalidateQueries({ 
        queryKey: ['customer-visits'],
        exact: false,
        refetchType: 'all'
      });
      
      // Then invalidate and refetch all week-plans queries to ensure data consistency
      queryClient.invalidateQueries({ 
        queryKey: ['week-plans'],
        exact: false,
        refetchType: 'all'
      });
      
      // Show toast notification
      toast({
        title: 'Plan Updated',
        description: 'Week plan has been updated successfully and the related customer visit has been updated if applicable.',
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
  });
}
