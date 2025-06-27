import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { calculateGoals } from '@/utils/rep-performance-utils';

export type GoalType = 'profit' | 'margin' | 'activeRatio' | 'packs';

export interface UserGoal {
  id: string;
  user_id: string;
  user_display_name: string | null;
  goal_type: GoalType;
  target_value: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goals {
  profit: number;
  margin: number;
  activeRatio: number;
  packs: number;
}

export function useUserGoals(selectedUserId?: string | null, selectedUserDisplayName?: string) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goals>({
    profit: 100000,
    margin: 15,
    activeRatio: 75,
    packs: 5000
  });
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [hasCustomGoals, setHasCustomGoals] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Determine effective user ID for goal operations
  const effectiveUserId = selectedUserId === "all" ? "all" : (selectedUserId || user?.id);
  const effectiveDisplayName = selectedUserId === "all" ? "all" : (selectedUserDisplayName || user?.email);

  // Fetch user's custom goals or fall back to calculated goals
  const fetchGoals = async () => {
    if (!effectiveUserId) return;
    
    setIsLoading(true);
    try {
      // First, try to get custom goals for the user
      const { data: customGoalsData, error: customGoalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', effectiveUserId);
      
      if (customGoalsError) throw customGoalsError;
      
      if (customGoalsData && customGoalsData.length > 0) {
        // User has custom goals
        setUserGoals(customGoalsData);
        setHasCustomGoals(true);
        
        // Convert array of goals to Goals object
        const customGoals: Goals = {
          profit: 100000,
          margin: 15,
          activeRatio: 75,
          packs: 5000
        };
        
        customGoalsData.forEach(goal => {
          customGoals[goal.goal_type as GoalType] = goal.target_value;
        });
        
        setGoals(customGoals);
      } else {
        // No custom goals, use calculated goals
        setHasCustomGoals(false);
        const calculatedGoals = await calculateGoals(effectiveDisplayName || "", effectiveUserId === "all");
        setGoals(calculatedGoals);
      }
      
    } catch (error) {
      console.error('Error fetching user goals:', error);
      toast.error('Failed to load goals');
      
      // Fall back to calculated goals on error
      try {
        const calculatedGoals = await calculateGoals(effectiveDisplayName || "", effectiveUserId === "all");
        setGoals(calculatedGoals);
        setHasCustomGoals(false);
      } catch (calcError) {
        console.error('Error calculating fallback goals:', calcError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save custom goals for user
  const saveCustomGoals = async (newGoals: Goals) => {
    console.log('saveCustomGoals called with:', { newGoals, effectiveUserId, effectiveDisplayName });
    
    if (!effectiveUserId || effectiveUserId === "all") {
      toast.error('Cannot save custom goals for aggregated view');
      return false;
    }
    
    setIsSaving(true);
    try {
      console.log('Deleting existing goals for user:', effectiveUserId);
      
      // Delete existing goals for this user
      const { error: deleteError } = await supabase
        .from('user_goals')
        .delete()
        .eq('user_id', effectiveUserId);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }
      
      // Insert new goals
      const goalsToInsert = Object.entries(newGoals).map(([goalType, targetValue]) => ({
        user_id: effectiveUserId,
        user_display_name: effectiveDisplayName,
        goal_type: goalType,
        target_value: targetValue,
        is_custom: true
      }));
      
      console.log('Inserting goals:', goalsToInsert);
      
      const { error: insertError, data: insertData } = await supabase
        .from('user_goals')
        .insert(goalsToInsert)
        .select();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      
      console.log('Successfully inserted goals:', insertData);
      
      // Update local state
      setGoals(newGoals);
      setHasCustomGoals(true);
      
      // Refresh goals to get updated data with IDs
      await fetchGoals();
      
      toast.success('Goals saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving custom goals:', error);
      toast.error('Failed to save goals');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to calculated goals (delete custom goals)
  const resetToCalculatedGoals = async () => {
    if (!effectiveUserId || effectiveUserId === "all") {
      toast.error('Cannot reset goals for aggregated view');
      return false;
    }
    
    setIsSaving(true);
    try {
      // Delete custom goals
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('user_id', effectiveUserId);
      
      if (error) throw error;
      
      // Get calculated goals
      const calculatedGoals = await calculateGoals(effectiveDisplayName || "", false);
      setGoals(calculatedGoals);
      setHasCustomGoals(false);
      setUserGoals([]);
      
      toast.success('Reset to calculated goals');
      return true;
    } catch (error) {
      console.error('Error resetting goals:', error);
      toast.error('Failed to reset goals');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Get suggested (calculated) goals for comparison
  const getSuggestedGoals = async (): Promise<Goals> => {
    try {
      return await calculateGoals(effectiveDisplayName || "", effectiveUserId === "all");
    } catch (error) {
      console.error('Error getting suggested goals:', error);
      return {
        profit: 100000,
        margin: 15,
        activeRatio: 75,
        packs: 5000
      };
    }
  };

  // Load goals when user or selection changes
  useEffect(() => {
    console.log('useUserGoals effect:', { effectiveUserId, effectiveDisplayName, user });
    if (effectiveUserId) {
      fetchGoals();
    }
  }, [effectiveUserId, effectiveDisplayName]);

  return {
    goals,
    userGoals,
    hasCustomGoals,
    isLoading,
    isSaving,
    saveCustomGoals,
    resetToCalculatedGoals,
    getSuggestedGoals,
    fetchGoals,
    canCustomize: effectiveUserId !== "all" // Can't customize goals for "all data" view
  };
}