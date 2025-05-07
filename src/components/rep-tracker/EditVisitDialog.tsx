
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
import { parseISO } from 'date-fns';

interface EditVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
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
    week_plan_id?: string;
    created_at?: string;
    updated_at?: string;
  };
  customers: Array<{
    account_name: string;
    account_ref: string;
  }>;
  userId?: string;
  onSuccess: () => void;
}

const formSchema = z.object({
  date: z.date(),
  customer_ref: z.string().min(1, {
    message: "Please select a customer.",
  }),
  contact_name: z.string().optional(),
  visit_type: z.string().min(1, {
    message: "Please select a visit type.",
  }),
  has_order: z.boolean().default(false),
  profit: z.number().optional(),
  comments: z.string().optional(),
});

const EditVisitDialog: React.FC<EditVisitDialogProps> = ({ isOpen, onClose, visit, customers, userId, onSuccess }) => {
  const [isOrdered, setIsOrdered] = useState(visit.has_order);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: parseISO(visit.date),
      customer_ref: visit.customer_ref,
      contact_name: visit.contact_name,
      visit_type: visit.visit_type,
      has_order: visit.has_order,
      profit: visit.profit,
      comments: visit.comments,
    },
  });

  const { mutate: updateVisit, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { error } = await supabase
        .from('customer_visits')
        .update({
          date: values.date.toISOString(),
          customer_ref: values.customer_ref,
          customer_name: customers.find(c => c.account_ref === values.customer_ref)?.account_name,
          contact_name: values.contact_name,
          visit_type: values.visit_type,
          has_order: values.has_order,
          profit: values.has_order ? values.profit : null,
          comments: values.comments,
          user_id: userId || user?.id,
        })
        .eq('id', visit.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-visits'] });
      toast({
        title: 'Success',
        description: 'Visit updated successfully.',
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update visit. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateVisit(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Edit Visit</DialogTitle>
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
                      <SelectItem value="In-Person">In-Person</SelectItem>
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
                  </div>
                  <FormControl>
                    <Switch
                      checked={isOrdered}
                      onCheckedChange={(checked) => {
                        setIsOrdered(checked);
                        field.onChange(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {isOrdered && (
              <FormField
                control={form.control}
                name="profit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profit (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Profit from order"
                        {...field}
                      />
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
                      placeholder="Additional comments about the visit"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Updating...' : 'Update Visit'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVisitDialog;
