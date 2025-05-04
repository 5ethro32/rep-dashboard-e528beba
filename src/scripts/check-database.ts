// Database connection check script
import { createClient } from '@supabase/supabase-js';

// Supabase connection details from client.ts
const SUPABASE_URL = "https://ukshnjjmsrhgvkwrzoah.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huamptc3JoZ3Zrd3J6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUxNjUsImV4cCI6MjA1OTYxMTE2NX0.5X8Zb5gAGW3DsyTyBoR8bl4_TXpZWtqz0OaMyM5dUlI";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Interface for sample data records
interface DbRecord {
  id: string;
  rep_name: string;
  department: string;
  spend: number;
  profit: number;
  [key: string]: any;
}

// Function to check database connection and get sample data
async function checkDatabase() {
  console.log('Checking database connection...');
  
  try {
    // 1. Test connection with a simple query
    const { data: tableData, error: tableError } = await supabase
      .from('unified_sales_data')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Connection error:', tableError);
      return;
    }
    
    console.log('Connection successful!');
    
    // 2. Check each month for data
    const months = ['February', 'March', 'April', 'May'];
    
    for (const month of months) {
      console.log(`\nChecking data for ${month}:`);
      
      // Get all records for the month
      const { data: monthData, error: monthError } = await supabase
        .from('unified_sales_data')
        .select('*')
        .eq('reporting_month', month);
      
      if (monthError) {
        console.error(`Error fetching ${month} data:`, monthError);
        continue;
      }
      
      console.log(`- Total records: ${monthData?.length || 0}`);
      
      // Calculate sums directly from the data
      if (monthData && monthData.length > 0) {
        // Calculate totals
        let totalSpend = 0;
        let totalProfit = 0;
        let totalPacks = 0;
        let nonZeroSpendCount = 0;
        let nonZeroProfitCount = 0;
        
        monthData.forEach(record => {
          const spend = Number(record.spend || 0);
          const profit = Number(record.profit || 0);
          const packs = Number(record.packs || 0);
          
          totalSpend += spend;
          totalProfit += profit;
          totalPacks += packs;
          
          if (spend > 0) nonZeroSpendCount++;
          if (profit > 0) nonZeroProfitCount++;
        });
        
        console.log(`- Total spend: ${totalSpend}`);
        console.log(`- Total profit: ${totalProfit}`);
        console.log(`- Total packs: ${totalPacks}`);
        console.log(`- Records with non-zero spend: ${nonZeroSpendCount}`);
        console.log(`- Records with non-zero profit: ${nonZeroProfitCount}`);
        
        // Check data types of a sample record
        if (monthData.length > 0) {
          const sample = monthData[0];
          console.log(`- Sample record data types:`);
          console.log(`  spend: type=${typeof sample.spend}, value=${sample.spend}`);
          console.log(`  profit: type=${typeof sample.profit}, value=${sample.profit}`);
          console.log(`  rep_name: ${sample.rep_name}`);
          console.log(`  department: ${sample.department}`);
        }
        
        // Find records with non-zero values
        const nonZeroRecords = monthData.filter(record => 
          Number(record.spend) > 0 || Number(record.profit) > 0
        );
        
        console.log(`- Records with non-zero values: ${nonZeroRecords.length}`);
        
        if (nonZeroRecords.length > 0) {
          // Show first 3 non-zero records
          nonZeroRecords.slice(0, 3).forEach((record, i) => {
            console.log(`  Record #${i+1}:`);
            console.log(`    Rep: ${record.rep_name}`);
            console.log(`    Department: ${record.department}`);
            console.log(`    Spend: ${record.spend}`);
            console.log(`    Profit: ${record.profit}`);
          });
        } else {
          console.log('  No records with non-zero values found!');
          
          // Show first 3 regular records if no non-zero records
          monthData.slice(0, 3).forEach((record, i) => {
            console.log(`  Record #${i+1} (all zeros):`);
            console.log(`    Rep: ${record.rep_name}`);
            console.log(`    Department: ${record.department}`);
            console.log(`    Spend: ${record.spend}`);
            console.log(`    Profit: ${record.profit}`);
          });
          
          // Analyze sample record in more detail
          if (monthData.length > 0) {
            const detailedSample = monthData[0];
            console.log('\n  Detailed analysis of first record:');
            console.log('  Raw record data:');
            for (const [key, value] of Object.entries(detailedSample)) {
              console.log(`    ${key}: ${value} (${typeof value})`);
            }
          }
        }
        
        // Calculate department totals
        console.log('\n  Department breakdown:');
        const departments = Array.from(new Set(monthData.map(r => (r.department || '').toLowerCase())));
        
        departments.forEach(dept => {
          if (!dept) return; // Skip empty departments
          
          const deptRecords = monthData.filter(r => 
            (r.department || '').toLowerCase() === dept.toLowerCase()
          );
          
          const deptSpend = deptRecords.reduce((sum, r) => sum + Number(r.spend || 0), 0);
          const deptProfit = deptRecords.reduce((sum, r) => sum + Number(r.profit || 0), 0);
          
          console.log(`  ${dept}: ${deptRecords.length} records, spend=${deptSpend}, profit=${deptProfit}`);
        });
      } else {
        console.log('  No data found for this month');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkDatabase().catch(console.error); 