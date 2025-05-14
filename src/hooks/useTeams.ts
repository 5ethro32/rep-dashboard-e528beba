
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Team } from '@/types/goals.types';

export function useTeams() {
  const queryClient = useQueryClient();

  // Fetch all teams
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*, team_members(user_id, profiles(first_name, last_name))')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading teams",
          description: error.message,
        });
        throw new Error(error.message);
      }
      
      return data as Team[];
    }
  });

  // Create a new team
  const createTeam = useMutation({
    mutationFn: async (teamName: string) => {
      const { data, error } = await supabase
        .from('teams')
        .insert([{ name: teamName }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Team created",
        description: `Team "${data.name}" has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create team",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Add member to team
  const addTeamMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          user_id: userId
        }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Member added",
        description: "Member has been added to the team successfully.",
      });
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

  // Remove member from team
  const removeTeamMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .match({ team_id: teamId, user_id: userId });
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "Member has been removed from the team.",
      });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Delete team
  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      
      if (error) throw new Error(error.message);
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

  return {
    teams,
    isLoading,
    error,
    createTeam,
    addTeamMember,
    removeTeamMember,
    deleteTeam
  };
}
