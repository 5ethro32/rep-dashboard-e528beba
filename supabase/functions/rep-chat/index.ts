
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

    // Fetch relevant sales data based on the selected month
    let salesData;
    try {
      const month = selectedMonth || 'March'; // Default to March if not specified
      const tableName = month.toLowerCase() === 'march' ? 'sales_data_march' : 'sales_data_februrary';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100); // Limit to prevent too much data being sent
      
      if (error) throw error;
      salesData = data;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      salesData = 'Unable to fetch sales data';
    }

    // Prepare a system prompt with data context
    const systemPrompt = `
You are a sales data analysis assistant specialized in helping sales managers understand their rep performance data.
You have access to sales data for ${selectedMonth || 'March'} 2025.

Here's a summary of the available data:
- Rep performance data includes reps' names, departments (Retail, REVA, Wholesale)
- Key metrics include: profit, margin percentage, packs sold, and spend
- The data compares performance between February and March 2025

When answering:
1. Be concise and specific, focusing on data insights
2. If asked about specific numbers, provide the exact figures when available
3. If you don't know or can't find specific data, acknowledge that
4. Always maintain a professional, helpful tone

Sample of the available data (first few records):
${JSON.stringify(salesData?.slice(0, 5) || 'No data available')}
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
