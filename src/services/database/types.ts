
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
}
