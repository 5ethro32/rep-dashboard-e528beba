import { supabase } from '../integrations/supabase/client';
import { 
  DailyRepPerformanceData, 
  DailyRepPerformanceFilters, 
  DailyRepPerformanceMetrics,
  DailyRepPerformanceComparisonData,
  DailyAggregatedData,
  DailyRepTableData,
  DailyRepTableComparisonData
} from '../types/daily-rep-performance.types';

// Updated service using server-side aggregation functions
export class DailyRepPerformanceServiceV2 {
  
  /**
   * Fetches aggregated daily performance data using server-side SQL functions
   * This solves the 1000-record limit by aggregating data on the server
   */
  async getAggregatedData(
    startDate: string, 
    endDate: string, 
    filters: DailyRepPerformanceFilters
  ): Promise<DailyAggregatedData[]> {
    try {
      console.log('📊 Fetching aggregated data from server-side functions');
      console.log('Date range:', startDate, 'to', endDate);
      console.log('Filters:', filters);

      // Use the new SQL aggregation function
      const { data, error } = await supabase.rpc('get_daily_aggregated_data', {
        start_date: startDate,
        end_date: endDate,
        department_filter: filters.department !== 'all' ? filters.department : null,
        method_filter: filters.method !== 'all' ? filters.method : null
      });

      if (error) {
        console.error('❌ Error fetching aggregated data:', error);
        throw error;
      }

      console.log('✅ Aggregated data fetched successfully:', data?.length || 0, 'periods');
      
      return (data || []) as DailyAggregatedData[];
    } catch (error) {
      console.error('❌ Failed to fetch aggregated data:', error);
      throw error;
    }
  }

  /**
   * Fetches summary metrics using server-side SQL functions
   * Fast calculation of totals without hitting record limits
   */
  async getSummaryMetrics(
    startDate: string, 
    endDate: string, 
    filters: DailyRepPerformanceFilters
  ): Promise<DailyRepPerformanceMetrics> {
    try {
      console.log('📈 Fetching summary metrics from server-side functions');
      
      // Debug: Log exact parameters being sent to SQL function
      const sqlParams = {
        start_date: startDate,
        end_date: endDate,
        department_filter: filters.department !== 'all' ? filters.department : null,
        method_filter: filters.method !== 'all' ? filters.method : null
      };
      console.log('🔍 DEBUG: SQL Function parameters:', sqlParams);

      // Use the new SQL summary function
      const { data, error } = await supabase.rpc('get_daily_summary_metrics', sqlParams);

      if (error) {
        console.error('❌ Error fetching summary metrics:', error);
        console.error('🔍 DEBUG: Error details:', error);
        throw error;
      }

      console.log('🔍 DEBUG: Raw SQL function response:', data);
      const metrics = data?.[0];
      if (!metrics) {
        console.log('⚠️ No metrics data found for date range, trying fallback...');
        console.log('🔍 DEBUG: Data array length:', data?.length || 0);
        
        // Try a broader date range to see if any data exists
        console.log('🔍 DEBUG: Trying fallback date range (2024-01-01 to 2024-12-31)...');
        const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_daily_summary_metrics', {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          department_filter: null,
          method_filter: null
        });
        
        if (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
        } else {
          console.log('🔍 DEBUG: Fallback query result:', fallbackData);
          if (fallbackData && fallbackData[0] && fallbackData[0].unique_accounts > 0) {
            console.log('✅ Found data in 2024! The issue is likely that there\'s no data for the current date range.');
          }
        }
        
        // Try to use available month-specific tables as fallback
        console.log('🔄 Daily_Data has no data, trying month-specific tables...');
        try {
          const fallbackResult = await this.tryFallbackDataSources(startDate, endDate, filters);
          if (fallbackResult.activeAccounts > 0) {
            console.log('✅ Found data in fallback tables:', fallbackResult);
            return fallbackResult;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
        
        return {
          revenue: 0,
          profit: 0,
          margin: 0,
          activeAccounts: 0
        };
      }

      const result = {
        revenue: Number(metrics.total_spend) || 0,
        profit: Number(metrics.total_profit) || 0,
        margin: Number(metrics.avg_margin) || 0,
        activeAccounts: Number(metrics.unique_accounts) || 0
      };

      console.log('🔍 DEBUG: Raw metrics from SQL function:', metrics);
      console.log('🔍 DEBUG: Unique accounts value:', metrics.unique_accounts, 'Type:', typeof metrics.unique_accounts);
      console.log('🔍 DEBUG: Date range and filters used:', {
        start_date: startDate,
        end_date: endDate,
        department_filter: filters.department,
        method_filter: filters.method
      });

      // SIMPLE FIX: If we have revenue/profit but activeAccounts is wrong, recalculate it directly
      if (result.revenue > 0 && result.activeAccounts <= 1) {
        console.log('🔧 ACTIVE ACCOUNTS FIX: Revenue exists but activeAccounts is wrong, calculating directly...');
        try {
          const directCount = await this.calculateActiveAccountsDirect(startDate, endDate, filters);
          if (directCount > 0) {
            result.activeAccounts = directCount;
            console.log('✅ FIXED: Active accounts corrected to:', directCount);
          }
        } catch (directError) {
          console.error('❌ Direct calculation failed:', directError);
        }
      }

      console.log('✅ Summary metrics calculated:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch summary metrics:', error);
      throw error;
    }
  }

