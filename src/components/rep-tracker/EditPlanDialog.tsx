import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useUpdatePlanMutation } from '@/hooks/usePlanMutation';
import { ImprovedCustomerSelector } from './ImprovedCustomerSelector';
import DatePickerField from './DatePickerField';

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

  // Determine if this is a prospect based on customer_ref
  const [isProspect, setIsProspect] = useState(plan.customer_ref === 'PROSPECT');
  
  const { register, handleSubmit, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      id: plan.id,
      planned_date: plan.planned_date,
      customer_ref: plan.customer_ref,
      customer_name: plan.customer_name,
      notes: plan.notes || '',
    },
  });

  // Update prospect state when plan changes
  useEffect(() => {
    if (plan) {
      setIsProspect(plan.customer_ref === 'PROSPECT');
    }
  }, [plan]);

  const updatePlanMutation = useUpdatePlanMutation(() => {
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
    if (checked) {
      // Switching TO prospect mode - keep current name but change ref
      setValue('customer_ref', 'PROSPECT');
    } else {
      // Switching FROM prospect mode - clear selection so user must choose
      setValue('customer_ref', '');
      setValue('customer_name', '');
    }
  };

  const handleProspectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prospectName = e.target.value;
    setValue('customer_name', prospectName);
    // Use a special identifier for prospects
    setValue('customer_ref', prospectName ? 'PROSPECT' : '');
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
                  customers={customers}
                  selectedCustomer={watch('customer_name')}
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
                Include any relevant details about this prospect
              </p>
            )}
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
      </DialogContent>
    </Dialog>
  );
};

export default EditPlanDialog;
