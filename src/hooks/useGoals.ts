
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Goal } from '@/types/goals.types';

export function useGoals() {
  const queryClient = useQueryClient();

  // Fetch all goals
  const { data: goals, isLoading, error } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, teams(name)')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading goals",
          description: error.message,
        });
        throw new Error(error.message);
      }
      
      return data as Goal[];
    }
  });

  // Create a new goal
  const createGoal = useMutation({
    mutationFn: async (newGoal: Omit<Goal, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert([newGoal])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Goal created",
        description: "New goal has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create goal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Update goal progress
  const updateGoalProgress = useMutation({
    mutationFn: async ({ goalId, currentQuantity }: { goalId: string; currentQuantity: number }) => {
      const { data, error } = await supabase
        .from('goals')
        .update({ current_quantity: currentQuantity })
        .eq('id', goalId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Progress updated",
        description: "Goal progress has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update progress",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Delete goal
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({
        title: "Goal deleted",
        description: "The goal has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete goal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  return {
    goals,
    isLoading,
    error,
    createGoal,
    updateGoalProgress,
    deleteGoal
  };
}