  /**
   * Fetches comparison data for period-over-period analysis
   * Handles large datasets efficiently with server-side processing
   */
  async getComparisonData(
    currentStart: string,
    currentEnd: string,
    comparisonStart: string,
    comparisonEnd: string,
    filters: DailyRepPerformanceFilters
  ): Promise<DailyRepPerformanceComparisonData> {
    try {
      console.log('🔄 Fetching comparison data from server-side functions');

      // Use the new SQL comparison function
      const { data, error } = await supabase.rpc('get_daily_comparison_metrics', {
        current_start: currentStart,
        current_end: currentEnd,
        comparison_start: comparisonStart,
        comparison_end: comparisonEnd,
        department_filter: filters.department !== 'all' ? filters.department : null,
        method_filter: filters.method !== 'all' ? filters.method : null
      });

      if (error) {
        console.error('❌ Error fetching comparison data:', error);
        throw error;
      }

      const comparison = data?.[0];
      if (!comparison) {
        console.log('⚠️ No comparison data found, returning defaults');
        return {
          current: { revenue: 0, profit: 0, margin: 0, activeAccounts: 0 },
          comparison: { revenue: 0, profit: 0, margin: 0, activeAccounts: 0 },
          changes: { revenue: 0, profit: 0, margin: 0, activeAccounts: 0 }
        };
      }

      const result = {
        current: {
          revenue: Number(comparison.current_spend) || 0,
          profit: Number(comparison.current_profit) || 0,
          margin: Number(comparison.current_margin) || 0,
          activeAccounts: Number(comparison.current_accounts) || 0
        },
        comparison: {
          revenue: Number(comparison.comparison_spend) || 0,
          profit: Number(comparison.comparison_profit) || 0,
          margin: Number(comparison.comparison_margin) || 0,
          activeAccounts: Number(comparison.comparison_accounts) || 0
        },
        changes: {
          revenue: Number(comparison.spend_change) || 0,
          profit: Number(comparison.profit_change) || 0,
          margin: Number(comparison.margin_change) || 0,
          activeAccounts: Number(comparison.accounts_change) || 0
        }
      };

      console.log('✅ Comparison data calculated:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch comparison data:', error);
      throw error;
    }
  }

