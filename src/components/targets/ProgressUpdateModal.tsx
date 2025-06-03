import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  TrendingUp, 
  Package, 
  UserPlus, 
  Target as TargetIcon,
  Plus,
  Minus,
  Save,
  Trophy,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TargetWithParticipants, TargetType, TargetParticipant } from '@/types/targets.types';
import { useAuth } from '@/contexts/AuthContext';

// Form validation schema
const progressUpdateSchema = z.object({
  progress_value: z.number().min(0, 'Progress cannot be negative'),
  notes: z.string().optional(),
  activity_description: z.string().optional()
});

type ProgressUpdateData = z.infer<typeof progressUpdateSchema>;

interface ProgressUpdateModalProps {
  target: TargetWithParticipants;
  onSubmit: (targetId: string, userId: string, progress: number, notes?: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  target,
  onSubmit,
  onClose,
  isLoading = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quickAddValue, setQuickAddValue] = useState<number>(1);

  // Find current user's participation in this target
  const userParticipation = target.participants.find(p => p.user_id === user?.id);
  const currentProgress = userParticipation?.current_progress || 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<ProgressUpdateData>({
    resolver: zodResolver(progressUpdateSchema),
    defaultValues: {
      progress_value: currentProgress,
      notes: '',
      activity_description: ''
    }
  });

  const watchedProgress = watch('progress_value');

  // Calculate progress percentage
  const targetValue = target.target_amount || target.target_quantity || 100;
  const progressPercentage = Math.min((watchedProgress / targetValue) * 100, 100);
  const isCompleted = progressPercentage >= 100;

  // Get target type information
  const getTargetTypeInfo = (type: TargetType) => {
    switch (type) {
      case 'profit':
        return { 
          icon: TrendingUp, 
          label: 'Profit Target', 
          unit: '£', 
          color: 'text-green-400',
          description: 'Update your profit contribution'
        };
      case 'product':
        return { 
          icon: Package, 
          label: 'Product Sales', 
          unit: 'units', 
          color: 'text-blue-400',
          description: 'Log products sold'
        };
      case 'sales_volume':
        return { 
          icon: TargetIcon, 
          label: 'Sales Volume', 
          unit: '£', 
          color: 'text-purple-400',
          description: 'Update total sales value'
        };
      case 'customer_acquisition':
        return { 
          icon: UserPlus, 
          label: 'New Customers', 
          unit: 'customers', 
          color: 'text-orange-400',
          description: 'Add new customers acquired'
        };
    }
  };

  const { icon: TypeIcon, label: typeLabel, unit, color, description } = getTargetTypeInfo(target.target_type);

  // Handle form submission
  const onFormSubmit = async (data: ProgressUpdateData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update progress",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSubmit(target.id, user.id, data.progress_value, data.notes);
      toast({
        title: "Progress Updated",
        description: `Your progress has been updated to ${data.progress_value} ${unit}`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Quick add/subtract functions
  const handleQuickAdd = () => {
    const newValue = Math.max(0, watchedProgress + quickAddValue);
    setValue('progress_value', newValue);
  };

  const handleQuickSubtract = () => {
    const newValue = Math.max(0, watchedProgress - quickAddValue);
    setValue('progress_value', newValue);
  };

  // Set to target value
  const handleSetToTarget = () => {
    setValue('progress_value', targetValue);
  };

  // Reset to current progress
  const handleReset = () => {
    setValue('progress_value', currentProgress);
  };

  if (!user || !userParticipation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="bg-gray-900 border-white/10 w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-400 mb-4">You are not a participant in this target.</p>
            <Button onClick={onClose} variant="outline" className="border-gray-600 text-white">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TypeIcon className={cn("h-5 w-5", color)} />
              <div>
                <CardTitle className="text-white">Update Progress</CardTitle>
                <CardDescription>{target.title}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <CardContent className="space-y-6">
            {/* Target Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Target Type:</span>
                <Badge variant="secondary" className={cn("text-white", color.replace('text-', 'bg-'))}>
                  {typeLabel}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Target Goal:</span>
                <span className="text-white font-medium">
                  {targetValue.toLocaleString()} {unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Current Progress:</span>
                <span className="text-white font-medium">
                  {currentProgress.toLocaleString()} {unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Deadline:</span>
                <span className="text-white">
                  {format(new Date(target.end_date), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Current Progress Visualization */}
            <div className="space-y-3">
              <Label className="text-white">Current Progress</Label>
              <div className="space-y-2">
                <Progress 
                  value={(currentProgress / targetValue) * 100} 
                  className="h-3 bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0 {unit}</span>
                  <span className="font-medium text-white">
                    {Math.round((currentProgress / targetValue) * 100)}% Complete
                  </span>
                  <span>{targetValue.toLocaleString()} {unit}</span>
                </div>
              </div>
            </div>

            {/* Progress Update Input */}
            <div className="space-y-4">
              <Label className="text-white">Update Progress</Label>
              <p className="text-sm text-gray-400">{description}</p>
              
              {/* Quick Add Controls */}
              <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded border border-gray-600">
                <Label className="text-sm text-gray-400 min-w-0">Quick Add:</Label>
                <Input
                  type="number"
                  value={quickAddValue}
                  onChange={(e) => setQuickAddValue(Number(e.target.value) || 1)}
                  className="w-20 bg-gray-700 border-gray-600 text-white text-center"
                  min="1"
                />
                <span className="text-sm text-gray-400">{unit}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickSubtract}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickAdd}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Manual Input */}
              <div className="space-y-2">
                <Label htmlFor="progress_value" className="text-white">
                  Total Progress ({unit})
                </Label>
                <Input
                  id="progress_value"
                  type="number"
                  step={target.target_type === 'profit' || target.target_type === 'sales_volume' ? '0.01' : '1'}
                  {...register('progress_value', { valueAsNumber: true })}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder={`Enter total ${unit}`}
                />
                {errors.progress_value && (
                  <p className="text-red-400 text-sm">{errors.progress_value.message}</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetToTarget}
                  className="border-green-600 text-green-400 hover:bg-green-900/20"
                >
                  Complete Target
                </Button>
              </div>
            </div>

            {/* New Progress Preview */}
            {watchedProgress !== currentProgress && (
              <div className="space-y-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                <Label className="text-white">New Progress Preview</Label>
                <div className="space-y-2">
                  <Progress 
                    value={progressPercentage} 
                    className="h-3 bg-gray-700"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">0 {unit}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {Math.round(progressPercentage)}% Complete
                      </span>
                      {isCompleted && (
                        <Trophy className="h-3 w-3 text-yellow-400" />
                      )}
                    </div>
                    <span className="text-gray-400">{targetValue.toLocaleString()} {unit}</span>
                  </div>
                  <div className="text-sm text-center">
                    <span className="text-blue-400">
                      +{(watchedProgress - currentProgress).toLocaleString()} {unit}
                    </span>
                    <span className="text-gray-400"> increase</span>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Notes */}
            <div className="space-y-2">
              <Label htmlFor="activity_description" className="text-white">
                Activity Description (Optional)
              </Label>
              <Textarea
                id="activity_description"
                {...register('activity_description')}
                placeholder="Describe what you accomplished (e.g., 'Closed deal with ABC Corp for £5,000')"
                className="bg-gray-800 border-gray-600 text-white"
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional comments or notes..."
                className="bg-gray-800 border-gray-600 text-white"
                rows={2}
              />
            </div>
          </CardContent>

          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading || watchedProgress === currentProgress}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                'Updating...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Progress
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProgressUpdateModal; 