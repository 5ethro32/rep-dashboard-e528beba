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

// Interface for monthly data structure
interface MonthData {
  tableName: string;
  data: any[];
  metrics: OverallMetrics | null;
  repDetails: Record<string, RepSummary>;
}

// Interface for conversation context
interface ConversationContext {
  conversationId: string;
  history: Array<{role: string, content: string}>;
  selectedMonth?: string;
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
  
  // Determine if we're using the new or old schema based on table name
  const isNewSchema = tableName === 'sales_data'; // March data uses new schema
  const isFebruary = tableName === 'sales_data_februrary'; // February data
  const isApril = tableName === 'mtd_daily'; // April data
  
  while (hasMoreData) {
    let query;
    
    if (isNewSchema) {
      // New schema uses rep_type for department
      query = supabase
        .from(tableName)
        .select('*')
        .eq('rep_type', normalizedDept);
    } else {
      // Old schema and April data use 'Department' field
      query = supabase
        .from(tableName)
        .select('*')
        .ilike('Department', normalizedDept);
    }
    
    // Add pagination
    const result = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    const { data, error } = result;
    
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

// Function to normalize field access across different table schemas
const getFieldValue = (record, fieldName, tableName) => {
  if (!record) return null;

  // February (sales_data_februrary) and April (mtd_daily) use capitalized field names
  if (tableName === 'sales_data_februrary' || tableName === 'mtd_daily') {
    // Map field names from the new schema to old schema
    const fieldMapping = {
      'rep_name': 'Rep',
      'sub_rep': 'Sub-Rep',
      'rep_type': 'Department',
      'account_ref': 'Account Ref',
      'account_name': 'Account Name',
      'spend': 'Spend',
      'profit': 'Profit',
      'packs': 'Packs',
      'margin': 'Margin',
      'cost': 'Cost',
      'credit': 'Credit'
    };
    
    // If we're looking for a field that needs to be mapped
    if (fieldMapping[fieldName]) {
      return record[fieldMapping[fieldName]];
    }
    
    // If it's already in the right format
    if (record[fieldName]) {
      return record[fieldName];
    }
    
    // If it's a capitalized field name
    return record[fieldName.charAt(0).toUpperCase() + fieldName.slice(1)];
  } 
  // March data (sales_data) uses lowercase field names
  else {
    // Map field names from the old schema to new schema
    const fieldMapping = {
      'Rep': 'rep_name',
      'Sub-Rep': 'sub_rep',
      'Department': 'rep_type',
      'Account Ref': 'account_ref',
      'Account Name': 'account_name',
      'Spend': 'spend',
      'Profit': 'profit',
      'Packs': 'packs',
      'Margin': 'margin',
      'Cost': 'cost',
      'Credit': 'credit'
    };
    
    // If we're looking for a field that needs to be mapped
    if (fieldMapping[fieldName]) {
      return record[fieldMapping[fieldName]];
    }
    
    // If it's already in the right format
    return record[fieldName];
  }
};

// Process data for a specific rep - consistently calculating totals across all departments
const processRepData = (allData, repName, tableName) => {
  if (!repName || !allData || !allData.length) return null;
  
  console.log(`Processing data for rep: ${repName} from ${tableName}`);
  
  // Process the combined dataset for this rep (from both Rep and Sub-Rep columns)
  const repData = allData.filter(record => {
    const rep = getFieldValue(record, 'rep_name', tableName) || getFieldValue(record, 'Rep', tableName);
    const subRep = getFieldValue(record, 'sub_rep', tableName) || getFieldValue(record, 'Sub-Rep', tableName);
    
    return (rep && rep.toLowerCase().includes(repName.toLowerCase())) || 
           (subRep && subRep.toLowerCase().includes(repName.toLowerCase()));
  });
  
  if (!repData || repData.length === 0) {
    console.log(`No data found for rep ${repName} in ${tableName}`);
    return null;
  }
  
  console.log(`Found ${repData.length} records for ${repName} in ${tableName}`);
  
  // Group by department to show the breakdown
  const departmentData = repData.reduce((acc, record) => {
    const dept = getFieldValue(record, 'Department', tableName) || 
                 getFieldValue(record, 'rep_type', tableName) || 'Unknown';
    
    if (!acc[dept]) {
      acc[dept] = { 
        spend: 0, 
        profit: 0, 
        packs: 0, 
        accounts: new Set(), 
        activeAccounts: new Set(),
      };
    }
    
    const spend = Number(getFieldValue(record, 'spend', tableName) || 0);
    const profit = Number(getFieldValue(record, 'profit', tableName) || 0);
    const packs = Number(getFieldValue(record, 'packs', tableName) || 0);
    const accountRef = getFieldValue(record, 'account_ref', tableName) || 
                       getFieldValue(record, 'Account Ref', tableName);
    
    acc[dept].spend += spend;
    acc[dept].profit += profit;
    acc[dept].packs += packs;
    
    if (accountRef) {
      acc[dept].accounts.add(accountRef);
      if (spend > 0) {
        acc[dept].activeAccounts.add(accountRef);
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
  
  console.log(`Processed details for rep ${repName} from ${tableName}:`, {
    totalSpend: summary.totalSpend,
    totalProfit: summary.totalProfit,
    margin: summary.margin,
    departments: summary.departments
  });
  
  return summary;
};

// Process all data to get metrics for a month - consistently calculating across all data
const processMonthData = (allData, tableName) => {
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
    const dept = getFieldValue(record, 'Department', tableName) || 
                 getFieldValue(record, 'rep_type', tableName) || 'Unknown';
    const spend = Number(getFieldValue(record, 'spend', tableName) || 0);
    const profit = Number(getFieldValue(record, 'profit', tableName) || 0);
    const packs = Number(getFieldValue(record, 'packs', tableName) || 0);
    const accountRef = getFieldValue(record, 'account_ref', tableName) || 
                       getFieldValue(record, 'Account Ref', tableName);
    const accountName = getFieldValue(record, 'account_name', tableName) || 
                        getFieldValue(record, 'Account Name', tableName);
    
    // Add to overall totals
    metrics.totalSpend += spend;
    metrics.totalProfit += profit;
    metrics.totalPacks += packs;
    
    // Track accounts
    if (accountRef) {
      metrics.totalAccounts.add(accountRef);
      if (spend > 0) {
        metrics.activeAccounts.add(accountRef);
      }
      
      // Map account ref to account name
      if (accountName && accountRef) {
        accountRefToName.set(accountRef, accountName);
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
    
    if (accountRef) {
      departmentBreakdown[dept].accounts.add(accountRef);
      if (spend > 0) {
        departmentBreakdown[dept].activeAccounts.add(accountRef);
      }
    }
    
    // Track customer performance
    if (accountName && accountRef) {
      const accountKey = accountRef;
      
      if (!customerProfitMap.has(accountKey)) {
        customerProfitMap.set(accountKey, {
          accountName: accountName,
          accountRef: accountRef,
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
    const rep = getFieldValue(record, 'rep_name', tableName) || getFieldValue(record, 'Rep', tableName);
    const subRep = getFieldValue(record, 'sub_rep', tableName) || getFieldValue(record, 'Sub-Rep', tableName);
    
    if (rep && !isDepartment(rep)) {
      repSet.add(rep);
    }
    if (subRep && subRep.trim() !== '') {
      repSet.add(subRep);
    }
  });
  
  // Then, calculate totals for each rep (combining data where they appear as Rep or Sub-Rep)
  Array.from(repSet).forEach(rep => {
    let totalProfit = 0;
    let totalSpend = 0;
    let totalPacks = 0;
    
    // Add data where the person is listed as Rep
    allData.forEach(record => {
      const recordRep = getFieldValue(record, 'rep_name', tableName) || getFieldValue(record, 'Rep', tableName);
      if (recordRep === rep) {
        totalProfit += Number(getFieldValue(record, 'profit', tableName) || 0);
        totalSpend += Number(getFieldValue(record, 'spend', tableName) || 0);
        totalPacks += Number(getFieldValue(record, 'packs', tableName) || 0);
      }
    });
    
    // Add data where the person is listed as Sub-Rep
    allData.forEach(record => {
      const recordSubRep = getFieldValue(record, 'sub_rep', tableName) || getFieldValue(record, 'Sub-Rep', tableName);
      if (recordSubRep === rep) {
        totalProfit += Number(getFieldValue(record, 'profit', tableName) || 0);
        totalSpend += Number(getFieldValue(record, 'spend', tableName) || 0);
        totalPacks += Number(getFieldValue(record, 'packs', tableName) || 0);
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
  
  console.log(`Calculated overall metrics for ${tableName}:`, {
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

// Function to find a specific customer by name or account reference
const findCustomerData = async (supabase, customerQuery, monthsToCheck = ['february', 'march', 'april']) => {
  const results = {};
  
  for (const month of monthsToCheck) {
    let tableName;
    if (month === 'february') tableName = 'sales_data_februrary';
    else if (month === 'march') tableName = 'sales_data';
    else if (month === 'april') tableName = 'mtd_daily';
    
    // Skip if we don't have a valid table name
    if (!tableName) continue;
    
    let allData;
    try {
      allData = await fetchAllData(supabase, tableName);
    } catch (error) {
      console.error(`Error fetching ${month} data:`, error);
      continue;
    }
    
    // Search for customers by name or reference
    const matchingCustomers = allData.filter(record => {
      const accountName = getFieldValue(record, 'account_name', tableName) || 
                        getFieldValue(record, 'Account Name', tableName) || '';
      const accountRef = getFieldValue(record, 'account_ref', tableName) || 
                       getFieldValue(record, 'Account Ref', tableName) || '';
      
      return accountName.toLowerCase().includes(customerQuery.toLowerCase()) || 
             accountRef.toLowerCase().includes(customerQuery.toLowerCase());
    });
    
    if (matchingCustomers.length > 0) {
      // Group by account reference to aggregate data
      const customerGroups = {};
      
      matchingCustomers.forEach(record => {
        const accountRef = getFieldValue(record, 'account_ref', tableName) || 
                         getFieldValue(record, 'Account Ref', tableName);
        const accountName = getFieldValue(record, 'account_name', tableName) || 
                          getFieldValue(record, 'Account Name', tableName);
        
        if (!customerGroups[accountRef]) {
          customerGroups[accountRef] = {
            accountRef,
            accountName,
            totalSpend: 0,
            totalProfit: 0,
            totalPacks: 0,
            margin: 0,
            reps: new Set(),
            transactions: matchingCustomers.length
          };
        }
        
        const spend = Number(getFieldValue(record, 'spend', tableName) || 0);
        const profit = Number(getFieldValue(record, 'profit', tableName) || 0);
        const packs = Number(getFieldValue(record, 'packs', tableName) || 0);
        const rep = getFieldValue(record, 'rep_name', tableName) || 
                  getFieldValue(record, 'Rep', tableName);
        const subRep = getFieldValue(record, 'sub_rep', tableName) || 
                     getFieldValue(record, 'Sub-Rep', tableName);
        
        customerGroups[accountRef].totalSpend += spend;
        customerGroups[accountRef].totalProfit += profit;
        customerGroups[accountRef].totalPacks += packs;
        
        if (rep) customerGroups[accountRef].reps.add(rep);
        if (subRep) customerGroups[accountRef].reps.add(subRep);
      });
      
      // Calculate margins and format rep arrays
      Object.values(customerGroups).forEach(customer => {
        customer.margin = customer.totalSpend > 0 ? (customer.totalProfit / customer.totalSpend) * 100 : 0;
        customer.reps = Array.from(customer.reps);
      });
      
      results[month] = Object.values(customerGroups);
    } else {
      results[month] = [];
    }
  }
  
  return results;
};

// Fetch top performers using SQL functions for better optimization
const fetchTopPerformers = async (supabase, month) => {
  try {
    let topProfitFunction, topMarginFunction;
    
    // Determine which SQL function to call based on the month
    if (month === 'march') {
      topProfitFunction = 'get_march_top_reps_by_profit';
      topMarginFunction = 'get_march_top_reps_by_margin';
    } else if (month === 'april') {
      topProfitFunction = 'get_april_top_reps_by_profit';
      topMarginFunction = 'get_april_top_reps_by_margin';
    } else {
      // For February, we'll calculate manually as we don't have a specialized function
      return null;
    }
    
    // Fetch top performers by profit
    const { data: topProfit, error: profitError } = await supabase
      .rpc(topProfitFunction);
      
    if (profitError) {
      console.error(`Error fetching top performers by profit for ${month}:`, profitError);
      return null;
    }
    
    // Fetch top performers by margin  
    const { data: topMargin, error: marginError } = await supabase
      .rpc(topMarginFunction);
      
    if (marginError) {
      console.error(`Error fetching top performers by margin for ${month}:`, marginError);
      return null;
    }
    
    return {
      topByProfit: topProfit || [],
      topByMargin: topMargin || []
    };
  } catch (error) {
    console.error(`Error fetching top performers for ${month}:`, error);
    return null;
  }
};

// Main function to gather all data across months for comprehensive querying
const gatherAllMonthsData = async (supabase) => {
  try {
    // Define tables for each month
    const monthTables = {
      'february': 'sales_data_februrary',
      'march': 'sales_data',
      'april': 'mtd_daily'
    };
    
    // Object to store all month data
    const allMonths: Record<string, MonthData> = {};
    
    // Fetch and process data for each month
    for (const [month, tableName] of Object.entries(monthTables)) {
      console.log(`Fetching data for ${month} from ${tableName}...`);
      
      try {
        // Fetch all data for the month
        const monthData = await fetchAllData(supabase, tableName);
        
        // Process metrics for the month
        const metrics = processMonthData(monthData, tableName);
        
        // Extract rep names for processing individual rep data
        const repSet = new Set<string>();
        monthData.forEach(record => {
          const rep = getFieldValue(record, 'rep_name', tableName) || getFieldValue(record, 'Rep', tableName);
          const subRep = getFieldValue(record, 'sub_rep', tableName) || getFieldValue(record, 'Sub-Rep', tableName);
          
          if (rep && !isDepartment(rep)) {
            repSet.add(rep);
          }
          if (subRep && subRep.trim() !== '') {
            repSet.add(subRep);
          }
        });
        
        // Process data for each rep
        const repDetails: Record<string, RepSummary> = {};
        Array.from(repSet).forEach(rep => {
          const repData = processRepData(monthData, rep, tableName);
          if (repData) {
            repDetails[rep] = repData;
          }
        });
        
        // Store all data for this month
        allMonths[month] = {
          tableName,
          data: monthData,
          metrics,
          repDetails
        };
        
        console.log(`Completed processing ${month} data: ${monthData.length} records, ${Object.keys(repDetails).length} reps`);
      } catch (error) {
        console.error(`Error processing ${month} data:`, error);
        allMonths[month] = {
          tableName,
          data: [],
          metrics: null,
          repDetails: {}
        };
      }
    }
    
    return allMonths;
  } catch (error) {
    console.error('Error gathering all months data:', error);
    throw error;
  }
};

// New function to extract entities from user query using enhanced NLP
const extractEntities = (message: string) => {
  const entities: {
    repNames: string[];
    months: string[];
    metrics: string[];
    customers: string[];
    departments: string[];
    comparisons: boolean;
    insights: boolean;
    trend: boolean;
    reasons: boolean;
  } = {
    repNames: [],
    months: [],
    metrics: [],
    customers: [],
    departments: [],
    comparisons: false,
    insights: false,
    trend: false,
    reasons: false
  };

  // Enhanced rep name detection
  const commonRepNames = [
    'Craig', 'Murray', 'John', 'David', 'Simon', 'Laura', 'Paul', 'Steven', 
    'Craig McDowall', 'Murray Glasgow', 'Mike Cooper', 'Louise Skiba', 'Michael McKay',
    'Jonny Cunningham', 'Ged Thomas', 'Pete Dhillon', 'Clare Quinn', 'Stuart Geddes', 
    'Yvonne Walton', 'Adam Forsythe', 'Cammy Stuart'
  ];
  
  for (const name of commonRepNames) {
    if (message.toLowerCase().includes(name.toLowerCase())) {
      entities.repNames.push(name);
    }
  }
  
  // Extract month mentions
  const monthPatterns = [
    { regex: /\b(jan|january)\b/i, value: 'january' },
    { regex: /\b(feb|february)\b/i, value: 'february' },
    { regex: /\b(mar|march)\b/i, value: 'march' },
    { regex: /\b(apr|april)\b/i, value: 'april' },
    { regex: /last month/i, value: 'lastMonth' },
    { regex: /this month/i, value: 'thisMonth' },
    { regex: /previous month/i, value: 'previousMonth' }
  ];
  
  monthPatterns.forEach(pattern => {
    if (pattern.regex.test(message)) {
      entities.months.push(pattern.value);
    }
  });
  
  // Extract metric mentions
  const metricPatterns = [
    { regex: /\b(profit|profitability|earnings|income)\b/i, value: 'profit' },
    { regex: /\b(margin|margins)\b/i, value: 'margin' },
    { regex: /\b(spend|sales|revenue|turnover)\b/i, value: 'spend' },
    { regex: /\b(pack|packs)\b/i, value: 'packs' },
    { regex: /\b(account|accounts|customer|customers)\b/i, value: 'accounts' },
    { regex: /\b(performance|performing)\b/i, value: 'performance' }
  ];
  
  metricPatterns.forEach(pattern => {
    if (pattern.regex.test(message)) {
      entities.metrics.push(pattern.value);
    }
  });
  
  // Check for department mentions
  const deptPatterns = [
    { regex: /\b(retail)\b/i, value: 'RETAIL' },
    { regex: /\b(reva)\b/i, value: 'REVA' },
    { regex: /\b(wholesale)\b/i, value: 'Wholesale' }
  ];
  
  deptPatterns.forEach(pattern => {
    if (pattern.regex.test(message)) {
      entities.departments.push(pattern.value);
    }
  });
  
  // Check for customer inquiries
  const customerRegex = /(?:for|about|at|in)\s+([A-Za-z0-9\s]+(?:Pharmacy|Ltd|Limited|Store|Shop))/i;
  const customerMatch = message.match(customerRegex);
  if (customerMatch) {
    entities.customers.push(customerMatch[1].trim());
  }
  
  // Check for comparison intent
  entities.comparisons = /compare|comparison|versus|vs|difference|change|growth|increased|decreased/i.test(message);
  
  // Check for insights request
  entities.insights = /insight|insights|analysis|analyze|understand|explain|overview/i.test(message);
  
  // Check for trend analysis
  entities.trend = /trend|trending|over time|pattern|trajectory|history|historical/i.test(message);
  
  // Check for reasons/explanations
  entities.reasons = /why|reason|cause|explain|because|lead to|resulted in|due to/i.test(message);
  
  return entities;
};

// New function to reformulate vague queries
const reformulateQuery = (message: string, entities: any, selectedMonth: string): string => {
  let reformulation = message;
  
  // If query is very short/vague, expand it based on extracted entities
  if (message.length < 15) {
    if (entities.repNames.length > 0) {
      const repName = entities.repNames[0];
      reformulation = `Tell me about ${repName}'s sales performance${selectedMonth ? ` in ${selectedMonth}` : ''}`;
    } else if (message.toLowerCase().includes('top')) {
      reformulation = `Who are the top performing sales reps${selectedMonth ? ` in ${selectedMonth}` : ''}?`;
    } else if (message.toLowerCase().includes('worst') || message.toLowerCase().includes('bottom')) {
      reformulation = `Who are the worst performing sales reps${selectedMonth ? ` in ${selectedMonth}` : ''}?`;
    }
  }
  
  // If no time period specified but comparing, assume last two months
  if (entities.comparisons && entities.months.length === 0) {
    if (selectedMonth === 'April') {
      reformulation += ' comparing March and April';
    } else if (selectedMonth === 'March') {
      reformulation += ' comparing February and March';
    }
  }
  
  // If asking for reasons without specific metrics
  if (entities.reasons && entities.metrics.length === 0) {
    reformulation += ' in terms of profit and sales volume';
  }
  
  return reformulation;
};

// New function to determine if we should include data visualizations
const shouldIncludeVisualization = (message: string, entities: any): {
  includeChart: boolean,
  chartType?: 'bar' | 'line' | 'pie',
  includeTable: boolean
} => {
  const result = {
    includeChart: false,
    chartType: undefined as 'bar' | 'line' | 'pie' | undefined,
    includeTable: false
  };
  
  // Check for explicit visualization requests
  if (/chart|graph|plot|visual|visually|show me/i.test(message)) {
    result.includeChart = true;
    
    // Determine chart type based on query content
    if (entities.trend || /over time|history|pattern|trend/i.test(message)) {
      result.chartType = 'line';
    } else if (entities.comparisons || entities.months.length > 1 || entities.repNames.length > 1) {
      result.chartType = 'bar';
    } else if (/breakdown|distribution|share|split/i.test(message)) {
      result.chartType = 'pie';
    } else {
      result.chartType = 'bar'; // Default
    }
  }
  
  // Check for tabular data requests
  if (/table|list|breakdown|details|specifically|exactly/i.test(message)) {
    result.includeTable = true;
  }
  
  return result;
};

// Enhanced function to analyze trends and anomalies
const analyzeDataTrends = (
  februaryData: OverallMetrics | null, 
  marchData: OverallMetrics | null, 
  aprilData: OverallMetrics | null
): string => {
  if (!februaryData || !marchData) {
    return '';
  }
  
  const insights = [];
  
  // Calculate month-over-month changes for key metrics
  const febToMarProfit = marchData.totalProfit - februaryData.totalProfit;
  const febToMarProfitPercent = (febToMarProfit / februaryData.totalProfit) * 100;
  
  const febToMarSpend = marchData.totalSpend - februaryData.totalSpend;
  const febToMarSpendPercent = (febToMarSpend / februaryData.totalSpend) * 100;
  
  const febToMarMargin = marchData.averageMargin - februaryData.averageMargin;
  
  // Detect significant changes (>10% or <-10%)
  if (Math.abs(febToMarProfitPercent) > 10) {
    const direction = febToMarProfitPercent > 0 ? 'increased' : 'decreased';
    insights.push(`Total profit ${direction} by ${Math.abs(febToMarProfitPercent).toFixed(1)}% from February to March.`);
    
    // Add possible explanations
    if (febToMarProfitPercent > 0 && febToMarSpendPercent > 0) {
      insights.push(`This growth appears to be driven by higher sales volume.`);
    } else if (febToMarProfitPercent > 0 && febToMarMargin > 0) {
      insights.push(`This improvement appears to be driven by better margins rather than volume.`);
    } else if (febToMarProfitPercent < 0 && febToMarSpendPercent < 0) {
      insights.push(`This decline appears to be primarily due to lower sales volume.`);
    } else if (febToMarProfitPercent < 0 && febToMarMargin < 0) {
      insights.push(`This decline appears to be driven by margin compression.`);
    }
  }
  
  // Include April data if available
  if (aprilData) {
    const marToAprProfit = aprilData.totalProfit - marchData.totalProfit;
    const marToAprProfitPercent = (marToAprProfit / marchData.totalProfit) * 100;
    
    if (Math.abs(marToAprProfitPercent) > 10) {
      const direction = marToAprProfitPercent > 0 ? 'increasing' : 'decreasing';
      insights.push(`The trend is continuing with profit ${direction} by ${Math.abs(marToAprProfitPercent).toFixed(1)}% from March to April.`);
    }
  }
  
  // Add top performer consistency insights
  const topPerformersFeb = new Set(februaryData.topPerformersByProfit.map(x => x.rep));
  const topPerformersMar = new Set(marchData.topPerformersByProfit.map(x => x.rep));
  
  const consistentTopPerformers = [...topPerformersFeb].filter(rep => topPerformersMar.has(rep));
  if (consistentTopPerformers.length > 0) {
    insights.push(`${consistentTopPerformers.join(', ')} ${consistentTopPerformers.length === 1 ? 'has' : 'have'} been among top performers for both February and March.`);
  }
  
  return insights.join(' ');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, selectedMonth, conversationContext } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Gather comprehensive data for all months
    const allMonthsData = await gatherAllMonthsData(supabase);
    
    // Apply enhanced entity extraction
    const entities = extractEntities(message);
    
    // Reformulate query if vague
    const enhancedQuery = reformulateQuery(message, entities, selectedMonth);
    
    // Determine if we should include visualizations
    const visualizationInfo = shouldIncludeVisualization(message, entities);
    
    // Extract repName from entities
    const repName = entities.repNames.length > 0 ? entities.repNames[0] : null;
    
    // Determine if asking about customers
    const isAskingAboutCustomers = entities.customers.length > 0 || /customer|account|pharmacy|shop|store|account ref|account number/i.test(message);
    
    // Check for specific account or customer
    const customerName = entities.customers.length > 0 ? entities.customers[0] : null;
    
    // If asking about a customer, fetch the customer data
    let customerData = null;
    if (customerName) {
      customerData = await findCustomerData(supabase, customerName);
    }
    
    // Generate data visualizations if needed
    let chartData = null;
    let chartType = null;
    let tableData = null;
    let tableHeaders = null;
    
    if (visualizationInfo.includeChart) {
      // Example chart data structure - in a real implementation, you'd generate this based on the query
      if (entities.repNames.length > 0 && entities.comparisons) {
        // Comparison chart for a specific rep across months
        const repName = entities.repNames[0];
        chartData = {
          labels: ['February', 'March', 'April'],
          datasets: [{
            name: 'Profit',
            data: [
              allMonthsData.february?.repDetails[repName]?.totalProfit || 0,
              allMonthsData.march?.repDetails[repName]?.totalProfit || 0,
              allMonthsData.april?.repDetails[repName]?.totalProfit || 0
            ]
          }]
        };
        chartType = 'bar';
      } else if (entities.metrics.includes('profit') && !entities.repNames.length) {
        // Overall profit trend chart
        chartData = {
          labels: ['February', 'March', 'April'],
          datasets: [{
            name: 'Total Profit',
            data: [
              allMonthsData.february?.metrics?.totalProfit || 0,
              allMonthsData.march?.metrics?.totalProfit || 0,
              allMonthsData.april?.metrics?.totalProfit || 0
            ]
          }]
        };
        chartType = visualizationInfo.chartType;
      }
    }
    
    if (visualizationInfo.includeTable) {
      // Example table data structure - in a real implementation, you'd generate this based on the query
      if (entities.repNames.length > 0) {
        // Table with rep performance across months
        const repName = entities.repNames[0];
        tableHeaders = ['Month', 'Profit', 'Spend', 'Margin', 'Packs'];
        tableData = [
          {
            month: 'February',
            profit: allMonthsData.february?.repDetails[repName]?.totalProfit?.toFixed(2) || 'N/A',
            spend: allMonthsData.february?.repDetails[repName]?.totalSpend?.toFixed(2) || 'N/A',
            margin: allMonthsData.february?.repDetails[repName]?.margin?.toFixed(2) + '%' || 'N/A',
            packs: allMonthsData.february?.repDetails[repName]?.totalPacks || 'N/A'
          },
          {
            month: 'March',
            profit: allMonthsData.march?.repDetails[repName]?.totalProfit?.toFixed(2) || 'N/A',
            spend: allMonthsData.march?.repDetails[repName]?.totalSpend?.toFixed(2) || 'N/A',
            margin: allMonthsData.march?.repDetails[repName]?.margin?.toFixed(2) + '%' || 'N/A',
            packs: allMonthsData.march?.repDetails[repName]?.totalPacks || 'N/A'
          },
          {
            month: 'April',
            profit: allMonthsData.april?.repDetails[repName]?.totalProfit?.toFixed(2) || 'N/A',
            spend: allMonthsData.april?.repDetails[repName]?.totalSpend?.toFixed(2) || 'N/A',
            margin: allMonthsData.april?.repDetails[repName]?.margin?.toFixed(2) + '%' || 'N/A',
            packs: allMonthsData.april?.repDetails[repName]?.totalPacks || 'N/A'
          }
        ];
      } else if (message.toLowerCase().includes('top') || message.toLowerCase().includes('best')) {
        // Table with top performers
        tableHeaders = ['Rep', 'Profit', 'Margin'];
        tableData = allMonthsData[selectedMonth.toLowerCase()]?.metrics?.topPerformersByProfit.map(rep => ({
          rep: rep.rep,
          profit: rep.profit.toFixed(2),
          margin: (allMonthsData[selectedMonth.toLowerCase()]?.repDetails[rep.rep]?.margin || 0).toFixed(2) + '%'
        })) || [];
      }
    }
    
    // Check if asking for insights or trend analysis
    let trendAnalysis = '';
    if (entities.insights || entities.trend || entities.reasons) {
      trendAnalysis = analyzeDataTrends(
        allMonthsData.february?.metrics || null, 
        allMonthsData.march?.metrics || null,
        allMonthsData.april?.metrics || null
      );
    }

    // Try to fetch top performers using SQL functions for better performance
    const marchTopPerformers = await fetchTopPerformers(supabase, 'march');
    const aprilTopPerformers = await fetchTopPerformers(supabase, 'april');
    
    // Prepare previous conversation context for the LLM
    const previousMessages = conversationContext?.history || [];
    
    // Prepare a system prompt with data context
    const systemPrompt = `
You are Vera, a sales data analysis assistant specialized in helping sales managers understand their rep performance data.
You have access to sales data for February, March, and April 2025.

IMPORTANT: Always provide CONSISTENT and ACCURATE data by using the combined totals across all departments (Retail, REVA, and Wholesale) for any rep mentioned.

${trendAnalysis ? `\n\nIMPORTANT INSIGHTS:\n${trendAnalysis}\n\n` : ''}

Here's key information from the data:

${allMonthsData.march && allMonthsData.march.metrics ? `
MARCH 2025 OVERALL METRICS:
Total Spend: ${allMonthsData.march.metrics.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${allMonthsData.march.metrics.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Average Margin: ${allMonthsData.march.metrics.averageMargin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${allMonthsData.march.metrics.totalPacks.toLocaleString('en-US')}
Total Accounts: ${allMonthsData.march.metrics.totalAccounts.size}
Active Accounts: ${allMonthsData.march.metrics.activeAccounts.size}

TOP PERFORMERS BY PROFIT:
${JSON.stringify(marchTopPerformers?.topByProfit || allMonthsData.march.metrics?.topPerformersByProfit || 'Data unavailable')}

TOP PERFORMERS BY MARGIN:
${JSON.stringify(marchTopPerformers?.topByMargin || allMonthsData.march.metrics?.topPerformersByMargin || 'Data unavailable')}

WORST PERFORMERS BY PROFIT:
${JSON.stringify(allMonthsData.march.metrics?.bottomPerformersByProfit || 'Data unavailable')}

WORST PERFORMERS BY MARGIN:
${JSON.stringify(allMonthsData.march.metrics?.bottomPerformersByMargin || 'Data unavailable')}
` : 'No March data available'}

${allMonthsData.february && allMonthsData.february.metrics ? `
FEBRUARY 2025 OVERALL METRICS:
Total Spend: ${allMonthsData.february.metrics.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${allMonthsData.february.metrics.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Average Margin: ${allMonthsData.february.metrics.averageMargin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${allMonthsData.february.metrics.totalPacks.toLocaleString('en-US')}
Total Accounts: ${allMonthsData.february.metrics.totalAccounts.size}
Active Accounts: ${allMonthsData.february.metrics.activeAccounts.size}

TOP PERFORMERS BY PROFIT:
${JSON.stringify(allMonthsData.february.metrics?.topPerformersByProfit || 'Data unavailable')}

TOP PERFORMERS BY MARGIN:
${JSON.stringify(allMonthsData.february.metrics?.topPerformersByMargin || 'Data unavailable')}

WORST PERFORMERS BY PROFIT:
${JSON.stringify(allMonthsData.february.metrics?.bottomPerformersByProfit || 'Data unavailable')}

WORST PERFORMERS BY MARGIN:
${JSON.stringify(allMonthsData.february.metrics?.bottomPerformersByMargin || 'Data unavailable')}
` : 'No February data available'}

${allMonthsData.april && allMonthsData.april.metrics ? `
APRIL 2025 OVERALL METRICS:
Total Spend: ${allMonthsData.april.metrics.totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${allMonthsData.april.metrics.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Average Margin: ${allMonthsData.april.metrics.averageMargin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${allMonthsData.april.metrics.totalPacks.toLocaleString('en-US')}
Total Accounts: ${allMonthsData.april.metrics.totalAccounts.size}
Active Accounts: ${allMonthsData.april.metrics.activeAccounts.size}

TOP PERFORMERS BY PROFIT:
${JSON.stringify(aprilTopPerformers?.topByProfit || allMonthsData.april.metrics?.topPerformersByProfit || 'Data unavailable')}

TOP PERFORMERS BY MARGIN:
${JSON.stringify(aprilTopPerformers?.topByMargin || allMonthsData.april.metrics?.topPerformersByMargin || 'Data unavailable')}

WORST PERFORMERS BY PROFIT:
${JSON.stringify(allMonthsData.april.metrics?.bottomPerformersByProfit || 'Data unavailable')}

WORST PERFORMERS BY MARGIN:
${JSON.stringify(allMonthsData.april.metrics?.bottomPerformersByMargin || 'Data unavailable')}
` : 'No April data available'}

${repName && (
  (allMonthsData.march && allMonthsData.march.repDetails[repName]) || 
  (allMonthsData.february && allMonthsData.february.repDetails[repName]) ||
  (allMonthsData.april && allMonthsData.april.repDetails[repName])
) ? `
SPECIFIC DETAILS FOR ${repName.toUpperCase()}:

${allMonthsData.february && allMonthsData.february.repDetails[repName] ? `
FEBRUARY 2025 DATA:
Total Spend: ${allMonthsData.february.repDetails[repName].totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${allMonthsData.february.repDetails[repName].totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Margin: ${allMonthsData.february.repDetails[repName].margin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${allMonthsData.february.repDetails[repName].totalPacks.toLocaleString('en-US')}
Total Accounts: ${allMonthsData.february.repDetails[repName].totalAccounts}
Active Accounts: ${allMonthsData.february.repDetails[repName].activeAccounts}
Departments: ${allMonthsData.february.repDetails[repName].departments.join(', ')}
` : 'No February data available for this rep'}

${allMonthsData.march && allMonthsData.march.repDetails[repName] ? `
MARCH 2025 DATA:
Total Spend: ${allMonthsData.march.repDetails[repName].totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${allMonthsData.march.repDetails[repName].totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Margin: ${allMonthsData.march.repDetails[repName].margin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${allMonthsData.march.repDetails[repName].totalPacks.toLocaleString('en-US')}
Total Accounts: ${allMonthsData.march.repDetails[repName].totalAccounts}
Active Accounts: ${allMonthsData.march.repDetails[repName].activeAccounts}
Departments: ${allMonthsData.march.repDetails[repName].departments.join(', ')}
` : 'No March data available for this rep'}

${allMonthsData.april && allMonthsData.april.repDetails[repName] ? `
APRIL 2025 DATA:
Total Spend: ${allMonthsData.april.repDetails[repName].totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Total Profit: ${allMonthsData.april.repDetails[repName].totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Margin: ${allMonthsData.april.repDetails[repName].margin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
Total Packs: ${allMonthsData.april.repDetails[repName].totalPacks.toLocaleString('en-US')}
Total Accounts: ${allMonthsData.april.repDetails[repName].totalAccounts}
Active Accounts: ${allMonthsData.april.repDetails[repName].activeAccounts}
Departments: ${allMonthsData.april.repDetails[repName].departments.join(', ')}
` : 'No April data available for this rep'}

${allMonthsData.february && allMonthsData.february.repDetails[repName] && allMonthsData.march && allMonthsData.march.repDetails[repName] ? `
MONTH-OVER-MONTH CHANGE (FEBRUARY TO MARCH):
Profit Change: ${(allMonthsData.march.repDetails[repName].totalProfit - allMonthsData.february.repDetails[repName].totalProfit).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${allMonthsData.february.repDetails[repName].totalProfit !== 0 ? ((allMonthsData.march.repDetails[repName].totalProfit - allMonthsData.february.repDetails[repName].totalProfit) / allMonthsData.february.repDetails[repName].totalProfit * 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}%)
Margin Change: ${(allMonthsData.march.repDetails[repName].margin - allMonthsData.february.repDetails[repName].margin).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
` : ''}

${allMonthsData.march && allMonthsData.march.repDetails[repName] && allMonthsData.april && allMonthsData.april.repDetails[repName] ? `
MONTH-OVER-MONTH CHANGE (MARCH TO APRIL):
Profit Change: ${(allMonthsData.april.repDetails[repName].totalProfit - allMonthsData.march.repDetails[repName].totalProfit).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${allMonthsData.march.repDetails[repName].totalProfit !== 0 ? ((allMonthsData.april.repDetails[repName].totalProfit - allMonthsData.march.repDetails[repName].totalProfit) / allMonthsData.march.repDetails[repName].totalProfit * 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}%)
Margin Change: ${(allMonthsData.april.repDetails[repName].margin - allMonthsData.march.repDetails[repName].margin).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
` : ''}
` : ''}

${customerData && customerName ? `
CUSTOMER DATA FOR "${customerName}":

${customerData.february && customerData.february.length > 0 ? `
FEBRUARY 2025 DATA:
${JSON.stringify(customerData.february.map(customer => ({
  accountName: customer.accountName,
  accountRef: customer.accountRef,
  totalSpend: customer.totalSpend.toFixed(2),
  totalProfit: customer.totalProfit.toFixed(2),
  margin: customer.margin.toFixed(2),
  totalPacks: customer.totalPacks,
  reps: customer.reps
})))}
` : 'No February data available for this customer'}

${customerData.march && customerData.march.length > 0 ? `
MARCH 2025 DATA:
${JSON.stringify(customerData.march.map(customer => ({
  accountName: customer.accountName,
  accountRef: customer.accountRef,
  totalSpend: customer.totalSpend.toFixed(2),
  totalProfit: customer.totalProfit.toFixed(2),
  margin: customer.margin.toFixed(2),
  totalPacks: customer.totalPacks,
  reps: customer.reps
})))}
` : 'No March data available for this customer'}

${customerData.april && customerData.april.length > 0 ? `
APRIL 2025 DATA:
${JSON.stringify(customerData.april.map(customer => ({
  accountName: customer.accountName,
  accountRef: customer.accountRef,
  totalSpend: customer.totalSpend.toFixed(2),
  totalProfit: customer.totalProfit.toFixed(2),
  margin: customer.margin.toFixed(2),
  totalPacks: customer.totalPacks,
  reps: customer.reps
})))}
` : 'No April data available for this customer'}
` : ''}

When answering:
1. Be conversational, helpful, and insightful - not just reporting numbers
2. If asked about specific numbers, provide the exact figures from the data above
3. When asked about top or worst performers, specify which metric (profit, margin) and include the actual values
4. If data isn't available for a specific question, acknowledge that
5. NEVER FORMAT YOUR RESPONSE WITH MARKDOWN or any formatting symbols
6. Use plain text formatting with proper line breaks and paragraphs
7. If responding about a specific rep, use proper paragraph breaks between sections
8. FOR CONSISTENT ANSWERS - Make sure to use a rep's TOTAL profit/margin across ALL departments (Retail, REVA, Wholesale combined)
9. When comparing between months, always give the exact amounts and percentage changes
10. NEVER refer to Wholesale or REVA as sales reps - they are departments, not individuals
11. Respond to any questions about WHY something happened with informed analysis
12. If the user asks a vague question, try to give the most relevant information

IMPORTANT FORMATTING RULES:
- ALWAYS use £ (pound sterling) as currency symbol, not $ or any other currency
- Never use any markdown formatting such as bold, italic, or headers
- Never use any special characters like ** or ## for formatting

I will include visualizations separately in the UI, just focus on providing a clear, insightful textual response.
`;

    // Call OpenAI API to generate response
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...previousMessages.slice(-5), // Include the last 5 messages for context
          { role: 'user', content: enhancedQuery || message }
        ],
        temperature: 0.3, // Lower temperature for more consistent responses
        max_tokens: 1000
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const aiData = await openAIResponse.json();
    const aiResponse = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        chartData,
        chartType,
        tableData,
        tableHeaders
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in rep-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
