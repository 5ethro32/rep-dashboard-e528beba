// Target type definitions for the gamification system

export type TargetType = 'profit' | 'product' | 'sales_volume' | 'customer_acquisition';
export type TimePeriod = 'daily' | 'weekly' | 'monthly';
export type TargetScope = 'individual' | 'group' | 'company';
export type TargetStatus = 'draft' | 'active' | 'completed' | 'expired' | 'cancelled';

export interface Target {
  id: string;
  title: string;
  description?: string;
  target_type: TargetType;
  target_amount?: number;
  target_quantity?: number;
  time_period: TimePeriod;
  scope: TargetScope;
  start_date: string;
  end_date: string;
  start_time?: string; // For daily challenges with specific times
  end_time?: string; // For daily challenges with specific times
  is_active: boolean;
  status: TargetStatus;
  prize_description?: string;
  challenge_mode?: 'individual_products' | 'combined_products' | 'any_products'; // How products are evaluated
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TargetParticipant {
  id: string;
  target_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  current_progress: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  rank?: number;
  created_at: string;
}

export interface TargetProduct {
  id: string;
  target_id: string;
  product_name: string;
  product_code?: string;
  required_quantity?: number;
  target_amount?: number; // For monetary targets on specific products
  weight?: number; // For weighted contribution in multi-product challenges
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_email?: string;
  progress: number;
  progress_percentage: number;
  rank: number;
  is_completed: boolean;
  completed_at?: string;
}

export interface TargetWithParticipants extends Target {
  participants: TargetParticipant[];
  products?: TargetProduct[];
  leaderboard: LeaderboardEntry[];
  total_participants: number;
  completed_participants: number;
}

export interface CreateTargetRequest {
  title: string;
  description?: string;
  target_type: TargetType;
  target_amount?: number;
  target_quantity?: number;
  time_period: TimePeriod;
  scope: TargetScope;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  prize_description?: string;
  challenge_mode?: 'individual_products' | 'combined_products' | 'any_products';
  participant_ids?: string[];
  products?: Omit<TargetProduct, 'id' | 'target_id'>[];
}

export interface UpdateTargetRequest extends Partial<CreateTargetRequest> {
  id: string;
  is_active?: boolean;
  status?: TargetStatus;
}

// Progress tracking interfaces
export interface ProgressUpdate {
  target_id: string;
  user_id: string;
  progress_value: number;
  timestamp: string;
}

export interface TargetFilters {
  status?: TargetStatus[];
  target_type?: TargetType[];
  time_period?: TimePeriod[];
  scope?: TargetScope[];
  search?: string;
  created_by?: string;
  participant_id?: string;
}

// Team goal specific types for collaborative targets where team progress increases with each user input
export interface TeamGoalProgress {
  target_id: string;
  team_progress: number;
  team_target: number;
  individual_contributions: {
    user_id: string;
    user_name: string;
    contribution: number;
    percentage_of_team: number;
  }[];
  is_team_goal_achieved: boolean;
} 