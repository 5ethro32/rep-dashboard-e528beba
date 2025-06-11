import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  const defaultDate = selectedDate || new Date();
  const [isProspect, setIsProspect] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      planned_date: defaultDate.toISOString().split('T')[0],
    }
  });

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const addPlanMutation = usePlanMutation(() => {
    reset({
      planned_date: defaultDate.toISOString().split('T')[0],
      customer_ref: '',
      customer_name: '',
      notes: '',
    });
    
    // Reset prospect toggle when closing
    setIsProspect(false);
    
    if (onSuccess) {
      onSuccess();
    }
    
    onClose();
  });

  const handleCustomerSelect = (ref: string, name: string) => {
    setValue('customer_ref', ref);
    setValue('customer_name', name);
  };

  const handleProspectToggle = (checked: boolean) => {
    setIsProspect(checked);
    // Clear current selection when switching modes
    setValue('customer_ref', '');
    setValue('customer_name', '');
  };

  const handleProspectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prospectName = e.target.value;
    setValue('customer_name', prospectName);
    // Use a special identifier for prospects
    setValue('customer_ref', prospectName ? 'PROSPECT' : '');
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

  const handleDialogClose = () => {
    // Reset form and prospect toggle when closing
    reset({
      planned_date: defaultDate.toISOString().split('T')[0],
      customer_ref: '',
      customer_name: '',
      notes: '',
    });
    setIsProspect(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
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

          <div className="space-y-4">
            {/* Toggle between existing customer and new prospect */}
            <div className="flex items-center space-x-2">
              <Switch
                id="prospect-mode"
                checked={isProspect}
                onCheckedChange={handleProspectToggle}
              />
              <Label htmlFor="prospect-mode" className="text-sm">
                New prospect (not in customer list)
              </Label>
            </div>

            {/* Customer selection - existing customers */}
            {!isProspect && (
              <div className="space-y-2">
                <Label htmlFor="customer">Existing Customer</Label>
                <ImprovedCustomerSelector
                  customers={safeCustomers}
                  selectedCustomer={watch('customer_name') || ''}
                  onSelect={handleCustomerSelect}
                />
                <p className="text-xs text-muted-foreground">
                  Select from your existing customer list
                </p>
              </div>
            )}

            {/* Prospect name input - new prospects */}
            {isProspect && (
              <div className="space-y-2">
                <Label htmlFor="prospect-name">Prospect Name</Label>
                <Input
                  id="prospect-name"
                  placeholder="Enter prospect company name"
                  value={watch('customer_name') || ''}
                  onChange={handleProspectNameChange}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the name of a new prospect/potential customer
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Optional details about the planned visit"
            />
            {isProspect && (
              <p className="text-xs text-muted-foreground">
                Include any relevant details about this new prospect
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleDialogClose}>
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
