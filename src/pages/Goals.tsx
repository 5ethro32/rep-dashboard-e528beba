
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Flag, Trophy } from 'lucide-react';
import LoadingState from '@/components/metric-card/LoadingState';
import CreateTeamForm from '@/components/goals/CreateTeamForm';
import TeamsList from '@/components/goals/TeamsList';
import GoalsList from '@/components/goals/GoalsList';
import CreateGoalForm from '@/components/goals/CreateGoalForm';
import GoalTrackingComponent from '@/components/goals/GoalTrackingComponent';
import Leaderboard from '@/components/goals/Leaderboard';

const Goals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('teams');
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [showCreateGoalForm, setShowCreateGoalForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Query for teams
  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*, team_members(user_id)')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading teams",
          description: error.message,
        });
        throw new Error(error.message);
      }
      
      return data || [];
    }
  });

  // Query for goals
  const { data: goals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, teams(name)')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading goals",
          description: error.message,
        });
        throw new Error(error.message);
      }
      
      return data || [];
    }
  });

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setActiveTab('goals');
  };

  if (isLoadingTeams || isLoadingGoals) {
    return (
      <div className="container mx-auto p-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Trophy className="mr-2 h-6 w-6 text-finance-red" />
              Goals & Teams
            </CardTitle>
            <CardDescription>Create teams and track goals for product sales</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-8">
            <LoadingState />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center">
              <Trophy className="mr-2 h-6 w-6 text-finance-red" />
              Goals & Teams
            </CardTitle>
            <div className="space-x-2">
              {activeTab === 'teams' && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateTeamForm(!showCreateTeamForm)}
                >
                  {showCreateTeamForm ? 'Cancel' : 'Create Team'}
                </Button>
              )}
              {activeTab === 'goals' && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateGoalForm(!showCreateGoalForm)}
                >
                  {showCreateGoalForm ? 'Cancel' : 'Create Goal'}
                </Button>
              )}
            </div>
          </div>
          <CardDescription>Create teams and track goals for product sales</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teams" className="mt-4">
              {showCreateTeamForm && <CreateTeamForm onSuccess={() => setShowCreateTeamForm(false)} />}
              <TeamsList teams={teams} onSelectTeam={handleTeamSelect} />
            </TabsContent>
            
            <TabsContent value="goals" className="mt-4">
              {showCreateGoalForm && (
                <CreateGoalForm 
                  onSuccess={() => setShowCreateGoalForm(false)}
                  teams={teams}
                  selectedTeam={selectedTeam}
                />
              )}
              <GoalsList goals={goals} teams={teams} selectedTeam={selectedTeam} />
            </TabsContent>
            
            <TabsContent value="leaderboard" className="mt-4">
              <Leaderboard teams={teams} goals={goals} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Track team progress and celebrate achievements
        </CardFooter>
      </Card>

      {goals && goals.length > 0 && (
        <GoalTrackingComponent goals={goals} />
      )}
    </div>
  );
};

export default Goals;
