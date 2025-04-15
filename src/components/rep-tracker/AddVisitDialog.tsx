
import React, { useState } from 'react';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { format } from 'date-fns';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  customers = [],
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm<VisitFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'), // Pre-populate with today's date
      visit_type: 'Customer Visit',
      has_order: false,
    }
  });
  
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Filter customers based on search - ensuring customers is an array
  const filteredCustomers = Array.isArray(customers) 
    ? customers
        .filter(customer => 
          customer.account_name.toLowerCase().includes(customerSearch.toLowerCase()))
        .slice(0, 100) // Limit to 100 results for performance
    : [];

  const addVisitMutation = useMutation({
    mutationFn: async (data: VisitFormData) => {
      // Format date for database
      const formattedDate = new Date(data.date);
      formattedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      const { error } = await supabase
        .from('customer_visits')
        .insert([{ 
          ...data, 
          user_id: user?.id,
          date: formattedDate.toISOString()
        }]);

      if (error) throw error;
    },
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customer-visits'] });
        toast({
          title: 'Visit Added',
          description: 'Customer visit has been recorded successfully.',
        });
        reset({
          date: format(new Date(), 'yyyy-MM-dd'),
          visit_type: 'Customer Visit',
          has_order: false,
        });
        onClose();
      },
      onError: (error: Error) => {
        console.error("Error adding visit:", error);
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
              type="date"
              {...register('date', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {watch('customer_name') || "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search customer..." 
                    onValueChange={setCustomerSearch}
                  />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.account_ref}
                        value={customer.account_name}
                        onSelect={() => {
                          setValue('customer_ref', customer.account_ref);
                          setValue('customer_name', customer.account_name);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            watch('customer_name') === customer.account_name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {customer.account_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
            <Button type="submit" disabled={addPlanMutation.isPending}>
              {addVisitMutation.isPending ? 'Saving...' : 'Add Visit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVisitDialog;
