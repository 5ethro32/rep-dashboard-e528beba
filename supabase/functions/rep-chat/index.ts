
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    // Prepare the OpenAI API
    const configuration = new Configuration({ apiKey: openAIApiKey });
    const openai = new OpenAIApi(configuration);

    // Prepare the messages for the chat completion
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: "system",
        content: `You are Vera, a financial data assistant for a pharmaceutical sales company.
        
        You can answer questions about sales performance data for ${selectedMonth} 2025.
        
        The data includes:
        1. Rep performance across different departments (RETAIL, REVA, Wholesale)
        2. Sub-Rep performance within REVA and Wholesale departments
        3. Customer/account data with Account Names and Account References
        
        Important context:
        - The "Rep" column contains the main rep name or department name (RETAIL, REVA, Wholesale)
        - The "Sub-Rep" column contains individual reps working within REVA or Wholesale departments
        - When asked about specific reps (like "Craig's wholesale profit"), look for data where the Department is "Wholesale" and the Sub-Rep is "Craig"
        - The "Account Ref" is the customer account number (e.g., KN002 is the account number for "Knightswood Pharmacy")
        - The "Account Name" contains the customer/shop name
        
        Be concise and specific in your answers. Format currency values with pound sign (£) and use comma separators for thousands. Round numbers appropriately for readability.
        
        When asked about customers or accounts:
        - If asked about a "top customer," assume they mean by profit unless specified otherwise
        - If asked for an "account number," provide the Account Ref for the specified Account Name
        - If asked about a specific customer, search for partial matches in the Account Name field
        
        Here's the current data summary to help you answer questions:
        ${formattedSummary}`
      },
      {
        role: "user",
        content: message
      }
    ];

    // Call the OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview", // Use the latest model that's available
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const reply = completion.data.choices[0].message?.content || "I'm sorry, I couldn't process your request.";

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
