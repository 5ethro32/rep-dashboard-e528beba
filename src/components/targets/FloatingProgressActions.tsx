import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Check, 
  Zap, 
  TrendingUp,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TargetWithParticipants } from '@/types/targets.types';
import { useAuth } from '@/contexts/AuthContext';

interface FloatingProgressActionsProps {
  target: TargetWithParticipants;
  onProgressUpdate: (targetId: string, userId: string, progress: number) => Promise<void>;
  className?: string;
}

const FloatingProgressActions: React.FC<FloatingProgressActionsProps> = ({
  target,
  onProgressUpdate,
  className
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  // Get current user's participation
  const userParticipation = user ? target.participants.find(p => p.user_id === user.id) : null;
  const currentProgress = userParticipation?.current_progress || 0;
  const isCompleted = userParticipation?.is_completed || false;

  // Calculate target value
  const targetValue = target.target_amount || target.target_quantity || 100;
  const progressPercentage = Math.min((currentProgress / targetValue) * 100, 100);

  // Get quick action values
  const getQuickActions = () => {
    const remaining = targetValue - currentProgress;
    
    if (target.target_type === 'profit' || target.target_type === 'sales_volume') {
      if (targetValue >= 1000) {
        return [
          { value: 50, label: '£50', color: 'bg-blue-600' },
          { value: 100, label: '£100', color: 'bg-purple-600' },
          { value: Math.min(250, remaining), label: `£${Math.min(250, remaining)}`, color: 'bg-orange-600' }
        ].filter(action => action.value > 0 && action.value <= remaining);
      } else {
        return [
          { value: 10, label: '£10', color: 'bg-blue-600' },
          { value: 25, label: '£25', color: 'bg-purple-600' },
          { value: Math.min(50, remaining), label: `£${Math.min(50, remaining)}`, color: 'bg-orange-600' }
        ].filter(action => action.value > 0 && action.value <= remaining);
      }
    } else {
      return [
        { value: 1, label: '+1', color: 'bg-blue-600' },
        { value: 5, label: '+5', color: 'bg-purple-600' },
        { value: Math.min(10, remaining), label: `+${Math.min(10, remaining)}`, color: 'bg-orange-600' }
      ].filter(action => action.value > 0 && action.value <= remaining);
    }
  };

  const quickActions = getQuickActions();

  // Handle quick update
  const handleQuickUpdate = async (increment: number) => {
    if (!user || isUpdating) return;
    
    setIsUpdating(true);
    setJustUpdated(true);
    
    try {
      const newProgress = Math.min(currentProgress + increment, targetValue);
      await onProgressUpdate(target.id, user.id, newProgress);
      
      // Auto-collapse after update
      setTimeout(() => {
        setIsExpanded(false);
        setJustUpdated(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle complete
  const handleComplete = async () => {
    if (!user || isUpdating) return;
    
    setIsUpdating(true);
    setJustUpdated(true);
    
    try {
      await onProgressUpdate(target.id, user.id, targetValue);
      setTimeout(() => {
        setIsExpanded(false);
        setJustUpdated(false);
      }, 2000);
    } catch (error) {
      console.error('Error completing target:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't show if user is not a participant or target is completed
  if (!userParticipation || isCompleted) return null;

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <div className="flex flex-col items-end gap-3">
        {/* Quick Action Buttons */}
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
            {/* Complete Button */}
            {currentProgress < targetValue && (
              <Button
                onClick={handleComplete}
                disabled={isUpdating}
                className="h-12 px-4 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Check className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            
            {/* Quick Increment Buttons */}
            {quickActions.map((action, index) => (
              <Button
                key={index}
                onClick={() => handleQuickUpdate(action.value)}
                disabled={isUpdating}
                className={cn(
                  "h-12 px-4 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105",
                  action.color,
                  action.color === 'bg-blue-600' && 'hover:bg-blue-700',
                  action.color === 'bg-purple-600' && 'hover:bg-purple-700',
                  action.color === 'bg-orange-600' && 'hover:bg-orange-700'
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Main FAB */}
        <div className="relative">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={isUpdating}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110",
              isExpanded ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
              justUpdated && "bg-green-600 hover:bg-green-700 animate-pulse"
            )}
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : isExpanded ? (
              <X className="h-5 w-5 text-white" />
            ) : justUpdated ? (
              <Check className="h-5 w-5 text-white" />
            ) : (
              <Zap className="h-5 w-5 text-white" />
            )}
          </Button>

          {/* Progress Ring */}
          <svg 
            className="absolute inset-0 h-14 w-14 transform -rotate-90"
            viewBox="0 0 56 56"
          >
            <circle
              cx="28"
              cy="28"
              r="26"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-600"
            />
            <circle
              cx="28"
              cy="28"
              r="26"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPercentage / 100)}`}
              className={cn(
                "transition-all duration-500",
                isCompleted ? "text-green-400" : "text-blue-400"
              )}
            />
          </svg>

          {/* Progress Badge */}
          {!isExpanded && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs min-w-[24px] h-6 flex items-center justify-center"
            >
              {Math.round(progressPercentage)}%
            </Badge>
          )}
        </div>
      </div>

      {/* Target Info Tooltip */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 mb-2 p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-600 min-w-[200px] animate-in slide-in-from-bottom-1 duration-200">
          <div className="text-white text-sm font-medium mb-1">{target.title}</div>
          <div className="text-gray-400 text-xs">
            {target.target_type === 'profit' || target.target_type === 'sales_volume' 
              ? `£${currentProgress.toLocaleString()} / £${targetValue.toLocaleString()}`
              : `${currentProgress} / ${targetValue}`
            }
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-gray-600 rounded-full">
              <div 
                className="h-1 bg-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-blue-400 text-xs font-medium">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingProgressActions; 