export interface RepData {
  rep: string;
  spend: number;
  profit: number;
  margin: number;
  packs: number;
  activeAccounts: number;
  totalAccounts: number;
  profitPerActiveShop: number;
  profitPerPack: number;
  activeRatio: number;
}

export interface SalesDataItem {
  id: number;
  rep_name: string;
  rep_type: string;
  account_ref: string;
  spend: number;
  profit: number;
  packs: number;
  account_name: string;
  reporting_period: string;
  sub_rep?: string;
  // Add any additional fields from your Supabase table
  cost?: number;
  credit?: number;
  margin?: number;
  import_date?: string;
}

export interface SummaryData {
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
  totalAccounts: number;
  activeAccounts: number;
  averageMargin: number;
}

export interface RepChanges {
  spend: number;
  profit: number;
  margin: number;
  packs: number;
  activeAccounts: number; // Added this property
  totalAccounts: number; // Added this property
  profitPerActiveShop: number;
  profitPerPack: number;
  activeRatio: number;
}

export type RepChangesRecord = Record<string, RepChanges>;

export interface MarchRollingData {
  Department?: string;
  Rep: string;
  "Sub-Rep"?: string;
  "Account Name"?: string;
  "Account Ref"?: string;
  Spend?: number;
  Profit?: number;
  Margin?: number;
  Packs?: number;
}

export interface SalesData {
  rep_type?: string;
  rep_name: string;
  sub_rep?: string;
  account_name: string;
  account_ref: string;
  spend: number;
  profit: number;
  margin: number;
  packs: number;
}
