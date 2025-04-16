
import React from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { SimpleCustomerSelect } from './SimpleCustomerSelect';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface EditPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    planned_date: string;
    customer_name: string;
    customer_ref: string;
    notes: string | null;
  } | null;
  customers?: Array<{ account_name: string; account_ref: string }>;
  onSuccess?: () => void;
}

interface PlanFormData {
  planned_date: string;
  customer_ref: string;
  customer_name: string;
  notes: string;
}

const EditPlanDialog: React.FC<EditPlanDialogProps> = ({
  isOpen,
  onClose,
  plan,
  customers = [],
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Initialize the form with the plan data when available
  const { register, handleSubmit, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      planned_date: plan?.planned_date ? format(new Date(plan.planned_date), 'yyyy-MM-dd') : '',
      customer_ref: plan?.customer_ref || '',
      customer_name: plan?.customer_name || '',
      notes: plan?.notes || '',
    }
  });

  // Update form values when plan changes
  React.useEffect(() => {
    if (plan) {
      setValue('planned_date', format(new Date(plan.planned_date), 'yyyy-MM-dd'));
      setValue('customer_ref', plan.customer_ref);
      setValue('customer_name', plan.customer_name);
      setValue('notes', plan.notes || '');
    }
  }, [plan, setValue]);

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const updatePlanMutation = useMutation({
    mutationFn: async (data: PlanFormData & { id: string }) => {
      console.log("Attempting to update plan with data:", data);
      
      const { data: updatedData, error } = await supabase
        .from('week_plans')
        .update({
          planned_date: new Date(data.planned_date).toISOString().split('T')[0],
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
        
        // Invalidate and refetch all week-plans queries
        queryClient.invalidateQueries({ 
          queryKey: ['week-plans'],
          refetchType: 'all'
        });
        
        toast({
          title: 'Plan Updated',
          description: 'Week plan has been updated successfully.',
        });
        
        // Call the success callback
        if (onSuccess) {
          onSuccess();
        }
        
        // Close the dialog
        onClose();
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

  const handleCustomerSelect = (ref: string, name: string) => {
    setValue('customer_ref', ref);
    setValue('customer_name', name);
  };

  const onSubmit = (data: PlanFormData) => {
    if (!user?.id || !plan?.id) {
      console.error("Missing user ID or plan ID");
      return;
    }
    
    console.log("Form submitted with data:", { ...data, id: plan.id });
    
    updatePlanMutation.mutate({ 
      ...data, 
      id: plan.id
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Week Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planned_date">Date</Label>
            <Input
              id="planned_date"
              type="date"
              {...register('planned_date', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <SimpleCustomerSelect
              customers={safeCustomers}
              selectedCustomer={watch('customer_name') || ''}
              onSelect={handleCustomerSelect}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Optional details about the planned visit"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updatePlanMutation.isPending}
              className="bg-finance-red hover:bg-finance-red/80"
            >
              {updatePlanMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlanDialog;
