
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Team } from '@/types/goals.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UserPlus, Users, Trash } from 'lucide-react';

interface TeamsListProps {
  teams: Team[];
  onSelectTeam: (team: Team) => void;
}

const TeamsList = ({ teams, onSelectTeam }: TeamsListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [memberEmail, setMemberEmail] = useState('');

  // Simplified mutation without complex type parameters
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeam) return null;
      
      // 1. Get the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberEmail.trim())
        .single();

      if (userError) {
        throw new Error('User not found with this email.');
      }

      // 2. Add the user to the team
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: selectedTeam.id,
          user_id: userData.id
        }]);

      if (memberError) {
        if (memberError.code === '23505') { // Unique violation
          throw new Error('This user is already a member of the team.');
        }
        throw new Error(memberError.message);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Member added",
        description: `User has been added to the team successfully.`,
      });
      setMemberEmail('');
      setShowAddMemberDialog(false);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add member",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw new Error(error.message);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete team",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  const openAddMemberDialog = (team: Team) => {
    setSelectedTeam(team);
    setShowAddMemberDialog(true);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMemberMutation.mutate();
  };

  const handleDelete = (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Users className="mx-auto h-8 w-8 opacity-50" />
        <p className="mt-2">No teams created yet.</p>
        <p className="text-sm">Create a team to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card 
            key={team.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectTeam(team)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-white">{team.name}</h3>
                <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openAddMemberDialog(team)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <Users className="h-4 w-4 mr-1" />
                <span>{team.team_members?.length || 1} member(s)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="memberEmail" className="text-right">
                  User Email
                </Label>
                <Input
                  id="memberEmail"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit"
                disabled={!memberEmail.trim() || addMemberMutation.isPending}
              >
                {addMemberMutation.isPending && <span className="mr-2 h-4 w-4 animate-spin">●</span>}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamsList;
