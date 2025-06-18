/**
 * Debug utility to check June_Data_Comparison table
 */

import { supabase } from '@/integrations/supabase/client';

export const debugJuneComparisonData = async () => {
  console.log('🔍 DEBUGGING JUNE COMPARISON DATA');
  console.log('=' .repeat(50));
  
  try {
    // Check if June_Data_Comparison table exists and has data
    console.log('1. Checking June_Data_Comparison table...');
    const { count: comparisonCount, error: comparisonCountError } = await supabase
      .from('June_Data_Comparison')
      .select('*', { count: 'exact', head: true });

    if (comparisonCountError) {
      console.error('❌ Error accessing June_Data_Comparison:', comparisonCountError);
      return;
    }

    console.log(`✅ June_Data_Comparison table found with ${comparisonCount || 0} records`);

    // Also check June_Data for comparison
    console.log('\n2. Checking June_Data table for comparison...');
    const { count: juneCount, error: juneCountError } = await supabase
      .from('June_Data')
      .select('*', { count: 'exact', head: true });

    if (juneCountError) {
      console.error('❌ Error accessing June_Data:', juneCountError);
    } else {
      console.log(`✅ June_Data table found with ${juneCount || 0} records`);
    }

    // Compare the counts
    console.log('\n3. Table size comparison:');
    console.log(`   June_Data: ${juneCount || 0} records`);
    console.log(`   June_Data_Comparison: ${comparisonCount || 0} records`);
    console.log(`   Difference: ${(juneCount || 0) - (comparisonCount || 0)} records`);

    if (!comparisonCount || comparisonCount === 0) {
      console.log('⚠️ June_Data_Comparison table is EMPTY - this is why comparison shows £0');
      
      // Check if May_Data exists as alternative
      console.log('\n4. Checking May_Data as potential alternative...');
      const { count: mayCount, error: mayError } = await supabase
        .from('May_Data')
        .select('*', { count: 'exact', head: true });
        
      if (mayError) {
        console.error('❌ Error accessing May_Data:', mayError);
      } else {
        console.log(`✅ May_Data table found with ${mayCount || 0} records`);
      }
      
      return;
    }

    // Test pagination - fetch data in chunks like the app does
    console.log('\n4. Testing pagination (like the app does)...');
    const pageSize = 1000;
    const comparisonPages = Math.ceil(comparisonCount / pageSize);
    console.log(`   Total pages needed: ${comparisonPages}`);
    
    let totalFetched = 0;
    for (let page = 0; page < comparisonPages; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data: pageData, error: pageError } = await supabase
        .from('June_Data_Comparison')
        .select('*')
        .range(from, to);
      
      if (pageError) {
        console.error(`❌ Error fetching page ${page}:`, pageError);
        break;
      }
      
      const pageCount = pageData?.length || 0;
      totalFetched += pageCount;
      console.log(`   Page ${page + 1}/${comparisonPages}: ${pageCount} records (range ${from}-${to})`);
    }
    
    console.log(`   Total fetched: ${totalFetched} records`);
    console.log(`   Expected: ${comparisonCount} records`);
    console.log(`   Match: ${totalFetched === comparisonCount ? '✅' : '❌'}`);

    // Get sample data from June_Data_Comparison
    console.log('\n5. Getting sample data from June_Data_Comparison...');
    const { data: sampleComparison, error: sampleError } = await supabase
      .from('June_Data_Comparison')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError);
      return;
    }

    console.log('Sample June_Data_Comparison records:');
    sampleComparison?.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        Rep: record.Rep,
        Department: record.Department,
        Profit: record.Profit,
        Spend: record.Spend,
        Packs: record.Packs
      });
    });

    // Calculate total profit from June_Data_Comparison using the same logic as the app
    console.log('\n6. Calculating totals from June_Data_Comparison (using app logic)...');
    
    // Fetch all data using pagination (same as app)
    let allComparisonData = [];
    for (let page = 0; page < comparisonPages; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data: pageData, error: pageError } = await supabase
        .from('June_Data_Comparison')
        .select('*')
        .range(from, to);
      
      if (!pageError && pageData) {
        allComparisonData = [...allComparisonData, ...pageData];
      }
    }

    const totals = allComparisonData.reduce((acc, record) => {
      const profit = typeof record.Profit === 'string' ? parseFloat(record.Profit) : Number(record.Profit || 0);
      const spend = typeof record.Spend === 'string' ? parseFloat(record.Spend) : Number(record.Spend || 0);
      const packs = typeof record.Packs === 'string' ? parseInt(record.Packs as string) : Number(record.Packs || 0);
      
      return {
        totalProfit: acc.totalProfit + profit,
        totalSpend: acc.totalSpend + spend,
        totalPacks: acc.totalPacks + packs
      };
    }, { totalProfit: 0, totalSpend: 0, totalPacks: 0 });

    console.log('June_Data_Comparison totals:', totals);
    console.log(`Records processed: ${allComparisonData.length}`);

    // Also get June_Data totals for comparison
    if (juneCount && juneCount > 0) {
      console.log('\n7. Getting June_Data totals for comparison...');
      
      // Fetch sample of June_Data
      const junePages = Math.ceil(juneCount / pageSize);
      let allJuneData = [];
      
      // Only fetch first few pages to avoid overwhelming
      const maxPages = Math.min(junePages, 3);
      for (let page = 0; page < maxPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('June_Data')
          .select('Profit, Spend, Packs')
          .range(from, to);
        
        if (!pageError && pageData) {
          allJuneData = [...allJuneData, ...pageData];
        }
      }

      const juneTotals = allJuneData.reduce((acc, record) => {
        const profit = typeof record.Profit === 'string' ? parseFloat(record.Profit) : Number(record.Profit || 0);
        const spend = typeof record.Spend === 'string' ? parseFloat(record.Spend) : Number(record.Spend || 0);
        const packs = typeof record.Packs === 'string' ? parseInt(record.Packs as string) : Number(record.Packs || 0);
        
        return {
          totalProfit: acc.totalProfit + profit,
          totalSpend: acc.totalSpend + spend,
          totalPacks: acc.totalPacks + packs
        };
      }, { totalProfit: 0, totalSpend: 0, totalPacks: 0 });

      console.log(`June_Data totals (first ${maxPages} pages):`, juneTotals);
      console.log(`Records processed: ${allJuneData.length} of ${juneCount}`);
    }

  } catch (error) {
    console.error('❌ Exception during debug:', error);
  }
  
  console.log('\n' + '='.repeat(50));
}; 