
import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CreateTeamFormProps {
  onSuccess: () => void;
}

const CreateTeamForm = ({ onSuccess }: CreateTeamFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState('');

  const createTeam = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!teamName.trim()) throw new Error('Team name is required');

      // 1. Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{ name: teamName.trim() }])
        .select()
        .single();

      if (teamError) throw new Error(teamError.message);

      // 2. Add the current user as a team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{ 
          team_id: team.id,
          user_id: user.id
        }]);

      if (memberError) throw new Error(memberError.message);

      return team;
    },
    onSuccess: () => {
      toast({
        title: "Team created",
        description: `Team "${teamName}" has been created successfully.`,
      });
      setTeamName('');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create team",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam.mutate();
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                disabled={createTeam.isPending}
                autoFocus
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={createTeam.isPending || !teamName.trim()}
              >
                {createTeam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTeamForm;
