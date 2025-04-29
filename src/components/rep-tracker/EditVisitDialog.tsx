import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { format } from 'date-fns';
import { ImprovedCustomerSelector } from './ImprovedCustomerSelector';
import DatePickerField from './DatePickerField';

interface Visit {
  id: string;
  date: string;
  customer_name: string;
  customer_ref: string;
  contact_name?: string;
  visit_type: string;
  has_order: boolean;
  profit?: number;
  comments?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

interface EditVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  visit: Visit;
  customers?: Array<{ account_name: string; account_ref: string }>;
  onSuccess?: () => void;
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

const EditVisitDialog: React.FC<EditVisitDialogProps> = ({
  isOpen,
  onClose,
  visit,
  customers = [],
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const formattedDate = format(new Date(visit.date), 'yyyy-MM-dd');
  
  const { register, handleSubmit, setValue, watch } = useForm<VisitFormData>({
    defaultValues: {
      date: formattedDate,
      customer_ref: visit.customer_ref,
      customer_name: visit.customer_name,
      contact_name: visit.contact_name || '',
      visit_type: visit.visit_type,
      has_order: visit.has_order,
      profit: visit.profit || 0,
      comments: visit.comments || '',
    }
  });

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const updateVisitMutation = useMutation({
    mutationFn: async (data: VisitFormData) => {
      const formattedDate = new Date(data.date);
      formattedDate.setHours(12, 0, 0, 0);
      
      const { error } = await supabase
        .from('customer_visits')
        .update({ 
          ...data, 
          date: formattedDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', visit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-visits'],
        exact: false,
        refetchType: 'all'
      });
      
      toast({
        title: 'Visit Updated',
        description: 'Customer visit has been updated successfully.',
      });
      
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error("Error updating visit:", error);
      toast({
        title: 'Error',
        description: 'Failed to update visit. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCustomerSelect = (ref: string, name: string) => {
    setValue('customer_ref', ref);
    setValue('customer_name', name);
  };

  const onSubmit = (data: VisitFormData) => {
    updateVisitMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Customer Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DatePickerField
            id="date"
            label="Date"
            value={watch('date')}
            onChange={(date) => setValue('date', date)}
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
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              {...register('contact_name')}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit_type">Visit Type</Label>
            <Select
              defaultValue={visit.visit_type}
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
              defaultValue={visit.has_order ? 'true' : 'false'}
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
            <Button type="submit" disabled={updateVisitMutation.isPending}>
              {updateVisitMutation.isPending ? 'Saving...' : 'Update Visit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVisitDialog;
