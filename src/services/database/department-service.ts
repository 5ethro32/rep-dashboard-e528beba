
import { supabase } from '@/integrations/supabase/client';
import { QueryData, DepartmentData } from './types';

export const fetchDepartmentData = async (
  department: string, 
  isMarch: boolean
): Promise<QueryData<DepartmentData>> => {
  const table = isMarch ? 'sales_data' : 'sales_data_februrary';
  const aprilTable = 'mtd_daily';
  const lastAprilTable = 'last_mtd_daily';
  
  try {
    if (isMarch) {
      const { data, error } = await supabase
        .from(table)
        .select()
        .limit(2500); // Increased limit to handle more records
      
      if (data && department) {
        const filteredData = data.filter(item => 
          'rep_type' in item && item.rep_type === department
        );
        
        // Transform data to match DepartmentData interface
        const transformedData = filteredData.map(item => {
          if ('rep_type' in item) {
            return {
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
            } as DepartmentData;
          } else {
            return {
              Department: item.Department,
              Rep: item.Rep,
              'Sub-Rep': item["Sub-Rep"],
              'Account Ref': item["Account Ref"],
              'Account Name': item["Account Name"],
              Spend: item.Spend,
              Profit: item.Profit,
              Packs: item.Packs,
              Cost: item.Cost,
              Credit: item.Credit,
              Margin: item.Margin
            } as DepartmentData;
          }
        });

        return { data: transformedData, error };
      } 
      
      return { data: null, error };
    } else {
      // If we're dealing with April data
      if (table === 'sales_data_februrary') {
        const { data, error } = await supabase
          .from(lastAprilTable)  // Use last_mtd_daily for April comparisons
          .select()
          .limit(2500); // Increased limit for April comparison data
        
        if (data && department) {
          const filteredData = data.filter(item => 
            'Department' in item && item.Department === department
          );
          
          return { data: filteredData as DepartmentData[], error };
        }
        
        return { data: null, error };
      } else {
        const { data, error } = await supabase
          .from(table)
          .select()
          .limit(2500); // Increased limit
        
        if (data && department) {
          const filteredData = data.filter(item => 
            'Department' in item && item.Department === department
          );
          
          return { data: filteredData as DepartmentData[], error };
        }
        
        return { data: null, error };
      }
    }
  } catch (error) {
    console.error(`Error fetching ${department} data:`, error);
    return { data: null, error: error as Error };
  }
};
