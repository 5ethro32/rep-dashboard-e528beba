import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X, Users, Target, TrendingUp, Package, UserPlus, Save, ArrowLeft, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TargetsService } from '@/services/targetsService';
import { CreateTargetRequest, UpdateTargetRequest, TargetType, TimePeriod, TargetScope, TargetWithParticipants } from '@/types/targets.types';
import ProductSelector, { ProductTarget, ChallengeMode } from './ProductSelector';
import TimePicker from './TimePicker';

// Form validation schema
const targetFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  target_type: z.enum(['profit', 'product', 'sales_volume', 'customer_acquisition']),
  target_amount: z.number().positive('Amount must be positive').optional(),
  target_quantity: z.number().positive('Quantity must be positive').optional(),
  time_period: z.enum(['daily', 'weekly', 'monthly']),
  scope: z.enum(['individual', 'group', 'company']),
  start_date: z.date(),
  end_date: z.date(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  prize_description: z.string().optional(),
  challenge_mode: z.enum(['individual_products', 'combined_products', 'any_products']).optional(),
  participant_ids: z.array(z.string()).optional(),
  products: z.array(z.object({
    product_name: z.string().min(1, 'Product name is required'),
    product_code: z.string().optional(),
    required_quantity: z.number().positive('Quantity must be positive').optional(),
    target_amount: z.number().positive('Amount must be positive').optional(),
    weight: z.number().positive('Weight must be positive').optional()
  })).optional()
}).refine((data) => {
  // Ensure end date is after start date
  return data.end_date > data.start_date;
}, {
  message: "End date must be after start date",
  path: ["end_date"]
}).refine((data) => {
  // Ensure either target_amount or target_quantity is provided based on target_type
  if (data.target_type === 'profit' || data.target_type === 'sales_volume') {
    return data.target_amount && data.target_amount > 0;
  }
  if (data.target_type === 'product' || data.target_type === 'customer_acquisition') {
    return data.target_quantity && data.target_quantity > 0;
  }
  return true;
}, {
  message: "Target amount or quantity is required based on target type",
  path: ["target_amount"]
});

type TargetFormData = z.infer<typeof targetFormSchema>;

