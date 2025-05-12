
export interface RuleConfig {
  rule1: {
    group1_2: { trend_down: number; trend_flat_up: number };
    group3_4: { trend_down: number; trend_flat_up: number };
    group5_6: { trend_down: number; trend_flat_up: number };
  };
  rule2: {
    group1_2: { trend_down: number; trend_flat_up: number };
    group3_4: { trend_down: number; trend_flat_up: number };
    group5_6: { trend_down: number; trend_flat_up: number };
  };
}

export interface EngineData {
  items: any[];
  flaggedItems: any[];
  totalItems: number;
  activeItems?: number;
  totalRevenue?: number;
  totalProfit?: number;
  overallMargin?: number;
  currentAvgMargin?: number;
  proposedAvgMargin?: number;
  currentProfit?: number;
  proposedProfit?: number;
  profitDelta?: number;
  marginLift?: number;
  avgCostLessThanMLCount?: number;
  rule1Flags?: number;
  rule2Flags?: number;
  fileName?: string;
  chartData?: any[];
  approvedItems?: any[];
  rejectedItems?: any[];
  ruleConfig?: RuleConfig;
}
