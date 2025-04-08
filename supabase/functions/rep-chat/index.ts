
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryParams {
  message: string;
  selectedMonth?: string;
}

interface RepData {
  name: string;
  profit: number;
  spend: number;
  margin: number;
  packs: number;
  accounts: number;
  activeAccounts: number;
  department?: string;
}

interface DepartmentData {
  name: string;
  totalProfit: number;
  totalSpend: number;
  margin: number;
  totalPacks: number;
  totalAccounts: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { message, selectedMonth = 'March' } = await req.json() as QueryParams

    console.log(`Processing query: "${message}" for month: ${selectedMonth}`)
    
    // Determine the data table based on selected month
    const dataTable = selectedMonth.toLowerCase() === 'february' ? 
      'sales_data_februrary' : 'sales_data_march'
    
    // Get both March and February data for comparison regardless of selected month
    const { data: marchData, error: marchError } = await supabase
      .from('sales_data_march')
      .select('*')
    
    if (marchError) {
      throw new Error(`Error fetching March data: ${marchError.message}`)
    }

    const { data: februaryData, error: febError } = await supabase
      .from('sales_data_februrary')
      .select('*')
    
    if (febError) {
      throw new Error(`Error fetching February data: ${febError.message}`)
    }

    console.log(`Fetched ${marchData.length} records from March data and ${februaryData.length} records from February data`)

    // Query the selected month's data first
    const currentMonthData = selectedMonth.toLowerCase() === 'february' ? februaryData : marchData
    const otherMonthData = selectedMonth.toLowerCase() === 'february' ? marchData : februaryData

    // Process data to get rep performance, considering both Rep and Sub-Rep columns
    const repPerformance = processRepData(currentMonthData)
    const otherMonthRepPerformance = processRepData(otherMonthData)
    
    // Process department data
    const departmentData = processDepartmentData(currentMonthData)
    const otherMonthDepartmentData = processDepartmentData(otherMonthData)

    // Calculate changes between months
    const repChanges = calculateRepChanges(
      repPerformance, 
      otherMonthRepPerformance, 
      selectedMonth.toLowerCase() === 'february' ? 'march' : 'february'
    )

    const departmentChanges = calculateDepartmentChanges(
      departmentData, 
      otherMonthDepartmentData,
      selectedMonth.toLowerCase() === 'february' ? 'march' : 'february'
    )

    const topPerformers = Object.entries(repPerformance)
      .filter(([name]) => !['RETAIL', 'REVA', 'Wholesale'].includes(name))
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5)
      .map(([name, data]) => ({ 
        name,
        profit: data.profit,
        change: repChanges[name]?.profitChange || 0
      }))
    
    const topMargins = Object.entries(repPerformance)
      .filter(([name]) => !['RETAIL', 'REVA', 'Wholesale'].includes(name))
      .sort((a, b) => b[1].margin - a[1].margin)
      .slice(0, 5)
      .map(([name, data]) => ({ 
        name,
        margin: data.margin,
        change: repChanges[name]?.marginChange || 0
      }))

    // Create context for AI response
    const context = {
      currentMonth: selectedMonth,
      comparisonMonth: selectedMonth.toLowerCase() === 'february' ? 'March' : 'February',
      repPerformance,
      departmentData,
      topPerformers,
      topMargins,
      repChanges,
      departmentChanges
    }

    // Get ChatGPT response
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Vera, a retail sales data assistant. You help analyze sales rep performance data.

IMPORTANT GUIDELINES:
- Focus your answers on the sales data for ${selectedMonth} 2025
- Use £ for all currency values (not $ or any other currency)
- All numbers should be formatted appropriately (use commas for thousands)
- Never format your responses with markdown 
- Keep responses concise and conversational
- Avoid phrases like "Based on the data provided" or "According to the data"
- Present the most important insights first
- Always specify amounts in your responses
- If asked about changes or comparisons, use the comparative data between ${selectedMonth} and ${selectedMonth.toLowerCase() === 'february' ? 'March' : 'February'}

IMPORTANT DEPARTMENT/REP INFORMATION:
- There are three departments: Retail, REVA, and Wholesale
- The "Retail" department includes all reps except those with the names "REVA" or "Wholesale"  
- For rep performance, combine data where the person is listed in either the "Rep" column or "Sub-Rep" column
- When providing rep performance, always specify their department if relevant
- Never confuse the department names (Retail/REVA/Wholesale) with individual rep names

