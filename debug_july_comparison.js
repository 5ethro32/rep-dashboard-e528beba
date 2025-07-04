import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = 'https://umcysfheyhqzlxdvfhcv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtY3lzZmhleWhxemx4ZHZmaGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MDk3ODAsImV4cCI6MjA0NjQ4NTc4MH0.KYJwZfKP2EEhWEzg2QcHoMUXfgzrEz4OvPfUyJ_bCXY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugJulyComparisonData() {
  console.log('🔍 Checking July_Data_Comparison table...');
  
  try {
    // Get total count first
    const { count, error: countError } = await supabase
      .from('July_Data_Comparison')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting count:', countError);
      return;
    }
    
    console.log(`📊 Total records in July_Data_Comparison: ${count}`);
    
    // Get first 10 records to see structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('July_Data_Comparison')
      .select('*')
      .limit(10);
    
    if (sampleError) {
      console.error('Error getting sample data:', sampleError);
      return;
    }
    
    console.log('📋 Sample records:');
    console.table(sampleData);
    
    // Check retail department totals
    const { data: retailData, error: retailError } = await supabase
      .from('July_Data_Comparison')
      .select('Rep, Profit, Spend, Packs, Department')
      .eq('Department', 'RETAIL');
    
    if (retailError) {
      console.error('Error getting retail data:', retailError);
      return;
    }
    
    console.log('🏪 Retail department records:');
    console.table(retailData);
    
    // Calculate retail totals manually
    const retailTotalProfit = retailData.reduce((sum, item) => {
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      return sum + profit;
    }, 0);
    
    const retailTotalSpend = retailData.reduce((sum, item) => {
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      return sum + spend;
    }, 0);
    
    console.log('🧮 Manual retail totals:');
    console.log(`Total Profit: £${retailTotalProfit.toLocaleString()}`);
    console.log(`Total Spend: £${retailTotalSpend.toLocaleString()}`);
    
    // Check specific reps
    const problemReps = ['Michael McKay', 'Pete Dhillon', 'Stuart Geddes'];
    
    for (const repName of problemReps) {
      const { data: repData, error: repError } = await supabase
        .from('July_Data_Comparison')
        .select('Rep, Profit, Spend, Packs, Department')
        .eq('Rep', repName);
      
      if (repError) {
        console.error(`Error getting ${repName} data:`, repError);
        continue;
      }
      
      console.log(`👤 ${repName} records in July_Data_Comparison:`);
      console.table(repData);
      
      // Calculate totals for this rep
      const repTotalProfit = repData.reduce((sum, item) => {
        const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
        return sum + profit;
      }, 0);
      
      const repTotalSpend = repData.reduce((sum, item) => {
        const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
        return sum + spend;
      }, 0);
      
      console.log(`${repName} totals - Profit: £${repTotalProfit.toLocaleString()}, Spend: £${repTotalSpend.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('🔴 Error in debug script:', error);
  }
}

// Run the debug
debugJulyComparisonData(); 