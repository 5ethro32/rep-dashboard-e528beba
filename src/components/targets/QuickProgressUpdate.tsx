import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Minus, 
  Check, 
  TrendingUp, 
  Target, 
  Zap,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TargetWithParticipants } from '@/types/targets.types';
import { useAuth } from '@/contexts/AuthContext';

interface QuickProgressUpdateProps {
  target: TargetWithParticipants;
  onProgressUpdate: (targetId: string, userId: string, progress: number) => Promise<void>;
  className?: string;
}

const QuickProgressUpdate: React.FC<QuickProgressUpdateProps> = ({
  target,
  onProgressUpdate,
  className
}) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);
  const [justUpdated, setJustUpdated] = useState(false);

  // Get current user's participation
  const userParticipation = user ? target.participants.find(p => p.user_id === user.id) : null;
  const currentProgress = userParticipation?.current_progress || 0;
  const isCompleted = userParticipation?.is_completed || false;

  // Calculate target value and progress percentage
  const targetValue = target.target_amount || target.target_quantity || 100;
  const progressPercentage = Math.min((currentProgress / targetValue) * 100, 100);

  // Initialize temp progress
  useEffect(() => {
    setTempProgress(currentProgress);
  }, [currentProgress]);

  // Get smart increment values based on target type and current progress
  const getSmartIncrements = () => {
    const remaining = targetValue - currentProgress;
    
    if (target.target_type === 'profit' || target.target_type === 'sales_volume') {
      // Monetary targets
      if (targetValue >= 1000) {
        return [50, 100, 250, Math.min(500, remaining)].filter(v => v > 0 && v <= remaining);
      } else {
        return [10, 25, 50, Math.min(100, remaining)].filter(v => v > 0 && v <= remaining);
      }
    } else {
      // Quantity targets
      if (targetValue >= 50) {
        return [1, 5, 10, Math.min(25, remaining)].filter(v => v > 0 && v <= remaining);
      } else {
        return [1, 2, 5, Math.min(10, remaining)].filter(v => v > 0 && v <= remaining);
      }
    }
  };

  const smartIncrements = getSmartIncrements();

  // Handle quick increment
  const handleQuickIncrement = async (increment: number) => {
    if (!user || isUpdating) return;
    
    setIsUpdating(true);
    setJustUpdated(true);
    
    try {
      const newProgress = Math.min(currentProgress + increment, targetValue);
      await onProgressUpdate(target.id, user.id, newProgress);
      
      // Show success animation
      setTimeout(() => setJustUpdated(false), 2000);
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle slider update
  const handleSliderUpdate = async (value: number[]) => {
    if (!user || isUpdating) return;
    
    const newProgress = value[0];
    setTempProgress(newProgress);
    
    // Debounced update
    clearTimeout((window as any).progressUpdateTimeout);
    (window as any).progressUpdateTimeout = setTimeout(async () => {
      setIsUpdating(true);
      try {
        await onProgressUpdate(target.id, user.id, newProgress);
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 1500);
      } catch (error) {
        console.error('Error updating progress:', error);
      } finally {
        setIsUpdating(false);
      }
    }, 500);
  };

  // Handle complete target
  const handleCompleteTarget = async () => {
    if (!user || isUpdating) return;
    
    setIsUpdating(true);
    setJustUpdated(true);
    
    try {
      await onProgressUpdate(target.id, user.id, targetValue);
      setTimeout(() => setJustUpdated(false), 3000);
    } catch (error) {
      console.error('Error completing target:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format value for display
  const formatValue = (value: number) => {
    if (target.target_type === 'profit' || target.target_type === 'sales_volume') {
      return `£${value.toLocaleString()}`;
    }
    return value.toString();
  };

  // Don't show if user is not a participant
  if (!userParticipation) return null;

  return (
    <Card className={cn(
      "bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20 transition-all duration-300",
      justUpdated && "from-green-900/30 to-blue-900/30 border-green-500/30 shadow-lg shadow-green-500/10",
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-full transition-colors",
              isCompleted ? "bg-green-600" : "bg-blue-600"
            )}>
              {isCompleted ? (
                <Check className="h-3 w-3 text-white" />
              ) : (
                <Target className="h-3 w-3 text-white" />
              )}
            </div>
            <span className="text-white text-sm font-medium">Your Progress</span>
            {justUpdated && (
              <Badge variant="secondary" className="bg-green-600 text-white text-xs animate-pulse">
                Updated!
              </Badge>
            )}
          </div>
          
          <button
            onClick={() => setShowSlider(!showSlider)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {showSlider ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Progress Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">
              {formatValue(currentProgress)} / {formatValue(targetValue)}
            </span>
            <span className={cn(
              "text-sm font-medium",
              isCompleted ? "text-green-400" : "text-blue-400"
            )}>
              {Math.round(progressPercentage)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500 ease-out",
                isCompleted ? "bg-green-500" : "bg-blue-500",
                justUpdated && "animate-pulse"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
            {justUpdated && (
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-full" />
            )}
          </div>

          {/* Quick Action Buttons */}
          {!isCompleted && (
            <div className="flex flex-wrap gap-2">
              {smartIncrements.map((increment) => (
                <Button
                  key={increment}
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickIncrement(increment)}
                  disabled={isUpdating}
                  className="h-7 px-2 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-900/30 hover:border-blue-400"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {formatValue(increment)}
                </Button>
              ))}
              
              {currentProgress < targetValue && (
                <Button
                  size="sm"
                  onClick={handleCompleteTarget}
                  disabled={isUpdating}
                  className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Complete
                </Button>
              )}
            </div>
          )}

          {/* Slider for Precise Control */}
          {showSlider && !isCompleted && (
            <div className="space-y-2 pt-2 border-t border-gray-600">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12">Precise:</span>
                <Slider
                  value={[tempProgress]}
                  onValueChange={handleSliderUpdate}
                  max={targetValue}
                  step={target.target_type === 'profit' || target.target_type === 'sales_volume' ? 1 : 1}
                  className="flex-1"
                  disabled={isUpdating}
                />
                <span className="text-xs text-white w-16 text-right">
                  {formatValue(tempProgress)}
                </span>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {isCompleted && (
            <div className="flex items-center gap-2 p-2 bg-green-900/30 rounded-lg border border-green-500/30">
              <div className="p-1 bg-green-600 rounded-full">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-green-400 text-sm font-medium">Target Completed!</span>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                  🎉 Well done!
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {isUpdating && (
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Updating...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickProgressUpdate; 