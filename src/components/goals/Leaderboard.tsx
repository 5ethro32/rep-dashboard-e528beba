
import React, { useMemo } from 'react';
import { Team, Goal } from '@/types/goals.types';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatting-utils';
import { Trophy } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  goals: Goal[];
}

interface TeamProgress {
  id: string;
  name: string;
  totalProgress: number;
  financialImpact: number;
  completedGoals: number;
  totalGoals: number;
}

const Leaderboard = ({ teams, goals }: LeaderboardProps) => {
  const teamProgress = useMemo(() => {
    if (!teams.length || !goals.length) return [];

    const progressByTeam: Record<string, TeamProgress> = {};

    // Initialize team progress objects
    teams.forEach(team => {
      progressByTeam[team.id] = {
        id: team.id,
        name: team.name,
        totalProgress: 0,
        financialImpact: 0,
        completedGoals: 0,
        totalGoals: 0
      };
    });

    // Calculate progress for each team
    goals.forEach(goal => {
      if (!progressByTeam[goal.team_id]) return;

      const teamData = progressByTeam[goal.team_id];
      const progressPercent = goal.target_quantity > 0 
        ? (goal.current_quantity / goal.target_quantity) * 100
        : 0;
      
      teamData.totalGoals++;
      teamData.totalProgress += progressPercent;
      teamData.financialImpact += goal.current_quantity * goal.price;
      
      if (goal.current_quantity >= goal.target_quantity) {
        teamData.completedGoals++;
      }
    });

    // Convert to array and calculate averages
    return Object.values(progressByTeam)
      .map(team => ({
        ...team,
        totalProgress: team.totalGoals > 0 
          ? team.totalProgress / team.totalGoals 
          : 0
      }))
      .filter(team => team.totalGoals > 0) // Only show teams with goals
      .sort((a, b) => b.totalProgress - a.totalProgress);
  }, [teams, goals]);

  if (teamProgress.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No team progress data available yet.</p>
        <p className="text-sm">Create teams and goals to see the leaderboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-6">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-lg font-bold mt-2">Team Leaderboard</h2>
        </div>
      </div>

      {teamProgress.map((team, index) => (
        <Card key={team.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className={`flex items-center p-4 ${index === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : ''}`}>
              <div className="flex-shrink-0 w-8 text-center">
                {index === 0 && <span className="text-yellow-500 font-bold">#1</span>}
                {index === 1 && <span className="text-slate-400 font-bold">#2</span>}
                {index === 2 && <span className="text-amber-700 font-bold">#3</span>}
                {index > 2 && <span className="text-gray-500">#{index + 1}</span>}
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex justify-between">
                  <h3 className="font-medium">{team.name}</h3>
                  <span className="text-sm font-bold">
                    {Math.round(team.totalProgress)}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-700 rounded-full w-full">
                  <div
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-yellow-500' : 'bg-finance-red'
                    }`}
                    style={{ width: `${team.totalProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{team.completedGoals} of {team.totalGoals} goals completed</span>
                  <span>Impact: {formatCurrency(team.financialImpact)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Leaderboard;
