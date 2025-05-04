// Database connection check script
const { createClient } = require('@supabase/supabase-js');

// Supabase connection details from client.ts
const SUPABASE_URL = "https://ukshnjjmsrhgvkwrzoah.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Function to check database connection and get sample data
async function checkDatabase() {
  console.log('Checking database connection...');
  
  try {
    // 1. Test connection with a simple ping
    const { data: pingData, error: pingError } = await supabase.from('unified_sales_data').select('count(*)');
    
    if (pingError) {
      console.error('Connection error:', pingError);
      return;
    }
    
    console.log('Connection successful!');
    
    // 2. Check each month for data
    const months = ['February', 'March', 'April', 'May'];
    
    for (const month of months) {
      console.log(`\nChecking data for ${month}:`);
      
      // Get record count
      const { data: countData, error: countError } = await supabase
        .from('unified_sales_data')
        .select('count(*)')
        .eq('reporting_month', month);
      
      if (countError) {
        console.error(`Error counting ${month} records:`, countError);
        continue;
      }
      
      console.log(`- Total records: ${countData[0].count}`);
      
      // Get sum of spend and profit
      const { data: sumData, error: sumError } = await supabase
        .rpc('select', { 
          query: `
            SELECT 
              SUM(spend) as total_spend, 
              SUM(profit) as total_profit,
              COUNT(*) FILTER (WHERE spend > 0) as non_zero_spend_count,
              COUNT(*) FILTER (WHERE profit > 0) as non_zero_profit_count
            FROM unified_sales_data 
            WHERE reporting_month = '${month}'
          `
        });
      
      if (sumError) {
        console.error(`Error summing ${month} data:`, sumError);
        continue;
      }
      
      const financialData = sumData[0];
      console.log(`- Total spend: ${financialData.total_spend || 0}`);
      console.log(`- Total profit: ${financialData.total_profit || 0}`);
      console.log(`- Records with non-zero spend: ${financialData.non_zero_spend_count || 0}`);
      console.log(`- Records with non-zero profit: ${financialData.non_zero_profit_count || 0}`);
      
      // Get sample records with non-zero values
      const { data: sampleData, error: sampleError } = await supabase
        .from('unified_sales_data')
        .select('*')
        .eq('reporting_month', month)
        .or('spend.gt.0,profit.gt.0')
        .limit(3);
      
      if (sampleError) {
        console.error(`Error getting ${month} sample:`, sampleError);
        continue;
      }
      
      console.log(`- Sample records with non-zero values: ${sampleData.length}`);
      if (sampleData.length > 0) {
        sampleData.forEach((record, i) => {
          console.log(`  Record #${i+1}:`);
          console.log(`    ID: ${record.id}`);
          console.log(`    Rep: ${record.rep_name}`);
          console.log(`    Department: ${record.department}`);
          console.log(`    Spend: ${record.spend}`);
          console.log(`    Profit: ${record.profit}`);
        });
      } else {
        console.log('  No records with non-zero values found!');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkDatabase().catch(console.error); 