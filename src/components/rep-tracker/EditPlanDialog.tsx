
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdatePlanMutation } from '@/hooks/usePlanMutation';
import { ImprovedCustomerSelector } from './ImprovedCustomerSelector';
import DatePickerField from './DatePickerField';
import { Form, FormField } from '@/components/ui/form';

interface EditPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    planned_date: string;
    customer_ref: string;
    customer_name: string;
    notes: string;
  } | null; // Make plan explicitly nullable
  customers: Array<{ account_name: string; account_ref: string }>;
  onSuccess?: () => void;
}

interface PlanFormData {
  id: string;
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
  // Add a safety check - if plan is null/undefined, don't render the dialog
  if (!plan) {
    return null;
  }
  
  const form = useForm<PlanFormData>({
    defaultValues: {
      id: plan.id,
      planned_date: plan.planned_date,
      customer_ref: plan.customer_ref,
      customer_name: plan.customer_name,
      notes: plan.notes || '',
    },
  });

  const updatePlanMutation = useUpdatePlanMutation(() => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  });

  const handleCustomerSelect = (ref: string, name: string) => {
    form.setValue('customer_ref', ref);
    form.setValue('customer_name', name);
  };

  const onSubmit = (data: PlanFormData) => {
    updatePlanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="planned_date"
              render={({ field }) => (
                <DatePickerField
                  control={form.control}
                  fieldName="planned_date"
                  label="Date"
                />
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <ImprovedCustomerSelector
                customers={customers}
                selectedCustomer={form.watch('customer_name')}
                onSelect={handleCustomerSelect}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Optional details about the planned visit"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlanMutation.isPending}>
                {updatePlanMutation.isPending ? 'Saving...' : 'Update Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlanDialog;
