
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = 'https://ukshnjjmsrhgvkwrzoah.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface RepSummary {
  name: string;
  departments: string[];
  totalSpend: number;
  totalProfit: number;
  margin: number;
  totalPacks: number;
  totalAccounts: number;
  activeAccounts: number;
  profitPerActiveAccount: number;
  sampleTransactions: any[];
}

interface OverallMetrics {
  totalSpend: number;
  totalProfit: number;
  averageMargin: number;
  totalPacks: number;
  totalAccounts: Set<string>;
  activeAccounts: Set<string>;
  topPerformersByProfit: any[];
  topPerformersByMargin: any[];
  departmentBreakdown: any;
}

// Determine if a string is a department name
const isDepartment = (name: string): boolean => {
  return ['RETAIL', 'REVA', 'Wholesale'].includes(name);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, selectedMonth } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which tables to query based on selected month
    const tables = {
      'march': 'sales_data_march',
      'february': 'sales_data_februrary'
    };
    
    const month = selectedMonth?.toLowerCase() || 'march'; // Default to March if not specified
    const tableName = tables[month] || tables.march;
    
    console.log(`Querying table: ${tableName} for month: ${month}`);
    
    // Get sales data for the specified month
    let salesData;
    let topSalesPeople;
    let repDetails: RepSummary | null = null;
    let overallMetrics: OverallMetrics | null = null;

    try {
      // Check if the query is asking about overall metrics
      const isOverallQuery = /total|overall|all|combined|everyone|across all|summary/i.test(message);
      
      // Extract any rep name mentioned in the message for detailed lookup
      const repNameMatch = message.match(/(?:about|on|for|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
      const repName = repNameMatch ? repNameMatch[1] : null;
      
      // If asking about overall metrics, get that data
      if (isOverallQuery) {
        console.log("Detected query for overall metrics");
        
        const { data: allData, error: allDataError } = await supabase
          .from(tableName)
          .select('*');
        
        if (allDataError) {
          console.error(`Error fetching all data from ${tableName}:`, allDataError);
          throw allDataError;
        }
        
        if (allData && allData.length > 0) {
          // Calculate overall metrics
          const metrics: OverallMetrics = {
            totalSpend: 0,
            totalProfit: 0,
            averageMargin: 0,
            totalPacks: 0,
            totalAccounts: new Set<string>(),
            activeAccounts: new Set<string>(),
            topPerformersByProfit: [],
            topPerformersByMargin: [],
            departmentBreakdown: {}
          };
          
          // Group by department for breakdown
          const departmentBreakdown: Record<string, {
            spend: number,
            profit: number,
            packs: number,
            accounts: Set<string>,
            activeAccounts: Set<string>
          }> = {};
          
          // Aggregate data
          allData.forEach(record => {
            const dept = record.Department || 'Unknown';
            const spend = Number(record.Spend || 0);
            const profit = Number(record.Profit || 0);
            const packs = Number(record.Packs || 0);
            
            // Add to overall totals
            metrics.totalSpend += spend;
            metrics.totalProfit += profit;
            metrics.totalPacks += packs;
            
            // Track accounts
            if (record['Account Ref']) {
              metrics.totalAccounts.add(record['Account Ref']);
              if (spend > 0) {
                metrics.activeAccounts.add(record['Account Ref']);
              }
            }
            
            // Department breakdown
            if (!departmentBreakdown[dept]) {
              departmentBreakdown[dept] = {
                spend: 0,
                profit: 0,
                packs: 0,
                accounts: new Set<string>(),
                activeAccounts: new Set<string>()
              };
            }
            
            departmentBreakdown[dept].spend += spend;
            departmentBreakdown[dept].profit += profit;
            departmentBreakdown[dept].packs += packs;
            
            if (record['Account Ref']) {
              departmentBreakdown[dept].accounts.add(record['Account Ref']);
              if (spend > 0) {
                departmentBreakdown[dept].activeAccounts.add(record['Account Ref']);
              }
            }
          });
          
          // Calculate average margin
          metrics.averageMargin = metrics.totalSpend > 0 ? (metrics.totalProfit / metrics.totalSpend) * 100 : 0;
          
          // Format department breakdown for output
          const formattedDeptBreakdown = Object.entries(departmentBreakdown).map(([dept, data]) => ({
            department: dept,
            spend: data.spend,
            profit: data.profit,
            margin: data.spend > 0 ? (data.profit / data.spend) * 100 : 0,
            packs: data.packs,
            accounts: data.accounts.size,
            activeAccounts: data.activeAccounts.size
          }));
          
          // Get top performers by profit - ONLY include actual reps, not departments
          const repProfitMap = new Map<string, number>();
          const repMarginMap = new Map<string, { spend: number, profit: number }>();
          const repSet = new Set<string>();
          
          // First, gather all rep names (from both Rep and Sub-Rep fields)
          allData.forEach(record => {
            if (record.Rep && !isDepartment(record.Rep)) {
              repSet.add(record.Rep);
            }
            if (record['Sub-Rep'] && record['Sub-Rep'].trim() !== '') {
              repSet.add(record['Sub-Rep']);
            }
          });
          
          // Then, calculate totals for each rep (combining data where they appear as Rep or Sub-Rep)
          Array.from(repSet).forEach(rep => {
            let totalProfit = 0;
            let totalSpend = 0;
            
            // Add data where the person is listed as Rep
            allData.forEach(record => {
              if (record.Rep === rep) {
                totalProfit += Number(record.Profit || 0);
                totalSpend += Number(record.Spend || 0);
              }
            });
            
            // Add data where the person is listed as Sub-Rep
            allData.forEach(record => {
              if (record['Sub-Rep'] === rep) {
                totalProfit += Number(record.Profit || 0);
                totalSpend += Number(record.Spend || 0);
              }
            });
            
            repProfitMap.set(rep, totalProfit);
            repMarginMap.set(rep, { 
              spend: totalSpend, 
              profit: totalProfit 
            });
          });
          
          // Convert to arrays and sort
          let topByProfit = Array.from(repProfitMap.entries()).map(([rep, profit]) => ({
            rep,
            profit
          })).sort((a, b) => b.profit - a.profit).slice(0, 5);
          
          let topByMargin = Array.from(repMarginMap.entries())
            .map(([rep, { spend, profit }]) => ({
              rep,
              margin: spend > 0 ? (profit / spend) * 100 : 0
            }))
            .filter(item => item.margin > 0)
            .sort((a, b) => b.margin - a.margin)
            .slice(0, 5);
          
          metrics.topPerformersByProfit = topByProfit;
          metrics.topPerformersByMargin = topByMargin;
          metrics.departmentBreakdown = formattedDeptBreakdown;
          
          overallMetrics = metrics;
          
          console.log("Calculated overall metrics:", {
            totalProfit: metrics.totalProfit,
            averageMargin: metrics.averageMargin,
            totalAccounts: metrics.totalAccounts.size,
            activeAccounts: metrics.activeAccounts.size,
            departments: Object.keys(departmentBreakdown).length
          });
        }
      }
      
      // If a specific rep is mentioned, get their details across all departments
      if (repName) {
        console.log(`Looking for data on rep: ${repName}`);
        
        // Here we need to look for the rep name in both Rep and Sub-Rep fields
        const { data: repAsMainRep, error: repAsMainError } = await supabase
          .from(tableName)
          .select('*')
          .ilike('Rep', `%${repName}%`);

        const { data: repAsSubRep, error: repAsSubError } = await supabase
          .from(tableName)
          .select('*')
          .ilike('Sub-Rep', `%${repName}%`);
        
        if (repAsMainError || repAsSubError) {
          console.error(`Error fetching data for rep ${repName}:`, repAsMainError || repAsSubError);
        } else {
          // Combine results where the person appears as either Rep or Sub-Rep
          const repData = [...(repAsMainRep || []), ...(repAsSubRep || [])];
          
          if (repData && repData.length > 0) {
            // Group by department to show the breakdown
            const departmentData = repData.reduce((acc, record) => {
              const dept = record.Department || 'Unknown';
              if (!acc[dept]) {
                acc[dept] = { 
                  spend: 0, 
                  profit: 0, 
                  packs: 0, 
                  accounts: new Set(), 
                  activeAccounts: new Set(),
                };
              }
              
              const spend = Number(record.Spend || 0);
              const profit = Number(record.Profit || 0);
              const packs = Number(record.Packs || 0);
              
              acc[dept].spend += spend;
              acc[dept].profit += profit;
              acc[dept].packs += packs;
              
              if (record['Account Ref']) {
                acc[dept].accounts.add(record['Account Ref']);
                if (spend > 0) {
                  acc[dept].activeAccounts.add(record['Account Ref']);
                }
              }
              
              return acc;
            }, {});
            
            // Calculate overall totals across all departments
            let totalSpend = 0;
            let totalProfit = 0;
            let totalPacks = 0;
            const allAccounts = new Set<string>();
            const allActiveAccounts = new Set<string>();
            const departments: string[] = [];
            
            Object.entries(departmentData).forEach(([dept, data]) => {
              departments.push(dept);
              totalSpend += data.spend;
              totalProfit += data.profit;
              totalPacks += data.packs;
              
              data.accounts.forEach(account => allAccounts.add(String(account)));
              data.activeAccounts.forEach(account => allActiveAccounts.add(String(account)));
            });
            
            // Find interesting sample transactions (non-zero values preferably)
            const interestingTransactions = repData
              .filter(record => Number(record.Spend || 0) > 0 || Number(record.Profit || 0) !== 0)
              .slice(0, 2);
            
            // If we don't have enough interesting transactions, add some zero ones
            if (interestingTransactions.length < 3) {
              const zeroTransactions = repData
                .filter(record => Number(record.Spend || 0) === 0 && Number(record.Profit || 0) === 0)
                .slice(0, 3 - interestingTransactions.length);
              
              interestingTransactions.push(...zeroTransactions);
            }
            
            // Ensure we have exactly 3 transactions or fewer if not enough data
            const sampleTransactions = interestingTransactions.slice(0, 3);
            
            // Create the final rep summary
            repDetails = {
              name: repName,
              departments: departments,
              totalSpend: totalSpend,
              totalProfit: totalProfit,
              margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
              totalPacks: totalPacks,
              totalAccounts: allAccounts.size,
              activeAccounts: allActiveAccounts.size,
              profitPerActiveAccount: allActiveAccounts.size > 0 ? totalProfit / allActiveAccounts.size : 0,
              sampleTransactions: sampleTransactions
            };
            
            // Also provide department breakdown for context
            const departmentBreakdown = Object.entries(departmentData).map(([dept, data]) => ({
              department: dept,
              spend: data.spend,
              profit: data.profit,
              margin: data.spend > 0 ? (data.profit / data.spend) * 100 : 0,
              packs: data.packs,
              accounts: data.accounts.size,
              activeAccounts: data.activeAccounts.size,
            }));
            
            console.log(`Found details for rep ${repName}:`, JSON.stringify({
              summary: repDetails,
              departmentBreakdown
            }, null, 2));
          } else {
            console.log(`No data found for rep ${repName}`);
          }
        }
      }
      
      // Get general sales data (limited sample)
      const { data: generalData, error: generalError } = await supabase
        .from(tableName)
        .select('*')
        .limit(20);
      
      if (generalError) {
        console.error('Error fetching general sales data:', generalError);
        throw generalError;
      }
      
      // Get top sales people by profit - now excluding departments like REVA and Wholesale
      const { data: allSalesData, error: allSalesError } = await supabase
        .from(tableName)
        .select('Rep, Profit, Department, "Sub-Rep"');
      
      if (allSalesError) {
        console.error('Error fetching sales data:', allSalesError);
        throw allSalesError;
      }
      
      // Process sales data to get top performers excluding departments
      const repProfits: Record<string, number> = {};
      const repMargins: Record<string, { profit: number, spend: number }> = {};
      const repPacks: Record<string, number> = {};
      
      // First collect all rep names (whether in Rep or Sub-Rep columns)
      const allReps = new Set<string>();
      allSalesData.forEach(record => {
        if (record.Rep && !isDepartment(record.Rep)) {
          allReps.add(record.Rep);
        }
        if (record["Sub-Rep"] && record["Sub-Rep"].trim() !== '') {
          allReps.add(record["Sub-Rep"]);
        }
      });
      
      // Then calculate totals for each rep
      Array.from(allReps).forEach(repName => {
        let totalProfit = 0;
        let totalSpend = 0;
        let totalPacks = 0;
        
        // Add data where they appear as Rep
        allSalesData.forEach(record => {
          if (record.Rep === repName) {
            totalProfit += Number(record.Profit || 0);
            // We don't have Spend in this query so we'll need to extract it separately
          }
        });
        
        // Add data where they appear as Sub-Rep
        allSalesData.forEach(record => {
          if (record["Sub-Rep"] === repName) {
            totalProfit += Number(record.Profit || 0);
            // We don't have Spend in this query so we'll need to extract it separately
          }
        });
        
        repProfits[repName] = totalProfit;
      });
      
      // Now get spend data
      const { data: spendData, error: spendError } = await supabase
        .from(tableName)
        .select('Rep, Spend, Department, "Sub-Rep"');
        
      if (!spendError) {
        Array.from(allReps).forEach(repName => {
          let totalSpend = 0;
          
          // Add data where they appear as Rep
          spendData.forEach(record => {
            if (record.Rep === repName) {
              totalSpend += Number(record.Spend || 0);
            }
          });
          
          // Add data where they appear as Sub-Rep
          spendData.forEach(record => {
            if (record["Sub-Rep"] === repName) {
              totalSpend += Number(record.Spend || 0);
            }
          });
          
          // Update margin data
          if (!repMargins[repName]) {
            repMargins[repName] = { profit: 0, spend: 0 };
          }
          repMargins[repName].spend = totalSpend;
          repMargins[repName].profit = repProfits[repName] || 0;
        });
      }
      
      // Now get packs data
      const { data: packsData, error: packsError } = await supabase
        .from(tableName)
        .select('Rep, Packs, Department, "Sub-Rep"');
        
      if (!packsError) {
        Array.from(allReps).forEach(repName => {
          let totalPacks = 0;
          
          // Add data where they appear as Rep
          packsData.forEach(record => {
            if (record.Rep === repName) {
              totalPacks += Number(record.Packs || 0);
            }
          });
          
          // Add data where they appear as Sub-Rep
          packsData.forEach(record => {
            if (record["Sub-Rep"] === repName) {
              totalPacks += Number(record.Packs || 0);
            }
          });
          
          repPacks[repName] = totalPacks;
        });
      }
      
      // Sort and get top performers
      const topByProfit = Object.entries(repProfits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([rep, profit]) => ({ Rep: rep, Profit: profit, Department: "Combined" }));
        
      const topByMargin = Object.entries(repMargins)
        .map(([rep, { profit, spend }]) => ({ 
          Rep: rep, 
          Margin: spend > 0 ? (profit / spend) * 100 : 0,
          Department: "Combined"
        }))
        .sort((a, b) => b.Margin - a.Margin)
        .slice(0, 5);
        
      const topByPacks = Object.entries(repPacks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([rep, packs]) => ({ Rep: rep, Packs: packs, Department: "Combined" }));
      
      salesData = generalData;
      topSalesPeople = {
        byProfit: topByProfit,
        byMargin: topByMargin,
        byPacks: topByPacks
      };
      
      console.log(`Successfully fetched ${salesData.length} records from ${tableName}`);
      console.log(`Top performers:`, JSON.stringify(topSalesPeople, null, 2));
      
    } catch (error) {
      console.error(`Error fetching sales data from ${tableName}:`, error);
      salesData = `Unable to fetch sales data from ${tableName}: ${error.message}`;
      topSalesPeople = "Data unavailable";
    }

    // Prepare a system prompt with data context
    const systemPrompt = `
You are Vera, a sales data analysis assistant specialized in helping sales managers understand their rep performance data.
You have access to sales data for ${selectedMonth || 'March'} 2025.

Here's key information from the data:
1. Top performers by profit in ${selectedMonth || 'March'} 2025:
${JSON.stringify(topSalesPeople?.byProfit || 'Data unavailable')}

2. Top performers by margin in ${selectedMonth || 'March'} 2025:
${JSON.stringify(topSalesPeople?.byMargin || 'Data unavailable')}

3. Top performers by packs sold in ${selectedMonth || 'March'} 2025:
${JSON.stringify(topSalesPeople?.byPacks || 'Data unavailable')}

${overallMetrics ? `
4. Overall metrics for ${selectedMonth || 'March'} 2025:

Total Spend: ${overallMetrics.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${overallMetrics.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Average Margin: ${overallMetrics.averageMargin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${overallMetrics.totalPacks.toLocaleString('en-US')}
Total Accounts: ${overallMetrics.totalAccounts.size}
Active Accounts: ${overallMetrics.activeAccounts.size}

Department Breakdown:
${JSON.stringify(overallMetrics.departmentBreakdown, null, 2)}

Top Performers by Profit:
${JSON.stringify(overallMetrics.topPerformersByProfit, null, 2)}

Top Performers by Margin:
${JSON.stringify(overallMetrics.topPerformersByMargin, null, 2)}
` : ''}

${repDetails ? `
${overallMetrics ? '5' : '4'}. Specific details for ${repDetails.name}:

Key Performance Metrics:

Total Spend: ${repDetails.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${repDetails.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Margin: ${repDetails.margin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${repDetails.totalPacks.toLocaleString('en-US')}
Total Accounts: ${repDetails.totalAccounts}
Active Accounts: ${repDetails.activeAccounts}
Profit per Active Account: ${repDetails.profitPerActiveAccount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}

Sample transactions:
${JSON.stringify(repDetails.sampleTransactions.map(t => ({
  account: t['Account Name'],
  spend: t.Spend,
  cost: t.Cost,
  profit: t.Profit,
  margin: t.Margin,
  packs: t.Packs
})), null, 2)}
` : ''}

When answering:
1. Be concise and specific, focusing on the data I've provided
2. If asked about specific numbers, provide the exact figures from the data above
3. When asked about top performers, specify which metric (profit, margin, packs) and include the actual values
4. If data isn't available for a specific question, acknowledge that
5. Always maintain a professional, helpful tone
6. DO NOT FORMAT YOUR RESPONSE WITH MARKDOWN like **, *, or ## symbols
7. Use plain text formatting with proper line breaks and paragraphs
8. Use simple formatting with dashes and numbers for lists
9. If responding about a specific rep, use proper paragraph breaks between sections
10. Do not mention the department unless specifically asked - just give combined results across all departments
11. For rep performance, combine data where they appear as both Rep and Sub-Rep
12. NEVER refer to Wholesale or REVA as sales reps - they are departments, not individuals

Sample of the general data (first few records):
${JSON.stringify(salesData?.slice(0, 3) || 'No data available')}
    `;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.5,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData?.error?.message || openAIResponse.statusText}`);
    }

    const data = await openAIResponse.json();
    const assistantReply = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        reply: assistantReply,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in rep-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
