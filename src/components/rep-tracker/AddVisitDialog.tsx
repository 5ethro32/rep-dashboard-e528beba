import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { ImprovedCustomerSelector } from './ImprovedCustomerSelector';
import DatePickerField from './DatePickerField';

interface AddVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  customers?: Array<{ account_name: string; account_ref: string }>;
}

interface VisitFormData {
  date: string;
  customer_ref: string;
  customer_name: string;
  contact_name: string;
  visit_type: string;
  has_order: boolean;
  profit: number;
  comments: string;
}

const AddVisitDialog: React.FC<AddVisitDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customers = [],
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProspect, setIsProspect] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<VisitFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      visit_type: 'Customer Visit',
      has_order: false,
    }
  });

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const addVisitMutation = useMutation({
    mutationFn: async (data: VisitFormData) => {
      // Validate customer_ref is present
      if (!data.customer_ref || !data.customer_name) {
        throw new Error('Please select a customer or enter a prospect name before saving');
      }
      
      const formattedDate = new Date(data.date);
      formattedDate.setHours(12, 0, 0, 0);
      
      // First, create a corresponding week plan entry
      // This ensures the visit appears in both tabs
      const weekPlanData = {
        planned_date: data.date, // Use date string format for week plans
        customer_ref: data.customer_ref,
        customer_name: data.customer_name,
        notes: data.comments || null,
        user_id: user?.id
      };
      
      const { data: insertedPlan, error: planError } = await supabase
        .from('week_plans')
        .insert([weekPlanData])
        .select('*')
        .single();
      
      if (planError) {
        console.error("Error creating week plan:", planError);
        throw new Error('Failed to create week plan entry');
      }
      
      // Now create the customer visit entry with reference to the week plan
      const visitData = {
        ...data,
        user_id: user?.id,
        date: formattedDate.toISOString(),
        week_plan_id: insertedPlan.id // Link to the week plan
      };
      
      const { error: visitError } = await supabase
        .from('customer_visits')
        .insert([visitData]);

      if (visitError) {
        // If visit creation fails, we should clean up the week plan
        await supabase
          .from('week_plans')
          .delete()
          .eq('id', insertedPlan.id);
        throw visitError;
      }
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure both tabs are updated
      queryClient.invalidateQueries({
        queryKey: ['customer-visits'],
        exact: false,
        refetchType: 'all'
      });
      
      // Also invalidate week plans queries so the Week Plan tab is updated
      queryClient.invalidateQueries({
        queryKey: ['week-plans'],
        exact: false,
        refetchType: 'all'
      });
      
      queryClient.invalidateQueries({
        queryKey: ['visit-metrics'],
        exact: false,
        refetchType: 'all'
      });
      
      toast({
        title: 'Visit Added',
        description: 'Customer visit and corresponding week plan have been created successfully.',
      });
      
      reset({
        date: new Date().toISOString().split('T')[0],
        visit_type: 'Customer Visit',
        has_order: false,
      });
      
      // Reset prospect mode
      setIsProspect(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    },
    onError: (error: Error) => {
      console.error("Error adding visit:", error);
      
      // Show a more specific error message
      const errorMessage = error.message.includes('select a customer') || error.message.includes('prospect name')
        ? error.message 
        : 'Failed to add visit. Please try again.';
        
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
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

  const onSubmit = (data: VisitFormData) => {
    // Additional validation before submitting
    if (!data.customer_ref || !data.customer_name) {
      toast({
        title: 'Validation Error',
        description: isProspect 
          ? 'Please enter a prospect name before saving'
          : 'Please select a customer before saving',
        variant: 'destructive',
      });
      return;
    }
    
    addVisitMutation.mutate(data);
  };

  const handleDialogClose = () => {
    reset({
      date: new Date().toISOString().split('T')[0],
      visit_type: 'Customer Visit',
      has_order: false,
    });
    setIsProspect(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Customer Visit</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add details about your customer visit below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DatePickerField
            id="date"
            label="Date"
            value={watch('date')}
            onChange={(date) => setValue('date', date)}
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
                <Label htmlFor="customer">Existing Customer <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="prospect-name">Prospect Name <span className="text-destructive">*</span></Label>
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
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              {...register('contact_name')}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit_type">Visit Type <span className="text-destructive">*</span></Label>
            <Select
              defaultValue="Customer Visit"
              onValueChange={(value) => setValue('visit_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Customer Visit">Customer Visit</SelectItem>
                <SelectItem value="Outbound Call">Outbound Call</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="has_order">Order Placed</Label>
            <Select
              defaultValue="false"
              onValueChange={(value) => setValue('has_order', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watch('has_order') && (
            <div className="space-y-2">
              <Label htmlFor="profit">Profit (£)</Label>
              <Input
                id="profit"
                type="number"
                step="0.01"
                {...register('profit', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              {...register('comments')}
              placeholder="Optional"
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
            <Button type="submit" disabled={addVisitMutation.isPending}>
              {addVisitMutation.isPending ? 'Saving...' : 'Add Visit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVisitDialog;
