
export interface Team {
  id: string;
  name: string;
  created_at: string;
  active: boolean;
  team_members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  team_id: string;
  product_name: string;
  target_quantity: number;
  current_quantity: number;
  price: number;
  created_at: string;
  end_date: string | null;
  active: boolean;
  teams?: {
    name: string;
  };
}

export interface GoalProgress {
  productName: string;
  targetQuantity: number;
  currentQuantity: number;
  price: number;
  financialImpact: number;
  percentComplete: number;
}

export interface TeamWithGoals extends Team {
  goalCount: number;
  totalProgress: number;
  financialImpact: number;
}
