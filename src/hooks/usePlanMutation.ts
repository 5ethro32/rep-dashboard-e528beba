
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
      const { error } = await supabase
        .from('week_plans')
        .insert([data]);

      if (error) throw error;
    },
    meta: {
      onSuccess: () => {
        // Force a complete refresh of all week-plans queries
        queryClient.invalidateQueries({ 
          queryKey: ['week-plans'],
          exact: false,
          refetchType: 'all'
        });
        
        toast({
          title: 'Plan Added',
          description: 'Week plan has been added successfully.',
        });
        
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
