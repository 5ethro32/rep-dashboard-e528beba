
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
  topCustomers: any[];
  accountRefMapping: Record<string, string>;
}

interface ComparisonMetrics {
  month: string;
  metrics: OverallMetrics | null;
  repDetails: Record<string, RepSummary>;
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

// Process data for a specific rep - consistently calculating totals across all departments
const processRepData = (allData, repName) => {
  if (!repName) return null;
  
  console.log(`Processing data for rep: ${repName}`);
  
  // Process the combined dataset for this rep (from both Rep and Sub-Rep columns)
  const repData = allData.filter(record => {
    return (record.Rep && record.Rep.toLowerCase().includes(repName.toLowerCase())) || 
           (record['Sub-Rep'] && record['Sub-Rep'].toLowerCase().includes(repName.toLowerCase()));
  });
  
  if (!repData || repData.length === 0) {
    console.log(`No data found for rep ${repName}`);
    return null;
  }
  
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
  const summary: RepSummary = {
    name: repName,
    departments: departments,
    totalSpend: totalSpend,
    totalProfit: totalProfit,
    margin: totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0,
    totalPacks: totalPacks,
    totalAccounts: allAccounts.size,
    activeAccounts: allActiveAccounts.size,
    profitPerActiveAccount: allActiveAccounts.size > 0 ? totalProfit / allActiveAccounts.size : 0
  };
  
  console.log(`Processed details for rep ${repName}:`, {
    totalSpend: summary.totalSpend,
    totalProfit: summary.totalProfit,
    margin: summary.margin,
    departments: summary.departments
  });
  
  return summary;
};

// Process all data to get metrics for a month - consistently calculating across all data
const processMonthData = (allData) => {
  if (!allData || allData.length === 0) return null;
  
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
    bottomPerformersByProfit: [],
    bottomPerformersByMargin: [],
    departmentBreakdown: {},
    topCustomers: [],
    accountRefMapping: {}
  };
  
  // Group by department for breakdown
  const departmentBreakdown: Record<string, {
    spend: number,
    profit: number,
    packs: number,
    accounts: Set<string>,
    activeAccounts: Set<string>
  }> = {};
  
  // Create customer tracking data structures
  const customerProfitMap = new Map<string, {
    accountName: string,
    accountRef: string,
    profit: number,
    spend: number,
    margin: number,
    packs: number
  }>();
  
  // Map account refs to account names
  const accountRefToName = new Map<string, string>();
  
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
      