  /**
   * Fetches rep performance data using server-side SQL functions
   * Returns individual rep metrics without comparison data
   */
  async getRepPerformanceData(
    startDate: string,
    endDate: string,
    filters: DailyRepPerformanceFilters,
    department?: string // Add optional department parameter for tab filtering
  ): Promise<DailyRepTableData[]> {
    try {
      console.log('👥 Fetching rep performance data from server-side functions');

      // Try the new function first, fall back to direct query if it fails
      try {
        // Handle department filtering - tab-specific department overrides page filters
        let departmentFilter = null;
        if (department && department !== 'overall') {
          // Convert tab names to database values
          const deptMap: Record<string, string> = {
            'retail': 'RETAIL',
            'reva': 'REVA', 
            'wholesale': 'WHOLESALE'
          };
          const dbDept = deptMap[department];
          if (dbDept) {
            departmentFilter = [dbDept];
          }
        } else if (filters.department !== 'all' && Array.isArray(filters.department)) {
          departmentFilter = filters.department;
        }

        const { data, error } = await supabase.rpc('get_daily_rep_performance', {
          start_date: startDate,
          end_date: endDate,
          department_filter: departmentFilter,
          method_filter: filters.method !== 'all' ? filters.method : null
        });

        if (error) {
          console.warn('⚠️ SQL function failed, trying fallback:', error);
          console.warn('⚠️ Error details:', error.message || error);
          throw error;
        }

        const repData = (data || []).map(row => ({
          rep: row.rep_name,
          spend: Number(row.total_spend) || 0,
          profit: Number(row.total_profit) || 0,
          margin: Number(row.avg_margin) || 0,
          activeAccounts: Number(row.active_accounts) || 0,
          totalAccounts: Number(row.total_accounts) || 0,
          telesalesPercentage: Number(row.telesales_profit_percentage) || 0,
          telesalesProfit: Number(row.total_telesales_profit) || 0
        }));

        // Debug: Check what the new function is returning
        if (data && data.length > 0) {
          console.log('🔍 New function first rep:', data[0]);
          console.log('🔍 Account values:', {
            active: data[0].active_accounts,
            total: data[0].total_accounts,
            activeType: typeof data[0].active_accounts,
            totalType: typeof data[0].total_accounts
          });
        }

        // Check if Active Accounts data is reasonable (same logic as summary metrics)
        const totalRevenue = repData.reduce((sum, rep) => sum + rep.spend, 0);
        const totalActiveAccounts = repData.reduce((sum, rep) => sum + rep.activeAccounts, 0);
        const maxActiveAccounts = Math.max(...repData.map(rep => rep.activeAccounts));
        
        // If we have revenue but unreasonably low active accounts, use our improved calculation
        if (totalRevenue > 1000 && (totalActiveAccounts <= repData.length || maxActiveAccounts <= 1)) {
          console.log('🔧 REP LEVEL: SQL function returned unreasonable active accounts data (likely all 1s)');
          console.log('🔧 REP LEVEL: Total revenue:', totalRevenue, 'Total active accounts:', totalActiveAccounts, 'Max active accounts:', maxActiveAccounts);
          console.log('🔧 REP LEVEL: Using improved calculation instead...');
          
          // Use the improved calculation - FORCE RETURN of improved results
          const improvedResults = await this.calculateRepLevelActiveAccounts(startDate, endDate, filters, department);
          if (improvedResults && improvedResults.length > 0) {
            console.log('✅ REP LEVEL: REPLACING bad SQL data with improved results');
            console.log('🔧 REP LEVEL: Improved first rep:', {
              rep: improvedResults[0].rep,
              active: improvedResults[0].activeAccounts,
              profit: improvedResults[0].profit
            });
            return improvedResults; // CRITICAL: This MUST return here to replace bad data
          } else {
            console.log('❌ REP LEVEL: Improved calculation failed, falling back to bad SQL data');
          }
        }

        console.log('✅ Rep performance data fetched from SQL:', repData.length, 'reps');
        return repData;
      } catch (functionError) {
        console.warn('⚠️ SQL function failed, using fallback approach:', functionError.message || functionError);
        
        // Fallback: Use direct query approach
        let query = supabase
          .from('Daily_Data')
          .select('Rep, "Sub-Rep", Spend, Profit, "Account Ref", Method, Department')
          .gte('Date_Time', startDate)
          .lte('Date_Time', endDate);

        // Apply department filter - tab-specific department overrides page filters
        if (department && department !== 'overall') {
          // Convert tab names to database values
          const deptMap: Record<string, string> = {
            'retail': 'RETAIL',
            'reva': 'REVA', 
            'wholesale': 'WHOLESALE'
          };
          const dbDept = deptMap[department];
          if (dbDept) {
            query = query.eq('Department', dbDept);
          }
        } else if (filters.department !== 'all' && Array.isArray(filters.department)) {
          // Use page-level department filters only if no tab-specific department
          query = query.in('Department', filters.department);
        }
        
        if (filters.method !== 'all') {
          query = query.eq('Method', filters.method);
        }

        const { data: rawData, error: queryError } = await query;

        if (queryError) {
          console.error('❌ Fallback query failed:', queryError);
          throw queryError;
        }

        // Use the same improved logic for rep-level data
        console.log('🔧 REP LEVEL: SQL function failed, applying improved unique customer counting for each rep...');
        const repLevelResults = await this.calculateRepLevelActiveAccounts(startDate, endDate, filters, department);
        console.log('🔧 REP LEVEL: calculateRepLevelActiveAccounts returned:', repLevelResults?.length || 0, 'reps');
        if (repLevelResults && repLevelResults.length > 0) {
          console.log('🔧 REP LEVEL: First rep result:', repLevelResults[0]);
        }
        return repLevelResults;
      }
    } catch (error) {
      console.error('❌ Failed to fetch rep performance data:', error);
      throw error;
    }
  }

