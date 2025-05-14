
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Goal, Team } from '@/types/goals.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatting-utils';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash, Check, X } from 'lucide-react';

interface GoalsListProps {
  goals: Goal[];
  teams: Team[];
  selectedTeam: Team | null;
}

const GoalsList = ({ goals, teams, selectedTeam }: GoalsListProps) => {
  const queryClient = useQueryClient();
  const [editingGoal, setEditingGoal] = React.useState<string | null>(null);
  const [currentQuantity, setCurrentQuantity] = React.useState<number>(0);

  const filteredGoals = selectedTeam 
    ? goals.filter(goal => goal.team_id === selectedTeam.id)
    : goals;

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, quantity }: { goalId: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('goals')
        .update({ current_quantity: quantity })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Goal updated",
        description: "Goal progress has been updated successfully.",
      });
      setEditingGoal(null);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update goal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({
        title: "Goal deleted",
        description: "The goal has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete goal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  const startEditing = (goal: Goal) => {
    setEditingGoal(goal.id);
    setCurrentQuantity(goal.current_quantity);
  };

  const cancelEditing = () => {
    setEditingGoal(null);
  };

  const saveEditing = (goalId: string) => {
    updateGoalMutation.mutate({ goalId, quantity: currentQuantity });
  };

  const handleDelete = (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoalMutation.mutate(goalId);
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  if (filteredGoals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="mt-2">No goals found.</p>
        <p className="text-sm">
          {selectedTeam ? `Create a goal for ${selectedTeam.name}` : 'Create a goal to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredGoals.map((goal) => {
        const progressPercent = Math.min(
          Math.round((goal.current_quantity / goal.target_quantity) * 100),
          100
        );
        const financialImpact = goal.current_quantity * goal.price;
        const targetImpact = goal.target_quantity * goal.price;
        const isComplete = progressPercent === 100;

        return (
          <Card 
            key={goal.id} 
            className={`overflow-hidden ${isComplete ? 'border-green-500' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-white">{goal.name}</h3>
                  <p className="text-sm text-gray-400">
                    Team: {goal.teams?.name || getTeamName(goal.team_id)}
                  </p>
                </div>
                {!editingGoal && (
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => startEditing(goal)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="mb-2">
                <p className="text-sm">{goal.product_name}</p>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Price: {formatCurrency(goal.price)}</span>
                  {goal.end_date && (
                    <span>Target date: {new Date(goal.end_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {editingGoal === goal.id ? (
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="range"
                    min="0"
                    max={goal.target_quantity}
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                    className="w-full"
                  />
                  <input
                    type="number"
                    min="0"
                    max={goal.target_quantity}
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                    className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <>
                  <Progress value={progressPercent} className="h-2 mb-1" />
                  <div className="flex justify-between text-xs">
                    <span>
                      {goal.current_quantity} of {goal.target_quantity} units ({progressPercent}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(financialImpact)} / {formatCurrency(targetImpact)}
                    </span>
                  </div>
                </>
              )}

              {editingGoal === goal.id && (
                <div className="flex justify-end mt-3 space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => saveEditing(goal.id)}
                    disabled={updateGoalMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
              
              {isComplete && !editingGoal && (
                <div className="mt-2 bg-green-900/30 text-green-400 px-3 py-1 rounded-sm text-xs inline-flex items-center">
                  <Check className="h-3 w-3 mr-1" />
                  Goal completed!
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GoalsList;
