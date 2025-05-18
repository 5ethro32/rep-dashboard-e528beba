
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
  activeAccounts: number;
  totalAccounts: number;
  profitPerActiveShop: number;
  profitPerPack: number;
  activeRatio: number;
}

export type RepChangesRecord = Record<string, RepChanges>;

// Add the missing AccountData and MetricsData interfaces
export interface MetricsData {
  totalOrders: number;
  revenue: number;
  margin: number;
  profit: number;
  visits: number;
}

export interface AccountData {
  id: string;
  name: string;
  representative: string;
  type: string;
  industry: string;
  location: string;
  metrics: MetricsData;
  changePercent: number;
  starred: boolean;
}
