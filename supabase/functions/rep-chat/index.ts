
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  selectedMonth: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { message, selectedMonth = 'March' } = await req.json() as ChatRequest;
    
    // Choose the right table based on selected month
    const tableName = selectedMonth === 'March' ? 'sales_data_march' : 'sales_data_februrary';
    console.log(`Processing query for ${tableName}: ${message}`);
    
    // Get summary metrics for context
    const { data: profitSummary, error: profitError } = await supabase.rpc('get_department_profit', { 
      dept: 'RETAIL'
    });
    
    const { data: revaProfitSummary, error: revaProfitError } = await supabase.rpc('get_reva_profit');
    const { data: wholesaleProfitSummary, error: wholesaleProfitError } = await supabase.rpc('get_wholesale_profit');
    
    if (profitError || revaProfitError || wholesaleProfitError) {
      console.error("Error fetching department profits:", profitError || revaProfitError || wholesaleProfitError);
    }
    
    const departmentProfits = {
      RETAIL: profitSummary || 0,
      REVA: revaProfitSummary || 0,
      Wholesale: wholesaleProfitSummary || 0,
      Total: (profitSummary || 0) + (revaProfitSummary || 0) + (wholesaleProfitSummary || 0)
    };
    
    // Fetch all reps for reference
    const { data: repData, error: repError } = await supabase
      .from(tableName)
      .select('Rep, "Sub-Rep", Department, "Account Name", "Account Ref", Profit, Spend, Packs, Margin')
      .order('Profit', { ascending: false });
      
    if (repError) {
      console.error("Error fetching rep data:", repError);
      throw new Error(`Failed to fetch rep data: ${repError.message}`);
    }
    
    // Extract data for specific department queries
    const retailData = repData?.filter(item => item.Department === 'RETAIL') || [];
    const revaData = repData?.filter(item => item.Department === 'REVA') || [];
    const wholesaleData = repData?.filter(item => item.Department === 'Wholesale') || [];
    
    // Get account-level data for customer queries
    const accountData = repData?.reduce((acc: Record<string, any>, item) => {
      const accountRef = item["Account Ref"];
      if (accountRef && !acc[accountRef]) {
        acc[accountRef] = {
          accountName: item["Account Name"],
          accountRef: accountRef,
          profit: 0,
          spend: 0,
          packs: 0,
        };
      }
      
      if (accountRef) {
        acc[accountRef].profit += Number(item.Profit || 0);
        acc[accountRef].spend += Number(item.Spend || 0);
        acc[accountRef].packs += Number(item.Packs || 0);
      }
      
      return acc;
    }, {});
    
    // Calculate top accounts by profit
    const topAccounts = Object.values(accountData || {})
      .sort((a: any, b: any) => b.profit - a.profit)
      .slice(0, 10);
    
    // Calculate sub-rep performance for department-specific queries
    const subRepPerformance: Record<string, Record<string, any>> = {};
    
    // Process sub-rep data for REVA
    revaData.forEach(item => {
      const subRep = item["Sub-Rep"];
      if (subRep) {
        if (!subRepPerformance[subRep]) {
          subRepPerformance[subRep] = {
            REVA: { profit: 0, spend: 0, packs: 0 },
            Wholesale: { profit: 0, spend: 0, packs: 0 },
            Total: { profit: 0, spend: 0, packs: 0 }
          };
        }
        
        subRepPerformance[subRep].REVA.profit += Number(item.Profit || 0);
        subRepPerformance[subRep].REVA.spend += Number(item.Spend || 0);
        subRepPerformance[subRep].REVA.packs += Number(item.Packs || 0);
        
        subRepPerformance[subRep].Total.profit += Number(item.Profit || 0);
        subRepPerformance[subRep].Total.spend += Number(item.Spend || 0);
        subRepPerformance[subRep].Total.packs += Number(item.Packs || 0);
      }
    });
    
    // Process sub-rep data for Wholesale
    wholesaleData.forEach(item => {
      const subRep = item["Sub-Rep"];
      if (subRep) {
        if (!subRepPerformance[subRep]) {
          subRepPerformance[subRep] = {
            REVA: { profit: 0, spend: 0, packs: 0 },
            Wholesale: { profit: 0, spend: 0, packs: 0 },
            Total: { profit: 0, spend: 0, packs: 0 }
          };
        }
        
        subRepPerformance[subRep].Wholesale.profit += Number(item.Profit || 0);
        subRepPerformance[subRep].Wholesale.spend += Number(item.Spend || 0);
        subRepPerformance[subRep].Wholesale.packs += Number(item.Packs || 0);
        
        subRepPerformance[subRep].Total.profit += Number(item.Profit || 0);
        subRepPerformance[subRep].Total.spend += Number(item.Spend || 0);
        subRepPerformance[subRep].Total.packs += Number(item.Packs || 0);
      }
    });
    
    // Calculate individual retail rep performance
    const retailRepPerformance: Record<string, any> = {};
    
    retailData.forEach(item => {
      const rep = item.Rep;
      if (!retailRepPerformance[rep]) {
        retailRepPerformance[rep] = {
          profit: 0,
          spend: 0,
          packs: 0
        };
      }
      
      retailRepPerformance[rep].profit += Number(item.Profit || 0);
      retailRepPerformance[rep].spend += Number(item.Spend || 0);
      retailRepPerformance[rep].packs += Number(item.Packs || 0);
    });
    
    // Format the data for OpenAI
    const formattedSummary = `
    Department Profits for ${selectedMonth} 2025:
    - RETAIL: £${departmentProfits.RETAIL.toLocaleString()}
    - REVA: £${departmentProfits.REVA.toLocaleString()}
    - Wholesale: £${departmentProfits.Wholesale.toLocaleString()}
    - Total: £${departmentProfits.Total.toLocaleString()}
    
    Sub-Rep Performance by Department:
    ${Object.entries(subRepPerformance).map(([rep, data]) => `
    * ${rep}:
      - REVA Profit: £${data.REVA.profit.toLocaleString()}
      - Wholesale Profit: £${data.Wholesale.profit.toLocaleString()}
      - Total Profit: £${data.Total.profit.toLocaleString()}
    `).join('')}
    
    Top Accounts by Profit:
    ${topAccounts.slice(0, 5).map((account: any, index: number) => 
      `${index + 1}. ${account.accountName} (${account.accountRef}): £${account.profit.toLocaleString()}`
    ).join('\n')}
    
    Account Reference Mapping (first 10 examples):
    ${Object.values(accountData || {}).slice(0, 10).map((account: any) => 
      `- ${account.accountName} → ${account.accountRef}`
    ).join('\n')}
    `;

    // Without using the OpenAI API directly, we'll generate a simple response
    // based on the user's query
    let reply = "I don't have enough information to answer that query.";
    
    // Simple keyword matching for basic questions
    const query = message.toLowerCase();

    // Department profit queries
    if (query.includes('reva profit') || query.includes('reva department profit')) {
      reply = `The total REVA profit for ${selectedMonth} 2025 is £${departmentProfits.REVA.toLocaleString()}.`;
    } 
    else if (query.includes('wholesale profit') || query.includes('wholesale department profit')) {
      reply = `The total Wholesale profit for ${selectedMonth} 2025 is £${departmentProfits.Wholesale.toLocaleString()}.`;
    }
    else if (query.includes('retail profit') || query.includes('retail department profit')) {
      reply = `The total Retail profit for ${selectedMonth} 2025 is £${departmentProfits.RETAIL.toLocaleString()}.`;
    }
    else if (query.includes('total profit')) {
      reply = `The total profit across all departments for ${selectedMonth} 2025 is £${departmentProfits.Total.toLocaleString()}.`;
    }
    // General rep profit queries - handle any rep name
    else if (query.includes('profit') && !query.includes('department') && !query.includes('wholesale') && !query.includes('reva')) {
      // Extract potential rep name from the query
      const repQuery = query.replace("'s profit", "").replace("profit", "").trim();
      let foundRep = false;

      // Check retail reps
      for (const rep in retailRepPerformance) {
        if (rep.toLowerCase().includes(repQuery)) {
          reply = `${rep}'s retail profit for ${selectedMonth} 2025 is £${retailRepPerformance[rep].profit.toLocaleString()}.`;
          foundRep = true;
          break;
        }
      }

      // Check sub-reps
      if (!foundRep) {
        for (const rep in subRepPerformance) {
          if (rep.toLowerCase().includes(repQuery)) {
            const totalProfit = subRepPerformance[rep].Total.profit;
            reply = `${rep}'s total profit for ${selectedMonth} 2025 is £${totalProfit.toLocaleString()}.`;
            foundRep = true;
            break;
          }
        }
      }

      if (!foundRep) {
        reply = `I couldn't find profit data for "${repQuery}" in the ${selectedMonth} 2025 data.`;
      }
    }
    // Sub-rep specific queries
    else if (query.includes('craig') && query.includes('wholesale')) {
      const craigData = subRepPerformance['Craig'];
      if (craigData && craigData.Wholesale) {
        reply = `Craig's wholesale profit for ${selectedMonth} 2025 is £${craigData.Wholesale.profit.toLocaleString()}.`;
      } else {
        reply = `I don't have data for Craig in the Wholesale department for ${selectedMonth} 2025.`;
      }
    }
    else if (query.includes('craig') && query.includes('reva')) {
      const craigData = subRepPerformance['Craig'];
      if (craigData && craigData.REVA) {
        reply = `Craig's REVA profit for ${selectedMonth} 2025 is £${craigData.REVA.profit.toLocaleString()}.`;
      } else {
        reply = `I don't have data for Craig in the REVA department for ${selectedMonth} 2025.`;
      }
    }
    else if (query.includes('craig') && query.includes('sales')) {
      const craigData = subRepPerformance['Craig'];
      if (craigData) {
        reply = `Craig's sales performance for ${selectedMonth} 2025:\n
- REVA Profit: £${craigData.REVA.profit.toLocaleString()}
- REVA Revenue: £${craigData.REVA.spend.toLocaleString()}
- Wholesale Profit: £${craigData.Wholesale.profit.toLocaleString()}
- Wholesale Revenue: £${craigData.Wholesale.spend.toLocaleString()}
- Total Profit: £${craigData.Total.profit.toLocaleString()}
- Total Revenue: £${craigData.Total.spend.toLocaleString()}`;
      } else {
        reply = `I don't have sales data for Craig for ${selectedMonth} 2025.`;
      }
    }
    // Account queries
    else if (query.includes('account') && query.includes('knightswood')) {
      const knightswoodAccount = Object.values(accountData || {}).find(
        (account: any) => account.accountName && account.accountName.toLowerCase().includes('knightswood')
      );
      
      if (knightswoodAccount) {
        reply = `The account number for Knightswood is ${knightswoodAccount.accountRef}.`;
      } else {
        reply = `I couldn't find an account with the name Knightswood in the ${selectedMonth} 2025 data.`;
      }
    }
    // Top performers query
    else if (query.includes('top performer') || query.includes('best performer')) {
      const topSubReps = Object.entries(subRepPerformance)
        .map(([name, data]) => ({ name, profit: data.Total.profit }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 3);
        
      reply = `The top performers for ${selectedMonth} 2025 are:\n${
        topSubReps.map((rep, i) => `${i + 1}. ${rep.name} with a profit of £${rep.profit.toLocaleString()}`).join('\n')
      }`;
    }
    // Fallback response
    else {
      reply = `I'm not sure how to answer that question about the ${selectedMonth} 2025 data. You can ask me about department profits, specific reps like Craig, account numbers, or top performers.`;
    }

    // Return the response
    return new Response(
      JSON.stringify({ reply }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
