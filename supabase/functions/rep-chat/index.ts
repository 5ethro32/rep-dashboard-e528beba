
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

    // Determine which table to query based on selected month
    const month = selectedMonth || 'March'; // Default to March if not specified
    const tableName = month.toLowerCase() === 'march' ? 'sales_data_march' : 'sales_data_februrary';
    
    console.log(`Querying table: ${tableName} for month: ${month}`);
    
    // Get sales data for the specified month
    let salesData;
    let topSalesPeople;
    try {
      // Get general sales data
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
You are a sales data analysis assistant specialized in helping sales managers understand their rep performance data.
You have access to sales data for ${month} 2025.

Here's key information from the data:
1. Top performers by profit in ${month} 2025:
${JSON.stringify(topSalesPeople?.byProfit || 'Data unavailable', null, 2)}

2. Top performers by margin in ${month} 2025:
${JSON.stringify(topSalesPeople?.byMargin || 'Data unavailable', null, 2)}

3. Top performers by packs sold in ${month} 2025:
${JSON.stringify(topSalesPeople?.byPacks || 'Data unavailable', null, 2)}

When answering:
1. Be concise and specific, focusing on the data I've provided
2. If asked about specific numbers, provide the exact figures from the data above
3. When asked about top performers, specify which metric (profit, margin, packs) and include the actual values
4. If data isn't available for a specific question, acknowledge that
5. Always maintain a professional, helpful tone

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
