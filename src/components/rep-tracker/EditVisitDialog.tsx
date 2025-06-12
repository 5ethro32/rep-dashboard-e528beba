import React, { useState, useEffect } from 'react';
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
  
  // Determine if this is a prospect based on customer_ref
  const [isProspect, setIsProspect] = useState(visit.customer_ref === 'PROSPECT');
  
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

  // Update prospect state when visit changes
  useEffect(() => {
    setIsProspect(visit.customer_ref === 'PROSPECT');
  }, [visit.customer_ref]);

  const updateVisitMutation = useMutation({
    mutationFn: async (data: VisitFormData) => {
      // Validate customer_ref is present
      if (!data.customer_ref || !data.customer_name) {
        throw new Error('Please select a customer or enter a prospect name before saving');
      }
      
      const formattedDate = new Date(data.date);
      formattedDate.setHours(12, 0, 0, 0);
      
      // First, check if this visit has an associated week plan
      const { data: visitData } = await supabase
        .from('customer_visits')
        .select('week_plan_id')
        .eq('id', visit.id)
        .single();
      
      // Update the customer visit
      const { error: visitError } = await supabase
        .from('customer_visits')
        .update({ 
          ...data, 
          date: formattedDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', visit.id);

      if (visitError) throw visitError;
      
      // If there's an associated week plan, update it too (unless it has order data)
      if (visitData?.week_plan_id) {
        // Only update basic details if the visit hasn't been marked as having an order
        // to preserve important order information
        if (!visit.has_order) {
          const { error: planError } = await supabase
            .from('week_plans')
            .update({
              planned_date: data.date,
              customer_ref: data.customer_ref,
              customer_name: data.customer_name,
              notes: data.comments
            })
            .eq('id', visitData.week_plan_id);
            
          if (planError) {
            console.error("Error updating week plan:", planError);
            // We continue even if week plan update fails
          }
        }
      }
    },
    onSuccess: () => {
      // Invalidate both customer visits and week plans to ensure sync
      queryClient.invalidateQueries({
        queryKey: ['customer-visits'],
        exact: false,
        refetchType: 'all'
      });
      
      queryClient.invalidateQueries({
        queryKey: ['week-plans'],
        exact: false,
        refetchType: 'all'
      });
      
      toast({
        title: 'Visit Updated',
        description: 'Customer visit and associated week plan have been updated successfully.',
      });
      
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error("Error updating visit:", error);
      
      // Show a more specific error message
      const errorMessage = error.message.includes('select a customer') || error.message.includes('prospect name')
        ? error.message 
        : 'Failed to update visit. Please try again.';
        
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
