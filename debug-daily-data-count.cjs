// Debug script to check record counts in all tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ewlmtxoqrdxvvomrjbhy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bG10eG9xcmR4dnZvbXJqYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MDI3NDQsImV4cCI6MjA0MTQ3ODc0NH0.SvaGkL0bAihANZEPPXRQWQjjJ2NJfILCw8KX3dOJjAY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableCounts() {
  console.log('🔍 Checking record counts in all tables...\n');
  
  const tables = [
    'Daily_Data',
    'July_Data', 
    'June_Data',
    'May_Data',
    'mtd_daily',
    'sales_data',
    'sales_data_februrary'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count?.toLocaleString() || 0} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

checkTableCounts(); 