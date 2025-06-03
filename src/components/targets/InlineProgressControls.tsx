import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  Check, 
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TargetWithParticipants } from '@/types/targets.types';
import { useAuth } from '@/contexts/AuthContext';

interface InlineProgressControlsProps {
  target: TargetWithParticipants;
  onProgressUpdate: (targetId: string, userId: string, progress: number) => Promise<void>;
  className?: string;
}

const InlineProgressControls: React.FC<InlineProgressControlsProps> = ({
  target,
  onProgressUpdate,
  className
}) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  // Get current user's participation
  const userParticipation = user ? target.participants.find(p => p.user_id === user.id) : null;
  const currentProgress = userParticipation?.current_progress || 0;
  const isCompleted = userParticipation?.is_completed || false;

  // Calculate target value
  const targetValue = target.target_amount || target.target_quantity || 100;

  // Get smart increment value
  const getSmartIncrement = () => {
    const remaining = targetValue - currentProgress;
    
    if (target.target_type === 'profit' || target.target_type === 'sales_volume') {
      if (targetValue >= 1000) {
        return Math.min(100, remaining);
      } else {
        return Math.min(25, remaining);
      }
    } else {
      if (targetValue >= 50) {
        return Math.min(5, remaining);
      } else {
        return Math.min(1, remaining);
      }
    }
  };

  const smartIncrement = getSmartIncrement();

  // Handle quick increment
  const handleQuickIncrement = async () => {
    if (!user || isUpdating || smartIncrement <= 0) return;
    
    setIsUpdating(true);
    setJustUpdated(true);
    
    try {
      const newProgress = Math.min(currentProgress + smartIncrement, targetValue);
      await onProgressUpdate(target.id, user.id, newProgress);
      
      // Show success animation
      setTimeout(() => setJustUpdated(false), 1500);
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
      setTimeout(() => setJustUpdated(false), 2000);
    } catch (error) {
      console.error('Error completing target:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format value for display
  const formatValue = (value: number) => {
    if (target.target_type === 'profit' || target.target_type === 'sales_volume') {
      return `£${value}`;
    }
    return `+${value}`;
  };

  // Don't show if user is not a participant or target is completed
  if (!userParticipation || isCompleted) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-600/50 transition-all duration-200",
      justUpdated && "bg-green-900/30 border-green-500/50",
      className
    )}>
      {/* Quick Add Button */}
      {smartIncrement > 0 && (
        <Button
          size="sm"
          onClick={handleQuickIncrement}
          disabled={isUpdating}
          className={cn(
            "h-7 px-3 text-xs transition-all duration-200",
            justUpdated 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {isUpdating ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
          ) : justUpdated ? (
            <Check className="h-3 w-3" />
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              {formatValue(smartIncrement)}
            </>
          )}
        </Button>
      )}

      {/* Complete Button */}
      {currentProgress < targetValue && (
        <Button
          size="sm"
          onClick={handleComplete}
          disabled={isUpdating}
          className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
        >
          {isUpdating ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              Done
            </>
          )}
        </Button>
      )}

      {/* Status Badge */}
      {justUpdated && (
        <Badge 
          variant="secondary" 
          className="bg-green-600 text-white text-xs animate-pulse"
        >
          Updated!
        </Badge>
      )}
    </div>
  );
};

export default InlineProgressControls; 