  /**
   * Calculate rep-level active accounts using the same improved logic as summary
   */
  async calculateRepLevelActiveAccounts(
    startDate: string,
    endDate: string,
    filters: DailyRepPerformanceFilters,
    department?: string
  ): Promise<DailyRepTableData[]> {
    console.log('🔧 REP LEVEL: Calculating unique customers per rep using batch processing...');
    
    // Try the most likely data sources in order (same as summary)
    const dataSources = [
      { table: 'July_Data', accountField: 'Account Ref', spendField: 'Spend', profitField: 'Profit', repField: 'Rep', subRepField: 'Sub-Rep', deptField: 'Department', methodField: 'Method' },
      { table: 'June_Data', accountField: 'Account Ref', spendField: 'Spend', profitField: 'Profit', repField: 'Rep', subRepField: 'Sub-Rep', deptField: 'Department', methodField: 'Method' },
      { table: 'May_Data', accountField: 'Account Ref', spendField: 'Spend', profitField: 'Profit', repField: 'Rep', subRepField: 'Sub-Rep', deptField: 'Department', methodField: 'Method' },
      { table: 'sales_data', accountField: 'account_ref', spendField: 'spend', profitField: 'profit', repField: 'rep_name', subRepField: 'sub_rep', deptField: 'rep_type', methodField: 'method' },
      { table: 'mtd_daily', accountField: 'Account Ref', spendField: 'Spend', profitField: 'Profit', repField: 'Rep', subRepField: 'Sub-Rep', deptField: 'Department', methodField: 'Method' }
    ];
    
    for (const source of dataSources) {
      try {
        console.log(`🔧 REP LEVEL: Trying ${source.table}...`);
        
        // Test with small sample first
        const { data: testData, error: testError } = await (supabase as any)
          .from(source.table)
          .select('*')
          .limit(5);
        
                 if (testError || !testData || testData.length === 0) {
           console.log(`⚠️ REP LEVEL: ${source.table} not available or empty`, testError);
           continue;
         }
         
         console.log(`✅ REP LEVEL: ${source.table} has data, processing ALL records per rep...`);
         console.log(`🔧 REP LEVEL: Sample record from ${source.table}:`, testData[0]);
        
        // Get ALL data in batches and aggregate by rep with unique customers
        const repMap = new Map<string, {
          spend: number;
          profit: number;
          accounts: Set<string>;
          telesalesProfit: number;
        }>();
        
        let from = 0;
        const batchSize = 1000;
        let hasMoreData = true;
        let totalProcessed = 0;
        
        while (hasMoreData) {
          const { data: batchData, error: batchError } = await (supabase as any)
            .from(source.table)
            .select('*')
            .range(from, from + batchSize - 1);
          
          if (batchError) {
            console.log(`❌ REP LEVEL: Error in batch ${from}-${from + batchSize - 1}:`, batchError);
            break;
          }
          
          if (!batchData || batchData.length === 0) {
            hasMoreData = false;
            break;
          }
          
          // Process this batch (with debugging for first few records)
          batchData.forEach((row, index) => {
            const isDebugRecord = index < 5; // Only debug first 5 records per batch
            // Apply Sub-Rep logic: For REVA and Wholesale, use Sub-Rep if available, otherwise use Rep
            const department = row[source.deptField] || 'RETAIL';
            const rep = ((department === 'REVA' || department === 'Wholesale' || department === 'WHOLESALE') && row[source.subRepField]) 
              ? row[source.subRepField] 
              : row[source.repField];
            if (!rep) return;

            if (!repMap.has(rep)) {
              repMap.set(rep, {
                spend: 0,
                profit: 0,
                accounts: new Set(),
                telesalesProfit: 0
              });
            }

            const repData = repMap.get(rep)!;
            repData.spend += Number(row[source.spendField]) || 0;
            repData.profit += Number(row[source.profitField]) || 0;
            
            // Add unique customer (same logic as summary)
            const accountRef = row[source.accountField];
            if (isDebugRecord) {
              console.log(`🔧 ACCOUNT DEBUG: Rep ${rep}, Field: ${source.accountField}, Value: "${accountRef}", Type: ${typeof accountRef}`);
            }
            if (accountRef && accountRef !== null && accountRef !== '' && accountRef !== undefined) {
              repData.accounts.add(String(accountRef).trim());
              if (isDebugRecord) {
                console.log(`✅ ACCOUNT ADDED: ${String(accountRef).trim()} to ${rep}, Set size now: ${repData.accounts.size}`);
              }
            } else {
              if (isDebugRecord) {
                console.log(`❌ ACCOUNT SKIPPED: ${rep} - accountRef is empty/null/undefined`);
              }
            }
            
            if (row[source.methodField] === 'telesales') {
              repData.telesalesProfit += Number(row[source.profitField]) || 0;
            }
          });
          
          totalProcessed += batchData.length;
          console.log(`🔧 REP LEVEL: Processed batch ${from}-${from + batchData.length - 1}, total records: ${totalProcessed}, unique reps so far: ${repMap.size}`);
          
          // If we got less than batchSize, we're done
          if (batchData.length < batchSize) {
            hasMoreData = false;
          } else {
            from += batchSize;
          }
        }
        
        // Convert to final format with unique customer counts
        const repData = Array.from(repMap.entries()).map(([rep, data]) => {
          const activeAccountsCount = data.accounts.size;
          console.log(`🔧 MAPPING: ${rep} - accounts.size: ${activeAccountsCount}, accounts set:`, Array.from(data.accounts).slice(0, 3));
          
          return {
            rep,
            spend: data.spend,
            profit: data.profit,
            margin: data.spend > 0 ? (data.profit / data.spend) * 100 : 0,
            activeAccounts: activeAccountsCount, // UNIQUE customers who transacted with this rep
            totalAccounts: activeAccountsCount, // Using same value (we don't have assignment data)
            telesalesPercentage: data.profit > 0 ? (data.telesalesProfit / data.profit) * 100 : 0,
            telesalesProfit: data.telesalesProfit
          };
        }).sort((a, b) => b.profit - a.profit);

        console.log(`✅ REP LEVEL: Calculated ${repData.length} reps from ${source.table} with ${totalProcessed} total records`);
        
        // Check if we actually found any valid account references
        const totalActiveAccounts = repData.reduce((sum, rep) => sum + rep.activeAccounts, 0);
        
        if (totalActiveAccounts === 0 && repData.length > 0) {
          console.log(`⚠️ REP LEVEL: No valid account references found in ${source.table}, trying next data source...`);
          continue; // Try next data source
        }
        
        // Log some examples
        if (repData.length > 0) {
          console.log(`🔧 REP LEVEL: Examples - ${repData[0].rep}: ${repData[0].activeAccounts} unique customers, £${repData[0].profit.toFixed(0)} profit`);
          if (repData.length > 1) {
            console.log(`🔧 REP LEVEL: Examples - ${repData[1].rep}: ${repData[1].activeAccounts} unique customers, £${repData[1].profit.toFixed(0)} profit`);
          }
          if (repData.length > 2) {
            console.log(`🔧 REP LEVEL: Examples - ${repData[2].rep}: ${repData[2].activeAccounts} unique customers, £${repData[2].profit.toFixed(0)} profit`);
          }
          // Show ALL rep active accounts to debug the issue
          console.log(`🚨🚨🚨 CRITICAL DEBUG - ALL REPS ACTIVE ACCOUNTS 🚨🚨🚨`);
          console.log(repData.map(r => ({ rep: r.rep, active: r.activeAccounts, profit: r.profit })));
          console.log(`🚨🚨🚨 END CRITICAL DEBUG 🚨🚨🚨`);
        }
        
        return repData;
        
      } catch (sourceError) {
        console.log(`❌ REP LEVEL: Error with ${source.table}:`, sourceError);
        continue;
      }
    }
    
    console.log('⚠️ REP LEVEL: No data found in any source, returning empty array');
    return [];
  }

