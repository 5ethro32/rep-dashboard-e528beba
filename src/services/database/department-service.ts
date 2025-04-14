
import { supabase } from '@/integrations/supabase/client';
import { QueryData, DepartmentData } from './types';

export const fetchDepartmentData = async (
  department: string, 
  isMarch: boolean
): Promise<QueryData<DepartmentData>> => {
  const table = isMarch ? 'sales_data' : 'sales_data_februrary';
  
  try {
    if (isMarch) {
      const { data, error } = await supabase
        .from(table)
        .select(`
          id,
          rep_type,
          rep_name,
          sub_rep,
          account_ref,
          account_name,
          spend,
          profit,
          packs,
          cost,
          credit,
          margin
        `)
        .eq('rep_type', department);

      return { data, error };
    } else {
      const { data, error } = await supabase
        .from(table)
        .select(`
          id,
          Department as rep_type,
          Rep as rep_name,
          "Sub-Rep" as sub_rep,
          "Account Ref" as account_ref,
          "Account Name" as account_name,
          Spend as spend,
          Profit as profit,
          Packs as packs,
          Cost as cost,
          Credit as credit,
          Margin as margin
        `)
        .eq('Department', department);
      
      return { data, error };
    }
  } catch (error) {
    console.error(`Error fetching ${department} data:`, error);
    return { data: null, error: error as Error };
  }
};

