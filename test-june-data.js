// Test script to check June 2025 data
// Run this with: node test-june-data.js

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client (using the same config as the app)
const supabaseUrl = 'https://ukshnjjmsrhgvkwrzoah.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrc2huampnvcGht3ZrdxpvYWgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNzQ5MTM0NCwiZXhwIjoyMDMzMDY3MzQ0fQ.rjEULmcU4-vb2CscdA8cfG-NPY2uxaJCFzWJFG4Q6ag';

const supabase = createClient(supabaseUrl, supabaseKey);

const testJuneData = async () => {
  try {
    console.log('🔍 Testing June 2025 Data...\n');

    // Test 1: Check raw data count for June
    console.log('📊 1. Raw data check for June 2025:');
    const { data: rawData, error: rawError } = await supabase
      .from('Daily_Data')
      .select('*')
      .gte('Date_Time', '2025-06-01')
      .lte('Date_Time', '2025-06-30')
      .limit(5);

    if (rawError) {
      console.error('❌ Error fetching raw data:', rawError);
      return;
    }

    console.log(`   Found ${rawData?.length || 0} records (showing first 5)`);
    if (rawData && rawData.length > 0) {
      console.log('   Sample record:', {
        date: rawData[0].Date_Time,
        spend: rawData[0].Spend,
        profit: rawData[0].Profit,
        account: rawData[0]['Account Name']
      });
    }

    // Test 2: Use our aggregation function
    console.log('\n📈 2. Using our SQL aggregation function:');
    const { data: funcData, error: funcError } = await supabase.rpc('get_daily_summary_metrics', {
      start_date: '2025-06-01',
      end_date: '2025-06-30',
      department_filter: null,
      method_filter: null
    });

    if (funcError) {
      console.error('❌ Error with function:', funcError);
    } else {
      console.log('   Function result:', funcData?.[0]);
    }

    // Test 3: Manual aggregation
    console.log('\n🔢 3. Manual aggregation:');
    const { data: manualData, error: manualError } = await supabase
      .from('Daily_Data')
      .select('Spend, Profit, "Account Ref"')
      .gte('Date_Time', '2025-06-01')
      .lte('Date_Time', '2025-06-30')
      .range(0, 9999);

    if (manualError) {
      console.error('❌ Error with manual query:', manualError);
    } else {
      const totalSpend = manualData?.reduce((sum, item) => sum + (item.Spend || 0), 0) || 0;
      const totalProfit = manualData?.reduce((sum, item) => sum + (item.Profit || 0), 0) || 0;
      const margin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
      const uniqueAccounts = new Set(manualData?.map(item => item['Account Ref']).filter(Boolean)).size;

      console.log('   Manual calculation:');
      console.log(`   Revenue: £${totalSpend.toLocaleString()}`);
      console.log(`   Profit: £${totalProfit.toLocaleString()}`);
      console.log(`   Margin: ${margin.toFixed(1)}%`);
      console.log(`   Active Accounts: ${uniqueAccounts}`);
      console.log(`   Records processed: ${manualData?.length || 0}`);
    }

    // Test 4: Check comparison period data (May 2025)
    console.log('\n🔄 4. Comparison period (May 2025):');
    const { data: mayData, error: mayError } = await supabase.rpc('get_daily_summary_metrics', {
      start_date: '2025-05-01',
      end_date: '2025-05-31',
      department_filter: null,
      method_filter: null
    });

    if (mayError) {
      console.error('❌ Error with May data:', mayError);
    } else {
      console.log('   May result:', mayData?.[0]);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
};

testJuneData(); 