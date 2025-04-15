
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface AddVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Array<{ account_name: string; account_ref: string }>;
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
  customers,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm<VisitFormData>();

  const addVisitMutation = useMutation({
    mutationFn: async (data: VisitFormData) => {
      const { error } = await supabase
        .from('customer_visits')
        .insert([{ ...data, user_id: user?.id }]);

      if (error) throw error;
    },
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customer-visits'] });
        toast({
          title: 'Visit Added',
          description: 'Customer visit has been recorded successfully.',
        });
        reset();
        onClose();
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: 'Failed to add visit. Please try again.',
          variant: 'destructive',
        });
      },
    },
  });

  const onSubmit = (data: VisitFormData) => {
    addVisitMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Customer Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select
              onValueChange={(value) => {
                const customer = customers.find(c => c.account_ref === value);
                setValue('customer_ref', value);
                setValue('customer_name', customer?.account_name || '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.account_ref} value={customer.account_ref}>
                    {customer.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              {...register('contact_name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit_type">Visit Type</Label>
            <Select
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
                {...register('profit')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              {...register('comments')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Visit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVisitDialog;
