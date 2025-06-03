import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  TargetWithParticipants, 
  CreateTargetRequest, 
  UpdateTargetRequest,
  TargetFilters,
  TargetParticipant,
  LeaderboardEntry,
  TeamGoalProgress
} from '@/types/targets.types';

/**
 * Service class for managing targets and gamification features
 * Currently using mock data until database tables are created
 */
export class TargetsService {
  
  // Mock data for development - will be replaced with real database calls
  private static mockTargets: TargetWithParticipants[] = [
    {
      id: '1',
      title: 'Q1 Profit Challenge',
      description: 'First to reach £5,000 profit this quarter wins!',
      target_type: 'profit',
      target_amount: 5000,
      target_quantity: undefined,
      time_period: 'monthly',
      scope: 'company',
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-03-31T23:59:59Z',
      is_active: true,
      status: 'active',
      prize_description: 'Winner gets a £500 bonus and recognition',
      created_by: 'admin-user-id',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      participants: [
        {
          id: 'p1',
          target_id: '1',
          user_id: 'user1',
          user_name: 'John Smith',
          user_email: 'john@avergenerics.co.uk',
          current_progress: 3200,
          progress_percentage: 64,
          is_completed: false,
          completed_at: undefined,
          rank: 1,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'p2',
          target_id: '1',
          user_id: 'user2',
          user_name: 'Sarah Johnson',
          user_email: 'sarah@avergenerics.co.uk',
          current_progress: 2800,
          progress_percentage: 56,
          is_completed: false,
          completed_at: undefined,
          rank: 2,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'p3',
          target_id: '1',
          user_id: 'user3',
          user_name: 'Mike Wilson',
          user_email: 'mike@avergenerics.co.uk',
          current_progress: 2100,
          progress_percentage: 42,
          is_completed: false,
          completed_at: undefined,
          rank: 3,
          created_at: '2024-01-01T00:00:00Z'
        }
      ],
      products: [],
      leaderboard: [
        {
          user_id: 'user1',
          user_name: 'John Smith',
          user_email: 'john@avergenerics.co.uk',
          progress: 3200,
          progress_percentage: 64,
          rank: 1,
          is_completed: false,
          completed_at: undefined
        },
        {
          user_id: 'user2',
          user_name: 'Sarah Johnson',
          user_email: 'sarah@avergenerics.co.uk',
          progress: 2800,
          progress_percentage: 56,
          rank: 2,
          is_completed: false,
          completed_at: undefined
        },
        {
          user_id: 'user3',
          user_name: 'Mike Wilson',
          user_email: 'mike@avergenerics.co.uk',
          progress: 2100,
          progress_percentage: 42,
          rank: 3,
          is_completed: false,
          completed_at: undefined
        }
      ],
      total_participants: 3,
      completed_participants: 0
    },
    {
      id: '2',
      title: 'Multi-Product Sales Challenge',
      description: 'First to sell £500 across Premium Widget A, Deluxe Gadget X, and Pro Tool Z',
      target_type: 'profit',
      target_amount: 500,
      target_quantity: undefined,
      time_period: 'weekly',
      scope: 'individual',
      start_date: '2024-01-15T00:00:00Z',
      end_date: '2024-01-21T23:59:59Z',
      challenge_mode: 'combined_products',
      is_active: false,
      status: 'completed',
      prize_description: '£200 bonus for the winner',
      created_by: 'admin-user-id',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-22T00:00:00Z',
      participants: [
        {
          id: 'p4',
          target_id: '2',
          user_id: 'user1',
          user_name: 'John Smith',
          user_email: 'john@avergenerics.co.uk',
          current_progress: 52,
          progress_percentage: 104,
          is_completed: true,
          completed_at: '2024-01-20T14:30:00Z',
          rank: 1,
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: 'p5',
          target_id: '2',
          user_id: 'user2',
          user_name: 'Sarah Johnson',
          user_email: 'sarah@avergenerics.co.uk',
          current_progress: 48,
          progress_percentage: 96,
          is_completed: false,
          completed_at: undefined,
          rank: 2,
          created_at: '2024-01-15T00:00:00Z'
        }
      ],
      products: [
        {
          id: 'pr1',
          target_id: '2',
          product_name: 'Premium Widget A',
          product_code: 'PWA001',
          target_amount: 200,
          weight: 1.0
        },
        {
          id: 'pr2',
          target_id: '2',
          product_name: 'Deluxe Gadget X',
          product_code: 'DGX003',
          target_amount: 200,
          weight: 1.0
        },
        {
          id: 'pr3',
          target_id: '2',
          product_name: 'Pro Tool Z',
          product_code: 'PTZ005',
          target_amount: 100,
          weight: 0.5
        }
      ],
      leaderboard: [
        {
          user_id: 'user1',
          user_name: 'John Smith',
          user_email: 'john@avergenerics.co.uk',
          progress: 52,
          progress_percentage: 104,
          rank: 1,
          is_completed: true,
          completed_at: '2024-01-20T14:30:00Z'
        },
        {
          user_id: 'user2',
          user_name: 'Sarah Johnson',
          user_email: 'sarah@avergenerics.co.uk',
          progress: 48,
          progress_percentage: 96,
          rank: 2,
          is_completed: false,
          completed_at: undefined
        }
      ],
      total_participants: 2,
      completed_participants: 1
    },
    {
      id: '3',
      title: 'Morning Rush Challenge',
      description: 'Sell £300 worth of any products during morning hours (9 AM - 12 PM)',
      target_type: 'sales_volume',
      target_amount: 300,
      target_quantity: undefined,
      time_period: 'daily',
      scope: 'individual',
      start_date: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
      end_date: new Date().toISOString().split('T')[0] + 'T23:59:59Z',
      start_time: '09:00',
      end_time: '12:00',
      challenge_mode: 'any_products',
      is_active: true,
      status: 'active',
      prize_description: '£50 bonus and early finish',
      created_by: 'admin-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participants: [
        {
          id: 'p6',
          target_id: '3',
          user_id: 'user1',
          user_name: 'John Smith',
          user_email: 'john@avergenerics.co.uk',
          current_progress: 150,
          progress_percentage: 50,
          is_completed: false,
          completed_at: undefined,
          rank: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 'p7',
          target_id: '3',
          user_id: 'user2',
          user_name: 'Sarah Johnson',
          user_email: 'sarah@avergenerics.co.uk',
          current_progress: 75,
          progress_percentage: 25,
          is_completed: false,
          completed_at: undefined,
          rank: 2,
          created_at: new Date().toISOString()
        }
      ],
      products: [
        {
          id: 'pr4',
          target_id: '3',
          product_name: 'Premium Widget A',
          product_code: 'PWA001'
        },
        {
          id: 'pr5',
          target_id: '3',
          product_name: 'Standard Widget B',
          product_code: 'SWB002'
        },
        {
          id: 'pr6',
          target_id: '3',
          product_name: 'Deluxe Gadget X',
          product_code: 'DGX003'
        }
      ],
      leaderboard: [
        {
          user_id: 'user1',
          user_name: 'John Smith',
          user_email: 'john@avergenerics.co.uk',
          progress: 150,
          progress_percentage: 50,
          rank: 1,
          is_completed: false,
          completed_at: undefined
        },
        {
          user_id: 'user2',
          user_name: 'Sarah Johnson',
          user_email: 'sarah@avergenerics.co.uk',
          progress: 75,
          progress_percentage: 25,
          rank: 2,
          is_completed: false,
          completed_at: undefined
        }
      ],
      total_participants: 2,
      completed_participants: 0
    }
  ];

  /**
   * Fetch all targets with optional filtering
   * @param filters - Optional filters to apply
   * @returns Promise<TargetWithParticipants[]>
   */
  static async getTargets(filters?: TargetFilters): Promise<TargetWithParticipants[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredTargets = [...this.mockTargets];

      // Apply filters
      if (filters?.status?.length) {
        filteredTargets = filteredTargets.filter(target => filters.status!.includes(target.status));
      }
      if (filters?.target_type?.length) {
        filteredTargets = filteredTargets.filter(target => filters.target_type!.includes(target.target_type));
      }
      if (filters?.time_period?.length) {
        filteredTargets = filteredTargets.filter(target => filters.time_period!.includes(target.time_period));
      }
      if (filters?.scope?.length) {
        filteredTargets = filteredTargets.filter(target => filters.scope!.includes(target.scope));
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredTargets = filteredTargets.filter(target => 
          target.title.toLowerCase().includes(searchLower) ||
          (target.description && target.description.toLowerCase().includes(searchLower))
        );
      }
      if (filters?.created_by) {
        filteredTargets = filteredTargets.filter(target => target.created_by === filters.created_by);
      }

      return filteredTargets;
    } catch (error) {
      console.error('Error in getTargets:', error);
      throw error;
    }
  }

  /**
   * Get a specific target by ID
   * @param targetId - The target ID
   * @returns Promise<TargetWithParticipants | null>
   */
  static async getTargetById(targetId: string): Promise<TargetWithParticipants | null> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const target = this.mockTargets.find(t => t.id === targetId);
      return target || null;
    } catch (error) {
      console.error('Error in getTargetById:', error);
      throw error;
    }
  }

  /**
   * Create a new target
   * @param targetData - The target creation data
   * @returns Promise<Target>
   */
  static async createTarget(targetData: CreateTargetRequest): Promise<Target> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTarget: Target = {
        id: `target_${Date.now()}`,
        title: targetData.title,
        description: targetData.description,
        target_type: targetData.target_type,
        target_amount: targetData.target_amount,
        target_quantity: targetData.target_quantity,
        time_period: targetData.time_period,
        scope: targetData.scope,
        start_date: targetData.start_date,
        end_date: targetData.end_date,
        is_active: true,
        status: 'active',
        prize_description: targetData.prize_description,
        created_by: (targetData as any).created_by || 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

             // Add to mock data
       const newTargetWithParticipants: TargetWithParticipants = {
         ...newTarget,
         participants: [],
         products: (targetData.products || []).map((p, index) => ({
           id: `product_${Date.now()}_${index}`,
           target_id: newTarget.id,
           ...p
         })),
         leaderboard: [],
         total_participants: 0,
         completed_participants: 0
       };

      this.mockTargets.unshift(newTargetWithParticipants);

      return newTarget;
    } catch (error) {
      console.error('Error in createTarget:', error);
      throw error;
    }
  }

  /**
   * Update an existing target
   * @param targetData - The target update data
   * @returns Promise<Target>
   */
  static async updateTarget(targetData: UpdateTargetRequest): Promise<Target> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const targetIndex = this.mockTargets.findIndex(t => t.id === targetData.id);
      if (targetIndex === -1) {
        throw new Error('Target not found');
      }

             const existingTarget = this.mockTargets[targetIndex];
       const updatedTarget = {
         ...existingTarget,
         ...targetData,
         updated_at: new Date().toISOString()
       } as TargetWithParticipants;

       this.mockTargets[targetIndex] = updatedTarget;

       // Return only the Target properties
       const { participants, products, leaderboard, total_participants, completed_participants, ...targetOnly } = updatedTarget;
       return targetOnly;
    } catch (error) {
      console.error('Error in updateTarget:', error);
      throw error;
    }
  }

  /**
   * Delete a target
   * @param targetId - The target ID to delete
   * @returns Promise<void>
   */
  static async deleteTarget(targetId: string): Promise<void> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const targetIndex = this.mockTargets.findIndex(t => t.id === targetId);
      if (targetIndex === -1) {
        throw new Error('Target not found');
      }

      this.mockTargets.splice(targetIndex, 1);
    } catch (error) {
      console.error('Error in deleteTarget:', error);
      throw error;
    }
  }

  /**
   * Update participant progress
   * @param targetId - The target ID
   * @param userId - The user ID
   * @param progress - The new progress value
   * @returns Promise<TargetParticipant>
   */
  static async updateProgress(targetId: string, userId: string, progress: number): Promise<TargetParticipant> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const target = this.mockTargets.find(t => t.id === targetId);
      if (!target) throw new Error('Target not found');

      const participant = target.participants.find(p => p.user_id === userId);
      if (!participant) throw new Error('Participant not found');

      const targetValue = target.target_amount || target.target_quantity || 100;
      const progressPercentage = Math.min((progress / targetValue) * 100, 100);
      const isCompleted = progressPercentage >= 100;

      participant.current_progress = progress;
      participant.progress_percentage = progressPercentage;
      participant.is_completed = isCompleted;
      participant.completed_at = isCompleted ? new Date().toISOString() : undefined;

      // Recalculate leaderboard
      target.leaderboard = this.calculateLeaderboard(target.participants);
      target.completed_participants = target.participants.filter(p => p.is_completed).length;

      return participant;
    } catch (error) {
      console.error('Error in updateProgress:', error);
      throw error;
    }
  }

  /**
   * Get team goal progress for collaborative targets
   * @param targetId - The target ID
   * @returns Promise<TeamGoalProgress>
   */
  static async getTeamGoalProgress(targetId: string): Promise<TeamGoalProgress> {
    try {
      const target = await this.getTargetById(targetId);
      if (!target) throw new Error('Target not found');

      const teamProgress = target.participants.reduce((sum, p) => sum + p.current_progress, 0);
      const teamTarget = target.target_amount || target.target_quantity || 100;
      
      const individualContributions = target.participants.map(p => ({
        user_id: p.user_id,
        user_name: p.user_name || 'Unknown User',
        contribution: p.current_progress,
        percentage_of_team: teamProgress > 0 ? (p.current_progress / teamProgress) * 100 : 0
      }));

      return {
        target_id: targetId,
        team_progress: teamProgress,
        team_target: teamTarget,
        individual_contributions: individualContributions,
        is_team_goal_achieved: teamProgress >= teamTarget
      };
    } catch (error) {
      console.error('Error in getTeamGoalProgress:', error);
      throw error;
    }
  }

  /**
   * Calculate leaderboard from participants
   * @param participants - Array of participants
   * @returns LeaderboardEntry[]
   */
  private static calculateLeaderboard(participants: TargetParticipant[]): LeaderboardEntry[] {
    return participants
      .map((p) => ({
        user_id: p.user_id,
        user_name: p.user_name || 'Unknown User',
        user_email: p.user_email || '',
        progress: p.current_progress,
        progress_percentage: p.progress_percentage,
        rank: 0, // Will be calculated below
        is_completed: p.is_completed,
        completed_at: p.completed_at
      }))
      .sort((a, b) => {
        // Sort by completion status first, then by progress
        if (a.is_completed && !b.is_completed) return -1;
        if (!a.is_completed && b.is_completed) return 1;
        return b.progress - a.progress;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }

  /**
   * Get all users for participant selection
   * @returns Promise<Array<{id: string, name: string, email: string}>>
   */
  static async getAvailableUsers(): Promise<Array<{id: string, name: string, email: string}>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) {
        console.error('Error fetching users:', error);
        // Return mock users if database call fails
        return [
          { id: 'user1', name: 'John Smith', email: 'john@avergenerics.co.uk' },
          { id: 'user2', name: 'Sarah Johnson', email: 'sarah@avergenerics.co.uk' },
          { id: 'user3', name: 'Mike Wilson', email: 'mike@avergenerics.co.uk' }
        ];
      }

      return (data || []).map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
        email: `${user.first_name?.toLowerCase() || 'user'}@avergenerics.co.uk`
      }));
    } catch (error) {
      console.error('Error in getAvailableUsers:', error);
      // Return mock users if there's an error
      return [
        { id: 'user1', name: 'John Smith', email: 'john@avergenerics.co.uk' },
        { id: 'user2', name: 'Sarah Johnson', email: 'sarah@avergenerics.co.uk' },
        { id: 'user3', name: 'Mike Wilson', email: 'mike@avergenerics.co.uk' }
      ];
    }
  }
} 