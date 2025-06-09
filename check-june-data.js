const { createClient } = require('@supabase/supabase-js');

// Read environment variables or use defaults
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ygxddlvpqnhxfaizlrwl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneGRkbHZwcW5oeGZhaXpscndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3ODkzNzYsImV4cCI6MjA0ODM2NTM3Nn0.n0Kxvkqt3cKTIvuAQpBLSqHZRhGhH2YQKyJH_p9nQ_Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJuneData() {
  console.log('Checking June_Data table...');
  
  // First check if table exists and has any data
  const { count, error: countError } = await supabase
    .from('June_Data')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Error getting count:', countError);
    return;
  }
  
  console.log('Total records in June_Data:', count);
  
  if (count > 0) {
    // Get sample records
    const { data: sampleData, error: sampleError } = await supabase
      .from('June_Data')
      .select('*')
      .limit(5);
      
    if (sampleError) {
      console.error('Error getting sample data:', sampleError);
      return;
    }
    
    console.log('\nSample June_Data records:');
    sampleData.forEach((record, i) => {
      console.log(`Record ${i+1}:`, {
        Rep: record.Rep,
        'Sub-Rep': record['Sub-Rep'],
        'Account Name': record['Account Name'],
        'Account Ref': record['Account Ref'],
        Department: record.Department,
        Profit: record.Profit,
        Spend: record.Spend
      });
    });
    
    // Check for Craig specifically (exact match first)
    const { data: craigExactData, error: craigExactError } = await supabase
      .from('June_Data')
      .select('*')
      .or(`Rep.eq.Craig,Sub-Rep.eq.Craig`)
      .limit(10);
      
    console.log('\nRecords for exactly "Craig" in June_Data:', craigExactData?.length || 0);
    
    // Check for Craig with ilike
    const { data: craigData, error: craigError } = await supabase
      .from('June_Data')
      .select('*')
      .or(`Rep.ilike.%Craig%,Sub-Rep.ilike.%Craig%`)
      .limit(10);
      
    console.log('Records containing "Craig" in June_Data:', craigData?.length || 0);
    
    // Check for Craig McDowall specifically
    const { data: craigMcData, error: craigMcError } = await supabase
      .from('June_Data')
      .select('*')
      .or(`Rep.ilike.%Craig McDowall%,Sub-Rep.ilike.%Craig McDowall%`)
      .limit(10);
      
    console.log('Records for "Craig McDowall" in June_Data:', craigMcData?.length || 0);
    
    if (craigData && craigData.length > 0) {
      console.log('\nCraig records found:');
      craigData.forEach((record, i) => {
        console.log(`Craig Record ${i+1}:`, {
          Rep: record.Rep,
          'Sub-Rep': record['Sub-Rep'],
          'Account Name': record['Account Name'],
          'Account Ref': record['Account Ref'],
          Department: record.Department,
          Profit: record.Profit,
          Spend: record.Spend
        });
      });
    }
    
    // Get unique rep names to see what's in the data
    const { data: uniqueReps, error: uniqueError } = await supabase
      .from('June_Data')
      .select('Rep')
      .not('Rep', 'is', null);
      
    if (uniqueReps) {
      const repNames = [...new Set(uniqueReps.map(r => r.Rep))].slice(0, 10);
      console.log('\nFirst 10 unique Rep names in June_Data:');
      repNames.forEach(name => console.log(`- "${name}"`));
    }
  } else {
    console.log('No data found in June_Data table');
  }
}

checkJuneData().catch(console.error); 