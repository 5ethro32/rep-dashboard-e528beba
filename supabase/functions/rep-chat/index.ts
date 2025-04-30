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
    
    // Check if this is a month comparison query
    const isMonthComparisonQuery = entities.months.length > 1 || 
                                  (entities.comparisons && entities.months.length > 0);
    
    let response = "";
    let chartData = null;
    let chartType = null;
    let tableData = null;
    let tableHeaders = null;
    let insights = null;
    let trends = null;
    let highlightedEntities = null;

    // Handle month comparison queries (new feature)
    if (isMonthComparisonQuery) {
      try {
        const { result, chart, table, monthInsights, comparisonTrends } = await handleMonthComparison(
          supabaseClient,
          entities.months,
          entities.metrics,
          message
        );
        
        response = result;
        chartData = chart;
        chartType = chartType || "bar";
        
        if (table) {
          tableData = table.data;
          tableHeaders = table.headers;
        }
        
        insights = monthInsights;
        trends = comparisonTrends;
        
        // Add highlighted entities for key metrics in comparison
        if (entities.metrics.length > 0) {
          highlightedEntities = entities.metrics.map(metric => ({
            type: 'metric' as 'metric',
            name: metric.charAt(0).toUpperCase() + metric.slice(1),
            value: metric === 'margin' ? 
              `${monthInsights?.[0] || 'Comparison available'}` : 
              `${monthInsights?.[0] || 'Data available'}`
          }));
        }
      } catch (error) {
        console.error('Error handling month comparison:', error);
        response = `I encountered an error while comparing the data for ${entities.months.join(' and ')}. Please try to be more specific about what you want to compare.`;
      }
    }
    // Handle AI analysis queries (existing feature)
    else if (requiresAnalysis) {
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
    const questionType = determineQuestionType(entities, message);

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

// New function to handle month comparison queries
async function handleMonthComparison(
  supabaseClient: any,
  months: string[],
  metrics: string[],
  query: string
): Promise<{
  result: string;
  chart: any[];
  table?: { headers: string[], data: any[] };
  monthInsights: string[];
  comparisonTrends?: any[];
}> {
  // Default to comparing margins if no specific metric is mentioned
  const targetMetric = metrics.length > 0 ? metrics[0] : 'margin';
  const normalizedMonths = normalizeMonths(months);
  
  if (normalizedMonths.length < 2) {
    // If only one month explicitly mentioned, assume comparing with the previous month
    if (normalizedMonths[0] === 'march') {
      normalizedMonths.push('february');
    } else if (normalizedMonths[0] === 'april') {
      normalizedMonths.push('march');
    } else if (normalizedMonths[0] === 'february') {
      // We don't have January data
      return {
        result: `I can't compare February to previous months as I don't have January data. Try comparing February to March instead.`,
        chart: [],
        monthInsights: [`No comparison data available for months before February`]
      };
    }
  }
  
  // Sort months chronologically
  normalizedMonths.sort((a, b) => {
    const monthOrder = { february: 0, march: 1, april: 2 };
    return monthOrder[a] - monthOrder[b];
  });
  
  const month1 = normalizedMonths[0];
  const month2 = normalizedMonths[1];
  
  console.log(`Comparing ${targetMetric} between ${month1} and ${month2}`);
  
  // Get data for the two months
  const data1 = await fetchMonthlyData(supabaseClient, TABLES[month1]);
  const data2 = await fetchMonthlyData(supabaseClient, TABLES[month2]);
  
  if (!data1.length || !data2.length) {
    return {
      result: `I don't have enough data to compare ${month1} and ${month2}.`,
      chart: [],
      monthInsights: [`No data available for comparison`]
    };
  }
  
  // Calculate metrics for both months
  const metrics1 = calculateComparisonMetrics(data1, month1, TABLES[month1]);
  const metrics2 = calculateComparisonMetrics(data2, month2, TABLES[month2]);
  
  // Prepare comparison data based on the target metric
  let result = '';
  let chartData = [];
  let tableData = [];
  let tableHeaders = [];
  let insights: string[] = [];
  
  // Format month names properly for display
  const month1Display = capitalizeFirstLetter(month1);
  const month2Display = capitalizeFirstLetter(month2);
  
  if (targetMetric === 'margin') {
    const marginDiff = metrics2.margin - metrics1.margin;
    const trend = marginDiff > 0 ? 'increased' : 'decreased';
    
    result = `When comparing margins between ${month1Display} and ${month2Display}:\n\n` +
      `${month1Display}'s overall margin was ${metrics1.margin.toFixed(2)}%\n` +
      `${month2Display}'s overall margin was ${metrics2.margin.toFixed(2)}%\n\n` +
      `This represents a ${Math.abs(marginDiff).toFixed(2)} percentage point ${trend} from ${month1Display} to ${month2Display}.`;
    
    chartData = [
      { name: month1Display, value: metrics1.margin },
      { name: month2Display, value: metrics2.margin }
    ];
    
    // Create table of top reps by margin in both months
    tableHeaders = ["Rep", `${month1Display} Margin`, `${month2Display} Margin`, "Change"];
    
    // Get top reps data
    const topReps = await getTopRepsForComparison(supabaseClient, month1, month2, 'margin', 5);
    
    tableData = topReps.map(rep => ({
      rep: rep.repName,
      [`${month1.toLowerCase()}Margin`]: `${rep.metrics1.margin.toFixed(1)}%`,
      [`${month2.toLowerCase()}Margin`]: `${rep.metrics2.margin.toFixed(1)}%`,
      change: `${rep.marginChange > 0 ? '+' : ''}${rep.marginChange.toFixed(1)}%`
    }));
    
    insights = [
      `Overall margin ${trend} by ${Math.abs(marginDiff).toFixed(2)} percentage points from ${month1Display} to ${month2Display}`,
      `${month2Display}'s overall margin was ${metrics2.margin.toFixed(2)}%`,
      `${getTopPerformerInsight(topReps, 'margin', month2Display)}`
    ];
    
  } else if (targetMetric === 'profit') {
    const profitDiff = metrics2.profit - metrics1.profit;
    const profitChangePct = (profitDiff / metrics1.profit) * 100;
    const trend = profitDiff > 0 ? 'increased' : 'decreased';
    
    result = `When comparing profit between ${month1Display} and ${month2Display}:\n\n` +
      `${month1Display}'s total profit was £${metrics1.profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n` +
      `${month2Display}'s total profit was £${metrics2.profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n\n` +
      `This represents a ${Math.abs(profitChangePct).toFixed(1)}% ${trend} from ${month1Display} to ${month2Display}.`;
    
    chartData = [
      { name: month1Display, value: metrics1.profit },
      { name: month2Display, value: metrics2.profit }
    ];
    
    // Create table of top reps by profit in both months
    tableHeaders = ["Rep", `${month1Display} Profit`, `${month2Display} Profit`, "Change %"];
    
    // Get top reps data
    const topReps = await getTopRepsForComparison(supabaseClient, month1, month2, 'profit', 5);
    
    tableData = topReps.map(rep => ({
      rep: rep.repName,
      [`${month1.toLowerCase()}Profit`]: `£${rep.metrics1.profit.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`,
      [`${month2.toLowerCase()}Profit`]: `£${rep.metrics2.profit.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`,
      change: `${rep.profitChangePct > 0 ? '+' : ''}${rep.profitChangePct.toFixed(1)}%`
    }));
    
    insights = [
      `Overall profit ${trend} by ${Math.abs(profitChangePct).toFixed(1)}% from ${month1Display} to ${month2Display}`,
      `${month2Display}'s total profit was £${metrics2.profit.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`,
      `${getTopPerformerInsight(topReps, 'profit', month2Display)}`
    ];
    
  } else if (targetMetric === 'spend') {
    const spendDiff = metrics2.spend - metrics1.spend;
    const spendChangePct = (spendDiff / metrics1.spend) * 100;
    const trend = spendDiff > 0 ? 'increased' : 'decreased';
    
    result = `When comparing spend between ${month1Display} and ${month2Display}:\n\n` +
      `${month1Display}'s total spend was £${metrics1.spend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n` +
      `${month2Display}'s total spend was £${metrics2.spend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n\n` +
      `This represents a ${Math.abs(spendChangePct).toFixed(1)}% ${trend} from ${month1Display} to ${month2Display}.`;
    
    chartData = [
      { name: month1Display, value: metrics1.spend },
      { name: month2Display, value: metrics2.spend }
    ];
    
    // Create table of top reps by spend in both months
    tableHeaders = ["Rep", `${month1Display} Spend`, `${month2Display} Spend`, "Change %"];
    
    // Get top reps data
    const topReps = await getTopRepsForComparison(supabaseClient, month1, month2, 'spend', 5);
    
    tableData = topReps.map(rep => ({
      rep: rep.repName,
      [`${month1.toLowerCase()}Spend`]: `£${rep.metrics1.spend.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`,
      [`${month2.toLowerCase()}Spend`]: `£${rep.metrics2.spend.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`,
      change: `${rep.spendChangePct > 0 ? '+' : ''}${rep.spendChangePct.toFixed(1)}%`
    }));
    
    insights = [
      `Overall spend ${trend} by ${Math.abs(spendChangePct).toFixed(1)}% from ${month1Display} to ${month2Display}`,
      `${month2Display}'s total spend was £${metrics2.spend.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`,
      `${getTopPerformerInsight(topReps, 'spend', month2Display)}`
    ];
    
  } else if (targetMetric === 'packs') {
    const packsDiff = metrics2.packs - metrics1.packs;
    const packsChangePct = (packsDiff / metrics1.packs) * 100;
    const trend = packsDiff > 0 ? 'increased' : 'decreased';
    
    result = `When comparing pack volumes between ${month1Display} and ${month2Display}:\n\n` +
      `${month1Display}'s total packs were ${metrics1.packs.toLocaleString('en-US')}\n` +
      `${month2Display}'s total packs were ${metrics2.packs.toLocaleString('en-US')}\n\n` +
      `This represents a ${Math.abs(packsChangePct).toFixed(1)}% ${trend} from ${month1Display} to ${month2Display}.`;
    
    chartData = [
      { name: month1Display, value: metrics1.packs },
      { name: month2Display, value: metrics2.packs }
    ];
    
    // Create table for department comparison
    tableHeaders = ["Department", `${month1Display} Packs`, `${month2Display} Packs`, "Change %"];
    
    // Get department data
    const departments = ["RETAIL", "REVA", "Wholesale"];
    const deptData = [];
    
    for (const dept of departments) {
      const dept1Packs = calculateDepartmentPacks(data1, dept, month1);
      const dept2Packs = calculateDepartmentPacks(data2, dept, month2);
      const deptPacksChange = dept1Packs > 0 ? ((dept2Packs - dept1Packs) / dept1Packs) * 100 : 0;
      
      deptData.push({
        department: dept,
        [`${month1.toLowerCase()}Packs`]: dept1Packs.toLocaleString('en-US'),
        [`${month2.toLowerCase()}Packs`]: dept2Packs.toLocaleString('en-US'),
        change: `${deptPacksChange > 0 ? '+' : ''}${deptPacksChange.toFixed(1)}%`
      });
    }
    
    tableData = deptData;
    
    insights = [
      `Overall packs ${trend} by ${Math.abs(packsChangePct).toFixed(1)}% from ${month1Display} to ${month2Display}`,
      `${month2Display}'s total packs were ${metrics2.packs.toLocaleString('en-US')}`,
      `The department with the biggest change was ${getDeptWithBiggestChange(deptData)}`
    ];
  } else {
    // Generic comparison for other metrics
    result = `I don't have specific comparison details for the metric "${targetMetric}" between ${month1Display} and ${month2Display}.`;
    
    chartData = [
      { name: month1Display, value: metrics1.profit },
      { name: month2Display, value: metrics2.profit }
    ];
    
    insights = [
      `${month1Display} to ${month2Display} comparison available`,
      `Try asking about specific metrics like margin, profit, or spend`,
      `For detailed analysis, specify the metric you want to compare`
    ];
  }
  
  return {
    result,
    chart: chartData,
    table: tableData.length > 0 ? { headers: tableHeaders, data: tableData } : undefined,
    monthInsights: insights,
    comparisonTrends: createComparisonTrends(metrics1, metrics2, month1Display, month2Display)
  };
}

// Helper function to normalize month names
function normalizeMonths(months: string[]): string[] {
  const monthMap: {[key: string]: string} = {
    'january': 'january',
    'jan': 'january',
    'february': 'february',
    'feb': 'february',
    'march': 'march',
    'mar': 'march',
    'april': 'april',
    'apr': 'april',
    'this month': 'april',
    'current month': 'april',
    'last month': 'march',
    'previous month': 'march'
  };
  
  return months
    .map(month => monthMap[month.toLowerCase()])
    .filter(month => month === 'february' || month === 'march' || month === 'april')
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
}

// Helper function to calculate comparison metrics
function calculateComparisonMetrics(data: any[], month: string, tableName: string): {
  profit: number;
  spend: number;
  margin: number;
  packs: number;
  accounts: number;
} {
  let totalProfit = 0;
  let totalSpend = 0;
  let totalPacks = 0;
  const activeAccounts = new Set();
  
  if (tableName === "sales_data") {
    // March data (newer format)
    for (const item of data) {
      totalProfit += Number(item.profit || 0);
      totalSpend += Number(item.spend || 0);
      totalPacks += Number(item.packs || 0);
      if (item.account_ref) activeAccounts.add(item.account_ref);
    }
  } else {
    // February/April data (original format)
    for (const item of data) {
      totalProfit += Number(item.Profit || 0);
      totalSpend += Number(item.Spend || 0);
      totalPacks += Number(item.Packs || 0);
      if (item["Account Ref"]) activeAccounts.add(item["Account Ref"]);
    }
  }
  
  const margin = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
  
  return {
    profit: totalProfit,
    spend: totalSpend,
