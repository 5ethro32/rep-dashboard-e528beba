
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddPlanMutation } from '@/hooks/usePlanMutation';
import { ImprovedCustomerSelector } from './ImprovedCustomerSelector';
import DatePickerField from './DatePickerField';

interface AddPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  customers: Array<{ account_name: string; account_ref: string }>;
  initialDate?: string;
}

interface PlanFormData {
  planned_date: string;
  customer_ref: string;
  customer_name: string;
  notes: string;
}

const AddPlanDialog: React.FC<AddPlanDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customers = [],
  initialDate
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      planned_date: initialDate || new Date().toISOString().split('T')[0],
      customer_ref: '',
      customer_name: '',
      notes: ''
    }
  });

  const addPlanMutation = useAddPlanMutation(() => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  });

  const handleCustomerSelect = (ref: string, name: string) => {
    setValue('customer_ref', ref);
    setValue('customer_name', name);
  };

  const onSubmit = (data: PlanFormData) => {
    addPlanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DatePickerField
            fieldName="planned_date"
            label="Date"
            value={watch('planned_date')}
            onChange={(date) => setValue('planned_date', date)}
          />

          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <ImprovedCustomerSelector
              customers={customers}
              selectedCustomer=""
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
            <Button type="submit" disabled={addPlanMutation.isPending}>
              {addPlanMutation.isPending ? 'Saving...' : 'Add Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlanDialog;
