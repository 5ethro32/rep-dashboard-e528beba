import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TargetsService } from '@/services/targetsService';
import { 
  TargetWithParticipants, 
  CreateTargetRequest, 
  UpdateTargetRequest,
  TargetFilters 
} from '@/types/targets.types';

/**
 * Custom hook for managing targets and their operations
 * Provides state management and CRUD operations for the targets feature
 */
export const useTargets = (filters?: TargetFilters) => {
  const { user } = useAuth();
  const [targets, setTargets] = useState<TargetWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch targets from the service
   */
  const fetchTargets = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await TargetsService.getTargets(filters);
      setTargets(data);
    } catch (err) {
      console.error('Error fetching targets:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, JSON.stringify(filters)]); // Use JSON.stringify to properly compare filters object

  /**
   * Create a new target
   */
  const createTarget = useCallback(async (targetData: CreateTargetRequest) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      
      // Add the current user as the creator
      const targetWithCreator = {
        ...targetData,
        created_by: user.id
      };
      
      await TargetsService.createTarget(targetWithCreator);
      
      // Refresh the targets list
      await fetchTargets();
    } catch (err) {
      console.error('Error creating target:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchTargets]);

  /**
   * Update an existing target
   */
  const updateTarget = useCallback(async (targetData: UpdateTargetRequest) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      
      await TargetsService.updateTarget(targetData);
      
      // Refresh the targets list
      await fetchTargets();
    } catch (err) {
      console.error('Error updating target:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchTargets]);

  /**
   * Delete a target
   */
  const deleteTarget = useCallback(async (targetId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      
      await TargetsService.deleteTarget(targetId);
      
      // Remove from local state immediately for better UX
      setTargets(prev => prev.filter(target => target.id !== targetId));
    } catch (err) {
      console.error('Error deleting target:', err);
      // Refresh on error to ensure consistency
      await fetchTargets();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchTargets]);

  /**
   * Update progress for a participant
   */
  const updateProgress = useCallback(async (targetId: string, userId: string, progress: number) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await TargetsService.updateProgress(targetId, userId, progress);
      
      // Update local state for immediate feedback
      setTargets(prev => prev.map(target => {
        if (target.id === targetId) {
          const updatedParticipants = target.participants.map(participant => {
            if (participant.user_id === userId) {
              const targetValue = target.target_amount || target.target_quantity || 100;
              const progressPercentage = Math.min((progress / targetValue) * 100, 100);
              const isCompleted = progressPercentage >= 100;
              
              return {
                ...participant,
                current_progress: progress,
                progress_percentage: progressPercentage,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : participant.completed_at
              };
            }
            return participant;
          });
          
          // Recalculate leaderboard
          const leaderboard = updatedParticipants
            .map(p => ({
              user_id: p.user_id,
              user_name: p.user_name || 'Unknown User',
              user_email: p.user_email || '',
              progress: p.current_progress,
              progress_percentage: p.progress_percentage,
              rank: 0,
              is_completed: p.is_completed,
              completed_at: p.completed_at
            }))
            .sort((a, b) => {
              if (a.is_completed && !b.is_completed) return -1;
              if (!a.is_completed && b.is_completed) return 1;
              return b.progress - a.progress;
            })
            .map((entry, index) => ({ ...entry, rank: index + 1 }));
          
          return {
            ...target,
            participants: updatedParticipants,
            leaderboard,
            completed_participants: updatedParticipants.filter(p => p.is_completed).length
          };
        }
        return target;
      }));
      
    } catch (err) {
      console.error('Error updating progress:', err);
      throw err;
    }
  }, [user]);

  /**
   * Refresh targets data
   */
  const refreshTargets = useCallback(async () => {
    await fetchTargets();
  }, [fetchTargets]);

  /**
   * Get targets by status
   */
  const getTargetsByStatus = useCallback((status: string) => {
    return targets.filter(target => target.status === status);
  }, [targets]);

  /**
   * Get user's targets (where user is a participant)
   */
  const getUserTargets = useCallback(() => {
    if (!user) return [];
    return targets.filter(target => 
      target.participants.some(participant => participant.user_id === user.id)
    );
  }, [targets, user]);

  /**
   * Get targets created by the current user
   */
  const getCreatedTargets = useCallback(() => {
    if (!user) return [];
    return targets.filter(target => target.created_by === user.id);
  }, [targets, user]);

  // Initial fetch when component mounts or dependencies change
  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  return {
    // State
    targets,
    isLoading,
    error,
    
    // Actions
    createTarget,
    updateTarget,
    deleteTarget,
    updateProgress,
    refreshTargets,
    
    // Computed values
    getTargetsByStatus,
    getUserTargets,
    getCreatedTargets,
    
    // Statistics
    activeTargets: targets.filter(t => t.status === 'active'),
    completedTargets: targets.filter(t => t.status === 'completed'),
    totalParticipants: targets.reduce((sum, t) => sum + t.total_participants, 0)
  };
}; 