
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
    
    // We'll always fetch both months' data regardless of the selected month
    // This way Vera can answer questions about either month or compare them
    
    // Get March data
    const { data: marchData, error: marchError } = await supabase
      .from('sales_data_march')
      .select('*')
    
    if (marchError) {
      throw new Error(`Error fetching March data: ${marchError.message}`)
    }

    // Get February data
    const { data: februaryData, error: febError } = await supabase
      .from('sales_data_februrary')
      .select('*')
    
    if (febError) {
      throw new Error(`Error fetching February data: ${febError.message}`)
    }

    console.log(`Fetched ${marchData.length} records from March data and ${februaryData.length} records from February data`)

    // Process rep data for both months
    const marchRepPerformance = processRepData(marchData)
    const februaryRepPerformance = processRepData(februaryData)
    
    // Process department data for both months
    const marchDepartmentData = processDepartmentData(marchData)
    const februaryDepartmentData = processDepartmentData(februaryData)

    // Calculate changes between months
    const repChanges = calculateRepChanges(marchRepPerformance, februaryRepPerformance)
    const departmentChanges = calculateDepartmentChanges(marchDepartmentData, februaryDepartmentData)

    // Top performers from both months
    const marchTopPerformers = Object.entries(marchRepPerformance)
      .filter(([name]) => !['RETAIL', 'REVA', 'Wholesale'].includes(name))
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5)
      .map(([name, data]) => ({ 
        name,
        profit: data.profit,
        change: repChanges[name]?.profitChange || 0
      }))
    
    const februaryTopPerformers = Object.entries(februaryRepPerformance)
      .filter(([name]) => !['RETAIL', 'REVA', 'Wholesale'].includes(name))
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5)
      .map(([name, data]) => ({ 
        name,
        profit: data.profit
      }))
    
    // Create context for AI response that includes data from both months
    const context = {
      marchData: {
        repPerformance: marchRepPerformance,
        departmentData: marchDepartmentData,
        topPerformers: marchTopPerformers,
      },
      februaryData: {
        repPerformance: februaryRepPerformance,
        departmentData: februaryDepartmentData,
        topPerformers: februaryTopPerformers,
      },
      changes: {
        reps: repChanges,
        departments: departmentChanges
      }
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
            content: `You are Vera, a retail sales data assistant. You help analyze sales rep performance data for February and March 2025.

IMPORTANT GUIDELINES:
- You have access to BOTH February 2025 and March 2025 data - use whichever is most relevant to the query
- You can compare data between months whenever relevant
- Use £ for all currency values (not $ or any other currency)
- All numbers should be formatted appropriately (use commas for thousands)
- Never format your responses with markdown
- Keep responses concise and conversational
- Avoid phrases like "Based on the data provided" or "According to the data"
- Present the most important insights first
- Always specify amounts in your responses
- When asked about changes or comparisons, focus on the differences between February and March

IMPORTANT DEPARTMENT/REP INFORMATION:
- There are three departments: Retail, REVA, and Wholesale
- The "Retail" department includes all reps except those with the names "REVA" or "Wholesale"  
- For rep performance, combine data where the person is listed in either the "Rep" column or "Sub-Rep" column
- When providing rep performance, always specify their department if relevant
- Never confuse the department names (Retail/REVA/Wholesale) with individual rep names

You can answer questions about either month, compare performance between months, or provide insights on month-over-month changes.`
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
      JSON.stringify({ reply }),
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

// Helper functions for processing data
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

function calculateRepChanges(
  marchData: Record<string, RepData>,
  februaryData: Record<string, RepData>
): Record<string, any> {
  const changes: Record<string, any> = {};
  
  // Calculate changes for all reps in current month
  Object.entries(marchData).forEach(([name, data]) => {
    const comparisonData = februaryData[name];
    
    if (comparisonData) {
      changes[name] = {
        profitChange: calculatePercentageChange(data.profit, comparisonData.profit),
        spendChange: calculatePercentageChange(data.spend, comparisonData.spend),
        marginChange: data.margin - comparisonData.margin,
        packsChange: calculatePercentageChange(data.packs, comparisonData.packs),
        accountsChange: calculatePercentageChange(data.accounts, comparisonData.accounts),
        comparisonMonth: 'February',
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
        comparisonMonth: 'February',
        newRep: true
      };
    }
  });
  
  return changes;
}

function calculateDepartmentChanges(
  marchData: Record<string, DepartmentData>,
  februaryData: Record<string, DepartmentData>
): Record<string, any> {
  const changes: Record<string, any> = {};
  
  Object.entries(marchData).forEach(([name, data]) => {
    const comparisonData = februaryData[name];
    
    if (comparisonData) {
      changes[name] = {
        profitChange: calculatePercentageChange(data.totalProfit, comparisonData.totalProfit),
        spendChange: calculatePercentageChange(data.totalSpend, comparisonData.totalSpend),
        marginChange: data.margin - comparisonData.margin,
        packsChange: calculatePercentageChange(data.totalPacks, comparisonData.totalPacks),
        accountsChange: calculatePercentageChange(data.totalAccounts, comparisonData.totalAccounts),
        comparisonMonth: 'February',
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
        comparisonMonth: 'February',
        newDepartment: true
      };
    }
  });
  
  return changes;
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function parseNumeric(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
