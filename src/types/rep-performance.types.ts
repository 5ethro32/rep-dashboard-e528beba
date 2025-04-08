
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
  profitPerActiveShop: number;
  profitPerPack: number;
  activeRatio: number;
}

export type RepChangesRecord = Record<string, RepChanges>;