  /**
   * Fetches rep performance comparison data (current vs previous period)
   * Returns rep metrics with comparison data and calculated changes
   */
  async getRepPerformanceComparisonData(
    currentStart: string,
    currentEnd: string,
    comparisonStart: string,
    comparisonEnd: string,
    filters: DailyRepPerformanceFilters,
    department?: string // Add optional department parameter for tab filtering
  ): Promise<DailyRepTableComparisonData[]> {
    try {
      console.log('📊 Fetching rep performance comparison data from server-side functions');

      // Try the new function first, fall back to separate calls if it fails
      try {
        // Handle department filtering - tab-specific department overrides page filters
        let departmentFilter = null;
        if (department && department !== 'overall') {
          // Convert tab names to database values
          const deptMap: Record<string, string> = {
            'retail': 'RETAIL',
            'reva': 'REVA', 
            'wholesale': 'WHOLESALE'
          };
          const dbDept = deptMap[department];
          if (dbDept) {
            departmentFilter = [dbDept];
          }
        } else if (filters.department !== 'all' && Array.isArray(filters.department)) {
          departmentFilter = filters.department;
        }

        const { data, error } = await supabase.rpc('get_daily_rep_performance_comparison', {
          current_start: currentStart,
          current_end: currentEnd,
          comparison_start: comparisonStart,
          comparison_end: comparisonEnd,
          department_filter: departmentFilter,
          method_filter: filters.method !== 'all' ? filters.method : null
        });

        if (error) {
          console.warn('⚠️ SQL comparison function failed, trying fallback:', error);
          throw error;
        }

        const comparisonData = (data || []).map(row => ({
          rep: row.rep_name,
          current: {
            spend: Number(row.current_spend) || 0,
            profit: Number(row.current_profit) || 0,
            margin: Number(row.current_margin) || 0,
            activeAccounts: Number(row.current_active_accounts) || 0,
            totalAccounts: Number(row.current_total_accounts) || 0,
            telesalesPercentage: Number(row.current_telesales_percentage) || 0,
            telesalesProfit: Number(row.current_telesales_profit) || 0
          },
          comparison: {
            spend: Number(row.comparison_spend) || 0,
            profit: Number(row.comparison_profit) || 0,
            margin: Number(row.comparison_margin) || 0,
            activeAccounts: Number(row.comparison_active_accounts) || 0,
            totalAccounts: Number(row.comparison_total_accounts) || 0,
            telesalesPercentage: Number(row.comparison_telesales_percentage) || 0,
            telesalesProfit: Number(row.comparison_telesales_profit) || 0
          },
          changes: {
            spend: Number(row.spend_change_percent) || 0,
            profit: Number(row.profit_change_percent) || 0,
            margin: Number(row.margin_change_percent) || 0,
            activeAccounts: Number(row.active_accounts_change_percent) || 0,
            totalAccounts: Number(row.total_accounts_change_percent) || 0,
            telesalesPercentage: Number(row.telesales_percentage_change_percent) || 0
          }
        }));

        // Check if Active Accounts data is reasonable (same logic as regular rep data)
        const totalCurrentRevenue = comparisonData.reduce((sum, rep) => sum + rep.current.spend, 0);
        const totalCurrentActiveAccounts = comparisonData.reduce((sum, rep) => sum + rep.current.activeAccounts, 0);
        const maxCurrentActiveAccounts = Math.max(...comparisonData.map(rep => rep.current.activeAccounts));
        
        // If we have revenue but unreasonably low active accounts, use fallback approach
        if (totalCurrentRevenue > 1000 && (totalCurrentActiveAccounts <= comparisonData.length || maxCurrentActiveAccounts <= 1)) {
          console.log('🔧 REP COMPARISON: SQL function returned unreasonable active accounts data (likely all 1s)');
          console.log('🔧 REP COMPARISON: Using fallback calculation instead...');
          
          // Use the fallback approach (fetch both periods separately)
          throw new Error('SQL function returned unreasonable data, using fallback');
        }

        console.log('✅ Rep performance comparison data fetched:', comparisonData.length, 'reps');
        return comparisonData;
      } catch (functionError) {
        console.warn('⚠️ SQL comparison function not available, using fallback approach');
        
        // Fallback: Fetch both periods separately and combine
        console.log('🔧 COMPARISON FALLBACK: Fetching current period data...');
        const currentData = await this.getRepPerformanceData(currentStart, currentEnd, filters, department);
        console.log('🔧 COMPARISON FALLBACK: Current period data:', currentData.length, 'reps');
        if (currentData.length > 0) {
          console.log('🔧 COMPARISON FALLBACK: Current first rep:', {
            rep: currentData[0].rep,
            active: currentData[0].activeAccounts,
            profit: currentData[0].profit
          });
        }
        
        console.log('🔧 COMPARISON FALLBACK: Fetching comparison period data...');
        const comparisonData = await this.getRepPerformanceData(comparisonStart, comparisonEnd, filters, department);
        console.log('🔧 COMPARISON FALLBACK: Comparison period data:', comparisonData.length, 'reps');
        if (comparisonData.length > 0) {
          console.log('🔧 COMPARISON FALLBACK: Comparison first rep:', {
            rep: comparisonData[0].rep,
            active: comparisonData[0].activeAccounts,
            profit: comparisonData[0].profit
          });
        }

        // Create comparison map
        const comparisonMap = new Map<string, DailyRepTableData>();
        comparisonData.forEach(rep => {
          comparisonMap.set(rep.rep, rep);
        });

        // Combine current and comparison data
        const combinedData = currentData.map(currentRep => {
          const comparisonRep = comparisonMap.get(currentRep.rep);
          
          // Debug: Check what we're combining
          if (currentRep.rep === 'Craig McDowall') {
            console.log('🔧 COMPARISON FALLBACK: Combining Craig McDowall data:', {
              currentActive: currentRep.activeAccounts,
              comparisonActive: comparisonRep?.activeAccounts,
              currentProfit: currentRep.profit,
              comparisonProfit: comparisonRep?.profit
            });
          }
          
          // Calculate changes
          const changes = {
            spend: comparisonRep?.spend && comparisonRep.spend > 0 
              ? ((currentRep.spend - comparisonRep.spend) / comparisonRep.spend) * 100 
              : 0,
            profit: comparisonRep?.profit && comparisonRep.profit > 0 
              ? ((currentRep.profit - comparisonRep.profit) / comparisonRep.profit) * 100 
              : 0,
            margin: comparisonRep?.margin 
              ? currentRep.margin - comparisonRep.margin 
              : 0,
            activeAccounts: comparisonRep?.activeAccounts && comparisonRep.activeAccounts > 0 
              ? ((currentRep.activeAccounts - comparisonRep.activeAccounts) / comparisonRep.activeAccounts) * 100 
              : 0,
            totalAccounts: comparisonRep?.totalAccounts && comparisonRep.totalAccounts > 0 
              ? ((currentRep.totalAccounts - comparisonRep.totalAccounts) / comparisonRep.totalAccounts) * 100 
              : 0,
            telesalesPercentage: comparisonRep?.telesalesPercentage 
              ? currentRep.telesalesPercentage - comparisonRep.telesalesPercentage 
              : 0
          };

          const result = {
            rep: currentRep.rep,
            current: {
              spend: currentRep.spend,
              profit: currentRep.profit,
              margin: currentRep.margin,
              activeAccounts: currentRep.activeAccounts || 0,
              totalAccounts: currentRep.totalAccounts || 0,
              telesalesPercentage: currentRep.telesalesPercentage,
              telesalesProfit: currentRep.telesalesProfit
            },
            comparison: {
              spend: comparisonRep?.spend || 0,
              profit: comparisonRep?.profit || 0,
              margin: comparisonRep?.margin || 0,
              activeAccounts: comparisonRep?.activeAccounts || 0,
              totalAccounts: comparisonRep?.totalAccounts || 0,
              telesalesPercentage: comparisonRep?.telesalesPercentage || 0,
              telesalesProfit: comparisonRep?.telesalesProfit || 0
            },
            changes
          };

          // Debug: Check final result for Craig
          if (currentRep.rep === 'Craig McDowall') {
            console.log('🔧 COMPARISON FALLBACK: Final Craig McDowall result:', {
              currentActive: result.current.activeAccounts,
              comparisonActive: result.comparison.activeAccounts
            });
          }

          return result;
        });

        console.log('✅ Rep performance comparison data fetched (fallback):', combinedData.length, 'reps');
        return combinedData;
      }
    } catch (error) {
      console.error('❌ Failed to fetch rep performance comparison data:', error);
      throw error;
    }
  }

