
export interface QueryData<T = any> {
  data: T[] | null;
  error: Error | null;
}

// Define the structure for the February data table
export interface SalesDataFebruary {
  id: string | number;
  Department: string;
  Rep: string;
  "Sub-Rep": string | null;
  "Account Ref": string | null;
  "Account Name": string | null;
  Spend: string | number | null;
  Profit: string | number | null;
  Packs: string | number | null;
  Cost: string | number | null;
  Credit: string | number | null;
  Margin: string | number | null;
}

// Define the structure for the March data table
export interface SalesDataMarch {
  id: string | number;
  rep_type: string;
  rep_name: string;
  sub_rep: string | null;
  account_ref: string;
  account_name: string;
  spend: string | number;
  profit: string | number;
  packs: string | number;
  cost: string | number;
  credit: string | number;
  margin: string | number;
}

// Common interface that both will be transformed into
export interface DepartmentData {
  id?: string | number;
  rep_type?: string;
  rep_name?: string;
  sub_rep?: string | null;
  account_ref?: string | null;
  account_name?: string | null;
  spend?: string | number | null;
  profit?: string | number | null;
  packs?: string | number | null;
  cost?: string | number | null;
  credit?: string | number | null;
  margin?: string | number | null;
}
