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
  // Removed sampleTransactions to keep responses concise
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
  bottomPerformersByProfit: any[]; // Added for worst performers
  bottomPerformersByMargin: any[]; // Added for worst performers
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
      
      // Check if the query is asking about a specific department
      const departmentMatch = message.match(/(?:about|for|on|in|from)\s+(reva|retail|wholesale)/i);
      const departmentName = departmentMatch ? departmentMatch[1] : null;
      
      // Extract any rep name mentioned in the message for detailed lookup
      const repNameMatch = message.match(/(?:about|on|for|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      const repName = repNameMatch ? repNameMatch[1] : null;
      
      // Fetch all data for each department
      console.log("Fetching data for all departments...");
      let retailData = await fetchDepartmentData(supabase, tableName, 'RETAIL');
      let revaData = await fetchDepartmentData(supabase, tableName, 'REVA');
      let wholesaleData = await fetchDepartmentData(supabase, tableName, 'Wholesale');
      
      // Combine all department data
      const allData = [...retailData, ...revaData, ...wholesaleData];
      console.log(`Total combined records from all departments: ${allData.length}`);
      
      // If asking about overall metrics, get that data
      if (isOverallQuery) {
        console.log("Detected query for overall metrics");
        
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
            bottomPerformersByProfit: [], // New field for worst performers
            bottomPerformersByMargin: [], // New field for worst performers
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
          
          // Process sales reps - ONLY include actual reps, not departments
          const repProfitMap = new Map<string, number>();
          const repMarginMap = new Map<string, { spend: number, profit: number }>();
          const repPacksMap = new Map<string, number>();
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
            let totalPacks = 0;
            
            // Add data where the person is listed as Rep
            allData.forEach(record => {
              if (record.Rep === rep) {
                totalProfit += Number(record.Profit || 0);
                totalSpend += Number(record.Spend || 0);
                totalPacks += Number(record.Packs || 0);
              }
            });
            
            // Add data where the person is listed as Sub-Rep
            allData.forEach(record => {
              if (record['Sub-Rep'] === rep) {
                totalProfit += Number(record.Profit || 0);
                totalSpend += Number(record.Spend || 0);
                totalPacks += Number(record.Packs || 0);
              }
            });
            
            repProfitMap.set(rep, totalProfit);
            repMarginMap.set(rep, { 
              spend: totalSpend, 
              profit: totalProfit 
            });
            repPacksMap.set(rep, totalPacks);
          });
          
          // Convert to arrays and sort for top performers
          let topByProfit = Array.from(repProfitMap.entries())
            .filter(([rep, profit]) => !isDepartment(rep) && profit > 0) // Filter out departments and zero profits
            .map(([rep, profit]) => ({
              rep,
              profit
            }))
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 5);
          
          let topByMargin = Array.from(repMarginMap.entries())
            .filter(([rep, { spend, profit }]) => !isDepartment(rep) && spend > 0 && profit > 0) // Filter valid entries
            .map(([rep, { spend, profit }]) => ({
              rep,
              margin: spend > 0 ? (profit / spend) * 100 : 0
            }))
            .filter(item => item.margin > 0)
            .sort((a, b) => b.margin - a.margin)
            .slice(0, 5);
          
          // Get bottom performers (worst performers)
          let bottomByProfit = Array.from(repProfitMap.entries())
            .filter(([rep, profit]) => !isDepartment(rep) && profit !== 0) // Filter out departments and zero profits
            .map(([rep, profit]) => ({
              rep,
              profit
            }))
            .sort((a, b) => a.profit - b.profit) // Sort ascending for worst
            .slice(0, 5);
          
          let bottomByMargin = Array.from(repMarginMap.entries())
            .filter(([rep, { spend, profit }]) => !isDepartment(rep) && spend > 0) // Filter valid entries
            .map(([rep, { spend, profit }]) => ({
              rep,
              margin: spend > 0 ? (profit / spend) * 100 : 0
            }))
            .sort((a, b) => a.margin - b.margin) // Sort ascending for worst
            .slice(0, 5);
          
          metrics.topPerformersByProfit = topByProfit;
          metrics.topPerformersByMargin = topByMargin;
          metrics.bottomPerformersByProfit = bottomByProfit;
          metrics.bottomPerformersByMargin = bottomByMargin;
          metrics.departmentBreakdown = formattedDeptBreakdown;
          
          overallMetrics = metrics;
          
          console.log("Calculated overall metrics:", {
            totalProfit: metrics.totalProfit,
            totalSpend: metrics.totalSpend,
            averageMargin: metrics.averageMargin,
            totalAccounts: metrics.totalAccounts.size,
            activeAccounts: metrics.activeAccounts.size,
            departmentBreakdown: Object.keys(departmentBreakdown).length
          });
        }
      }
      
      // If asking about a specific department
      if (departmentName) {
        console.log(`Detected query about the ${departmentName} department`);
        
        // Normalize department name for case-insensitive matching
        const normalizedDeptName = departmentName.toUpperCase();
        let deptData = [];
        
        if (normalizedDeptName === 'REVA') {
          deptData = revaData;
        } else if (normalizedDeptName === 'WHOLESALE') {
          deptData = wholesaleData;
        } else if (normalizedDeptName === 'RETAIL') {
          deptData = retailData;
        }
        
        if (deptData && deptData.length > 0) {
          console.log(`Found ${deptData.length} records for ${departmentName} department`);
          
          // Calculate department metrics
          let totalSpend = 0;
          let totalProfit = 0;
          let totalPacks = 0;
          const allAccounts = new Set<string>();
          const activeAccounts = new Set<string>();
          
          deptData.forEach(record => {
            const spend = Number(record.Spend || 0);
            const profit = Number(record.Profit || 0);
            const packs = Number(record.Packs || 0);
            
            totalSpend += spend;
            totalProfit += profit;
            totalPacks += packs;
            
            if (record['Account Ref']) {
              allAccounts.add(record['Account Ref']);
              if (spend > 0) {
                activeAccounts.add(record['Account Ref']);
              }
            }
          });
          
          // Create department summary
          repDetails = {
            name: departmentName,
            departments: [departmentName],
            totalSpend: totalSpend,
            totalProfit: totalProfit,
            margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
            totalPacks: totalPacks,
            totalAccounts: allAccounts.size,
            activeAccounts: activeAccounts.size,
            profitPerActiveAccount: activeAccounts.size > 0 ? totalProfit / activeAccounts.size : 0
            // Removed sampleTransactions to keep responses concise
          };
          
          console.log(`Found details for department ${departmentName}:`, {
            totalSpend: repDetails.totalSpend,
            totalProfit: repDetails.totalProfit,
            margin: repDetails.margin
          });
        } else {
          console.log(`No data found for department ${departmentName}`);
        }
      }
      
      // If a specific rep is mentioned, get their details across all departments
      if (repName) {
        console.log(`Looking for data on rep: ${repName}`);
        
        // Process the combined dataset for this rep (from both Rep and Sub-Rep columns)
        const repData = allData.filter(record => {
          return (record.Rep && record.Rep.toLowerCase().includes(repName.toLowerCase())) || 
                 (record['Sub-Rep'] && record['Sub-Rep'].toLowerCase().includes(repName.toLowerCase()));
        });
        
        if (repData && repData.length > 0) {
          console.log(`Found ${repData.length} records for ${repName}`);
          
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
            profitPerActiveAccount: allActiveAccounts.size > 0 ? totalProfit / allActiveAccounts.size : 0
            // Removed sampleTransactions to keep responses concise
          };
          
          console.log(`Found details for rep ${repName}:`, {
            totalSpend: repDetails.totalSpend,
            totalProfit: repDetails.totalProfit,
            margin: repDetails.margin,
            departments: repDetails.departments
          });
        } else {
          console.log(`No data found for rep ${repName}`);
        }
      }
      
      // Process all data to get top and bottom sales people by profit
      const repProfits: Record<string, number> = {};
      const repMargins: Record<string, { profit: number, spend: number }> = {};
      
      // First collect all rep names (whether in Rep or Sub-Rep columns)
      // making sure to exclude departments like Wholesale and REVA
      const allReps = new Set<string>();
      allData.forEach(record => {
        if (record.Rep && !isDepartment(record.Rep)) {
          allReps.add(record.Rep);
        }
        if (record["Sub-Rep"] && record["Sub-Rep"].trim() !== '') {
          allReps.add(record["Sub-Rep"]);
        }
      });
      
      // Calculate totals for each rep (combining both Rep and Sub-Rep appearances)
      Array.from(allReps).forEach(repName => {
        let totalProfit = 0;
        let totalSpend = 0;
        
        // Add data where they appear as Rep
        allData.forEach(record => {
          if (record.Rep === repName) {
            totalProfit += Number(record.Profit || 0);
            totalSpend += Number(record.Spend || 0);
          }
        });
        
        // Add data where they appear as Sub-Rep
        allData.forEach(record => {
          if (record["Sub-Rep"] === repName) {
            totalProfit += Number(record.Profit || 0);
            totalSpend += Number(record.Spend || 0);
          }
        });
        
        repProfits[repName] = totalProfit;
        repMargins[repName] = { profit: totalProfit, spend: totalSpend };
      });
      
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

      // Sort and get bottom performers
      const bottomByProfit = Object.entries(repProfits)
        .filter(([_, profit]) => profit !== 0) // Filter out zero profits for meaningful results
        .sort((a, b) => a[1] - b[1])
        .slice(0, 5)
        .map(([rep, profit]) => ({ Rep: rep, Profit: profit, Department: "Combined" }));
        
      const bottomByMargin = Object.entries(repMargins)
        .filter(([_, { spend }]) => spend > 0) // Filter for meaningful margins
        .map(([rep, { profit, spend }]) => ({ 
          Rep: rep, 
          Margin: spend > 0 ? (profit / spend) * 100 : 0,
          Department: "Combined"
        }))
        .sort((a, b) => a.Margin - b.Margin)
        .slice(0, 5);
      
      topSalesPeople = {
        byProfit: topByProfit,
        byMargin: topByMargin,
        bottomByProfit: bottomByProfit,
        bottomByMargin: bottomByMargin
      };
      
      // Sample of general sales data for context (reduced to bare minimum)
      salesData = allData.slice(0, 3);
      
      console.log(`Successfully processed sales data for ${month}`);
      console.log("Top performers by profit:", JSON.stringify(topByProfit.slice(0, 3)));
      console.log("Bottom performers by profit:", JSON.stringify(bottomByProfit.slice(0, 3)));
      
    } catch (error) {
      console.error(`Error processing sales data from ${tableName}:`, error);
      salesData = `Unable to process sales data from ${tableName}: ${error.message}`;
      topSalesPeople = "Data unavailable";
    }

    // Check if the message is asking about worst performers
    const isAskingAboutWorst = /worst|lowest|poorest|bottom|weakest/i.test(message);
    const isAskingAboutPerformance = /perform|sales|profit|margin/i.test(message);

    // Prepare a system prompt with data context
    const systemPrompt = `
You are Vera, a sales data analysis assistant specialized in helping sales managers understand their rep performance data.
You have access to sales data for ${selectedMonth || 'March'} 2025.

Here's key information from the data:
1. Top performers by profit in ${selectedMonth || 'March'} 2025:
${JSON.stringify(topSalesPeople?.byProfit || 'Data unavailable')}

2. Top performers by margin in ${selectedMonth || 'March'} 2025:
${JSON.stringify(topSalesPeople?.byMargin || 'Data unavailable')}

3. Worst performers by profit in ${selectedMonth || 'March'} 2025:
${JSON.stringify(topSalesPeople?.bottomByProfit || 'Data unavailable')}

4. Worst performers by margin in ${selectedMonth || 'March'} 2025:
${JSON.stringify(topSalesPeople?.bottomByMargin || 'Data unavailable')}

${overallMetrics ? `
5. Overall metrics for ${selectedMonth || 'March'} 2025:

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