interface TargetEditFormProps {
  target?: TargetWithParticipants; // If provided, we're editing; if not, we're creating
  onSubmit: (data: CreateTargetRequest | UpdateTargetRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const TargetEditForm: React.FC<TargetEditFormProps> = ({
  target,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductTarget[]>([]);
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>('individual_products');

  const isEditing = !!target;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<TargetFormData>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: isEditing ? {
      title: target.title,
      description: target.description || '',
      target_type: target.target_type,
      target_amount: target.target_amount || undefined,
      target_quantity: target.target_quantity || undefined,
      time_period: target.time_period,
      scope: target.scope,
      start_date: new Date(target.start_date),
      end_date: new Date(target.end_date),
      start_time: target.start_time || '',
      end_time: target.end_time || '',
      prize_description: target.prize_description || '',
      challenge_mode: target.challenge_mode || 'individual_products',
      participant_ids: target.participants.map(p => p.user_id)
    } : {
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      time_period: 'weekly',
      scope: 'group',
      target_type: 'profit',
      start_time: '',
      end_time: '',
      challenge_mode: 'individual_products'
    }
  });

  const watchedTargetType = watch('target_type');
  const watchedScope = watch('scope');
  const watchedTimePeriod = watch('time_period');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');
  const watchedStartTime = watch('start_time');
  const watchedEndTime = watch('end_time');

  // Load available users for participant selection
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await TargetsService.getAvailableUsers();
        setAvailableUsers(users);
        
        // If editing, set selected users and products
        if (isEditing && target) {
          const participantIds = target.participants.map(p => p.user_id);
          setSelectedUsers(participantIds);
          setValue('participant_ids', participantIds);
          
          // Set products and challenge mode if editing
          if (target.products && target.products.length > 0) {
            const targetProducts: ProductTarget[] = target.products.map(p => ({
              product_name: p.product_name,
              product_code: p.product_code,
              required_quantity: p.required_quantity,
              target_amount: p.target_amount,
              weight: p.weight
            }));
            setProducts(targetProducts);
          }
          
          if (target.challenge_mode) {
            setChallengeMode(target.challenge_mode);
          }
        }
      } catch (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error",
          description: "Failed to load available users",
          variant: "destructive"
        });
      }
    };

    loadUsers();
  }, [toast, isEditing, target, setValue]);

  // Auto-set end date based on time period and start date (only for new targets)
  useEffect(() => {
    if (!isEditing && watchedStartDate && watchedTimePeriod) {
      const startDate = new Date(watchedStartDate);
      let endDate = new Date(startDate);

      switch (watchedTimePeriod) {
        case 'daily':
          endDate.setDate(startDate.getDate() + 1);
          break;
        case 'weekly':
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(startDate.getMonth() + 1);
          break;
      }

      setValue('end_date', endDate);
    }
  }, [watchedStartDate, watchedTimePeriod, setValue, isEditing]);

  // Handle user selection for participants
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      setValue('participant_ids', newSelection);
      return newSelection;
    });
  };

  // Handle product management
  const handleProductsChange = (newProducts: ProductTarget[]) => {
    setProducts(newProducts);
  };

  const handleChallengeModeChange = (mode: ChallengeMode) => {
    setChallengeMode(mode);
    setValue('challenge_mode', mode);
  };

  // Handle form submission
  const onFormSubmit = async (data: TargetFormData) => {
    try {
      const formData = {
        ...data,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
        start_time: data.start_time || undefined,
        end_time: data.end_time || undefined,
        challenge_mode: challengeMode,
        participant_ids: selectedUsers,
        products: products.length > 0 ? products : undefined
      };

      if (isEditing && target) {
        // For editing, include the target ID
        await onSubmit({
          id: target.id,
          ...formData
        } as UpdateTargetRequest);
      } else {
        // For creating
        await onSubmit(formData as CreateTargetRequest);
      }

      toast({
        title: isEditing ? "Target Updated" : "Target Created",
        description: isEditing 
          ? "Target has been successfully updated." 
          : "Target has been successfully created.",
      });
    } catch (error) {
      console.error('Error submitting target:', error);
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update target. Please try again." 
          : "Failed to create target. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getTargetTypeInfo = (type: TargetType) => {
    switch (type) {
      case 'profit':
        return { icon: TrendingUp, label: 'Profit Target', color: 'text-green-400', unit: '£' };
      case 'product':
        return { icon: Package, label: 'Product Sales', color: 'text-blue-400', unit: 'units' };
      case 'sales_volume':
        return { icon: Target, label: 'Sales Volume', color: 'text-purple-400', unit: '£' };
      case 'customer_acquisition':
        return { icon: UserPlus, label: 'New Customers', color: 'text-orange-400', unit: 'customers' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-white">
                {isEditing ? 'Edit Target' : 'Create New Target'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {isEditing 
                  ? 'Update the target details and settings'
                  : 'Set up a new competitive target for your team'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Target Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Enter target title"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_type" className="text-white">Target Type *</Label>
                  <Select
                    value={watchedTargetType}
                    onValueChange={(value) => setValue('target_type', value as TargetType)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="profit">Profit Target</SelectItem>
                      <SelectItem value="product">Product Sales</SelectItem>
                      <SelectItem value="sales_volume">Sales Volume</SelectItem>
                      <SelectItem value="customer_acquisition">Customer Acquisition</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.target_type && (
                    <p className="text-red-400 text-sm">{errors.target_type.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe the target and its objectives"
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={3}
                />
              </div>
            </div>

            <Separator className="bg-gray-600" />

            {/* Target Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Target Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(watchedTargetType === 'profit' || watchedTargetType === 'sales_volume') && (
                  <div className="space-y-2">
                    <Label htmlFor="target_amount" className="text-white">
                      Target Amount (£) *
                    </Label>
                    <Input
                      id="target_amount"
                      type="number"
                      step="0.01"
                      {...register('target_amount', { valueAsNumber: true })}
                      placeholder="0.00"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    {errors.target_amount && (
                      <p className="text-red-400 text-sm">{errors.target_amount.message}</p>
                    )}
                  </div>
                )}

                {(watchedTargetType === 'product' || watchedTargetType === 'customer_acquisition') && (
                  <div className="space-y-2">
                    <Label htmlFor="target_quantity" className="text-white">
                      Target Quantity *
                    </Label>
                    <Input
                      id="target_quantity"
                      type="number"
                      {...register('target_quantity', { valueAsNumber: true })}
                      placeholder="0"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    {errors.target_quantity && (
                      <p className="text-red-400 text-sm">{errors.target_quantity.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="time_period" className="text-white">Time Period *</Label>
                  <Select
                    value={watchedTimePeriod}
                    onValueChange={(value) => setValue('time_period', value as TimePeriod)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope" className="text-white">Scope *</Label>
                  <Select
                    value={watchedScope}
                    onValueChange={(value) => setValue('scope', value as TargetScope)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="individual">Individual Competition</SelectItem>
                      <SelectItem value="group">Team Goals</SelectItem>
                      <SelectItem value="company">Company-wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-gray-800 border-gray-600 text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedStartDate ? format(watchedStartDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                      <Calendar
                        mode="single"
                        selected={watchedStartDate}
                        onSelect={(date) => date && setValue('start_date', date)}
                        initialFocus
                        className="bg-gray-800"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-gray-800 border-gray-600 text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch('end_date') ? format(watch('end_date'), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                      <Calendar
                        mode="single"
                        selected={watch('end_date')}
                        onSelect={(date) => date && setValue('end_date', date)}
                        initialFocus
                        className="bg-gray-800"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.end_date && (
                    <p className="text-red-400 text-sm">{errors.end_date.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Time Picker for Daily Challenges */}
            {watchedTimePeriod === 'daily' && (
              <>
                <Separator className="bg-gray-600" />
                <TimePicker
                  startTime={watchedStartTime || ''}
                  endTime={watchedEndTime || ''}
                  onStartTimeChange={(time) => setValue('start_time', time)}
                  onEndTimeChange={(time) => setValue('end_time', time)}
                  startDate={watchedStartDate}
                  endDate={watchedEndDate}
                />
              </>
            )}

            {/* Product Selection for Product-based Challenges */}
            {(watchedTargetType === 'product' || watchedTargetType === 'profit' || watchedTargetType === 'sales_volume') && (
              <>
                <Separator className="bg-gray-600" />
                <ProductSelector
                  targetType={watchedTargetType}
                  challengeMode={challengeMode}
                  products={products}
                  onProductsChange={handleProductsChange}
                  onChallengeModeChange={handleChallengeModeChange}
                />
              </>
            )}

            <Separator className="bg-gray-600" />

            {/* Participants */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Participants</h3>
              
              {watchedScope !== 'company' && (
                <div className="space-y-3">
                  <Label className="text-white">Select Participants</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg border border-gray-600"
                      >
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`user-${user.id}`}
                            className="text-white text-sm font-medium cursor-pointer"
                          >
                            {user.name}
                          </Label>
                          <p className="text-gray-400 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((userId) => {
                        const user = availableUsers.find(u => u.id === userId);
                        return user ? (
                          <Badge key={userId} variant="secondary" className="bg-blue-600">
                            {user.name}
                            <button
                              type="button"
                              onClick={() => toggleUserSelection(userId)}
                              className="ml-1 hover:text-red-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {watchedScope === 'company' && (
                <p className="text-gray-400 text-sm">
                  Company-wide targets automatically include all users.
                </p>
              )}
            </div>

            <Separator className="bg-gray-600" />

            {/* Rewards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Rewards & Motivation</h3>
              
              <div className="space-y-2">
                <Label htmlFor="prize_description" className="text-white">Prize Description</Label>
                <Textarea
                  id="prize_description"
                  {...register('prize_description')}
                  placeholder="Describe the reward for achieving this target"
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={2}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Target' : 'Create Target'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TargetEditForm; 