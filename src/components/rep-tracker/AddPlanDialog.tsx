
import React from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerSelector } from './CustomerSelector';
import { usePlanMutation } from '@/hooks/usePlanMutation';

interface AddPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Array<{ account_name: string; account_ref: string }>;
  selectedDate?: Date;
  onSuccess?: () => void;
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
  customers = [],
  selectedDate,
  onSuccess,
}) => {
  const { user } = useAuth();
  const defaultDate = selectedDate || new Date();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      planned_date: format(defaultDate, 'yyyy-MM-dd'),
    }
  });

  const addPlanMutation = usePlanMutation(() => {
    reset({
      planned_date: format(defaultDate, 'yyyy-MM-dd'),
      customer_ref: '',
      customer_name: '',
      notes: '',
    });
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  });

  const onSubmit = (data: PlanFormData) => {
    if (!user?.id) return;
    addPlanMutation.mutate({ ...data, user_id: user.id });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Week Plan</DialogTitle>
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
            <CustomerSelector
              customers={customers}
              selectedCustomer={watch('customer_name')}
              onSelect={(ref, name) => {
                setValue('customer_ref', ref);
                setValue('customer_name', name);
              }}
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