Bottom Performers by Profit:
${JSON.stringify(overallMetrics.bottomPerformersByProfit, null, 2)}

Top Performers by Margin:
${JSON.stringify(overallMetrics.topPerformersByMargin, null, 2)}

Bottom Performers by Margin:
${JSON.stringify(overallMetrics.bottomPerformersByMargin, null, 2)}
` : ''}

${repDetails ? `
6. Specific details for ${repDetails.name}:

Key Performance Metrics:

Total Spend: ${repDetails.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${repDetails.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Margin: ${repDetails.margin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${repDetails.totalPacks.toLocaleString('en-US')}
Total Accounts: ${repDetails.totalAccounts}
Active Accounts: ${repDetails.activeAccounts}
Profit per Active Account: ${repDetails.profitPerActiveAccount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
` : ''}

When answering:
1. Be extremely CONCISE and DIRECT - only provide exactly what was asked for
2. If asked about specific numbers, provide the exact figures from the data above
3. When asked about top or worst performers, specify which metric (profit, margin) and include the actual values
4. If data isn't available for a specific question, acknowledge that
5. DO NOT provide ANY sample transactions or unnecessary details that weren't asked for
6. DO NOT FORMAT YOUR RESPONSE WITH MARKDOWN like **, *, or ## symbols
7. Use plain text formatting with proper line breaks and paragraphs
8. If responding about a specific rep, use proper paragraph breaks between sections
9. Do not mention the department unless specifically asked - just give combined results across all departments
10. For rep performance, combine data where they appear as both Rep and Sub-Rep
11. NEVER refer to Wholesale or REVA as sales reps - they are departments, not individuals
12. If someone asks about "worst" performers, make sure to provide the bottom performers by profit data

${isAskingAboutWorst && isAskingAboutPerformance ? 'IMPORTANT: This question is specifically asking about the WORST performers, so be sure to provide the bottom performers by profit from the data.' : ''}
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