      // Map account ref to account name
      if (record['Account Name'] && record['Account Ref']) {
        accountRefToName.set(record['Account Ref'], record['Account Name']);
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
    
    // Track customer performance
    if (record['Account Name'] && record['Account Ref']) {
      const accountKey = record['Account Ref'];
      
      if (!customerProfitMap.has(accountKey)) {
        customerProfitMap.set(accountKey, {
          accountName: record['Account Name'],
          accountRef: record['Account Ref'],
          profit: 0,
          spend: 0,
          margin: 0,
          packs: 0
        });
      }
      
      const customerData = customerProfitMap.get(accountKey)!;
      customerData.profit += profit;
      customerData.spend += spend;
      customerData.packs += packs;
      customerData.margin = customerData.spend > 0 ? (customerData.profit / customerData.spend) * 100 : 0;
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
  
  // Process top customers
  let topCustomers = Array.from(customerProfitMap.values())
    .filter(customer => customer.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);
  
  // Convert account ref mapping to a simple object
  const accountRefMapping: Record<string, string> = {};
  accountRefToName.forEach((name, ref) => {
    accountRefMapping[ref] = name;
  });
  
  metrics.topPerformersByProfit = topByProfit;
  metrics.topPerformersByMargin = topByMargin;
  metrics.bottomPerformersByProfit = bottomByProfit;
  metrics.bottomPerformersByMargin = bottomByMargin;
  metrics.departmentBreakdown = formattedDeptBreakdown;
  metrics.topCustomers = topCustomers;
  metrics.accountRefMapping = accountRefMapping;
  
  console.log("Calculated overall metrics:", {
    totalProfit: metrics.totalProfit,
    totalSpend: metrics.totalSpend,
    averageMargin: metrics.averageMargin,
    totalAccounts: metrics.totalAccounts.size,
    activeAccounts: metrics.activeAccounts.size,
    departmentBreakdown: Object.keys(departmentBreakdown).length,
    topCustomersCount: topCustomers.length
  });
  
  return metrics;
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
    
    // Gather data for both months for comparison
    const marchData = await fetchAllData(supabase, tables.march);
    const februaryData = await fetchAllData(supabase, tables.february);
    
    console.log(`Fetched March data: ${marchData.length} records`);
    console.log(`Fetched February data: ${februaryData.length} records`);
    
    // Process month data for consistent metrics
    const marchMetrics = processMonthData(marchData);
    const februaryMetrics = processMonthData(februaryData);
    
    // Extract rep names from both months for processing
    const allReps = new Set<string>();
    [...marchData, ...februaryData].forEach(record => {
      if (record.Rep && !isDepartment(record.Rep)) {
        allReps.add(record.Rep);
      }
      if (record['Sub-Rep'] && record['Sub-Rep'].trim() !== '') {
        allReps.add(record['Sub-Rep']);
      }
    });
    
    // Process rep data for both months for consistency
    const repDetails: Record<string, { 
      march: RepSummary | null, 
      february: RepSummary | null 
    }> = {};
    
    Array.from(allReps).forEach(rep => {
      const marchRepData = processRepData(marchData, rep);
      const februaryRepData = processRepData(februaryData, rep);
      
      if (marchRepData || februaryRepData) {
        repDetails[rep] = {
          march: marchRepData,
          february: februaryRepData
        };
      }
    });
    
    // Calculate month-over-month changes for each rep
    const repChanges: Record<string, {
      profit: {
        amount: number;
        percent: number;
      };
      margin: {
        amount: number;
      };
    }> = {};
    
    Object.entries(repDetails).forEach(([rep, data]) => {
      if (data.march && data.february) {
        const profitChange = data.march.totalProfit - data.february.totalProfit;
        const profitPercent = data.february.totalProfit !== 0 ? 
          (profitChange / data.february.totalProfit) * 100 : 0;
        
        const marginChange = data.march.margin - data.february.margin;
        
        repChanges[rep] = {
          profit: {
            amount: profitChange,
            percent: profitPercent
          },
          margin: {
            amount: marginChange
          }
        };
      }
    });
    
    // Calculate overall month-over-month change
    let monthOverMonthChange = null;
    if (marchMetrics && februaryMetrics) {
      const profitChange = marchMetrics.totalProfit - februaryMetrics.totalProfit;
      const profitPercent = februaryMetrics.totalProfit !== 0 ?
        (profitChange / februaryMetrics.totalProfit) * 100 : 0;
      
      monthOverMonthChange = {
        profit: {
          amount: profitChange,
          percent: profitPercent
        },
        margin: {
          amount: marchMetrics.averageMargin - februaryMetrics.averageMargin
        }
      };
    }

    // Extract any rep name mentioned in the message for detailed lookup
    const repNameMatch = message.match(/(?:about|on|for|by|craig|murray|john|david|simon|laura|paul|steven)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) || 
                          message.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s/i);
    let repName = repNameMatch ? repNameMatch[1] : null;
    
    // Special case: check for common names directly
    const commonRepNames = ['Craig', 'Murray', 'John', 'David', 'Simon', 'Laura', 'Paul', 'Steven', 
                           'Craig McDowall', 'Murray Glasgow'];
    
    for (const name of commonRepNames) {
      if (message.toLowerCase().includes(name.toLowerCase())) {
        repName = name;
        break;
      }
    }
    
    // Determine if asking about customers
    const isAskingAboutCustomers = /customer|account|pharmacy|shop|store|knightswood|account ref|account number/i.test(message);
    
    // Check for specific account or customer
    const accountNameMatch = message.match(/(?:for|about|at|in)\s+([A-Za-z0-9\s]+(?:Pharmacy|Ltd|Limited|Store|Shop))/i) ||
                           message.match(/([A-Za-z0-9\s]+(?:Pharmacy|Ltd|Limited|Store|Shop))/i);
    let customerName = accountNameMatch ? accountNameMatch[1].trim() : null;
    
    // Determine if asking for top or bottom performers
    const isAskingAboutTop = /top|best|highest|leading|most profitable/i.test(message);
    const isAskingAboutWorst = /worst|lowest|poorest|bottom|weakest/i.test(message);
    const isAskingComparison = /compare|comparison|versus|vs|difference|change|growth|increased|decreased/i.test(message);
    
    // Determine if asking about a specific month
    const isAskingAboutMarch = /march/i.test(message);
    const isAskingAboutFebruary = /february|feb/i.test(message);
    
    // Default to March if no month specified
    const targetMonth = isAskingAboutFebruary ? 'february' : 'march';

    // Prepare a system prompt with data context
    const systemPrompt = `
You are Vera, a sales data analysis assistant specialized in helping sales managers understand their rep performance data.
You have access to sales data for both February and March 2025.

IMPORTANT: Always provide CONSISTENT and ACCURATE data by using the combined totals across all departments (Retail, REVA, and Wholesale) for any rep mentioned.

Here's key information from the data:

1. Top performers by profit in March 2025:
${JSON.stringify(marchMetrics?.topPerformersByProfit || 'Data unavailable')}

2. Top performers by margin in March 2025:
${JSON.stringify(marchMetrics?.topPerformersByMargin || 'Data unavailable')}

3. Worst performers by profit in March 2025:
${JSON.stringify(marchMetrics?.bottomPerformersByProfit || 'Data unavailable')}

4. Worst performers by margin in March 2025:
${JSON.stringify(marchMetrics?.bottomPerformersByMargin || 'Data unavailable')}

5. Top performers by profit in February 2025:
${JSON.stringify(februaryMetrics?.topPerformersByProfit || 'Data unavailable')}

6. Top performers by margin in February 2025:
${JSON.stringify(februaryMetrics?.topPerformersByMargin || 'Data unavailable')}

7. Worst performers by profit in February 2025:
${JSON.stringify(februaryMetrics?.bottomPerformersByProfit || 'Data unavailable')}

8. Worst performers by margin in February 2025:
${JSON.stringify(februaryMetrics?.bottomPerformersByMargin || 'Data unavailable')}

${marchMetrics ? `
9. Overall metrics for March 2025:

Total Spend: ${marchMetrics.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${marchMetrics.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Average Margin: ${marchMetrics.averageMargin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${marchMetrics.totalPacks.toLocaleString('en-US')}
Total Accounts: ${marchMetrics.totalAccounts.size}
Active Accounts: ${marchMetrics.activeAccounts.size}
` : ''}

${februaryMetrics ? `
10. Overall metrics for February 2025:

Total Spend: ${februaryMetrics.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${februaryMetrics.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Average Margin: ${februaryMetrics.averageMargin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${februaryMetrics.totalPacks.toLocaleString('en-US')}
Total Accounts: ${februaryMetrics.totalAccounts.size}
Active Accounts: ${februaryMetrics.activeAccounts.size}
` : ''}

${monthOverMonthChange ? `
11. Month-over-Month Change (March vs February):

Profit Change: ${monthOverMonthChange.profit.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${monthOverMonthChange.profit.percent.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%)
Margin Change: ${monthOverMonthChange.margin.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
` : ''}

${repName && repDetails[repName] ? `
12. Specific details for ${repName}:

FEBRUARY 2025 DATA:
${repDetails[repName].february ? `
Total Spend: ${repDetails[repName].february.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${repDetails[repName].february.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Margin: ${repDetails[repName].february.margin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${repDetails[repName].february.totalPacks.toLocaleString('en-US')}
Total Accounts: ${repDetails[repName].february.totalAccounts}
Active Accounts: ${repDetails[repName].february.activeAccounts}
Departments: ${repDetails[repName].february.departments.join(', ')}
` : 'No February data available'}

MARCH 2025 DATA:
${repDetails[repName].march ? `
Total Spend: ${repDetails[repName].march.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${repDetails[repName].march.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Margin: ${repDetails[repName].march.margin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${repDetails[repName].march.totalPacks.toLocaleString('en-US')}
Total Accounts: ${repDetails[repName].march.totalAccounts}
Active Accounts: ${repDetails[repName].march.activeAccounts}
Departments: ${repDetails[repName].march.departments.join(', ')}
` : 'No March data available'}

${repDetails[repName].february && repDetails[repName].march ? `
MONTH-OVER-MONTH CHANGE:
Profit Change: ${(repDetails[repName].march.totalProfit - repDetails[repName].february.totalProfit).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${((repDetails[repName].march.totalProfit - repDetails[repName].february.totalProfit) / repDetails[repName].february.totalProfit * 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%)
Margin Change: ${(repDetails[repName].march.margin - repDetails[repName].february.margin).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
` : ''}
` : ''}

${marchMetrics && marchMetrics.topCustomers && marchMetrics.topCustomers.length > 0 ? `
13. Top Customers by Profit in March 2025:
${JSON.stringify(marchMetrics.topCustomers.slice(0, 10).map(customer => ({
  accountName: customer.accountName,
  accountRef: customer.accountRef,
  profit: customer.profit.toFixed(2),
  spend: customer.spend.toFixed(2),
  margin: customer.margin.toFixed(2),
  packs: customer.packs
})))}
` : ''}

${februaryMetrics && februaryMetrics.topCustomers && februaryMetrics.topCustomers.length > 0 ? `
14. Top Customers by Profit in February 2025:
${JSON.stringify(februaryMetrics.topCustomers.slice(0, 10).map(customer => ({
  accountName: customer.accountName,
  accountRef: customer.accountRef,
  profit: customer.profit.toFixed(2),
  spend: customer.spend.toFixed(2),
  margin: customer.margin.toFixed(2),
  packs: customer.packs
})))}
` : ''}

15. Account Reference to Name Mappings:
${JSON.stringify(marchMetrics?.accountRefMapping ? Object.entries(marchMetrics.accountRefMapping).slice(0, 20) : 'Data unavailable')}

When answering:
1. Be extremely CONCISE and DIRECT - only provide exactly what was asked for
2. If asked about specific numbers, provide the exact figures from the data above
3. When asked about top or worst performers, specify which metric (profit, margin) and include the actual values
4. If data isn't available for a specific question, acknowledge that
5. DO NOT provide ANY sample transactions or unnecessary details that weren't asked for
6. NEVER FORMAT YOUR RESPONSE WITH MARKDOWN or any formatting symbols
7. Use plain text formatting with proper line breaks and paragraphs
8. If responding about a specific rep, use proper paragraph breaks between sections
9. FOR CONSISTENT ANSWERS - Make sure to use a rep's TOTAL profit/margin across ALL departments (Retail, REVA, Wholesale combined)
10. When comparing February to March, always give the exact amounts and percentage changes
11. NEVER refer to Wholesale or REVA as sales reps - they are departments, not individuals

CUSTOMER DATA HANDLING:
- When a user asks about customers or accounts, focus on the Account Name and Account Ref fields
- If a user asks for the "account number" for a specific customer, they're looking for the Account Ref that matches the Account Name
- If a user asks about top customers, provide the top customers by profit (default) unless they specify another metric
- When a user mentions a customer by name, try to find it in the Account Name field and provide its details

IMPORTANT FORMATTING RULES:
- ALWAYS use £ (pound sterling) as currency symbol, not $ or any other currency
- Never use any markdown formatting such as bold, italic, or headers
- Never use any special characters like ** or ## for formatting

${isAskingAboutWorst ? 'IMPORTANT: This question is specifically asking about the WORST performers, so be sure to provide the bottom performers by profit from the data.' : ''}
${isAskingAboutTop ? 'IMPORTANT: This question is specifically asking about the TOP performers, so be sure to provide the top performers by profit from the data.' : ''}
${repName ? `IMPORTANT: The user is asking about ${repName}. Make sure to use CONSISTENT data from the detailed breakdown provided above, showing COMBINED totals across all departments.` : ''}
${isAskingComparison ? 'IMPORTANT: The user is asking for a comparison between February and March. Provide data for both months and calculate the differences.' : ''}
${isAskingAboutCustomers ? 'IMPORTANT: The user is asking about customer data. Focus on providing accurate customer/account information from the Account Name and Account Ref fields.' : ''}
${customerName ? `IMPORTANT: The user is specifically asking about the customer "${customerName}". Look for this customer in the Account Name field and provide its details.` : ''}

Department Structure Info:
- The data is structured across multiple departments: Retail, REVA, and Wholesale
- Rep level data combines all departments for a complete view of individual performance
- Total figures combine all departments for the most accurate picture
- When reporting on a specific rep, ALWAYS include their combined total across all departments
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
