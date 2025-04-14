
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, responseType, userData } = await req.json();
    
    // Forward data to the webhook
    const webhookUrl = "https://jethro5.app.n8n.cloud/webhook-test/be5ddac3-2938-4dfb-9e32-4f37f96a4c11";
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        responseType,
        userData,
        timestamp: new Date().toISOString()
      }),
    });
    
    // Log the response from the webhook
    console.log("Webhook response status:", webhookResponse.status);
    
    // Create Supabase client with admin privileges using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Here we'll process depending on the responseType
    // For now, just return a basic response template based on type
    let responseContent = "";
    
    switch(responseType) {
      case 'concise':
        responseContent = `Here's a concise answer to your question about ${message.substring(0, 20)}...`;
        break;
      case 'visual':
        responseContent = `Here's a visual representation of data related to ${message.substring(0, 20)}...`;
        break;
      case 'deep-research':
        responseContent = `Here's an in-depth analysis of ${message.substring(0, 20)}...`;
        break;
      default:
        responseContent = `Here's what I found about ${message.substring(0, 20)}...`;
    }
    
    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        message: responseContent,
        type: responseType,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
