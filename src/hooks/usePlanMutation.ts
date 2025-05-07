
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PlanFormData {
  id?: string;
  planned_date: string;
  customer_ref: string;
  customer_name: string;
  notes: string;
}

export const useAddPlanMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (planData: PlanFormData) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase.from('week_plans').insert([
        {
          planned_date: planData.planned_date,
          customer_ref: planData.customer_ref,
          customer_name: planData.customer_name,
          notes: planData.notes,
          user_id: user.id
        }
      ]).select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan added successfully",
      });
      
      queryClient.invalidateQueries({
        queryKey: ['week-plans'],
        exact: false,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error('Error adding plan:', error);
      toast({
        title: "Error",
        description: "Failed to add plan. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePlanMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (planData: PlanFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('week_plans')
        .update({
          planned_date: planData.planned_date,
          customer_ref: planData.customer_ref,
          customer_name: planData.customer_name,
          notes: planData.notes
        })
        .eq('id', planData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan updated successfully",
      });
      
      queryClient.invalidateQueries({
        queryKey: ['week-plans'],
        exact: false,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update plan. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePlanMutation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('week_plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
      return { id: planId };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      
      queryClient.invalidateQueries({
        queryKey: ['week-plans'],
        exact: false,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan. Please try again.",
        variant: "destructive",
      });
    },
  });
};