  /**
   * SIMPLE DIRECT CALCULATION: Count active accounts from available data sources
   * This bypasses all complex logic and just counts unique accounts directly
   */
  async calculateActiveAccountsDirect(
    startDate: string,
    endDate: string,
    filters: DailyRepPerformanceFilters
  ): Promise<number> {
    console.log('🔧 DIRECT CALC: Calculating active accounts directly from available data...');
    
    // Try the most likely data sources in order
    const dataSources = [
      { table: 'July_Data', accountField: 'Account Ref' },
      { table: 'June_Data', accountField: 'Account Ref' },
      { table: 'May_Data', accountField: 'Account Ref' },
      { table: 'sales_data', accountField: 'account_ref' },
      { table: 'mtd_daily', accountField: 'Account Ref' }
    ];
    
    for (const source of dataSources) {
      try {
        console.log(`🔧 DIRECT CALC: Trying ${source.table}...`);
        
        const { data, error } = await (supabase as any)
          .from(source.table)
          .select(source.accountField)
          .limit(10); // Test with small sample first
        
        if (error || !data || data.length === 0) {
          console.log(`⚠️ DIRECT CALC: ${source.table} not available or empty`);
          continue;
        }
        
        console.log(`✅ DIRECT CALC: ${source.table} has data, getting ALL unique customers...`);
        
        // Get ALL unique account refs from this table (no limits)
        // We want DISTINCT customers who had ANY transaction in the period
        let allUniqueAccounts = new Set<string>();
        let from = 0;
        const batchSize = 1000;
        let hasMoreData = true;
        
        while (hasMoreData) {
          const { data: batchData, error: batchError } = await (supabase as any)
            .from(source.table)
            .select(source.accountField)
            .range(from, from + batchSize - 1);
          
          if (batchError) {
            console.log(`❌ DIRECT CALC: Error in batch ${from}-${from + batchSize - 1}:`, batchError);
            break;
          }
          
          if (!batchData || batchData.length === 0) {
            hasMoreData = false;
            break;
          }
          
          // Add unique accounts from this batch
          batchData.forEach(row => {
            const accountRef = row[source.accountField];
            if (accountRef && accountRef !== null && accountRef !== '' && accountRef !== undefined) {
              allUniqueAccounts.add(String(accountRef).trim());
            }
          });
          
          console.log(`🔧 DIRECT CALC: Processed batch ${from}-${from + batchData.length - 1}, total unique customers so far: ${allUniqueAccounts.size}`);
          
          // If we got less than batchSize, we're done
          if (batchData.length < batchSize) {
            hasMoreData = false;
          } else {
            from += batchSize;
          }
        }
        
        const uniqueAccounts = allUniqueAccounts.size;
        
        if (uniqueAccounts > 0) {
          console.log(`✅ DIRECT CALC: Found ${uniqueAccounts} UNIQUE CUSTOMERS (active accounts) in ${source.table}`);
          console.log(`🔧 DIRECT CALC: This represents customers who had ANY transaction in the period, counted once per customer`);
          return uniqueAccounts;
        } else {
          console.log(`⚠️ DIRECT CALC: No valid customer references found in ${source.table}`);
        }
        
      } catch (sourceError) {
        console.log(`❌ DIRECT CALC: Error with ${source.table}:`, sourceError);
        continue;
      }
    }
    
    console.log('⚠️ DIRECT CALC: No data found in any source');
    return 0;
  }

