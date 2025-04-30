
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { ImprovedCustomerSelector } from './ImprovedCustomerSelector';
import { usePlanMutation } from '@/hooks/usePlanMutation';
import DatePickerField from './DatePickerField';

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
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      planned_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      customer_ref: '',
      customer_name: '',
      notes: '',
    }
  });

  // Update the form values when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setValue('planned_date', selectedDate.toISOString().split('T')[0]);
    }
  }, [selectedDate, setValue]);

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const addPlanMutation = usePlanMutation(() => {
    // When resetting the form, use the current selectedDate, not the initial defaultDate
    reset({
      planned_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      customer_ref: '',
      customer_name: '',
      notes: '',
    });
    
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
    if (!user?.id) return;
    const formattedDate = new Date(data.planned_date);
    addPlanMutation.mutate({ 
      ...data, 
      user_id: user.id,
      planned_date: formattedDate.toISOString().split('T')[0] 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Week Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DatePickerField
            id="planned_date"
            label="Date"
            value={watch('planned_date')}
            onChange={(date) => setValue('planned_date', date)}
          />

          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <ImprovedCustomerSelector
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
