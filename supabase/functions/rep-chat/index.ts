
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
  bottomPerformersByProfit: any[];
  bottomPerformersByMargin: any[];
  departmentBreakdown: any;
}

// Determine if a string is a department name - case insensitive
const isDepartment = (name: string): boolean => {
  if (!name) return false;
  const upperName = name.toUpperCase();
  return ['RETAIL', 'REVA', 'WHOLESALE'].includes(upperName);
};

// Function to normalize department name - ensure consistent casing
const normalizeDepartmentName = (name: string): string => {
  if (!name) return '';
  const upperName = name.toUpperCase();
  
  if (upperName === 'RETAIL') return 'RETAIL';
  if (upperName === 'REVA') return 'REVA';
  if (upperName === 'WHOLESALE') return 'Wholesale'; // Keep original casing for Wholesale
  
  return name;
};

// Function to fetch all data from a table with pagination
const fetchAllData = async (supabase, tableName, options = {}) => {
  const PAGE_SIZE = 1000;
  let allData = [];
  let page = 0;
  let hasMoreData = true;
  
  console.log(`Fetching all data from ${tableName} with pagination...`);
  
  while (hasMoreData) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', options)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) {
      console.error(`Error fetching data from ${tableName}, page ${page}:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`Retrieved ${data.length} records from ${tableName}, page ${page}`);
      allData = [...allData, ...data];
      page++;
      
      // Check if we've fetched all available data
      hasMoreData = data.length === PAGE_SIZE;
    } else {
      hasMoreData = false;
    }
  }
  
  console.log(`Completed fetching all data from ${tableName}, total records: ${allData.length}`);
  return allData;
};

// Function to fetch all data from a specific department with pagination
const fetchDepartmentData = async (supabase, tableName, department) => {
  const PAGE_SIZE = 1000;
  let allData = [];
  let page = 0;
  let hasMoreData = true;
  
  // Normalize department name for consistent lookup
  const normalizedDept = normalizeDepartmentName(department);
  
  console.log(`Fetching all data for department ${normalizedDept} from ${tableName}...`);
  
  while (hasMoreData) {
    // Use ilike for case-insensitive matching
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .ilike('Department', normalizedDept)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) {
      console.error(`Error fetching ${normalizedDept} data from ${tableName}, page ${page}:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`Retrieved ${data.length} ${normalizedDept} records from ${tableName}, page ${page}`);
      allData = [...allData, ...data];
      page++;
      
      // Check if we've fetched all available data
      hasMoreData = data.length === PAGE_SIZE;
    } else {
      hasMoreData = false;
    }
  }
  
  console.log(`Completed fetching all ${normalizedDept} data from ${tableName}, total records: ${allData.length}`);
  return allData;
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

    // We'll always query both February and March tables regardless of selectedMonth
    const marchTableName = 'sales_data_march';
    const februaryTableName = 'sales_data_februrary';
    
    console.log(`Processing query: "${message}" for month: ${selectedMonth}`);
    
    // Initialize objects to store our data
    let marchData = [];
    let februaryData = [];
    let marchOverallMetrics = null;
    let februaryOverallMetrics = null;
    let repComparisons = {};
    let monthlyComparison = {};

    try {
      // Fetch data from both months
      console.log("Fetching data for both February and March...");
      
      // Direct function calls to get the total profit values
      const { data: retailProfitMarch, error: retailProfitMarchError } = await supabase.rpc('get_retail_profit');
      const { data: revaProfitMarch, error: revaProfitMarchError } = await supabase.rpc('get_reva_profit');
      const { data: wholesaleProfitMarch, error: wholesaleProfitMarchError } = await supabase.rpc('get_wholesale_profit');
      
      const marchTotalProfit = (retailProfitMarch || 0) + (revaProfitMarch || 0) + (wholesaleProfitMarch || 0);
      
      // Get February retail data
      let retailDataFeb = await fetchDepartmentData(supabase, februaryTableName, 'RETAIL');
      let revaDataFeb = await fetchDepartmentData(supabase, februaryTableName, 'REVA');
      let wholesaleDataFeb = await fetchDepartmentData(supabase, februaryTableName, 'Wholesale');
      
      // Calculate February total profit
      const retailProfitFeb = retailDataFeb.reduce((sum, item) => sum + Number(item.Profit || 0), 0);
      const revaProfitFeb = revaDataFeb.reduce((sum, item) => sum + Number(item.Profit || 0), 0);
      const wholesaleProfitFeb = wholesaleDataFeb.reduce((sum, item) => sum + Number(item.Profit || 0), 0);
      
      const febTotalProfit = retailProfitFeb + revaProfitFeb + wholesaleProfitFeb;
      
      // Get March retail data (for anything beyond just profit totals)
      let retailDataMarch = await fetchDepartmentData(supabase, marchTableName, 'RETAIL');
      let revaDataMarch = await fetchDepartmentData(supabase, marchTableName, 'REVA');
      let wholesaleDataMarch = await fetchDepartmentData(supabase, marchTableName, 'Wholesale');
      
      // Combine all February and March data
      februaryData = [...retailDataFeb, ...revaDataFeb, ...wholesaleDataFeb];
      marchData = [...retailDataMarch, ...revaDataMarch, ...wholesaleDataMarch];
      
      console.log(`Fetched ${marchData.length} records from March data and ${februaryData.length} records from February data`);
      
      // Calculate month-to-month differences
      const profitChange = marchTotalProfit - febTotalProfit;
      const profitChangePercent = febTotalProfit !== 0 ? (profitChange / febTotalProfit) * 100 : 0;
      
      monthlyComparison = {
        february: {
          totalProfit: febTotalProfit,
          retailProfit: retailProfitFeb,
          revaProfit: revaProfitFeb,
          wholesaleProfit: wholesaleProfitFeb
        },
        march: {
          totalProfit: marchTotalProfit,
          retailProfit: retailProfitMarch || 0,
          revaProfit: revaProfitMarch || 0,
          wholesaleProfit: wholesaleProfitMarch || 0
        },
        changes: {
          profit: profitChange,
          profitPercent: profitChangePercent
        }
      };
      
      console.log("Monthly comparison calculated:", {
        febProfit: febTotalProfit,
        marchProfit: marchTotalProfit,
        change: profitChange,
        changePercent: profitChangePercent
      });
      
      // Prepare rep-level comparisons
      // Process rep data from both months
      const febReps = processRepData(februaryData);
      const marchReps = processRepData(marchData);
      
      // For each rep in either month, calculate the changes
      const allReps = new Set([...Object.keys(febReps), ...Object.keys(marchReps)]);
      
      for (const rep of allReps) {
        if (!isDepartment(rep)) {
          const febData = febReps[rep] || { profit: 0, spend: 0 };
          const marchData = marchReps[rep] || { profit: 0, spend: 0 };
          
          const profitChange = marchData.profit - febData.profit;
          const profitChangePercent = febData.profit !== 0 ? (profitChange / febData.profit) * 100 : 0;
          
          repComparisons[rep] = {
            february: febData,
            march: marchData,
            changes: {
              profit: profitChange,
              profitPercent: profitChangePercent
            }
          };
        }
      }
      
      // Create a list of top performers by profit increase
      const topPerformersByProfitIncrease = Object.entries(repComparisons)
        .filter(([rep, data]) => data.changes.profit > 0)
        .sort((a, b) => b[1].changes.profit - a[1].changes.profit)
        .slice(0, 5)
        .map(([rep, data]) => ({
          rep,
          febProfit: data.february.profit,
          marchProfit: data.march.profit,
          increase: data.changes.profit,
          percentIncrease: data.changes.profitPercent
        }));
      
      // Create a list of worst performers by profit decrease
      const worstPerformersByProfitDecrease = Object.entries(repComparisons)
        .filter(([rep, data]) => data.changes.profit < 0)
        .sort((a, b) => a[1].changes.profit - b[1].changes.profit)
        .slice(0, 5)
        .map(([rep, data]) => ({
          rep,
          febProfit: data.february.profit,
          marchProfit: data.march.profit,
          decrease: Math.abs(data.changes.profit),
          percentDecrease: Math.abs(data.changes.profitPercent)
        }));
      
      console.log("Comparison data prepared successfully");
      
    } catch (error) {
      console.error('Error processing sales data:', error);
      throw new Error(`Unable to process sales data: ${error.message}`);
    }

    // Check if the message is specifically asking for a comparison
    const isComparison = /compar|diff|change|growth|vs|versus|against|month.{0,5}month/i.test(message);
    
    // Decide if we're looking for profits specifically
    const isProfitQuery = /profit|earn|revenue|money|make|made|performance/i.test(message);

    // Prepare a system prompt with data context
    const systemPrompt = `
You are Vera, a sales data analysis assistant specialized in helping sales managers understand their rep performance data.
You have access to sales data for both February and March 2025.

Here's key information from the data:

COMPARISON BETWEEN FEBRUARY AND MARCH 2025:

February 2025 Total Profit: ${monthlyComparison.february.totalProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}
- Retail: ${monthlyComparison.february.retailProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}
- REVA: ${monthlyComparison.february.revaProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}
- Wholesale: ${monthlyComparison.february.wholesaleProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}

March 2025 Total Profit: ${monthlyComparison.march.totalProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}
- Retail: ${monthlyComparison.march.retailProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}
- REVA: ${monthlyComparison.march.revaProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}
- Wholesale: ${monthlyComparison.march.wholesaleProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}

Change in Total Profit: ${monthlyComparison.changes.profit > 0 ? "+" : ""}${monthlyComparison.changes.profit.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})} (${monthlyComparison.changes.profitPercent.toFixed(2)}%)

Top Performing Reps (Profit Increase Feb to March):
${JSON.stringify(topPerformersByProfitIncrease || [])}

Worst Performing Reps (Profit Decrease Feb to March):
${JSON.stringify(worstPerformersByProfitDecrease || [])}

When answering:
1. Be extremely CONCISE and DIRECT - only provide exactly what was asked for
2. If asked about specific numbers, provide the exact figures from the data above
3. When asked about top or worst performers, specify which metric (profit, margin) and include the actual values
4. If data isn't available for a specific question, acknowledge that
5. DO NOT provide ANY sample transactions or unnecessary details that weren't asked for
6. NEVER FORMAT YOUR RESPONSE WITH MARKDOWN or any formatting symbols
7. Use plain text formatting with proper line breaks and paragraphs
8. If responding about a specific rep, use proper paragraph breaks between sections
9. Do not mention the department unless specifically asked - just give combined results across all departments

IMPORTANT FORMATTING RULES:
- ALWAYS use £ (pound sterling) as currency symbol, not $ or any other currency
- Never use any markdown formatting such as bold, italic, or headers
- Never use any special characters like ** or ## for formatting
- Format large numbers with commas for readability (e.g., £1,234,567.89)
- When giving percentages, always include the % symbol (e.g., 12.34%)

${isComparison ? 'This question is specifically asking for a comparison between February and March data, so please focus on the differences between these two months.' : ''}
${isProfitQuery ? 'This question is specifically asking about profit figures, so focus on those numbers in your answer.' : ''}

The current user query is: "${message}"
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

// Helper function to process rep data
function processRepData(data) {
  const repMap = {};
  
  // Process all records to get rep totals
  for (const record of data) {
    // Skip if no rep name
    if (!record.Rep) continue;
    
    // Handle rep name (combine data for sub-reps)
    const repName = record.Rep;
    const subRep = record["Sub-Rep"];
    const isSubRep = Boolean(subRep && subRep.trim() !== '');
    
    // If this is a department name, skip it
    if (isDepartment(repName)) continue;
    
    // Process main rep
    if (!repMap[repName]) {
      repMap[repName] = {
        profit: 0,
        spend: 0,
        packs: 0,
        accounts: new Set()
      };
    }
    
    repMap[repName].profit += Number(record.Profit || 0);
    repMap[repName].spend += Number(record.Spend || 0);
    repMap[repName].packs += Number(record.Packs || 0);
    if (record["Account Ref"]) repMap[repName].accounts.add(record["Account Ref"]);
    
    // Process sub-rep if exists
    if (isSubRep) {
      if (!repMap[subRep]) {
        repMap[subRep] = {
          profit: 0,
          spend: 0,
          packs: 0,
          accounts: new Set()
        };
      }
      
      repMap[subRep].profit += Number(record.Profit || 0);
      repMap[subRep].spend += Number(record.Spend || 0);
      repMap[subRep].packs += Number(record.Packs || 0);
      if (record["Account Ref"]) repMap[subRep].accounts.add(record["Account Ref"]);
    }
  }
  
  // Convert account sets to counts
  for (const rep in repMap) {
    repMap[rep].accountCount = repMap[rep].accounts.size;
    // Calculate margin
    repMap[rep].margin = repMap[rep].spend > 0 
      ? (repMap[rep].profit / repMap[rep].spend) * 100 
      : 0;
  }
  
  return repMap;
}
