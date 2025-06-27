import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Target, TrendingUp, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Goals, GoalType, validateGoals, applyGrowthToGoals, getGoalMetadata, formatGoalValue } from '@/utils/rep-performance-utils';

interface GoalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoals: Goals;
  suggestedGoals?: Goals;
  hasCustomGoals: boolean;
  onSave: (goals: Goals) => Promise<boolean>;
  onReset: () => Promise<boolean>;
  isSaving: boolean;
  canCustomize: boolean;
}

interface GoalFormData {
  profit: number;
  margin: number;
  activeRatio: number;
  packs: number;
}

const GoalEditModal: React.FC<GoalEditModalProps> = ({
  isOpen,
  onClose,
  currentGoals,
  suggestedGoals,
  hasCustomGoals,
  onSave,
  onReset,
  isSaving,
  canCustomize
}) => {
  const [activeTab, setActiveTab] = useState<string>('edit');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GoalFormData>({
    defaultValues: currentGoals
  });

  // Reset form when modal opens or goals change
  useEffect(() => {
    if (isOpen) {
      reset(currentGoals);
      setValidationErrors([]);
    }
  }, [isOpen, currentGoals, reset]);

  const watchedValues = watch();

  const handleDialogClose = () => {
    reset(currentGoals);
    setValidationErrors([]);
    setActiveTab('edit');
    onClose();
  };

  const onSubmit = async (data: GoalFormData) => {
    const validation = validateGoals(data);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    const success = await onSave(data);
    if (success) {
      handleDialogClose();
    }
  };

  const handleApplyGrowth = (growthPercent: number) => {
    const baseGoals = suggestedGoals || currentGoals;
    const newGoals = applyGrowthToGoals(baseGoals, growthPercent);
    
    setValue('profit', newGoals.profit);
    setValue('margin', newGoals.margin);
    setValue('activeRatio', newGoals.activeRatio);
    setValue('packs', newGoals.packs);
  };

  const handleUseSuggested = () => {
    if (suggestedGoals) {
      setValue('profit', suggestedGoals.profit);
      setValue('margin', suggestedGoals.margin);
      setValue('activeRatio', suggestedGoals.activeRatio);
      setValue('packs', suggestedGoals.packs);
    }
  };

  const handleResetToCalculated = async () => {
    const success = await onReset();
    if (success) {
      handleDialogClose();
    }
  };

  if (!canCustomize) {
    return (
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Customization
            </DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Goal customization is not available for the "All Data" view. Please select a specific user to customize their goals.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={handleDialogClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Customize Your Goals
            {hasCustomGoals && (
              <Badge variant="secondary" className="ml-2">Custom</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Goals</TabsTrigger>
            <TabsTrigger value="suggested">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(currentGoals) as GoalType[]).map((goalType) => {
                  const metadata = getGoalMetadata(goalType);
                  const currentValue = watchedValues[goalType];
                  const suggestedValue = suggestedGoals?.[goalType];
                  const isDifferentFromSuggested = suggestedValue && Math.abs(currentValue - suggestedValue) > (goalType === 'margin' || goalType === 'activeRatio' ? 0.1 : 1);

                  return (
                    <div key={goalType} className="space-y-2">
                      <Label htmlFor={goalType} className="flex items-center justify-between">
                        <span>{metadata.label}</span>
                        {isDifferentFromSuggested && (
                          <Badge variant="outline" className="text-xs">
                            Modified
                          </Badge>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id={goalType}
                          type="number"
                          step={goalType === 'margin' || goalType === 'activeRatio' ? '0.1' : '1'}
                          min="0"
                          placeholder={metadata.placeholder}
                          {...register(goalType, { 
                            required: `${metadata.label} is required`,
                            min: { value: 0, message: `${metadata.label} must be positive` }
                          })}
                          className={errors[goalType] ? 'border-red-500' : ''}
                        />
                        {metadata.unit && (
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                            {metadata.unit}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metadata.description}
                        {suggestedValue && (
                          <span className="block mt-1 text-blue-600">
                            Suggested: {formatGoalValue(goalType, suggestedValue)}
                          </span>
                        )}
                      </p>
                      {errors[goalType] && (
                        <p className="text-xs text-red-500">{errors[goalType]?.message}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyGrowth(5)}
                  className="flex items-center gap-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  +5% Growth
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyGrowth(10)}
                  className="flex items-center gap-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  +10% Growth
                </Button>
                {suggestedGoals && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseSuggested}
                    className="flex items-center gap-1"
                  >
                    <Target className="h-3 w-3" />
                    Use Suggested
                  </Button>
                )}
              </div>

              <DialogFooter className="flex justify-between">
                <div>
                  {hasCustomGoals && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleResetToCalculated}
                      disabled={isSaving}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset to Auto
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Goals'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="suggested" className="space-y-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                These goals are automatically calculated based on your previous month's performance data with intelligent growth factors applied.
              </div>
              
              {suggestedGoals ? (
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(suggestedGoals) as GoalType[]).map((goalType) => {
                    const metadata = getGoalMetadata(goalType);
                    const suggestedValue = suggestedGoals[goalType];
                    const currentValue = currentGoals[goalType];
                    const difference = suggestedValue - currentValue;
                    const percentDiff = currentValue > 0 ? (difference / currentValue) * 100 : 0;

                    return (
                      <div key={goalType} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">{metadata.label}</Label>
                          {Math.abs(difference) > (goalType === 'margin' || goalType === 'activeRatio' ? 0.1 : 1) && (
                            <Badge variant={difference > 0 ? "default" : "secondary"} className="text-xs">
                              {difference > 0 ? '+' : ''}{percentDiff.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold">
                          {formatGoalValue(goalType, suggestedValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Current: {formatGoalValue(goalType, currentValue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Unable to calculate suggested goals. Please set your goals manually.
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button onClick={handleDialogClose}>Close</Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GoalEditModal;