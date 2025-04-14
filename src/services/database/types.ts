
export interface QueryData<T = any> {
  data: T[] | null;
  error: Error | null;
}

export interface DepartmentData {
  Department?: string;
  Rep?: string;
  'Sub-Rep'?: string;
  'Account Ref'?: string;
  'Account Name'?: string;
  Spend?: string | number;
  Profit?: string | number;
  Packs?: string | number;
  Cost?: string | number;
  Credit?: string | number;
  Margin?: string | number;
  id?: string | number;
  rep_type?: string;
  rep_name?: string;
  sub_rep?: string;
  account_ref?: string;
  account_name?: string;
  spend?: string | number;
  profit?: string | number;
  packs?: string | number;
  cost?: string | number;
  credit?: string | number;
  margin?: string | number;
}
