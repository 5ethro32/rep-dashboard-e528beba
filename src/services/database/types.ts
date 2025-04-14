
export interface QueryData<T = any> {
  data: T[] | null;
  error: Error | null;
}

export interface DepartmentData {
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
