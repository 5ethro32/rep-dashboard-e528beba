
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CustomerSearch } from './CustomerSearch';
import DatePickerField from './DatePickerField';

interface AddVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Array<{
    account_name: string;
    account_ref: string;
  }>;
  userId?: string | null;
}

const formSchema = z.object({
  date: z.date(),
  customer_ref: z.string().min(1, {
    message: 'Please select a customer.',
  }),
  contact_name: z.string().optional(),
  visit_type: z.string().min(1, {
    message: 'Please select a visit type.',
  }),
  has_order: z.boolean().default(false),
  profit: z.number().optional(),
  comments: z.string().optional(),
});

const AddVisitDialog: React.FC<AddVisitDialogProps> = ({ isOpen, onClose, onSuccess, customers, userId }) => {
  const [isOrder, setIsOrder] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      customer_ref: '',
      contact_name: '',
      visit_type: 'In Person',
      has_order: false,
      profit: 0,
      comments: '',
    },
  });
  
  const { mutate: addVisit, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const customer = customers.find(c => c.account_ref === values.customer_ref);
      
      if (!customer) {
        throw new Error('Invalid customer selected.');
      }
      
      const { data, error } = await supabase
        .from('customer_visits')
        .insert([
          {
            date: values.date.toISOString(),
            customer_name: customer.account_name,
            customer_ref: values.customer_ref,
            contact_name: values.contact_name,
            visit_type: values.visit_type,
            has_order: values.has_order,
            profit: values.has_order ? values.profit : 0,
            comments: values.comments,
            user_id: userId || user?.id,
          },
        ]);
        
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Visit added successfully!',
      });
      
      queryClient.invalidateQueries({
        queryKey: ['customer-visits'],
        exact: false,
        refetchType: 'all'
      });
      
      onSuccess();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Something went wrong.',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleClose = () => {
    form.reset();
    onClose();
  };
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addVisit(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Add Customer Visit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <DatePickerField
                  control={form.control}
                  label="Date"
                  fieldName="date"
                />
              )}
            />
            
            <FormField
              control={form.control}
              name="customer_ref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <CustomerSearch
                      customers={customers}
                      field={field}
                    />
                  </FormControl>
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
                    <Input placeholder="Contact name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="visit_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select a visit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="In Person">In Person</SelectItem>
                      <SelectItem value="Phone Call">Phone Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_order"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Order Placed?</FormLabel>
                    <p className="text-muted-foreground text-xs">Did the customer place an order during this visit?</p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsOrder(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {isOrder && (
              <FormField
                control={form.control}
                name="profit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profit (£)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }} />
                    </FormControl>
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
                      placeholder="Any comments about the visit?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Adding...' : 'Add Visit'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVisitDialog;
