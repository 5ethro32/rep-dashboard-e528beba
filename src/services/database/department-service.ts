
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
        .select('*')
        .eq('rep_type', department);
      return { data, error };
    } else {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('Department', department);
      return { data, error };
    }
  } catch (error) {
    console.error(`Error fetching ${department} data:`, error);
    return { data: null, error: error as Error };
  }
};
