import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// Define our own ChatCompletionRequestMessage type instead of importing it
interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RepData {
  repName: string;
  totalSpend: number;
  totalProfit: number;
  margin: number;
  departments: string[];
}

interface CustomerData {
  accountRef: string;
  accountName: string;
  profit: number;
  spend: number;
  margin: number;
  department: string;
}

interface DatabaseTables {
  march: string;
  february: string;
  april: string;
}

const TABLES: DatabaseTables = {
  march: "sales_data",
  february: "sales_data_februrary",
  april: "mtd_daily",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Parse request body
    const requestData = await req.json();
    const { message, originalMessage, selectedMonth, conversationContext } = requestData;

    console.log(`Processing user message: ${originalMessage}\n`);
    console.log("Conversation context:", JSON.stringify(conversationContext, null, 2));

    // Process the month selection - default to March if not specified
    const month = (selectedMonth || "march").toLowerCase();
    const tableName = TABLES[month] || "sales_data"; // Default to March data

    // Extract entities from the message
    const entities = extractEntities(message);
    console.log("Extracted entities:", JSON.stringify(entities, null, 2));

    // Check if the query requires AI analysis
    const requiresAnalysis = requiresAIAnalysis(message, entities);
    
    // Check if the query is about a specific rep's customers
    const isCustomerQuery = message.toLowerCase().includes("customer") || 
                           originalMessage.toLowerCase().includes("customer");
    const isRepSpecific = entities.repNames.length > 0;
    
    // Check if the query is about top performers
    const isTopPerformersQuery = 
      originalMessage.toLowerCase().includes("top") && 
      (originalMessage.toLowerCase().includes("performer") ||
       originalMessage.toLowerCase().includes("rep") ||
       originalMessage.toLowerCase().includes("sales"));
    
    let response = "";
    let chartData = null;
    let chartType = null;
    let tableData = null;
    let tableHeaders = null;
    let insights = null;
    let trends = null;
    let highlightedEntities = null;

    // Handle AI analysis queries first (new feature)
    if (requiresAnalysis) {
      try {
        // Get the current month data
        let currentMonthData;
        if (month === "february") {
          currentMonthData = await fetchMonthlyData(supabaseClient, "sales_data_februrary");
        } else if (month === "april") {
          currentMonthData = await fetchMonthlyData(supabaseClient, "mtd_daily");
        } else {
          // Default to March
          currentMonthData = await fetchMonthlyData(supabaseClient, "sales_data");
        }
        
        // Get the previous month data for comparison
        let previousMonth = "";
        let previousMonthData;
        
        if (month === "february") {
          previousMonth = "January";
          // We don't have January data, so provide a placeholder response
          response = "I cannot analyze why metrics changed in February as I don't have access to January data for comparison.";
          
          // Create generic insights based on February data alone
          const febMetrics = calculateOverallMetrics(currentMonthData, TABLES.february);
          insights = [
            `February's total profit was £${febMetrics.totalProfit.toFixed(2)}`,
            `February's average margin was ${febMetrics.averageMargin.toFixed(1)}%`,
            `February had ${febMetrics.activeAccounts} active accounts`
          ];
        } else if (month === "march") {
          previousMonth = "February";
          previousMonthData = await fetchMonthlyData(supabaseClient, "sales_data_februrary");
          
          // If we have OpenAI API key, analyze with AI
          const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
          if (openAIApiKey) {
            const aiResponse = await analyzeWithAI(
              currentMonthData, 
              previousMonthData, 
              month, 
              previousMonth, 
              message,
              openAIApiKey
            );
            
            response = aiResponse.text;
            insights = aiResponse.insights;
            
            // Generate basic chart data showing month-over-month change
            chartData = [
              { name: previousMonth, value: calculateOverallMetrics(previousMonthData, TABLES.february).totalProfit },
              { name: month, value: calculateOverallMetrics(currentMonthData, TABLES.march).totalProfit }
            ];
            chartType = "bar";
          } else {
            // Fallback if no OpenAI API key is available
            response = analyzeMonthlyChange(currentMonthData, previousMonthData, "March", "February");
            
            // Create basic insights
            const marchMetrics = calculateOverallMetrics(currentMonthData, TABLES.march);
            const febMetrics = calculateOverallMetrics(previousMonthData, TABLES.february);
            
            const profitChange = ((marchMetrics.totalProfit - febMetrics.totalProfit) / febMetrics.totalProfit) * 100;
            const marginChange = marchMetrics.averageMargin - febMetrics.averageMargin;
            
            insights = [
              `Profit ${profitChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(profitChange).toFixed(1)}% from February to March`,
              `Margin ${marginChange >= 0 ? 'improved' : 'declined'} by ${Math.abs(marginChange).toFixed(1)} percentage points`,
              `Active accounts ${marchMetrics.activeAccounts >= febMetrics.activeAccounts ? 'increased' : 'decreased'} from ${febMetrics.activeAccounts} to ${marchMetrics.activeAccounts}`
            ];
          }
        } else if (month === "april") {
          previousMonth = "March";
          // Use march_rolling table for comparison
          previousMonthData = await fetchMarRollingData(supabaseClient);
          
          if (!previousMonthData || previousMonthData.length === 0) {
            // Fallback to standard March data if march_rolling isn't available
            previousMonthData = await fetchMonthlyData(supabaseClient, "sales_data");
          }
          
          // If we have OpenAI API key, analyze with AI
          const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
          if (openAIApiKey) {
            const aiResponse = await analyzeWithAI(
              currentMonthData, 
              previousMonthData, 
              month, 
              previousMonth, 
              message,
              openAIApiKey
            );
            
            response = aiResponse.text;
            insights = aiResponse.insights;
            
            // Generate basic chart data showing month-over-month change
            chartData = [
              { name: previousMonth, value: calculateOverallMetrics(previousMonthData, "march_rolling").totalProfit },
              { name: month, value: calculateOverallMetrics(currentMonthData, TABLES.april).totalProfit }
            ];
            chartType = "bar";
          } else {
            // Fallback if no OpenAI API key is available
            response = analyzeMonthlyChange(currentMonthData, previousMonthData, "April", "March");
            
            // Create basic insights
            const aprMetrics = calculateOverallMetrics(currentMonthData, TABLES.april);
            const marchMetrics = calculateOverallMetrics(previousMonthData, "march_rolling");
            
            const profitChange = ((aprMetrics.totalProfit - marchMetrics.totalProfit) / marchMetrics.totalProfit) * 100;
            const marginChange = aprMetrics.averageMargin - marchMetrics.averageMargin;
            
            insights = [
              `Profit ${profitChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(profitChange).toFixed(1)}% from March to April`,
              `Margin ${marginChange >= 0 ? 'improved' : 'declined'} by ${Math.abs(marginChange).toFixed(1)} percentage points`,
              `Active accounts ${aprMetrics.activeAccounts >= marchMetrics.activeAccounts ? 'increased' : 'decreased'} from ${marchMetrics.activeAccounts} to ${aprMetrics.activeAccounts}`
            ];
          }
        }
        
      } catch (error) {
        console.error('Error analyzing data:', error);
        response = `I encountered an error while analyzing the data. Please try again or ask a more specific question.`;
      }
    }
    // Handle specific query types
    else if (isTopPerformersQuery) {
      // Handle query about top performers
      try {
        const topRepsByProfit = await getTopRepsByProfit(supabaseClient, tableName, month, 5);
        
        if (topRepsByProfit && topRepsByProfit.length > 0) {
          response = `Here are the top performers by profit for ${selectedMonth}:\n\n`;
          
          tableHeaders = ["Rep", "Profit", "Spend", "Margin"];
          tableData = topRepsByProfit.map(rep => ({
            rep: rep.repName,
            profit: `£${rep.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            spend: `£${rep.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            margin: `${rep.margin.toFixed(1)}%`
          }));
          
          // Create chart data for visualization
          chartData = topRepsByProfit.map(rep => ({
            name: rep.repName.length > 10 ? 
              rep.repName.substring(0, 10) + "..." : 
              rep.repName,
            value: rep.totalProfit
          }));
          
          // Create insights
          const topRep = topRepsByProfit[0];
          const secondRep = topRepsByProfit[1];
          const totalProfit = topRepsByProfit.reduce((sum, rep) => sum + rep.totalProfit, 0);
          const topRepPercentage = (topRep.totalProfit / totalProfit * 100).toFixed(1);
          
          insights = [
            `${topRep.repName} is the top performer with £${topRep.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} profit`,
            `${topRep.repName} accounts for ${topRepPercentage}% of the total profit among top performers`,
            `${topRep.repName} is leading ${secondRep.repName} by £${(topRep.totalProfit - secondRep.totalProfit).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
          ];
          
          // Add highlighted entities
          highlightedEntities = [
            { type: 'rep', name: 'Top Rep', value: topRep.repName },
            { type: 'metric', name: 'Profit', value: `£${topRep.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
            { type: 'metric', name: 'Margin', value: `${topRep.margin.toFixed(1)}%` }
          ];
        } else {
          response = `I don't have any performance data for ${selectedMonth}.`;
        }
      } catch (error) {
        console.error('Error getting top performers:', error);
        response = `I encountered an error while trying to get the top performers for ${selectedMonth}.`;
      }
    } else if (isRepSpecific && isCustomerQuery) {
      // Handle rep-specific customer queries (e.g., "Show me Craig's most profitable customers")
      const repName = entities.repNames[0];
      const customerData = await getRepTopCustomers(supabaseClient, repName, tableName);
      
      if (customerData && customerData.length > 0) {
        response = `Here are ${repName}'s top customers by profit:\n`;
        
        tableHeaders = ["Customer", "Profit", "Spend", "Margin", "Department"];
        tableData = customerData.map(customer => ({
          customer: customer.accountName, 
          profit: `£${customer.profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
          spend: `£${customer.spend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
          margin: `${customer.margin.toFixed(1)}%`,
          department: customer.department
        }));
        
        // Create chart data for visualization
        chartData = customerData.slice(0, 5).map(customer => ({
          name: customer.accountName.length > 10 ? 
            customer.accountName.substring(0, 10) + "..." : 
            customer.accountName,
          value: customer.profit
        }));
        
        // Extract insights
        const topProfit = customerData[0].profit;
        const totalProfit = customerData.reduce((sum, c) => sum + c.profit, 0);
        const topCustomerPercentage = (topProfit / totalProfit * 100).toFixed(1);
        
        insights = [
          `${repName}'s top customer represents ${topCustomerPercentage}% of their total profit`,
          `${repName} serves ${customerData.length} profitable customers`,
          `The average profit per customer is £${(totalProfit / customerData.length).toFixed(2)}`
        ];
        
        // Add highlighted entities
        highlightedEntities = [
          { type: 'rep', name: 'Rep', value: repName },
          { type: 'metric', name: 'Total Profit', value: `£${totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
          { type: 'customer', name: 'Top Customer', value: customerData[0].accountName }
        ];
      } else {
        // Handle case where no data is found
        response = `I don't have any customer data for ${repName} in ${month}.`;
      }
    } else {
      // Handle other query types (this code already exists)
      // Fetch the appropriate monthly data based on the request
      if (month === "february") {
        console.log(`Fetching data for february from sales_data_februrary...\n`);
        const februaryData = await fetchMonthlyData(supabaseClient, "sales_data_februrary");
      } else if (month === "april") {
        console.log(`Fetching data for april from mtd_daily...\n`);
        const aprilData = await fetchMonthlyData(supabaseClient, "mtd_daily");
      } else {
        // Default to March
        console.log(`Fetching data for march from sales_data...\n`);
        const marchData = await fetchMonthlyData(supabaseClient, "sales_data");
      }

      // Default response if no specific handlers match
      response = `I don't have information about that query for ${selectedMonth}. You can ask me about top performers, specific reps, customers, or ask analytical questions like "Why did profit increase in April?".`;
    }

    // Determine the question type for better response formatting
    const questionType = determineQuestionType(entities);

    // Return the response with any visualization data
    return new Response(
      JSON.stringify({
        response,
        chartData,
        chartType: chartType || "bar",
        tableData,
        tableHeaders,
        insights,
        trends,
        highlightedEntities,
        entities,
        questionType,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper function to analyze data with OpenAI
async function analyzeWithAI(
  currentMonthData: any[],
  previousMonthData: any[],
  currentMonth: string,
  previousMonth: string,
  query: string,
  apiKey: string
): Promise<{ text: string; insights: string[] }> {
  try {
    // Format data for the prompt
    const prompt = formatDataForAIAnalysis(
      currentMonthData,
      previousMonthData,
      currentMonth,
      previousMonth,
      query
    );
    
    console.log("Sending prompt to OpenAI:", prompt.substring(0, 200) + "...");

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a sales analytics assistant. Analyze the sales data provided and give clear, concise insights. Focus on the most important factors that explain changes in performance. Provide 3-5 key insights that would be valuable to sales managers." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected OpenAI response:", data);
      throw new Error("Received invalid response from OpenAI");
    }
    
    const aiResponse = data.choices[0].message.content;
    console.log("AI Response received:", aiResponse.substring(0, 200) + "...");
    
    // Extract 3-5 key insights from the AI response
    const insights = extractInsightsFromResponse(aiResponse);
    
    return {
      text: aiResponse,
      insights: insights.length > 0 ? insights : [
        "Analysis provided by AI based on monthly comparison",
        "Performance metrics show changes between months", 
        "Consider investigating top performers for additional insights"
      ]
    };
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return {
      text: `I encountered an error while analyzing the data. The analysis feature may not be properly configured.`,
      insights: [
        "Error occurred during analysis",
        "Check OpenAI API key configuration",
        "Try asking a different type of question"
      ]
    };
  }
}

// Helper function to extract insights from AI response
function extractInsightsFromResponse(response: string): string[] {
  // Look for bullet points or numbered lists in the response
  const bulletPointRegex = /[•\-\*]\s+([^\n]+)/g;
  const numberedListRegex = /\d+\.\s+([^\n]+)/g;
  
  const bulletPoints = [...response.matchAll(bulletPointRegex)].map(match => match[1]);
  const numberedItems = [...response.matchAll(numberedListRegex)].map(match => match[1]);
  
  // Combine all found insights
  let insights = [...bulletPoints, ...numberedItems];
  
  // If no structured insights found, try to extract sentences
  if (insights.length === 0) {
    const sentences = response
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && s.length < 100); // Filter to reasonable insight length
      
    insights = sentences.slice(0, 5); // Take up to 5 sentences
  }
  
  // Limit to at most 5 insights
  return insights.slice(0, 5);
}

// Helper function to analyze monthly changes without AI
function analyzeMonthlyChange(
  currentMonthData: any[], 
  previousMonthData: any[], 
  currentMonth: string, 
  previousMonth: string
): string {
  try {
    // Calculate summary metrics for current month
    const currentTotalSpend = currentMonthData.reduce((sum, item) => sum + (Number(item.Spend || item.spend) || 0), 0);
    const currentTotalProfit = currentMonthData.reduce((sum, item) => sum + (Number(item.Profit || item.profit) || 0), 0);
    const currentMargin = currentTotalSpend > 0 ? (currentTotalProfit / currentTotalSpend) * 100 : 0;
    
    // Calculate summary metrics for previous month
    const prevTotalSpend = previousMonthData.reduce((sum, item) => sum + (Number(item.Spend || item.spend) || 0), 0);
    const prevTotalProfit = previousMonthData.reduce((sum, item) => sum + (Number(item.Profit || item.profit) || 0), 0);
    const prevMargin = prevTotalSpend > 0 ? (prevTotalProfit / prevTotalSpend) * 100 : 0;
    
    // Calculate changes
    const profitChange = prevTotalProfit > 0 ? 
      ((currentTotalProfit - prevTotalProfit) / prevTotalProfit) * 100 : 0;
    const spendChange = prevTotalSpend > 0 ? 
      ((currentTotalSpend - prevTotalSpend) / prevTotalSpend) * 100 : 0;
    const marginChange = currentMargin - prevMargin;

    // Generate summary text
    let analysis = `Here's my analysis of the changes from ${previousMonth} to ${currentMonth}:\n\n`;
    analysis += `Overall profit ${profitChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(profitChange).toFixed(1)}%, `;
    analysis += `from £${prevTotalProfit.toFixed(2)} to £${currentTotalProfit.toFixed(2)}.\n\n`;
    
    analysis += `Total sales ${spendChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(spendChange).toFixed(1)}%, `;
    analysis += `from £${prevTotalSpend.toFixed(2)} to £${currentTotalSpend.toFixed(2)}.\n\n`;
    
    analysis += `Overall margin ${marginChange >= 0 ? 'improved' : 'declined'} from ${prevMargin.toFixed(1)}% `;
    analysis += `to ${currentMargin.toFixed(1)}%, a change of ${Math.abs(marginChange).toFixed(1)} percentage points.\n\n`;
    
    // Try to identify top performers in the current month
    const repMap = new Map();
    currentMonthData.forEach(item => {
      const repName = item.Rep || item.rep_name;
      if (!repName || ['RETAIL', 'REVA', 'Wholesale'].includes(repName)) return;
      
      if (!repMap.has(repName)) {
        repMap.set(repName, { profit: 0 });
      }
      
      repMap.get(repName).profit += Number(item.Profit || item.profit || 0);
    });
    
    const topReps = Array.from(repMap.entries())
      .map(([name, data]) => ({ name, profit: data.profit }))
      .filter(rep => rep.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3);
    
    if (topReps.length > 0) {
      analysis += `The top performer${topReps.length > 1 ? 's' : ''} in ${currentMonth} ${topReps.length > 1 ? 'were' : 'was'} `;
      analysis += topReps.map((rep, i) => 
        `${rep.name} with £${rep.profit.toFixed(2)} profit${i < topReps.length - 1 ? ',' : ''}`
      ).join(' ');
      analysis += '.';
    }
    
    return analysis;
  } catch (error) {
    console.error("Error analyzing monthly change:", error);
    return `I encountered an error while analyzing the data between ${previousMonth} and ${currentMonth}.`;
  }
}

// Function to extract entities from user query
function extractEntities(message: string): any {
  const lowerMessage = message.toLowerCase();
  
  // Extract rep names
  const repNames = [];
  const repPatterns = [
    /\b(craig|mcdowall)\b/i,
    /\b(jonny|cunningham)\b/i,
    /\b(ged|thomas)\b/i,
    /\b(pete|dhillon)\b/i,
    /\b(michael|mckay)\b/i,
    /\b(louise|skiba)\b/i,
    /\b(stuart|geddes)\b/i,
    /\b(mike|cooper)\b/i,
    /\b(murray|glasgow)\b/i,
    /\b(clare|quinn)\b/i,
    /\b(cammy|stuart)\b/i,
    /\b(adam|forsythe)\b/i,
    /\byvonne\b/i,
  ];
  
  for (const pattern of repPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      // Map to full names
      if (match[0].includes("craig") || match[0].includes("mcdowall")) {
        repNames.push("Craig McDowall");
      } else if (match[0].includes("jonny") || match[0].includes("cunningham")) {
        repNames.push("Jonny Cunningham");
      } else if (match[0].includes("ged") || match[0].includes("thomas")) {
        repNames.push("Ged Thomas");
      } else if (match[0].includes("pete") || match[0].includes("dhillon")) {
        repNames.push("Pete Dhillon");
      } else if (match[0].includes("michael") || match[0].includes("mckay")) {
        repNames.push("Michael McKay");
      } else if (match[0].includes("louise") || match[0].includes("skiba")) {
        repNames.push("Louise Skiba");
      } else if (match[0].includes("stuart") || match[0].includes("geddes")) {
        repNames.push("Stuart Geddes");
      } else if (match[0].includes("mike") || match[0].includes("cooper")) {
        repNames.push("Mike Cooper");
      } else if (match[0].includes("murray") || match[0].includes("glasgow")) {
        repNames.push("Murray Glasgow");
      } else if (match[0].includes("clare") || match[0].includes("quinn")) {
        repNames.push("Clare Quinn");
      } else if (match[0].includes("cammy") || match[0].includes("stuart")) {
        repNames.push("Cammy Stuart");
      } else if (match[0].includes("adam") || match[0].includes("forsythe")) {
        repNames.push("Adam Forsythe");
      } else if (match[0].includes("yvonne")) {
        repNames.push("Yvonne Walton");
      }
    }
  }
  
  // Extract months
  const months = [];
  const monthPatterns = [
    /\b(january|jan)\b/i,
    /\b(february|feb)\b/i,
    /\b(march|mar)\b/i,
    /\b(april|apr)\b/i,
    /\blast month\b/i,
    /\bprevious month\b/i,
    /\bcurrent month\b/i,
    /\bthis month\b/i,
  ];
  
  for (const pattern of monthPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      if (match[0].includes("january") || match[0].includes("jan")) {
        months.push("january");
      } else if (match[0].includes("february") || match[0].includes("feb")) {
        months.push("february");
      } else if (match[0].includes("march") || match[0].includes("mar")) {
        months.push("march");
      } else if (match[0].includes("april") || match[0].includes("apr") || 
                match[0].includes("this month") || match[0].includes("current month")) {
        months.push("april");
      } else if (match[0].includes("last month") || match[0].includes("previous month")) {
        months.push("march"); // Assuming April is current, March is last
      }
    }
  }
  
  // Extract metrics
  const metrics = [];
  if (lowerMessage.includes("profit")) metrics.push("profit");
  if (lowerMessage.includes("margin")) metrics.push("margin");
  if (lowerMessage.includes("spend")) metrics.push("spend");
  if (lowerMessage.includes("packs")) metrics.push("packs");
  if (lowerMessage.includes("sales")) metrics.push("sales");
  
  // Extract customers
  const customers = [];
  if (lowerMessage.includes("customer") || lowerMessage.includes("account")) {
    // We don't have specific customer names to extract, but we note the general reference
    customers.push("general");
  }
  
  // Extract departments
  const departments = [];
  if (lowerMessage.includes("retail")) departments.push("RETAIL");
  if (lowerMessage.includes("reva")) departments.push("REVA");
  if (lowerMessage.includes("wholesale")) departments.push("Wholesale");
  
  // Check for comparison requests
  const comparisons = lowerMessage.includes("compare") || 
                     lowerMessage.includes("vs") ||
                     lowerMessage.includes("versus") ||
                     lowerMessage.includes("difference") ||
                     (months.length > 1);
  
  // Check for insight requests
  const insights = lowerMessage.includes("insight") || 
                  lowerMessage.includes("tell me about") ||
                  lowerMessage.includes("explain") ||
                  lowerMessage.includes("summary");
  
  // Check for trend requests
  const trend = lowerMessage.includes("trend") || 
               lowerMessage.includes("over time") ||
               lowerMessage.includes("change");
  
  // Check for reasons
  const reasons = lowerMessage.includes("why") || 
                 lowerMessage.includes("reason") ||
                 lowerMessage.includes("explain") ||
                 lowerMessage.includes("cause");
  
  // Check for visualization requests
  const visualization = lowerMessage.includes("chart") || 
                       lowerMessage.includes("graph") ||
                       lowerMessage.includes("plot") ||
                       lowerMessage.includes("visual") ||
                       lowerMessage.includes("show me");
  
  let visualization_type = null;
  if (visualization) {
    if (lowerMessage.includes("bar")) visualization_type = "bar";
    else if (lowerMessage.includes("line")) visualization_type = "line";
    else if (lowerMessage.includes("pie")) visualization_type = "pie";
    else visualization_type = "bar"; // Default visualization type
  }
  
  return {
    repNames,
    months,
    metrics,
    customers,
    departments,
    comparisons,
    insights,
    trend,
    reasons,
    visualization,
    visualization_type,
  };
}

// Function to determine question type based on content
function determineQuestionType(entities: any): string {
  const lowerMessage = message.toLowerCase();
  
  if (entities.reasons) {
    return 'reason';
  }
  
  if (entities.comparisons || entities.months.length > 1) {
    return 'comparison';
  }
  
  if (entities.trend) {
    return 'trend';
  }
  
  if (lowerMessage.includes("who") || lowerMessage.includes("top") || lowerMessage.includes("best")) {
    return 'performance';
  }
  
  if (entities.repNames.length > 0 || entities.customers.length > 0 || entities.departments.length > 0) {
    return 'specific';
  }
  
  // New handling for analytical questions
  const hasAnalyticalIntent = entities.insights && (entities.reasons || entities.trend);
  if (hasAnalyticalIntent) {
    return 'analysis';
  }
  
  return 'general';
}

// Helper function to check if a query requires AI analysis
function requiresAIAnalysis(query: string, entities: any): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Check for analytical keywords
  const analyticalKeywords = ['why', 'analyze', 'explain', 'reason', 'factors', 'cause'];
  const hasAnalyticalKeyword = analyticalKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // Check for comparative or trend indicators
  const hasTrendIndicator = entities.trend || 
                           lowerQuery.includes('increase') || 
                           lowerQuery.includes('decrease') ||
                           lowerQuery.includes('change') ||
                           lowerQuery.includes('improve');
  
  // Check for insight requests
  const requestsInsights = entities.insights || 
                          entities.reasons ||
                          lowerQuery.includes('insight');
  
  return (hasAnalyticalKeyword && (hasTrendIndicator || requestsInsights)) || 
         entities.questionType === 'reason' || 
         entities.questionType === 'analysis';
}

// Helper function to format data for AI analysis
function formatDataForAIAnalysis(
  monthData: any[], 
  comparisonData: any[], 
  currentMonth: string, 
  previousMonth: string,
  query: string
): string {
  // Calculate summary metrics for current month
  const currentTotalSpend = monthData.reduce((sum, item) => sum + (Number(item.Spend || item.spend) || 0), 0);
  const currentTotalProfit = monthData.reduce((sum, item) => sum + (Number(item.Profit || item.profit) || 0), 0);
  const currentMargin = currentTotalSpend > 0 ? (currentTotalProfit / currentTotalSpend) * 100 : 0;
  
  // Calculate summary metrics for previous month
  const prevTotalSpend = comparisonData.reduce((sum, item) => sum + (Number(item.Spend || item.spend) || 0), 0);
  const prevTotalProfit = comparisonData.reduce((sum, item) => sum + (Number(item.Profit || item.profit) || 0), 0);
  const prevMargin = prevTotalSpend > 0 ? (prevTotalProfit / prevTotalSpend) * 100 : 0;
  
  // Calculate changes
  const profitChange = prevTotalProfit > 0 ? 
    ((currentTotalProfit - prevTotalProfit) / prevTotalProfit) * 100 : 0;
  const spendChange = prevTotalSpend > 0 ? 
    ((currentTotalSpend - prevTotalSpend) / prevTotalSpend) * 100 : 0;
  const marginChange = currentMargin - prevMargin;

  // Get top performing reps in current month (top 5)
  const repMap = new Map();
  monthData.forEach(item => {
    const repName = (item.Rep || item.rep_name) === 'RETAIL' || (item.Rep || item.rep_name) === 'REVA' || (item.Rep || item.rep_name) === 'Wholesale' 
      ? (item["Sub-Rep"] || item.sub_rep || (item.Rep || item.rep_name)) 
      : (item.Rep || item.rep_name);
    
    if (!repName || repName === 'RETAIL' || repName === 'REVA' || repName === 'Wholesale') return;
    
    if (!repMap.has(repName)) {
      repMap.set(repName, { profit: 0, spend: 0 });
    }
    
    repMap.get(repName).profit += Number(item.Profit || item.profit || 0);
    repMap.get(repName).spend += Number(item.Spend || item.spend || 0);
  });
  
  // Get top 5 reps
  const topReps = Array.from(repMap.entries())
    .map(([name, data]) => ({ 
      name, 
      profit: data.profit, 
      margin: data.spend > 0 ? (data.profit / data.spend) * 100 : 0 
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);
  
  // Get department breakdown
  const deptMap = new Map();
  monthData.forEach(item => {
    const dept = item.Department || item.rep_type || 'RETAIL';
    
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { profit: 0, spend: 0 });
    }
    
    deptMap.get(dept).profit += Number(item.Profit || item.profit || 0);
    deptMap.get(dept).spend += Number(item.Spend || item.spend || 0);
  });
  
  const departments = Array.from(deptMap.entries())
    .map(([name, data]) => ({ 
      name, 
      profit: data.profit, 
      margin: data.spend > 0 ? (data.profit / data.spend) * 100 : 0,
      spend: data.spend 
    }))
    .sort((a, b) => b.profit - a.profit);
  
  // Format the data as a prompt for the AI
  return `
Monthly Sales Data Analysis:

Current Month (${currentMonth}):
- Total Profit: £${currentTotalProfit.toFixed(2)}
- Total Sales (Spend): £${currentTotalSpend.toFixed(2)}
- Overall Margin: ${currentMargin.toFixed(2)}%

Previous Month (${previousMonth}):
- Total Profit: £${prevTotalProfit.toFixed(2)}
- Total Sales (Spend): £${prevTotalSpend.toFixed(2)}
- Overall Margin: ${prevMargin.toFixed(2)}%

Change Metrics:
- Profit Change: ${profitChange > 0 ? '+' : ''}${profitChange.toFixed(2)}%
- Sales Change: ${spendChange > 0 ? '+' : ''}${spendChange.toFixed(2)}%
- Margin Change: ${marginChange > 0 ? '+' : ''}${marginChange.toFixed(2)}% points

Top Performers in ${currentMonth}:
${topReps.map((rep, i) => `${i + 1}. ${rep.name}: £${rep.profit.toFixed(2)} profit, ${rep.margin.toFixed(2)}% margin`).join('\n')}

Department Breakdown for ${currentMonth}:
${departments.map(dept => `- ${dept.name}: £${dept.profit.toFixed(2)} profit, ${dept.margin.toFixed(2)}% margin, £${dept.spend.toFixed(2)} sales`).join('\n')}

Based on this data, ${query}
`;
}

// Function to fetch March Rolling data
async function fetchMarRollingData(supabaseClient) {
  try {
    console.log("Fetching March Rolling data...");
    
    const { data, error } = await supabaseClient
      .from("march_rolling")
      .select("*");
      
    if (error) throw error;
    
    console.log(`Retrieved ${data?.length || 0} records from march_rolling`);
    return data || [];
  } catch (error) {
    console.error("Error fetching March Rolling data:", error);
    return [];
  }
}

// New function to get top reps by profit
async function getTopRepsByProfit(supabaseClient, tableName: string, month: string, limit = 5): Promise<RepData[]> {
  try {
    console.log(`Getting top performers by profit from ${tableName} for ${month}`);
    
    const repMap = new Map<string, {
      repName: string;
      totalSpend: number;
      totalProfit: number;
      departments: Set<string>;
    }>();
    
    let data;
    if (tableName === "sales_data") {
      // For March data (newer format)
      const { data: repData, error } = await supabaseClient
        .from(tableName)
        .select('rep_name, sub_rep, profit, spend, rep_type')
        .order('profit', { ascending: false });
        
      if (error) throw error;
      
      // Process the data to combine rep and sub-rep data
      repData.forEach(item => {
        // Handle main rep
        if (item.rep_name && !['RETAIL', 'REVA', 'Wholesale'].includes(item.rep_name)) {
          if (!repMap.has(item.rep_name)) {
            repMap.set(item.rep_name, {
              repName: item.rep_name,
              totalSpend: 0,
              totalProfit: 0,
              departments: new Set()
            });
          }
          const repData = repMap.get(item.rep_name)!;
          repData.totalSpend += Number(item.spend || 0);
          repData.totalProfit += Number(item.profit || 0);
          if (item.rep_type) repData.departments.add(item.rep_type);
        }
        
        // Handle sub-rep
        if (item.sub_rep && item.sub_rep.trim() !== '') {
          if (!repMap.has(item.sub_rep)) {
            repMap.set(item.sub_rep, {
              repName: item.sub_rep,
              totalSpend: 0,
              totalProfit: 0,
              departments: new Set()
            });
          }
          const repData = repMap.get(item.sub_rep)!;
          repData.totalSpend += Number(item.spend || 0);
          repData.totalProfit += Number(item.profit || 0);
          if (item.rep_type) repData.departments.add(item.rep_type);
        }
      });
    } else {
      // For February/April data (original format)
      const { data: repData, error } = await supabaseClient
        .from(tableName)
        .select('"Rep", "Sub-Rep", "Profit", "Spend", "Department"');
        
      if (error) throw error;
      
      // Process the data to combine rep and sub-rep data
      repData.forEach(item => {
        // Handle main rep
        if (item.Rep && !['RETAIL', 'REVA', 'Wholesale'].includes(item.Rep)) {
          if (!repMap.has(item.Rep)) {
            repMap.set(item.Rep, {
              repName: item.Rep,
              totalSpend: 0,
              totalProfit: 0,
              departments: new Set()
            });
          }
          const repData = repMap.get(item.Rep)!;
          repData.totalSpend += Number(item.Spend || 0);
          repData.totalProfit += Number(item.Profit || 0);
          if (item.Department) repData.departments.add(item.Department);
        }
        
        // Handle sub-rep
        if (item["Sub-Rep"] && item["Sub-Rep"].trim() !== '') {
          if (!repMap.has(item["Sub-Rep"])) {
            repMap.set(item["Sub-Rep"], {
              repName: item["Sub-Rep"],
              totalSpend: 0,
              totalProfit: 0,
              departments: new Set()
            });
          }
          const repData = repMap.get(item["Sub-Rep"])!;
          repData.totalSpend += Number(item.Spend || 0);
          repData.totalProfit += Number(item.Profit || 0);
          if (item.Department) repData.departments.add(item.Department);
        }
      });
    }
    
    // Convert map to array and calculate margin
    const result = Array.from(repMap.values())
      .map(rep => ({
        repName: rep.repName,
        totalSpend: rep.totalSpend,
        totalProfit: rep.totalProfit,
        margin: rep.totalSpend > 0 ? (rep.totalProfit / rep.totalSpend) * 100 : 0,
        departments: Array.from(rep.departments)
      }))
      .filter(rep => rep.totalProfit > 0)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, limit);
    
    console.log(`Found ${result.length} top performers for ${month} from ${tableName}`);
    return result;
  } catch (error) {
    console.error(`Error getting top performers from ${tableName}:`, error);
    return [];
  }
}

// New function to get a rep's top customers
async function getRepTopCustomers(supabaseClient, repName: string, tableName: string, limit = 10): Promise<CustomerData[]> {
  try {
    console.log(`Fetching top customers for rep: ${repName} from ${tableName}`);
    
    let data;
    if (tableName === "sales_data") {
      // For March data (newer format)
      const { data: customers, error } = await supabaseClient
        .from(tableName)
        .select('account_name, account_ref, profit, spend, margin, rep_name')
        .or(`rep_name.eq.${repName},sub_rep.eq.${repName}`)
        .order('profit', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      
      // Transform data to CustomerData format
      data = customers.map(c => ({
        accountRef: c.account_ref,
        accountName: c.account_name,
        profit: c.profit,
        spend: c.spend,
        margin: c.margin || (c.spend > 0 ? (c.profit / c.spend * 100) : 0),
        department: c.rep_type || "RETAIL"
      }));
    } else {
      // For February/April data (original format)
      const { data: customers, error } = await supabaseClient
        .from(tableName)
        .select('"Account Name", "Account Ref", "Profit", "Spend", "Department", "Rep", "Sub-Rep"')
        .or(`Rep.eq.${repName},Sub-Rep.eq.${repName}`)
        .order('Profit', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      
      // Transform data to CustomerData format
      data = customers.map(c => ({
        accountRef: c["Account Ref"],
        accountName: c["Account Name"],
        profit: c["Profit"],
        spend: c["Spend"],
        margin: c["Margin"] || (c["Spend"] > 0 ? (c["Profit"] / c["Spend"] * 100) : 0),
        department: c["Department"] || "RETAIL"
      }));
    }
    
    console.log(`Found ${data.length} customer records for ${repName} in ${tableName}`);
    return data;
  } catch (error) {
    console.error(`Error fetching top customers for ${repName}:`, error);
    return [];
  }
}

// Function to fetch monthly data with pagination
async function fetchMonthlyData(supabaseClient, tableName: string, pageSize = 1000) {
  try {
    console.log(`Fetching all data from ${tableName} with pagination...`);
    let allData = [];
    let page = 0;
    let hasMoreData = true;
    
    while (hasMoreData) {
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      
      if (data.length > 0) {
        console.log(`Retrieved ${data.length} records from ${tableName}, page ${page}`);
        allData = [...allData, ...data];
        page++;
      } else {
        hasMoreData = false;
      }
    }
    
    console.log(`Completed fetching all data from ${tableName}, total records: ${allData.length}`);
    
    // Calculate overall metrics
    const metrics = calculateOverallMetrics(allData, tableName);
    console.log(`Calculated overall metrics for ${tableName}:`, metrics);
    
    // Process rep-specific data
    const reps = extractUniqueReps(allData, tableName);
    for (const rep of reps) {
      console.log(`Processing data for rep: ${rep} from ${tableName}`);
      const repRecords = filterRepData(allData, rep, tableName);
      console.log(`Found ${repRecords.length} records for ${rep} in ${tableName}`);
      
      const repDetails = calculateRepMetrics(repRecords, tableName);
      console.log(`Processed details for rep ${rep} from ${tableName}:`, repDetails);
    }
    
    console.log(`Completed processing ${tableName} data: ${allData.length} records, ${reps.length} reps`);
    
    return allData;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return [];
  }
}

// Function to calculate overall metrics from data
function calculateOverallMetrics(data, tableName: string) {
  const totalProfit = data.reduce((sum, item) => {
    return sum + (tableName === "sales_data" ? 
      (item.profit || 0) : (item.Profit || 0));
  }, 0);
  
  const totalSpend = data.reduce((sum, item) => {
    return sum + (tableName === "sales_data" ? 
      (item.spend || 0) : (item.Spend || 0));
  }, 0);
  
  const averageMargin = totalSpend > 0 ? (totalProfit / totalSpend * 100) : 0;
  
  const allAccounts = new Set(data.map(item => {
    return tableName === "sales_data" ? 
      item.account_ref : item["Account Ref"];
  }));
  
  const activeAccounts = new Set(data.filter(item => {
    const spend = tableName === "sales_data" ? 
      (item.spend || 0) : (item.Spend || 0);
    return spend > 0;
  }).map(item => {
    return tableName === "sales_data" ? 
      item.account_ref : item["Account Ref"];
  }));
  
  const departments = new Set(data.map(item => {
    return tableName === "sales_data" ? 
      item.rep_type : item.Department;
  }));
  
  return {
    totalProfit,
    totalSpend,
    averageMargin,
    totalAccounts: allAccounts.size,
    activeAccounts: activeAccounts.size,
    departmentBreakdown: departments.size,
    topCustomersCount: 10,
  };
}

// Extract unique reps from the dataset
function extractUniqueReps(data, tableName: string): string[] {
  const repsSet = new Set<string>();
  
  data.forEach(item => {
    if (tableName === "sales_data") {
      if (item.rep_name) repsSet.add(item.rep_name);
      if (item.sub_rep) repsSet.add(item.sub_rep);
    } else {
      if (item.Rep) repsSet.add(item.Rep);
      if (item["Sub-Rep"]) repsSet.add(item["Sub-Rep"]);
    }
  });
  
  return Array.from(repsSet).filter(Boolean);
}

// Filter data for a specific rep
function filterRepData(data, repName: string, tableName: string) {
  return data.filter(item => {
    if (tableName === "sales_data") {
      return (item.rep_name === repName || item.sub_rep === repName);
    } else {
      return (item.Rep === repName || item["Sub-Rep"] === repName);
    }
  });
}

// Calculate metrics for a specific rep
function calculateRepMetrics(repData, tableName: string): RepData {
  const totalSpend = repData.reduce((sum, item) => {
    return sum + (tableName === "sales_data" ? 
      (item.spend || 0) : (item.Spend || 0));
  }, 0);
  
  const totalProfit = repData.reduce((sum, item) => {
    return sum + (tableName === "sales_data" ? 
      (item.profit || 0) : (item.Profit || 0));
  }, 0);
  
  const margin = totalSpend > 0 ? (totalProfit / totalSpend * 100) : 0;
  
  const departments = new Set(repData.map(item => {
    return tableName === "sales_data" ? 
      item.rep_type : item.Department;
  }));
  
  return {
    repName: repData[0]?.rep_name || repData[0]?.Rep || "Unknown",
    totalSpend,
    totalProfit,
    margin,
    departments: Array.from(departments).filter(Boolean),
  };
}
