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
import { CalendarIcon, Plus, X, Users, Target, TrendingUp, Package, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TargetsService } from '@/services/targetsService';
import { CreateTargetRequest, TargetType, TimePeriod, TargetScope } from '@/types/targets.types';

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
  prize_description: z.string().optional(),
  participant_ids: z.array(z.string()).optional(),
  products: z.array(z.object({
    product_name: z.string().min(1, 'Product name is required'),
    product_code: z.string().optional(),
    required_quantity: z.number().positive('Quantity must be positive')
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

interface TargetCreationFormProps {
  onSubmit: (data: CreateTargetRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const TargetCreationForm: React.FC<TargetCreationFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [products, setProducts] = useState<Array<{product_name: string, product_code?: string, required_quantity: number}>>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
    reset
  } = useForm<TargetFormData>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      time_period: 'weekly',
      scope: 'group',
      target_type: 'profit'
    }
  });

  const watchedTargetType = watch('target_type');
  const watchedScope = watch('scope');
  const watchedTimePeriod = watch('time_period');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  // Load available users for participant selection
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await TargetsService.getAvailableUsers();
        setAvailableUsers(users);
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
  }, [toast]);

  // Auto-set end date based on time period and start date
  useEffect(() => {
    if (watchedStartDate && watchedTimePeriod) {
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
  }, [watchedStartDate, watchedTimePeriod, setValue]);

  // Handle step navigation
  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number): (keyof TargetFormData)[] => {
    switch (step) {
      case 1:
        return ['title', 'description', 'target_type'];
      case 2:
        return ['target_amount', 'target_quantity', 'time_period', 'start_date', 'end_date'];
      case 3:
        return ['scope'];
      case 4:
        return ['prize_description'];
      default:
        return [];
    }
  };

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
  const addProduct = () => {
    setProducts(prev => [...prev, { product_name: '', required_quantity: 1 }]);
  };

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: string | number) => {
    setProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ));
  };

  // Handle form submission
  const onFormSubmit = async (data: TargetFormData) => {
    try {
      const submitData: CreateTargetRequest = {
        title: data.title,
        description: data.description,
        target_type: data.target_type,
        target_amount: data.target_amount,
        target_quantity: data.target_quantity,
        time_period: data.time_period,
        scope: data.scope,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
        prize_description: data.prize_description,
        participant_ids: selectedUsers,
        products: products.length > 0 ? products : undefined
      };

      await onSubmit(submitData);
      reset();
      setSelectedUsers([]);
      setProducts([]);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Get target type icon and description
  const getTargetTypeInfo = (type: TargetType) => {
    switch (type) {
      case 'profit':
        return { icon: TrendingUp, label: 'Profit Target', description: 'Compete to achieve the highest profit margins' };
      case 'product':
        return { icon: Package, label: 'Product Sales', description: 'Race to sell specific products or quantities' };
      case 'sales_volume':
        return { icon: Target, label: 'Sales Volume', description: 'Compete for the highest total sales value' };
      case 'customer_acquisition':
        return { icon: UserPlus, label: 'New Customers', description: 'Challenge to acquire the most new customers' };
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-white">Target Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Q1 Profit Challenge"
              className="bg-gray-800 border-gray-600 text-white"
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the target and what participants need to achieve..."
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label className="text-white">Target Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {(['profit', 'product', 'sales_volume', 'customer_acquisition'] as TargetType[]).map((type) => {
                const { icon: Icon, label, description } = getTargetTypeInfo(type);
                return (
                  <Card
                    key={type}
                    className={cn(
                      "cursor-pointer transition-colors border-2",
                      watchedTargetType === type
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    )}
                    onClick={() => setValue('target_type', type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-white">{label}</h4>
                          <p className="text-sm text-gray-400 mt-1">{description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {errors.target_type && (
              <p className="text-red-400 text-sm mt-1">{errors.target_type.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Target Details & Timeline</h3>
        
        <div className="space-y-4">
          {/* Target Amount/Quantity */}
          {(watchedTargetType === 'profit' || watchedTargetType === 'sales_volume') && (
            <div>
              <Label htmlFor="target_amount" className="text-white">
                Target Amount (£) *
              </Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                {...register('target_amount', { valueAsNumber: true })}
                placeholder="e.g., 5000"
                className="bg-gray-800 border-gray-600 text-white"
              />
              {errors.target_amount && (
                <p className="text-red-400 text-sm mt-1">{errors.target_amount.message}</p>
              )}
            </div>
          )}

          {(watchedTargetType === 'product' || watchedTargetType === 'customer_acquisition') && (
            <div>
              <Label htmlFor="target_quantity" className="text-white">
                Target Quantity *
              </Label>
              <Input
                id="target_quantity"
                type="number"
                {...register('target_quantity', { valueAsNumber: true })}
                placeholder="e.g., 50"
                className="bg-gray-800 border-gray-600 text-white"
              />
              {errors.target_quantity && (
                <p className="text-red-400 text-sm mt-1">{errors.target_quantity.message}</p>
              )}
            </div>
          )}

          {/* Time Period */}
          <div>
            <Label className="text-white">Time Period *</Label>
            <Select value={watchedTimePeriod} onValueChange={(value: TimePeriod) => setValue('time_period', value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="daily">Daily Challenge</SelectItem>
                <SelectItem value="weekly">Weekly Competition</SelectItem>
                <SelectItem value="monthly">Monthly Goal</SelectItem>
              </SelectContent>
            </Select>
            {errors.time_period && (
              <p className="text-red-400 text-sm mt-1">{errors.time_period.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-800 border-gray-600 text-white",
                      !watchedStartDate && "text-gray-400"
                    )}
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
              {errors.start_date && (
                <p className="text-red-400 text-sm mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <Label className="text-white">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-800 border-gray-600 text-white",
                      !watchedEndDate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedEndDate ? format(watchedEndDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                  <Calendar
                    mode="single"
                    selected={watchedEndDate}
                    onSelect={(date) => date && setValue('end_date', date)}
                    initialFocus
                    className="bg-gray-800"
                    disabled={(date) => date < watchedStartDate}
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && (
                <p className="text-red-400 text-sm mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Products for product-based targets */}
          {watchedTargetType === 'product' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white">Specific Products</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProduct}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              </div>
              
              {products.map((product, index) => (
                <Card key={index} className="bg-gray-800/50 border-gray-600 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Product name"
                        value={product.product_name}
                        onChange={(e) => updateProduct(index, 'product_name', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Input
                        placeholder="Product code (optional)"
                        value={product.product_code || ''}
                        onChange={(e) => updateProduct(index, 'product_code', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Input
                        type="number"
                        placeholder="Required quantity"
                        value={product.required_quantity}
                        onChange={(e) => updateProduct(index, 'required_quantity', parseInt(e.target.value) || 1)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Participants & Scope</h3>
        
        <div className="space-y-4">
          {/* Scope Selection */}
          <div>
            <Label className="text-white">Target Scope *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {(['individual', 'group', 'company'] as TargetScope[]).map((scope) => {
                const scopeInfo = {
                  individual: { icon: Users, label: 'Individual', description: 'Each person competes individually' },
                  group: { icon: Users, label: 'Team Goal', description: 'Team members work together towards a shared target' },
                  company: { icon: Users, label: 'Company-wide', description: 'All employees participate in the challenge' }
                };
                
                const { icon: Icon, label, description } = scopeInfo[scope];
                
                return (
                  <Card
                    key={scope}
                    className={cn(
                      "cursor-pointer transition-colors border-2",
                      watchedScope === scope
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    )}
                    onClick={() => setValue('scope', scope)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-white">{label}</h4>
                          <p className="text-sm text-gray-400 mt-1">{description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {errors.scope && (
              <p className="text-red-400 text-sm mt-1">{errors.scope.message}</p>
            )}
          </div>

          {/* Participant Selection */}
          {watchedScope !== 'company' && (
            <div>
              <Label className="text-white">Select Participants</Label>
              <p className="text-sm text-gray-400 mb-3">
                {watchedScope === 'group' 
                  ? 'Choose team members who will work together towards the shared goal'
                  : 'Choose individuals who will compete against each other'
                }
              </p>
              
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-600 rounded-lg p-3 bg-gray-800/50">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700/50"
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      className="border-gray-500"
                    />
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-2">Selected participants:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((userId) => {
                      const user = availableUsers.find(u => u.id === userId);
                      return user ? (
                        <Badge key={userId} variant="secondary" className="bg-blue-900/50 text-blue-200">
                          {user.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Rewards & Final Details</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="prize_description" className="text-white">Prize/Reward Description</Label>
            <Textarea
              id="prize_description"
              {...register('prize_description')}
              placeholder="Describe what the winner(s) will receive..."
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
            {errors.prize_description && (
              <p className="text-red-400 text-sm mt-1">{errors.prize_description.message}</p>
            )}
          </div>

          {/* Summary */}
          <div>
            <h4 className="font-medium text-white mb-3">Target Summary</h4>
            <Card className="bg-gray-800/50 border-gray-600">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Title:</span>
                  <span className="text-white">{watch('title') || 'Untitled Target'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{watchedTargetType?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Target:</span>
                  <span className="text-white">
                    {watchedTargetType === 'profit' || watchedTargetType === 'sales_volume' 
                      ? `£${watch('target_amount')?.toLocaleString() || '0'}`
                      : `${watch('target_quantity') || '0'} ${watchedTargetType === 'product' ? 'units' : 'customers'}`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white capitalize">{watchedTimePeriod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Scope:</span>
                  <span className="text-white capitalize">{watchedScope}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-white">
                    {watchedScope === 'company' ? 'All employees' : `${selectedUsers.length} selected`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Start Date:</span>
                  <span className="text-white">
                    {watchedStartDate ? format(watchedStartDate, "PPP") : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">End Date:</span>
                  <span className="text-white">
                    {watchedEndDate ? format(watchedEndDate, "PPP") : 'Not set'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Create New Target</CardTitle>
              <CardDescription>
                Set up a new competitive target for your team
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  )}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-2",
                      step < currentStep ? "bg-blue-600" : "bg-gray-700"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <CardContent className="space-y-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </CardContent>

          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Previous
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? 'Creating...' : 'Create Target'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TargetCreationForm; 