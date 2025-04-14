
import { supabase } from '@/integrations/supabase/client';
import { QueryData, DepartmentData } from './types';

export const fetchDepartmentData = async (
  department: string, 
  isMarch: boolean
): Promise<QueryData<DepartmentData>> => {
  const table = isMarch ? 'sales_data' : 'sales_data_februrary';
  
  try {
    if (isMarch) {
      // Using type assertions to avoid deep type instantiation issues
      const { data, error } = await supabase
        .from(table)
        .select()
        .eq('rep_type', department);

      if (!data) return { data: null, error };

      // Transform data to match DepartmentData interface
      const transformedData = data.map(item => ({
        Department: item.rep_type,
        Rep: item.rep_name,
        'Sub-Rep': item.sub_rep,
        'Account Ref': item.account_ref,
        'Account Name': item.account_name,
        Spend: item.spend,
        Profit: item.profit,
        Packs: item.packs,
        Cost: item.cost,
        Credit: item.credit,
        Margin: item.margin
      }));

      return { data: transformedData, error };
    } else {
      // Using type assertions to avoid deep type instantiation issues
      const { data, error } = await supabase
        .from(table)
        .select()
        .eq('Department', department);
      
      return { data, error };
    }
  } catch (error) {
    console.error(`Error fetching ${department} data:`, error);
    return { data: null, error: error as Error };
  }
};
