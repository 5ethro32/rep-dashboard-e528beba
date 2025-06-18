import { supabase } from '@/integrations/supabase/client';

export const debugMayData = async () => {
  console.log('🔍 Debugging May_Data table contents...');
  
  try {
    // Get a sample of records from May_Data
    const { data: mayData, error: mayError } = await supabase
      .from('May_Data')
      .select('*')
      .limit(5);
    
    if (mayError) {
      console.error('Error fetching May_Data:', mayError);
      return;
    }
    
    console.log('Sample May_Data records:', mayData);
    
    // Get total profit from May_Data
    const { data: mayTotals, error: mayTotalsError } = await supabase
      .from('May_Data')
      .select('Profit');
    
    if (mayTotalsError) {
      console.error('Error fetching May_Data totals:', mayTotalsError);
      return;
    }
    
    const totalMayProfit = mayTotals?.reduce((sum, record) => {
      const profit = typeof record.Profit === 'string' ? parseFloat(record.Profit) : Number(record.Profit || 0);
      return sum + profit;
    }, 0) || 0;
    
    console.log('Total profit in May_Data table:', totalMayProfit);
    
    // Compare with June_Data_Comparison
    const { data: juneCompData, error: juneCompError } = await supabase
      .from('June_Data_Comparison')
      .select('Profit')
      .limit(5);
    
    if (juneCompError) {
      console.error('Error fetching June_Data_Comparison:', juneCompError);
      return;
    }
    
    console.log('Sample June_Data_Comparison records:', juneCompData);
    
    // Get total profit from June_Data_Comparison
    const { data: juneCompTotals, error: juneCompTotalsError } = await supabase
      .from('June_Data_Comparison')
      .select('Profit');
    
    if (juneCompTotalsError) {
      console.error('Error fetching June_Data_Comparison totals:', juneCompTotalsError);
      return;
    }
    
    const totalJuneCompProfit = juneCompTotals?.reduce((sum, record) => {
      const profit = typeof record.Profit === 'string' ? parseFloat(record.Profit) : Number(record.Profit || 0);
      return sum + profit;
    }, 0) || 0;
    
    console.log('Total profit in June_Data_Comparison table:', totalJuneCompProfit);
    
    // Check if they match (indicating May_Data contains June comparison data)
    if (Math.abs(totalMayProfit - totalJuneCompProfit) < 1) {
      console.log('🚨 ISSUE FOUND: May_Data table contains the same data as June_Data_Comparison!');
      console.log('This explains why May shows £182,130 profit - it\'s actually June comparison data.');
    } else {
      console.log('May_Data and June_Data_Comparison contain different data as expected.');
    }
    
  } catch (error) {
    console.error('Error in debugMayData:', error);
  }
}; 