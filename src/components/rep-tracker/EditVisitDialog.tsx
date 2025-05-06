import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import CustomerSearch from './CustomerSearch';
import DatePickerField from './DatePickerField';
import { parseISO } from 'date-fns';

interface EditVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  visit: {
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
  };
  customers: Array<{
    account_name: string;
    account_ref: string;
  }>;
  userId?: string;
}

interface VisitFormValues {
  date: Date;
  customer_ref: string;
  customer_name: string;
  contact_name?: string;
  visit_type: string;
  has_order: boolean;
  profit?: number;
  comments?: string;
}

const EditVisitDialog: React.FC<EditVisitDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  visit,
  customers,
  userId
}) => {
  const form = useForm<VisitFormValues>({
    defaultValues: {
      date: parseISO(visit.date),
      customer_ref: visit.customer_ref,
      customer_name: visit.customer_name,
      contact_name: visit.contact_name || '',
      visit_type: visit.visit_type,
      has_order: visit.has_order,
      profit: visit.profit,
      comments: visit.comments || '',
    },
  });
  
  const { watch } = form;
  const hasOrder = watch('has_order');

  const updateVisitMutation = useMutation({
    mutationFn: async (data: VisitFormValues) => {
      const { error } = await supabase
        .from('customer_visits')
        .update({
          date: data.date.toISOString(),
          customer_ref: data.customer_ref,
          customer_name: data.customer_name,
          contact_name: data.contact_name || null,
          visit_type: data.visit_type,
          has_order: data.has_order,
          profit: data.has_order ? data.profit : null,
          comments: data.comments || null,
          updated_at: new Date().toISOString(),
          // Don't update user_id - keep the original owner
        })
        .eq('id', visit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Visit Updated',
        description: 'The customer visit has been successfully updated.',
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    },
    onError: (error) => {
      console.error('Error updating visit:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the visit. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: VisitFormValues) => {
    updateVisitMutation.mutate(data);
  };
  
  const handleCustomerSelect = (customer: { account_name: string; account_ref: string }) => {
    form.setValue('customer_ref', customer.account_ref);
    form.setValue('customer_name', customer.account_name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border border-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer Visit</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Visit Date</FormLabel>
                  <DatePickerField
                    date={field.value}
                    setDate={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customer_name"
              rules={{ required: 'Customer is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <CustomerSearch 
                    customers={customers} 
                    onSelect={handleCustomerSelect}
                    selectedCustomer={form.getValues('customer_ref')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contact name (optional)"
                      className="bg-gray-800 border-gray-700"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="visit_type"
              rules={{ required: 'Visit type is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="In-Person, Phone, Video, Email, etc"
                      className="bg-gray-800 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_order"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Order Placed</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {hasOrder && (
              <FormField
                control={form.control}
                name="profit"
                rules={{
                  required: hasOrder ? 'Profit amount is required' : false,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profit (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter profit amount"
                        className="bg-gray-800 border-gray-700"
                        {...field}
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about the visit"
                      className="bg-gray-800 border-gray-700 resize-none min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-finance-red hover:bg-finance-red/90"
                disabled={updateVisitMutation.isPending}
              >
                {updateVisitMutation.isPending ? 'Updating...' : 'Update Visit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVisitDialog;
