
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

    try {
      // Extract any rep name mentioned in the message for detailed lookup
      const repNameMatch = message.match(/(?:about|on|for|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
      const repName = repNameMatch ? repNameMatch[1] : null;
      
      // If a specific rep is mentioned, get their details across all departments
      if (repName) {
        console.log(`Looking for data on rep: ${repName}`);
        
        const { data: repData, error: repError } = await supabase
          .from(tableName)
          .select('*')
          .ilike('Rep', `%${repName}%`);
        
        if (repError) {
          console.error(`Error fetching data for rep ${repName}:`, repError);
        } else if (repData && repData.length > 0) {
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
      
      // Get general sales data (limited sample)
      const { data: generalData, error: generalError } = await supabase
        .from(tableName)
        .select('*')
        .limit(20);
      
      if (generalError) {
        console.error('Error fetching general sales data:', generalError);
        throw generalError;
      }
      
      // Get top sales people by profit
      const { data: topByProfit, error: profitError } = await supabase
        .from(tableName)
        .select('Rep, Profit, Department')
        .order('Profit', { ascending: false })
        .limit(5);
      
      if (profitError) {
        console.error('Error fetching top sales by profit:', profitError);
        throw profitError;
      }
      
      // Get top sales people by margin
      const { data: topByMargin, error: marginError } = await supabase
        .from(tableName)
        .select('Rep, Margin, Department')
        .order('Margin', { ascending: false })
        .limit(5);
      
      if (marginError) {
        console.error('Error fetching top sales by margin:', marginError);
        throw marginError;
      }
      
      // Get top sales people by packs
      const { data: topByPacks, error: packsError } = await supabase
        .from(tableName)
        .select('Rep, Packs, Department')
        .order('Packs', { ascending: false })
        .limit(5);
      
      if (packsError) {
        console.error('Error fetching top sales by packs:', packsError);
        throw packsError;
      }
      
      // Get unique reps with aggregated data
      const { data: allReps, error: repsError } = await supabase.rpc('get_unique_reps_with_data', { 
        table_name: tableName 
      });
      
      if (repsError) {
        console.error('Error fetching all reps data:', repsError);
      }
      
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

${repDetails ? `
4. Specific details for ${repDetails.name}:

Key Performance Metrics (Combined across ${repDetails.departments.join(', ')} departments):
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
10. Do not mention the department unless specifically asked - just give combined results

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