You have access to complete sales data for both February and March 2025.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })
    })

    const result = await completion.json()
    const reply = result.choices?.[0]?.message?.content || "I'm sorry, I couldn't analyze that data properly."

    return new Response(
      JSON.stringify({
        reply
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error in rep-chat function:', error)
    
    return new Response(
      JSON.stringify({
        reply: "I'm having trouble analyzing that data right now. Please try again in a moment."
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})

// Helper function to process raw data into rep performance metrics
function processRepData(data: any[]): Record<string, RepData> {
  const repMap: Record<string, RepData> = {}
  
  // Process data for each row
  data.forEach(row => {
    // Process main Rep data
    const repName = row.Rep || '';
    if (repName && repName !== '') {
      if (!repMap[repName]) {
        repMap[repName] = {
          name: repName,
          profit: 0,
          spend: 0,
          margin: 0,
          packs: 0,
          accounts: 0,
          activeAccounts: 0,
          department: row.Department || 'Retail'
        }
      }
      
      // Add this row's data to the rep's totals
      repMap[repName].profit += parseNumeric(row.Profit);
      repMap[repName].spend += parseNumeric(row.Spend);
      repMap[repName].packs += parseNumeric(row.Packs);
      
      // Count unique accounts
      const accountRef = row['Account Ref'] || '';
      if (accountRef) {
        repMap[repName].accounts++;
        if (parseNumeric(row.Spend) > 0) {
          repMap[repName].activeAccounts++;
        }
      }
    }
    
    // Process Sub-Rep data (if it exists and is different from main Rep)
    const subRepName = row['Sub-Rep'] || '';
    if (subRepName && subRepName !== '' && subRepName !== repName) {
      if (!repMap[subRepName]) {
        repMap[subRepName] = {
          name: subRepName,
          profit: 0,
          spend: 0,
          margin: 0,
          packs: 0,
          accounts: 0,
          activeAccounts: 0,
          department: row.Department || 'Retail'
        }
      }
      
      // Add this row's data to the sub-rep's totals
      repMap[subRepName].profit += parseNumeric(row.Profit);
      repMap[subRepName].spend += parseNumeric(row.Spend);
      repMap[subRepName].packs += parseNumeric(row.Packs);
      
      // Count unique accounts
      const accountRef = row['Account Ref'] || '';
      if (accountRef) {
        repMap[subRepName].accounts++;
        if (parseNumeric(row.Spend) > 0) {
          repMap[subRepName].activeAccounts++;
        }
      }
    }
  });
  
  // Calculate margin for each rep after all data is processed
  Object.keys(repMap).forEach(repName => {
    const rep = repMap[repName];
    rep.margin = rep.spend > 0 ? (rep.profit / rep.spend) * 100 : 0;
  });
  
  return repMap;
}

// Helper function to process department data
function processDepartmentData(data: any[]): Record<string, DepartmentData> {
  const deptMap: Record<string, DepartmentData> = {}
  const accountsPerDept: Record<string, Set<string>> = {}
  
  data.forEach(row => {
    const deptName = row.Department || 'Retail';
    
    if (!deptMap[deptName]) {
      deptMap[deptName] = {
        name: deptName,
        totalProfit: 0,
        totalSpend: 0,
        margin: 0,
        totalPacks: 0,
        totalAccounts: 0
      }
      accountsPerDept[deptName] = new Set();
    }
    
    deptMap[deptName].totalProfit += parseNumeric(row.Profit);
    deptMap[deptName].totalSpend += parseNumeric(row.Spend);
    deptMap[deptName].totalPacks += parseNumeric(row.Packs);
    
    const accountRef = row['Account Ref'] || '';
    if (accountRef) {
      accountsPerDept[deptName].add(accountRef);
    }
  });
  
  // Calculate margin and count accounts
  Object.keys(deptMap).forEach(deptName => {
    const dept = deptMap[deptName];
    dept.margin = dept.totalSpend > 0 ? (dept.totalProfit / dept.totalSpend) * 100 : 0;
    dept.totalAccounts = accountsPerDept[deptName].size;
  });
  
  return deptMap;
}

// Helper function for calculating changes between months
function calculateRepChanges(
  currentMonthData: Record<string, RepData>,
  comparisonMonthData: Record<string, RepData>,
  comparisonMonthName: string
): Record<string, any> {
  const changes: Record<string, any> = {};
  
  // Calculate changes for all reps in current month
  Object.entries(currentMonthData).forEach(([name, data]) => {
    const comparisonData = comparisonMonthData[name];
    
    if (comparisonData) {
      changes[name] = {
        profitChange: calculatePercentageChange(data.profit, comparisonData.profit),
        spendChange: calculatePercentageChange(data.spend, comparisonData.spend),
        marginChange: data.margin - comparisonData.margin,
        packsChange: calculatePercentageChange(data.packs, comparisonData.packs),
        accountsChange: calculatePercentageChange(data.accounts, comparisonData.accounts),
        comparisonMonth: comparisonMonthName,
        comparisonProfit: comparisonData.profit,
        comparisonSpend: comparisonData.spend,
        comparisonMargin: comparisonData.margin,
        comparisonPacks: comparisonData.packs
      };
    } else {
      // Rep didn't exist in comparison month
      changes[name] = {
        profitChange: 100,
        spendChange: 100,
        marginChange: data.margin,
        packsChange: 100,
        accountsChange: 100,
        comparisonMonth: comparisonMonthName,
        newRep: true
      };
    }
  });
  
  return changes;
}

// Helper function for calculating department changes
function calculateDepartmentChanges(
  currentMonthData: Record<string, DepartmentData>,
  comparisonMonthData: Record<string, DepartmentData>,
  comparisonMonthName: string
): Record<string, any> {
  const changes: Record<string, any> = {};
  
  Object.entries(currentMonthData).forEach(([name, data]) => {
    const comparisonData = comparisonMonthData[name];
    
    if (comparisonData) {
      changes[name] = {
        profitChange: calculatePercentageChange(data.totalProfit, comparisonData.totalProfit),
        spendChange: calculatePercentageChange(data.totalSpend, comparisonData.totalSpend),
        marginChange: data.margin - comparisonData.margin,
        packsChange: calculatePercentageChange(data.totalPacks, comparisonData.totalPacks),
        accountsChange: calculatePercentageChange(data.totalAccounts, comparisonData.totalAccounts),
        comparisonMonth: comparisonMonthName,
        comparisonProfit: comparisonData.totalProfit,
        comparisonSpend: comparisonData.totalSpend,
        comparisonMargin: comparisonData.margin,
        comparisonPacks: comparisonData.totalPacks
      };
    } else {
      changes[name] = {
        profitChange: 100,
        spendChange: 100,
        marginChange: data.margin,
        packsChange: 100,
        accountsChange: 100,
        comparisonMonth: comparisonMonthName,
        newDepartment: true
      };
    }
  });
  
  return changes;
}

// Helper function to calculate percentage change
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Helper function to safely parse numeric values
function parseNumeric(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