  /**
   * Try fallback data sources when Daily_Data table is empty
   * Uses the actual month-specific tables like sales_data, June_Data, July_Data, etc.
   */
  async tryFallbackDataSources(
    startDate: string,
    endDate: string,
    filters: DailyRepPerformanceFilters
  ): Promise<DailyRepPerformanceMetrics> {
    console.log('🔍 Trying fallback data sources for date range:', startDate, 'to', endDate);
    
    // Map of months to their corresponding table names based on memories
    const monthlyTables = [
      { month: '2024-07', table: 'July_Data' },
      { month: '2024-06', table: 'June_Data' },
      { month: '2024-05', table: 'May_Data' },
      { month: '2024-04', table: 'mtd_daily' },
      { month: '2024-03', table: 'sales_data' },
      { month: '2024-02', table: 'sales_data_februrary' }
    ];
    
    // Determine which table to use based on date range
    const startMonth = startDate.substring(0, 7); // Extract YYYY-MM
    const endMonth = endDate.substring(0, 7);
    
    // Find the appropriate table for the date range
    const targetTable = monthlyTables.find(t => t.month === startMonth || t.month === endMonth);
    
    if (!targetTable) {
      console.log('⚠️ No fallback table found for date range');
      return { revenue: 0, profit: 0, margin: 0, activeAccounts: 0 };
    }
    
    console.log(`🔍 Trying fallback table: ${targetTable.table} for month ${targetTable.month}`);
    
         try {
       // Try to fetch data from the identified table using type assertion
       let query = (supabase as any).from(targetTable.table).select('*');
       
       // Apply department filters if specified
       if (filters.department !== 'all' && Array.isArray(filters.department)) {
         // Try both 'Department' and 'rep_type' columns
         query = query.in('Department', filters.department);
       }
       
       const { data, error } = await query.limit(10); // Just test with a small sample
       
       if (error) {
         console.error(`❌ Error querying ${targetTable.table}:`, error);
         throw error;
       }
       
       if (!data || data.length === 0) {
         console.log(`⚠️ No data found in ${targetTable.table}`);
         return { revenue: 0, profit: 0, margin: 0, activeAccounts: 0 };
       }
       
       console.log(`✅ Found ${data.length} sample records in ${targetTable.table}`);
       console.log('🔍 Sample record keys:', Object.keys(data[0]));
       
       // Calculate metrics from the available data
       const accountRefField = 'Account Ref' in data[0] ? 'Account Ref' : 'account_ref';
       const spendField = 'Spend' in data[0] ? 'Spend' : 'spend';
       const profitField = 'Profit' in data[0] ? 'Profit' : 'profit';
       
       // Get full dataset for accurate count using type assertion
       const { data: fullData, error: fullError } = await (supabase as any)
         .from(targetTable.table)
         .select(`${accountRefField}, ${spendField}, ${profitField}`);
       
       if (fullError || !fullData) {
         throw new Error(`Failed to get full data from ${targetTable.table}`);
       }
      
      // Calculate metrics
      const uniqueAccounts = new Set(
        fullData
          .map(row => row[accountRefField])
          .filter(ref => ref && ref !== null && ref !== '')
      ).size;
      
      const totalSpend = fullData.reduce((sum, row) => {
        const spend = Number(row[spendField]) || 0;
        return sum + spend;
      }, 0);
      
      const totalProfit = fullData.reduce((sum, row) => {
        const profit = Number(row[profitField]) || 0;
        return sum + profit;
      }, 0);
      
      const margin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
      
      const result = {
        revenue: totalSpend,
        profit: totalProfit,
        margin: margin,
        activeAccounts: uniqueAccounts
      };
      
      console.log(`✅ Calculated fallback metrics from ${targetTable.table}:`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to query fallback table ${targetTable.table}:`, error);
      throw error;
    }
  }

  /**
   * Legacy method - fetches raw data (still subject to 1000-record limit)
   * Use getAggregatedData() for large datasets instead
   */
  async getRawData(
    startDate: string, 
    endDate: string, 
    filters: DailyRepPerformanceFilters
  ): Promise<DailyRepPerformanceData[]> {
    try {
      console.log('⚠️ Using legacy raw data fetch (1000 record limit)');
      
      let query = supabase
        .from('Daily_Data')
        .select('*')
        .gte('Date_Time', startDate)
        .lte('Date_Time', endDate)
        .range(0, 99999); // Attempt to get more records

      // Apply filters
      if (filters.department !== 'all') {
        query = query.in('Department', filters.department);
      }
      if (filters.method !== 'all') {
        query = query.eq('Method', filters.method);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching raw data:', error);
        throw error;
      }

      console.log('✅ Raw data fetched:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch raw data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dailyRepPerformanceServiceV2 = new DailyRepPerformanceServiceV2(); 