import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp, 
  Package, 
  UserPlus, 
  Crown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Target as TargetIcon,
  Clock,
  Award,
  Plus,
  Check
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { TargetWithParticipants, TargetType } from '@/types/targets.types';
import { useAuth } from '@/contexts/AuthContext';

interface TargetCardProps {
  target: TargetWithParticipants;
  onEdit?: (target: TargetWithParticipants) => void;
  onDelete?: (targetId: string) => void;
  onView?: (target: TargetWithParticipants) => void;
  onUpdateProgress?: (target: TargetWithParticipants) => void;
  onProgressUpdate?: (targetId: string, userId: string, progress: number) => Promise<void>;
  className?: string;
}

const TargetCard: React.FC<TargetCardProps> = ({
  target,
  onEdit,
  onDelete,
  onView,
  onUpdateProgress,
  onProgressUpdate,
  className
}) => {
  const { isAdmin, user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if current user is a participant
  const isParticipant = user && target.participants.some(p => p.user_id === user.id);
  const userParticipation = user ? target.participants.find(p => p.user_id === user.id) : null;

  // Calculate progress percentage
  const progressPercentage = target.total_participants > 0 
    ? (target.completed_participants / target.total_participants) * 100 
    : 0;

  // Calculate time remaining
  const now = new Date();
  const endDate = new Date(target.end_date);
  const startDate = new Date(target.start_date);
  const isActive = target.status === 'active';
  const isUpcoming = isBefore(now, startDate);
  const isExpired = isAfter(now, endDate);

  // Get target type information
  const getTargetTypeInfo = (type: TargetType) => {
    switch (type) {
      case 'profit':
        return { icon: TrendingUp, label: 'Profit Target', color: 'text-green-400' };
      case 'product':
        return { icon: Package, label: 'Product Sales', color: 'text-blue-400' };
      case 'sales_volume':
        return { icon: TargetIcon, label: 'Sales Volume', color: 'text-purple-400' };
      case 'customer_acquisition':
        return { icon: UserPlus, label: 'New Customers', color: 'text-orange-400' };
    }
  };

  const { icon: TypeIcon, label: typeLabel, color: typeColor } = getTargetTypeInfo(target.target_type);

  // Format target value
  const formatTargetValue = () => {
    if (target.target_type === 'profit' || target.target_type === 'sales_volume') {
      return target.target_amount ? `£${target.target_amount.toLocaleString()}` : 'N/A';
    }
    if (target.target_type === 'product' || target.target_type === 'customer_acquisition') {
      const unit = target.target_type === 'product' ? 'units' : 'customers';
      return target.target_quantity ? `${target.target_quantity} ${unit}` : 'N/A';
    }
    return 'N/A';
  };

  // Get status badge styling
  const getStatusBadge = () => {
    if (isUpcoming) {
      return { variant: 'secondary' as const, className: 'bg-blue-600', text: 'Upcoming' };
    }
    if (isExpired && target.status !== 'completed') {
      return { variant: 'secondary' as const, className: 'bg-red-600', text: 'Expired' };
    }
    if (target.status === 'completed') {
      return { variant: 'secondary' as const, className: 'bg-green-600', text: 'Completed' };
    }
    if (target.status === 'active') {
      return { variant: 'default' as const, className: 'bg-green-600', text: 'Active' };
    }
    return { variant: 'secondary' as const, className: 'bg-gray-600', text: target.status };
  };

  const statusBadge = getStatusBadge();

  // Handle delete confirmation
  const handleDelete = () => {
    if (onDelete) {
      onDelete(target.id);
    }
    setShowDeleteDialog(false);
  };

  // Get smart increment value for quick updates
  const getSmartIncrement = () => {
    const targetValue = target.target_amount || target.target_quantity || 100;
    const currentProgress = userParticipation?.current_progress || 0;
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

  // Format smart increment for display
  const formatSmartIncrement = () => {
    const increment = getSmartIncrement();
    if (target.target_type === 'profit' || target.target_type === 'sales_volume') {
      return `£${increment}`;
    }
    return `${increment}`;
  };

  // Handle quick progress update
  const handleQuickUpdate = async (increment: number) => {
    if (!user || !onProgressUpdate || isUpdating || increment <= 0) return;
    
    setIsUpdating(true);
    try {
      const currentProgress = userParticipation?.current_progress || 0;
      const targetValue = target.target_amount || target.target_quantity || 100;
      const newProgress = Math.min(currentProgress + increment, targetValue);
      await onProgressUpdate(target.id, user.id, newProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle target completion
  const handleCompleteTarget = async () => {
    if (!user || !onProgressUpdate || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const targetValue = target.target_amount || target.target_quantity || 100;
      await onProgressUpdate(target.id, user.id, targetValue);
    } catch (error) {
      console.error('Error completing target:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card className={cn(
        "bg-gray-900/40 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all duration-200 group",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">{typeLabel}</span>
              </div>
              <CardTitle className="text-lg text-white mb-1 truncate">{target.title}</CardTitle>
              {target.description && (
                <CardDescription className="text-gray-400 text-sm line-clamp-2">
                  {target.description}
                </CardDescription>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-3">
              <Badge 
                variant={statusBadge.variant}
                className={statusBadge.className}
              >
                {statusBadge.text}
              </Badge>
              
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                    {onView && (
                      <DropdownMenuItem 
                        onClick={() => onView(target)}
                        className="text-white hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem 
                        onClick={() => onEdit(target)}
                        className="text-white hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Target
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator className="bg-gray-600" />
                        <DropdownMenuItem 
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Target
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Target Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Target:</span>
                <span className="text-white font-medium">{formatTargetValue()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Period:</span>
                <span className="text-white capitalize">{target.time_period}</span>
              </div>
              {target.time_period === 'daily' && target.start_time && target.end_time && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white text-xs">{target.start_time}-{target.end_time}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Participants:</span>
                <span className="text-white">{target.total_participants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Scope:</span>
                <span className="text-white capitalize">{target.scope}</span>
              </div>
              {target.challenge_mode && target.products && target.products.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Products:</span>
                  <span className="text-white text-xs">{target.products.length} selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Challenge Mode Badge */}
          {target.challenge_mode && target.products && target.products.length > 0 && (
            <div className="mt-3">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  target.challenge_mode === 'individual_products' && "border-blue-500 text-blue-400",
                  target.challenge_mode === 'combined_products' && "border-green-500 text-green-400",
                  target.challenge_mode === 'any_products' && "border-purple-500 text-purple-400"
                )}
              >
                {target.challenge_mode === 'individual_products' && 'Individual Products'}
                {target.challenge_mode === 'combined_products' && 'Combined Target'}
                {target.challenge_mode === 'any_products' && 'Any Products'}
              </Badge>
            </div>
          )}

          {/* Product List for Multi-Product Challenges */}
          {target.products && target.products.length > 0 && target.products.length <= 3 && (
            <div className="mt-3">
              <div className="text-xs text-gray-400 mb-1">Featured Products:</div>
              <div className="flex flex-wrap gap-1">
                {target.products.map((product, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-gray-700">
                    {product.product_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Progress Section */}
          {target.participants.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Progress
                </span>
                <span className="text-white font-medium">
                  {target.completed_participants}/{target.total_participants} completed
                </span>
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={progressPercentage} 
                  className="h-2 bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span className="font-medium text-white">{Math.round(progressPercentage)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Preview */}
          {target.leaderboard.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Trophy className="h-3 w-3" />
                <span>Top Performers</span>
              </div>
              
              <div className="space-y-2">
                {target.leaderboard.slice(0, 3).map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        index === 0 ? 'bg-yellow-600' : 
                        index === 1 ? 'bg-gray-500' : 'bg-orange-600'
                      )}>
                        {entry.rank}
                      </div>
                      <span className="text-white truncate font-medium">
                        {entry.user_name}
                      </span>
                      {entry.is_completed && (
                        <Crown className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-gray-400 font-medium">
                      {Math.round(entry.progress_percentage)}%
                    </span>
                  </div>
                ))}
                
                {target.leaderboard.length > 3 && (
                  <div className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-400 hover:text-blue-300 text-xs"
                      onClick={() => onView?.(target)}
                    >
                      View all {target.leaderboard.length} participants
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2 pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Timeline
              </span>
              {isActive && !isExpired && (
                <span className="text-green-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(endDate, { addSuffix: true })}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Started:</span>
                <p className="text-white">{format(startDate, 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <span className="text-gray-500">Ends:</span>
                <p className="text-white">{format(endDate, 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Prize/Reward */}
          {target.prize_description && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Award className="h-3 w-3" />
                <span>Reward</span>
              </div>
              <p className="text-white text-sm">{target.prize_description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onView(target)}
                className="flex-1 border-gray-600 text-white hover:bg-gray-700"
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
            )}
            
            {isAdmin && onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(target)}
                className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>

          {/* Simple Progress Update Buttons for Participants */}
          {isParticipant && onProgressUpdate && target.status === 'active' && !userParticipation?.is_completed && (
            <div className="flex gap-2 pt-3 border-t border-gray-700 mt-3">
              <Button 
                size="sm" 
                onClick={() => handleQuickUpdate(getSmartIncrement())}
                disabled={isUpdating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Add {formatSmartIncrement()}
              </Button>
              
              <Button 
                size="sm" 
                onClick={() => handleCompleteTarget()}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Complete
              </Button>
            </div>
          )}

          {/* Completion Message */}
          {isParticipant && userParticipation?.is_completed && (
            <div className="flex items-center gap-2 p-3 bg-green-900/30 rounded-lg border border-green-500/30 mt-3">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium">Target Completed! 🎉</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Target</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{target.title}"? This action cannot be undone and will remove all associated progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Target
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TargetCard; 