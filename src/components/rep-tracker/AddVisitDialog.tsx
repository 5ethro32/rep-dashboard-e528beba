
import React from 'react';
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
        throw new Error('Please select a customer before saving');
      }
      
      const formattedDate = new Date(data.date);
      formattedDate.setHours(12, 0, 0, 0);
      
      const { error } = await supabase
        .from('customer_visits')
        .insert([{ 
          ...data, 
          user_id: user?.id,
          date: formattedDate.toISOString()
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-visits'],
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
        description: 'Customer visit has been recorded successfully.',
      });
      
      reset({
        date: new Date().toISOString().split('T')[0],
        visit_type: 'Customer Visit',
        has_order: false,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    },
    onError: (error: Error) => {
      console.error("Error adding visit:", error);
      
      // Show a more specific error message
      const errorMessage = error.message.includes('select a customer') 
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

  const onSubmit = (data: VisitFormData) => {
    // Additional validation before submitting
    if (!data.customer_ref || !data.customer_name) {
      toast({
        title: 'Validation Error',
        description: 'Please select a customer before saving',
        variant: 'destructive',
      });
      return;
    }
    
    addVisitMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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

          <div className="space-y-2">
            <Label htmlFor="customer">Customer <span className="text-destructive">*</span></Label>
            <ImprovedCustomerSelector
              customers={safeCustomers}
              selectedCustomer={watch('customer_name') || ''}
              onSelect={handleCustomerSelect}
            />
            {watch('customer_ref') && (
              <p className="text-xs text-green-600">Customer selected successfully</p>
            )}
            {!watch('customer_ref') && (
              <p className="text-xs text-muted-foreground">Please select a customer from the list</p>
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
