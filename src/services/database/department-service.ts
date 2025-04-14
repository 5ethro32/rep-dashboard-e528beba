
import { supabase } from '@/integrations/supabase/client';
import { QueryData, DepartmentData } from './types';

export const fetchDepartmentData = async (
  department: string, 
  isMarch: boolean
): Promise<QueryData<DepartmentData>> => {
  const table = isMarch ? 'sales_data' : 'sales_data_februrary';
  
  try {
    if (isMarch) {
      // For March data (sales_data table)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('rep_type', department);

      if (error) throw error;
      
      return { 
        data: data as DepartmentData[], 
        error: null 
      };
    } else {
      // For February data (sales_data_februrary table)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('Department', department);
      
      if (error) throw error;
      
      // Transform the February data to match our expected DepartmentData structure
      const transformedData: DepartmentData[] = data?.map(item => ({
        id: item.id,
        rep_type: item.Department,
        rep_name: item.Rep,
        sub_rep: item["Sub-Rep"],
        account_ref: item["Account Ref"],
        account_name: item["Account Name"],
        spend: item.Spend,
        profit: item.Profit,
        packs: item.Packs,
        cost: item.Cost,
        credit: item.Credit,
        margin: item.Margin
      })) || [];
      
      return { 
        data: transformedData, 
        error: null 
      };
    }
  } catch (error) {
    console.error(`Error fetching ${department} data:`, error);
    return { data: null, error: error as Error };
  }
};
