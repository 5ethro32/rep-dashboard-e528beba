// Debug utility for July comparison data issues
// This helps identify why specific reps have inflated comparison values

import { supabase } from '@/integrations/supabase/client';

export const debugJulyComparisonData = () => {
  console.log('🔧 JULY DEBUG UTILITY: Starting July comparison data analysis...');
  
  // Get stored data from localStorage
  const storedData = localStorage.getItem('repPerformanceData');
  if (!storedData) {
    console.log('❌ No stored rep performance data found');
    return;
  }
  
  const parsedData = JSON.parse(storedData);
  
  // Check if July data exists
  if (!parsedData.julRepData || !parsedData.julyComparisonSummary) {
    console.log('❌ No July data found in localStorage');
    return;
  }
  
  console.log('✅ July data found in localStorage');
  
  // Problematic reps
  const problematicReps = ['Michael McKay', 'Pete Dhillon', 'Stuart Geddes'];
  
  // Check current July data
  console.log('📊 CURRENT JULY DATA:');
  problematicReps.forEach(repName => {
    const retailRep = parsedData.julRepData?.find((r: any) => r.rep === repName);
    const revaRep = parsedData.julRevaData?.find((r: any) => r.rep === repName);
    const wholesaleRep = parsedData.julWholesaleData?.find((r: any) => r.rep === repName);
    
    console.log(`🔍 ${repName}:`);
    if (retailRep) {
      console.log(`  RETAIL: £${retailRep.spend.toFixed(2)} spend, £${retailRep.profit.toFixed(2)} profit`);
    }
    if (revaRep) {
      console.log(`  REVA: £${revaRep.spend.toFixed(2)} spend, £${revaRep.profit.toFixed(2)} profit`);
    }
    if (wholesaleRep) {
      console.log(`  WHOLESALE: £${wholesaleRep.spend.toFixed(2)} spend, £${wholesaleRep.profit.toFixed(2)} profit`);
    }
  });
  
  // Check comparison summary
  console.log('📊 COMPARISON SUMMARY:');
  console.log('Total comparison spend:', parsedData.julyComparisonSummary?.totalSpend);
  console.log('Total comparison profit:', parsedData.julyComparisonSummary?.totalProfit);
  
  // Check individual department comparison summaries
  console.log('📊 DEPARTMENT COMPARISON SUMMARIES:');
  console.log('Retail comparison:', parsedData.julyComparisonRetailSummary);
  console.log('REVA comparison:', parsedData.julyComparisonRevaSummary);
  console.log('Wholesale comparison:', parsedData.julyComparisonWholesaleSummary);
  
  // Check rep changes
  console.log('📊 REP CHANGES:');
  problematicReps.forEach(repName => {
    const repChanges = parsedData.julyRepChanges?.[repName];
    if (repChanges) {
      console.log(`🔍 ${repName} changes:`, repChanges);
    } else {
      console.log(`❌ No changes found for ${repName}`);
    }
  });
  
  return {
    julRepData: parsedData.julRepData,
    julRevaData: parsedData.julRevaData,
    julWholesaleData: parsedData.julWholesaleData,
    julyComparisonSummary: parsedData.julyComparisonSummary,
    julyRepChanges: parsedData.julyRepChanges,
    problematicReps: problematicReps.map(repName => ({
      name: repName,
      retailData: parsedData.julRepData?.find((r: any) => r.rep === repName),
      revaData: parsedData.julRevaData?.find((r: any) => r.rep === repName),
      wholesaleData: parsedData.julWholesaleData?.find((r: any) => r.rep === repName),
      changes: parsedData.julyRepChanges?.[repName]
    }))
  };
};

// New function to query July_Data_Comparison table directly
export const queryJulyComparisonTable = async () => {
  console.log('🔍 QUERYING JULY_DATA_COMPARISON TABLE DIRECTLY...');
  console.log('=' .repeat(50));
  
  try {
    // Check if July_Data_Comparison table exists and has data
    console.log('1. Checking July_Data_Comparison table...');
    const { count: comparisonCount, error: comparisonCountError } = await supabase
      .from('July_Data_Comparison' as any)
      .select('*', { count: 'exact', head: true });

    if (comparisonCountError) {
      console.error('❌ Error accessing July_Data_Comparison:', comparisonCountError);
      return;
    }

    console.log(`✅ July_Data_Comparison table found with ${comparisonCount || 0} records`);

    // Get sample records to understand the data structure
    console.log('\n2. Fetching sample records...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('July_Data_Comparison' as any)
      .select('*')
      .limit(10);

    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
      return;
    }

    console.log('✅ Sample records from July_Data_Comparison:');
    sampleData?.forEach((record: any, index) => {
      console.log(`Record ${index + 1}:`, {
        Rep: record.Rep,
        Department: record.Department,
        Spend: record.Spend,
        Profit: record.Profit,
        Packs: record.Packs,
        'Account Ref': record['Account Ref']
      });
    });

    // Check for our problematic reps specifically
    console.log('\n3. Checking problematic reps in July_Data_Comparison...');
    const problematicReps = ['Michael McKay', 'Pete Dhillon', 'Stuart Geddes'];
    
    for (const repName of problematicReps) {
      const { data: repData, error: repError } = await supabase
        .from('July_Data_Comparison' as any)
        .select('*')
        .ilike('Rep', `%${repName}%`);

      if (repError) {
        console.error(`❌ Error fetching data for ${repName}:`, repError);
        continue;
      }

      console.log(`\n📊 ${repName} in July_Data_Comparison:`);
      console.log(`   Total records: ${repData?.length || 0}`);
      
      if (repData && repData.length > 0) {
        const totalSpend = repData.reduce((sum, record: any) => {
          const spend = typeof record.Spend === 'string' ? parseFloat(record.Spend) : Number(record.Spend || 0);
          return sum + spend;
        }, 0);
        
        const totalProfit = repData.reduce((sum, record: any) => {
          const profit = typeof record.Profit === 'string' ? parseFloat(record.Profit) : Number(record.Profit || 0);
          return sum + profit;
        }, 0);
        
        console.log(`   Total spend: £${totalSpend.toFixed(2)}`);
        console.log(`   Total profit: £${totalProfit.toFixed(2)}`);
        console.log(`   Sample record:`, repData[0]);
      }
    }

    // Compare with June_Data to see if July_Data_Comparison contains June data
    console.log('\n4. Comparing with June_Data to verify July_Data_Comparison contains June data...');
    const { count: juneCount, error: juneCountError } = await supabase
      .from('June_Data')
      .select('*', { count: 'exact', head: true });

    if (juneCountError) {
      console.error('❌ Error accessing June_Data:', juneCountError);
    } else {
      console.log(`✅ June_Data table found with ${juneCount || 0} records`);
      console.log('\n📊 Table size comparison:');
      console.log(`   June_Data: ${juneCount || 0} records`);
      console.log(`   July_Data_Comparison: ${comparisonCount || 0} records`);
      console.log(`   Difference: ${(juneCount || 0) - (comparisonCount || 0)} records`);
      
      // If they're the same size, July_Data_Comparison likely contains June data
      if (juneCount === comparisonCount) {
        console.log('✅ July_Data_Comparison likely contains June data (same record count)');
      } else {
        console.log('⚠️  July_Data_Comparison has different record count than June_Data');
      }
    }

    return {
      comparisonCount,
      sampleData,
      juneCount
    };

  } catch (error) {
    console.error('❌ Error in queryJulyComparisonTable:', error);
  }
};

// Add this to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).debugJulyComparisonData = debugJulyComparisonData;
} 