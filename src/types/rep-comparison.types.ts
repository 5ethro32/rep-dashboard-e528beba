
export interface DepartmentProcessedData {
  retail: RepData[];
  reva: RepData[];
  wholesale: RepData[];
}

export interface DepartmentSummaries {
  retail: SummaryData;
  reva: SummaryData;
  wholesale: SummaryData;
}

export interface ComparisonChange {
  totalSpend: number;
  totalProfit: number;
  averageMargin: number;
  totalPacks: number;
  totalAccounts: number;
  activeAccounts: number;
}
