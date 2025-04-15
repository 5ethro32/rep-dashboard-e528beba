
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
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Array<{ account_name: string; account_ref: string }>;
  selectedDate?: Date;
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
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const defaultDate = selectedDate || new Date();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<PlanFormData>({
    defaultValues: {
      planned_date: format(defaultDate, 'yyyy-MM-dd'),
    }
  });
  
  const [open, setOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Ensure customers is always a valid array before filtering
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  const filteredCustomers = safeCustomers
    .filter(customer => 
      customer && 
      typeof customer === 'object' && 
      customer.account_name && 
      typeof customer.account_name === 'string' &&
      customer.account_name.toLowerCase().includes((customerSearch || '').toLowerCase())
    )
    .slice(0, 100); // Limit to 100 results for performance

  const addPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const { error } = await supabase
        .from('week_plans')
        .insert([{ 
          ...data, 
          user_id: user?.id,
        }]);

      if (error) throw error;
    },
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['week-plans'] });
        toast({
          title: 'Plan Added',
          description: 'Week plan has been added successfully.',
        });
        reset({
          planned_date: format(defaultDate, 'yyyy-MM-dd'),
        });
        onClose();
      },
      onError: (error: Error) => {
        console.error("Error adding plan:", error);
        toast({
          title: 'Error',
          description: 'Failed to add plan. Please try again.',
          variant: 'destructive',
        });
      },
    },
  });

  const onSubmit = (data: PlanFormData) => {
    addPlanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Week Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planned_date">Date</Label>
            <Input
              id="planned_date"
              type="date"
              {...register('planned_date', { required: true })}
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
                    onValueChange={(value) => setCustomerSearch(value || '')}
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Optional details about the planned visit"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
