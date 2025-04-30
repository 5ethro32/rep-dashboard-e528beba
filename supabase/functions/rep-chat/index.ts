
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

// Enhanced function to extract entities from user query using improved NLP techniques
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
    visualization: boolean;
    visualization_type: string | null;
  } = {
    repNames: [],
    months: [],
    metrics: [],
    customers: [],
    departments: [],
    comparisons: false,
    insights: false,
    trend: false,
    reasons: false,
    visualization: false,
    visualization_type: null
  };

  // Enhanced rep name detection with broader pattern matching
  const commonRepNames = [
    'Craig', 'Murray', 'John', 'David', 'Simon', 'Laura', 'Paul', 'Steven', 
    'Craig McDowall', 'Murray Glasgow', 'Mike Cooper', 'Louise Skiba', 'Michael McKay',
    'Jonny Cunningham', 'Ged Thomas', 'Pete Dhillon', 'Clare Quinn', 'Stuart Geddes', 
    'Yvonne Walton', 'Adam Forsythe', 'Cammy Stuart'
  ];
  
  // Match rep names more flexibly
  for (const name of commonRepNames) {
    const nameParts = name.toLowerCase().split(' ');
    const messageLower = message.toLowerCase();
    
    // Match either full name or just first name
    if (messageLower.includes(name.toLowerCase()) || 
        (nameParts.length > 1 && nameParts.some(part => messageLower.includes(part) && part.length > 3))) {
      entities.repNames.push(name);
    }
  }
  
  // Extract month mentions with more flexibility
  const monthPatterns = [
    { regex: /\b(jan|january)\b/i, value: 'january' },
    { regex: /\b(feb|february)\b/i, value: 'february' },
    { regex: /\b(mar|march)\b/i, value: 'march' },
    { regex: /\b(apr|april)\b/i, value: 'april' },
    { regex: /last month/i, value: 'lastMonth' },
    { regex: /this month/i, value: 'thisMonth' },
    { regex: /previous month/i, value: 'previousMonth' },
    { regex: /current month/i, value: 'thisMonth' }
  ];
  
  monthPatterns.forEach(pattern => {
    if (pattern.regex.test(message)) {
      entities.months.push(pattern.value);
    }
  });

  // Extract departments
  const departmentPatterns = [
    { regex: /\b(retail)\b/i, value: 'retail' },
    { regex: /\b(reva)\b/i, value: 'reva' },
    { regex: /\b(wholesale)\b/i, value: 'wholesale' }
  ];

  departmentPatterns.forEach(pattern => {
    if (pattern.regex.test(message)) {
      entities.departments.push(pattern.value);
    }
  });

  // Extract key metrics
  const metricPatterns = [
    { regex: /\b(profit)\b/i, value: 'profit' },
    { regex: /\b(sales|spend|revenue)\b/i, value: 'sales' },
    { regex: /\b(margin|margins)\b/i, value: 'margin' },
    { regex: /\b(pack|packs)\b/i, value: 'packs' },
    { regex: /\b(account|accounts)\b/i, value: 'accounts' },
    { regex: /\b(active account|active accounts)\b/i, value: 'activeAccounts' }
  ];

  metricPatterns.forEach(pattern => {
    if (pattern.regex.test(message)) {
      entities.metrics.push(pattern.value);
    }
  });

  // Detect comparison intent
  if (/\b(compare|vs\.?|versus|against|difference|comparison)\b/i.test(message) ||
      /\b(better than|worse than|higher|lower)\b/i.test(message) ||
      message.includes('to') && (entities.months.length > 1)) {
    entities.comparisons = true;
  }

  // Detect insights request
  if (/\b(insight|insights|analysis|analyze|understand|explain|why)\b/i.test(message) ||
      /\b(what do you think|observations|trends|patterns|conclusions)\b/i.test(message)) {
    entities.insights = true;
  }

  // Detect trend analysis request
  if (/\b(trend|trends|over time|pattern|patterns|growth|decline|trajectory|progress|development|evolution)\b/i.test(message)) {
    entities.trend = true;
  }

  // Detect reasons analysis request
  if (/\b(why|reason|reasons|cause|causes|explain|because|due to|result of|factor|factors)\b/i.test(message)) {
    entities.reasons = true;
  }

  // Detect visualization request
  if (/\b(show|chart|graph|plot|visual|visualize|visualization|display|figure|diagram)\b/i.test(message)) {
    entities.visualization = true;
    
    // Try to determine visualization type
    if (/\b(bar chart|bar graph|column chart|column graph)\b/i.test(message)) {
      entities.visualization_type = 'bar';
    } else if (/\b(line chart|line graph|trend line|trend chart|time series)\b/i.test(message)) {
      entities.visualization_type = 'line';
    } else if (/\b(pie chart|pie graph|donut chart|donut graph|circle chart)\b/i.test(message)) {
      entities.visualization_type = 'pie';
    } else if (/\b(table)\b/i.test(message)) {
      entities.visualization_type = 'table';
    }
  }

  // Look for customer mentions - this is more fuzzy as we don't have a predefined list
  if (/\b(customer|customers|client|clients|account|accounts)\b/i.test(message)) {
    // Extract words that might be customer names
    const words = message.split(/\s+/);
    const potentialCustomers = words.filter(word => 
      word.length > 3 && 
      !commonRepNames.some(rep => word.toLowerCase().includes(rep.toLowerCase())) &&
      !metricPatterns.some(pat => pat.regex.test(word)) &&
      !monthPatterns.some(pat => pat.regex.test(word)) &&
      !departmentPatterns.some(pat => pat.regex.test(word))
    );
    
    // Add potential customer names
    if (potentialCustomers.length > 0) {
      entities.customers = potentialCustomers;
    }
  }

  // If no specific metrics are mentioned but the query asks about performance,
  // default to profit and sales
  if (entities.metrics.length === 0 && 
      /\b(performance|how did|how is|doing|results|overview|summary)\b/i.test(message)) {
    entities.metrics.push('profit', 'sales');
  }

  // Set default month if none specified - use most recent data
  if (entities.months.length === 0) {
    entities.months.push('april'); // Default to most recent month
  }

  // Convert relative month references to actual months
  entities.months = entities.months.map(month => {
    if (month === 'thisMonth' || month === 'currentMonth') {
      return 'april'; // Current month is April
    } else if (month === 'lastMonth' || month === 'previousMonth') {
      return 'march'; // Last month is March
    }
    return month;
  });

  return entities;
};

// Analyze trends across months for specific metrics
const analyzeTrends = (allMonths: Record<string, MonthData>, metric: string) => {
  const trends = {
    overall: { 
      trend: 'stable',
      percentage: 0,
      analysis: ''
    },
    retail: {
      trend: 'stable',
      percentage: 0,
      analysis: ''
    },
    reva: {
      trend: 'stable',
      percentage: 0,
      analysis: ''
    },
    wholesale: {
      trend: 'stable',
      percentage: 0,
      analysis: ''
    }
  };
  
  // Helper function to calculate percentage change
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Helper function to determine trend direction
  const determineTrend = (percentage) => {
    if (percentage > 5) return 'increasing';
    if (percentage < -5) return 'decreasing';
    return 'stable';
  };
  
  // Helper function to get metric value from metrics object
  const getMetricValue = (metrics, metricName) => {
    if (!metrics) return 0;
    
    switch(metricName) {
      case 'profit':
        return metrics.totalProfit;
      case 'sales':
      case 'spend':
        return metrics.totalSpend;
      case 'margin':
        return metrics.averageMargin;
      case 'packs':
        return metrics.totalPacks;
      case 'accounts':
        return metrics.totalAccounts ? metrics.totalAccounts.size : 0;
      case 'activeAccounts':
        return metrics.activeAccounts ? metrics.activeAccounts.size : 0;
      default:
        return 0;
    }
  };
  
  // Helper function to get department metrics
  const getDepartmentMetrics = (metrics, department) => {
    if (!metrics || !metrics.departmentBreakdown) return null;
    return metrics.departmentBreakdown.find(dept => dept.department.toLowerCase() === department.toLowerCase());
  };
  
  // Calculate overall trends (February to April)
  if (allMonths.april && allMonths.april.metrics && allMonths.february && allMonths.february.metrics) {
    const aprilValue = getMetricValue(allMonths.april.metrics, metric);
    const februaryValue = getMetricValue(allMonths.february.metrics, metric);
    const change = calculateChange(aprilValue, februaryValue);
    
    trends.overall.percentage = change;
    trends.overall.trend = determineTrend(change);
    
    // Generate analysis text
    const direction = change > 0 ? 'increased' : 'decreased';
    const magnitude = Math.abs(change);
    
    if (magnitude > 20) {
      trends.overall.analysis = `${metric} has ${direction} significantly by ${magnitude.toFixed(1)}% from February to April.`;
    } else if (magnitude > 5) {
      trends.overall.analysis = `${metric} has ${direction} moderately by ${magnitude.toFixed(1)}% from February to April.`;
    } else {
      trends.overall.analysis = `${metric} has remained relatively stable from February to April (${change.toFixed(1)}% change).`;
    }
    
    // Add month-to-month analysis
    if (allMonths.march && allMonths.march.metrics) {
      const marchValue = getMetricValue(allMonths.march.metrics, metric);
      const feb_to_march = calculateChange(marchValue, februaryValue);
      const march_to_april = calculateChange(aprilValue, marchValue);
      
      if (Math.sign(feb_to_march) !== Math.sign(march_to_april)) {
        const firstTrend = feb_to_march > 0 ? 'increased' : 'decreased';
        const secondTrend = march_to_april > 0 ? 'increased' : 'decreased';
        
        trends.overall.analysis += ` There was a trend reversal - ${metric} ${firstTrend} by ${Math.abs(feb_to_march).toFixed(1)}% from February to March, but then ${secondTrend} by ${Math.abs(march_to_april).toFixed(1)}% from March to April.`;
      }
    }
  }
  
  // Calculate department trends
  const departments = ['retail', 'reva', 'wholesale'];
  
  departments.forEach(department => {
    const normalizedDept = department.toLowerCase();
    let aprilDept = null, marchDept = null, februaryDept = null;
    
    if (allMonths.april && allMonths.april.metrics) {
      aprilDept = getDepartmentMetrics(allMonths.april.metrics, normalizedDept);
    }
    
    if (allMonths.february && allMonths.february.metrics) {
      februaryDept = getDepartmentMetrics(allMonths.february.metrics, normalizedDept);
    }
    
    if (allMonths.march && allMonths.march.metrics) {
      marchDept = getDepartmentMetrics(allMonths.march.metrics, normalizedDept);
    }
    
    if (aprilDept && februaryDept) {
      let aprilValue, februaryValue;
      
      switch(metric) {
        case 'profit':
          aprilValue = aprilDept.profit;
          februaryValue = februaryDept.profit;
          break;
        case 'sales':
        case 'spend':
          aprilValue = aprilDept.spend;
          februaryValue = februaryDept.spend;
          break;
        case 'margin':
          aprilValue = aprilDept.margin;
          februaryValue = februaryDept.margin;
          break;
        case 'packs':
          aprilValue = aprilDept.packs;
          februaryValue = februaryDept.packs;
          break;
        case 'accounts':
          aprilValue = aprilDept.accounts;
          februaryValue = februaryDept.accounts;
          break;
        case 'activeAccounts':
          aprilValue = aprilDept.activeAccounts;
          februaryValue = februaryDept.activeAccounts;
          break;
        default:
          aprilValue = 0;
          februaryValue = 0;
      }
      
      const change = calculateChange(aprilValue, februaryValue);
      
      trends[normalizedDept].percentage = change;
      trends[normalizedDept].trend = determineTrend(change);
      
      // Generate analysis
      const direction = change > 0 ? 'increased' : 'decreased';
      const magnitude = Math.abs(change);
      
      if (magnitude > 20) {
        trends[normalizedDept].analysis = `${department} ${metric} has ${direction} significantly by ${magnitude.toFixed(1)}% from February to April.`;
      } else if (magnitude > 5) {
        trends[normalizedDept].analysis = `${department} ${metric} has ${direction} moderately by ${magnitude.toFixed(1)}% from February to April.`;
      } else {
        trends[normalizedDept].analysis = `${department} ${metric} has remained relatively stable from February to April (${change.toFixed(1)}% change).`;
      }
      
      // Add month-to-month analysis if available
      if (marchDept) {
        let marchValue;
        
        switch(metric) {
          case 'profit':
            marchValue = marchDept.profit;
            break;
          case 'sales':
          case 'spend':
            marchValue = marchDept.spend;
            break;
          case 'margin':
            marchValue = marchDept.margin;
            break;
          case 'packs':
            marchValue = marchDept.packs;
            break;
          case 'accounts':
            marchValue = marchDept.accounts;
            break;
          case 'activeAccounts':
            marchValue = marchDept.activeAccounts;
            break;
          default:
            marchValue = 0;
        }
        
        const feb_to_march = calculateChange(marchValue, februaryValue);
        const march_to_april = calculateChange(aprilValue, marchValue);
        
        if (Math.sign(feb_to_march) !== Math.sign(march_to_april)) {
          const firstTrend = feb_to_march > 0 ? 'increased' : 'decreased';
          const secondTrend = march_to_april > 0 ? 'increased' : 'decreased';
          
          trends[normalizedDept].analysis += ` There was a trend reversal - ${metric} ${firstTrend} by ${Math.abs(feb_to_march).toFixed(1)}% from February to March, but then ${secondTrend} by ${Math.abs(march_to_april).toFixed(1)}% from March to April.`;
        }
      }
    }
  });
  
  return trends;
};

// Function to identify potential reasons for changes in metrics
const analyzeReasons = (allMonths, metric, entity = null) => {
  // Default entity refers to overall performance
  const entityType = entity ? (entity.type || 'overall') : 'overall';
  const entityName = entity ? (entity.name || 'overall') : 'overall';
  
  let reasons = [];
  const insightData = {};
  
  // Analyze based on the metric type
  switch(metric) {
    case 'profit':
      if (entityType === 'rep' && entityName) {
        // For rep profit analysis
        if (allMonths.march?.repDetails?.[entityName] && allMonths.april?.repDetails?.[entityName]) {
          const marchProfit = allMonths.march.repDetails[entityName].totalProfit;
          const aprilProfit = allMonths.april.repDetails[entityName].totalProfit;
          const marchActiveAccounts = allMonths.march.repDetails[entityName].activeAccounts;
          const aprilActiveAccounts = allMonths.april.repDetails[entityName].activeAccounts;
          const marchMargin = allMonths.march.repDetails[entityName].margin;
          const aprilMargin = allMonths.april.repDetails[entityName].margin;
          
          const profitChange = ((aprilProfit - marchProfit) / marchProfit) * 100;
          const accountsChange = ((aprilActiveAccounts - marchActiveAccounts) / marchActiveAccounts) * 100;
          const marginChange = aprilMargin - marchMargin;
          
          insightData.profitChange = profitChange;
          insightData.accountsChange = accountsChange;
          insightData.marginChange = marginChange;
          
          // Identify possible reasons
          if (profitChange > 0) {
            if (accountsChange > 0) {
              reasons.push(`Increase in active accounts (${accountsChange.toFixed(1)}% more accounts) contributed to the profit growth.`);
            }
            
            if (marginChange > 0) {
              reasons.push(`Improved margin (${marginChange.toFixed(1)} percentage points higher) helped increase profitability.`);
            } else if (marginChange < 0) {
              reasons.push(`Despite lower margins, profit increased due to higher sales volume or more active accounts.`);
            }
          } else if (profitChange < 0) {
            if (accountsChange < 0) {
              reasons.push(`Decrease in active accounts (${Math.abs(accountsChange).toFixed(1)}% fewer accounts) likely contributed to the profit decline.`);
            }
            
            if (marginChange < 0) {
              reasons.push(`Lower margins (${Math.abs(marginChange).toFixed(1)} percentage points lower) reduced profitability.`);
            }
          }
        }
      } else if (entityType === 'department' && entityName) {
        // For department profit analysis
        const deptMetricMarch = allMonths.march?.metrics?.departmentBreakdown?.find(d => d.department.toLowerCase() === entityName.toLowerCase());
        const deptMetricApril = allMonths.april?.metrics?.departmentBreakdown?.find(d => d.department.toLowerCase() === entityName.toLowerCase());
        
        if (deptMetricMarch && deptMetricApril) {
          const profitChange = ((deptMetricApril.profit - deptMetricMarch.profit) / deptMetricMarch.profit) * 100;
          const marginChange = deptMetricApril.margin - deptMetricMarch.margin;
          const accountsChange = ((deptMetricApril.activeAccounts - deptMetricMarch.activeAccounts) / deptMetricMarch.activeAccounts) * 100;
          
          insightData.profitChange = profitChange;
          insightData.marginChange = marginChange;
          insightData.accountsChange = accountsChange;
          
          if (profitChange > 0) {
            if (accountsChange > 0) {
              reasons.push(`${entityName} department's increase in active accounts (${accountsChange.toFixed(1)}% more) drove profit growth.`);
            }
            
            if (marginChange > 0) {
              reasons.push(`${entityName} department's improved margin (${marginChange.toFixed(1)} percentage points higher) contributed to better profitability.`);
            }
          } else if (profitChange < 0) {
            if (accountsChange < 0) {
              reasons.push(`${entityName} department's decrease in active accounts (${Math.abs(accountsChange).toFixed(1)}% fewer) impacted profit negatively.`);
            }
            
            if (marginChange < 0) {
              reasons.push(`${entityName} department's decreased margins (${Math.abs(marginChange).toFixed(1)} percentage points lower) reduced profitability.`);
            }
          }
        }
      } else {
        // Overall profit analysis
        const marchMetrics = allMonths.march?.metrics;
        const aprilMetrics = allMonths.april?.metrics;
        
        if (marchMetrics && aprilMetrics) {
          const profitChange = ((aprilMetrics.totalProfit - marchMetrics.totalProfit) / marchMetrics.totalProfit) * 100;
          const marginChange = aprilMetrics.averageMargin - marchMetrics.averageMargin;
          const accountsChange = ((aprilMetrics.activeAccounts.size - marchMetrics.activeAccounts.size) / marchMetrics.activeAccounts.size) * 100;
          
          insightData.profitChange = profitChange;
          insightData.marginChange = marginChange;
          insightData.accountsChange = accountsChange;
          
          // Analyze department contributions
          const deptContributions = [];
          aprilMetrics.departmentBreakdown.forEach(aprilDept => {
            const marchDept = marchMetrics.departmentBreakdown.find(d => d.department === aprilDept.department);
            if (marchDept) {
              const deptChange = ((aprilDept.profit - marchDept.profit) / marchDept.profit) * 100;
              deptContributions.push({
                department: aprilDept.department,
                change: deptChange,
                marchProfit: marchDept.profit,
                aprilProfit: aprilDept.profit,
                impact: aprilDept.profit - marchDept.profit
              });
            }
          });
          
          // Sort by impact (absolute difference)
          deptContributions.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
          
          insightData.deptContributions = deptContributions;
          
          // Generate insights
          if (profitChange > 0) {
            // Positive profit change
            const topPositiveContributor = deptContributions.find(d => d.change > 0);
            if (topPositiveContributor) {
              reasons.push(`${topPositiveContributor.department}'s strong performance (${topPositiveContributor.change.toFixed(1)}% profit increase) was a major factor in the overall profit growth.`);
            }
            
            if (marginChange > 0) {
              reasons.push(`Higher overall margins (${marginChange.toFixed(1)} percentage points increase) across the business contributed to profit growth.`);
            }
            
            if (accountsChange > 0) {
              reasons.push(`Increase in active accounts (${accountsChange.toFixed(1)}% more) helped drive overall profitability.`);
            }
          } else if (profitChange < 0) {
            // Negative profit change
            const topNegativeContributor = deptContributions.find(d => d.change < 0);
            if (topNegativeContributor) {
              reasons.push(`${topNegativeContributor.department}'s performance decline (${Math.abs(topNegativeContributor.change).toFixed(1)}% profit decrease) significantly impacted overall profit.`);
            }
            
            if (marginChange < 0) {
              reasons.push(`Lower overall margins (${Math.abs(marginChange).toFixed(1)} percentage points decrease) reduced business profitability.`);
            }
            
            if (accountsChange < 0) {
              reasons.push(`Decrease in active accounts (${Math.abs(accountsChange).toFixed(1)}% fewer) contributed to profit decline.`);
            }
          }
        }
      }
      break;
      
    case 'margin':
      if (entityType === 'rep' && entityName) {
        // Rep margin analysis
        if (allMonths.march?.repDetails?.[entityName] && allMonths.april?.repDetails?.[entityName]) {
          const marchMargin = allMonths.march.repDetails[entityName].margin;
          const aprilMargin = allMonths.april.repDetails[entityName].margin;
          const marginChange = aprilMargin - marchMargin;
          
          insightData.marginChange = marginChange;
          
          if (marginChange > 0) {
            reasons.push(`${entityName} likely focused on selling higher-margin products or negotiated better terms in April.`);
          } else if (marginChange < 0) {
            reasons.push(`${entityName}'s margin decline could be due to price pressure, higher costs, or a shift in product mix.`);
          }
        }
      } else {
        // Overall margin analysis
        const marchMetrics = allMonths.march?.metrics;
        const aprilMetrics = allMonths.april?.metrics;
        
        if (marchMetrics && aprilMetrics) {
          const marginChange = aprilMetrics.averageMargin - marchMetrics.averageMargin;
          insightData.marginChange = marginChange;
          
          if (marginChange > 0) {
            // Positive margin change
            reasons.push(`Higher overall margins could be due to a shift toward more profitable products or departments.`);
            
            // Check department contributions
            const deptChanges = aprilMetrics.departmentBreakdown.map(aprilDept => {
              const marchDept = marchMetrics.departmentBreakdown.find(d => d.department === aprilDept.department);
              if (marchDept) {
                return {
                  department: aprilDept.department,
                  marchMargin: marchDept.margin,
                  aprilMargin: aprilDept.margin,
                  change: aprilDept.margin - marchDept.margin
                };
              }
              return null;
            }).filter(Boolean);
            
            // Sort by change
            deptChanges.sort((a, b) => b.change - a.change);
            
            if (deptChanges.length > 0 && deptChanges[0].change > 0) {
              reasons.push(`${deptChanges[0].department} saw the highest margin improvement (${deptChanges[0].change.toFixed(1)} percentage points), which contributed to the overall increase.`);
            }
          } else if (marginChange < 0) {
            // Negative margin change
            reasons.push(`Margin pressure could be due to increased competition, higher costs, or promotional pricing.`);
            
            // Check department contributions
            const deptChanges = aprilMetrics.departmentBreakdown.map(aprilDept => {
              const marchDept = marchMetrics.departmentBreakdown.find(d => d.department === aprilDept.department);
              if (marchDept) {
                return {
                  department: aprilDept.department,
                  marchMargin: marchDept.margin,
                  aprilMargin: aprilDept.margin,
                  change: aprilDept.margin - marchDept.margin
                };
              }
              return null;
            }).filter(Boolean);
            
            // Sort by change (ascending for negative impact)
            deptChanges.sort((a, b) => a.change - b.change);
            
            if (deptChanges.length > 0 && deptChanges[0].change < 0) {
              reasons.push(`${deptChanges[0].department} saw the largest margin decline (${Math.abs(deptChanges[0].change).toFixed(1)} percentage points), which affected the overall margin negatively.`);
            }
          }
        }
      }
      break;
    
    default:
      reasons.push(`Analysis for ${metric} changes is not available at this time.`);
  }
  
  return {
    reasons,
    insightData
  };
};

// Function to handle conversations and generate responses based on user messages
const handleConversation = async (supabase, message: string, conversationContext: ConversationContext) => {
  console.log('Processing user message:', message);
  console.log('Conversation context:', conversationContext);
  
  // Extract entities from the user message
  const entities = extractEntities(message);
  console.log('Extracted entities:', entities);
  
  // Gather data from all months for comprehensive analysis
  const allMonthsData = await gatherAllMonthsData(supabase);
  console.log('Gathered data for all months');
  
  // Build response based on the entities and intent
  let response = '';
  let chartData = null;
  let chartType = null;
  let tableData = null;
  let tableHeaders = null;
  
  // Determine the main user intent
  if (entities.repNames.length > 0) {
    // User is asking about specific reps
    const repName = entities.repNames[0]; // Use the first mentioned rep name
    response = `Let me tell you about ${repName}'s performance. `;
    
    if (entities.comparisons && entities.months.length > 1) {
      // Comparison across months for specific rep
      const monthsToCompare = entities.months.slice(0, 2);
      const month1Data = monthsToCompare[0] && allMonthsData[monthsToCompare[0]]?.repDetails?.[repName];
      const month2Data = monthsToCompare[1] && allMonthsData[monthsToCompare[1]]?.repDetails?.[repName];
      
      if (month1Data && month2Data) {
        const profitChange = ((month2Data.totalProfit - month1Data.totalProfit) / month1Data.totalProfit) * 100;
        const spendChange = ((month2Data.totalSpend - month1Data.totalSpend) / month1Data.totalSpend) * 100;
        const marginChange = month2Data.margin - month1Data.margin;
        
        response += `Comparing ${monthsToCompare[0]} to ${monthsToCompare[1]}, ${repName}'s profit ${profitChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(profitChange).toFixed(1)}% `;
        response += `(${month1Data.totalProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0})} vs ${month2Data.totalProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0})}). `;
        
        response += `Sales ${spendChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendChange).toFixed(1)}% `;
        response += `and margin ${marginChange > 0 ? 'improved' : 'declined'} by ${Math.abs(marginChange).toFixed(1)} percentage points `;
        response += `(${month1Data.margin.toFixed(1)}% vs ${month2Data.margin.toFixed(1)}%). `;
        
        if (month2Data.activeAccounts !== month1Data.activeAccounts) {
          const accountsChange = ((month2Data.activeAccounts - month1Data.activeAccounts) / month1Data.activeAccounts) * 100;
          response += `${repName} had ${accountsChange > 0 ? 'more' : 'fewer'} active accounts in ${monthsToCompare[1]} (${month2Data.activeAccounts} vs ${month1Data.activeAccounts} in ${monthsToCompare[0]}).`;
        }
        
        // Prepare chart data for comparison visualization
        if (entities.visualization || entities.metrics.length > 0) {
          chartData = {
            labels: [monthsToCompare[0], monthsToCompare[1]],
            datasets: [
              {
                label: 'Profit',
                data: [month1Data.totalProfit, month2Data.totalProfit]
              },
              {
                label: 'Sales',
                data: [month1Data.totalSpend, month2Data.totalSpend]
              }
            ]
          };
          chartType = entities.visualization_type || 'bar';
        }
      } else {
        response += `I don't have enough data to compare ${repName}'s performance across those months.`;
      }
    } else {
      // Single month analysis for specific rep
      const month = entities.months[0] || 'april'; // Default to most recent month
      const monthData = allMonthsData[month]?.repDetails?.[repName];
      
      if (monthData) {
        response += `In ${month}, ${repName} generated £${monthData.totalProfit.toLocaleString()} in profit from £${monthData.totalSpend.toLocaleString()} in sales, `;
        response += `with a margin of ${monthData.margin.toFixed(1)}%. `;
        
        if (monthData.departments && monthData.departments.length > 0) {
          response += `${repName} worked across ${monthData.departments.length} departments: ${monthData.departments.join(', ')}. `;
        }
        
        response += `They handled ${monthData.activeAccounts} active accounts out of ${monthData.totalAccounts} total accounts, `;
        response += `with an average profit per active account of £${monthData.profitPerActiveAccount.toFixed(0)}.`;
        
        // Add trend analysis if insights were requested
        if (entities.insights || entities.trend || entities.reasons) {
          const previousMonth = month === 'april' ? 'march' : (month === 'march' ? 'february' : null);
          
          if (previousMonth && allMonthsData[previousMonth]?.repDetails?.[repName]) {
            const prevMonthData = allMonthsData[previousMonth].repDetails[repName];
            
            const profitChange = ((monthData.totalProfit - prevMonthData.totalProfit) / prevMonthData.totalProfit) * 100;
            const spendChange = ((monthData.totalSpend - prevMonthData.totalSpend) / prevMonthData.totalSpend) * 100;
            const marginChange = monthData.margin - prevMonthData.margin;
            
            response += `\n\nCompared to ${previousMonth}, ${repName}'s profit ${profitChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(profitChange).toFixed(1)}%, `;
            response += `sales ${spendChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendChange).toFixed(1)}%, `;
            response += `and margin ${marginChange > 0 ? 'improved' : 'declined'} by ${Math.abs(marginChange).toFixed(1)} percentage points.`;
            
            // Add potential reasons for the changes
            if (entities.reasons) {
              const profitAnalysis = analyzeReasons(allMonthsData, 'profit', { type: 'rep', name: repName });
              if (profitAnalysis.reasons && profitAnalysis.reasons.length > 0) {
                response += `\n\nPossible reasons for these changes:\n- ${profitAnalysis.reasons.join('\n- ')}`;
              }
            }
          }
        }
        
        // Prepare visualization if requested
        if (entities.visualization) {
          const relatedMonths = ['february', 'march', 'april'].filter(m => allMonthsData[m]?.repDetails?.[repName]);
          
          if (relatedMonths.length > 1) {
            chartData = {
              labels: relatedMonths,
              datasets: [
                {
                  label: 'Profit',
                  data: relatedMonths.map(m => allMonthsData[m].repDetails[repName].totalProfit)
                },
                {
                  label: 'Sales',
                  data: relatedMonths.map(m => allMonthsData[m].repDetails[repName].totalSpend)
                }
              ]
            };
            chartType = entities.visualization_type || 'line';
          }
        }
      } else {
        response += `I don't have any data for ${repName} in ${month}.`;
      }
    }
  } else if (entities.departments.length > 0) {
    // User is asking about specific departments
    const department = entities.departments[0];
    response = `Let me tell you about the ${department} department's performance. `;
    
    if (entities.comparisons && entities.months.length > 1) {
      // Comparison across months for specific department
      const monthsToCompare = entities.months.slice(0, 2);
      
      // Get department metrics for both months
      const month1Metrics = allMonthsData[monthsToCompare[0]]?.metrics?.departmentBreakdown?.find(
        dept => dept.department.toLowerCase() === department.toLowerCase()
      );
      
      const month2Metrics = allMonthsData[monthsToCompare[1]]?.metrics?.departmentBreakdown?.find(
        dept => dept.department.toLowerCase() === department.toLowerCase()
      );
      
      if (month1Metrics && month2Metrics) {
        const profitChange = ((month2Metrics.profit - month1Metrics.profit) / month1Metrics.profit) * 100;
        const spendChange = ((month2Metrics.spend - month1Metrics.spend) / month1Metrics.spend) * 100;
        const marginChange = month2Metrics.margin - month1Metrics.margin;
        
        response += `Comparing ${monthsToCompare[0]} to ${monthsToCompare[1]}, the ${department} department's profit ${profitChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(profitChange).toFixed(1)}% `;
        response += `(${month1Metrics.profit.toLocaleString('en-US', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0})} vs ${month2Metrics.profit.toLocaleString('en-US', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0})}). `;
        
        response += `Sales ${spendChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendChange).toFixed(1)}% `;
        response += `and margin ${marginChange > 0 ? 'improved' : 'declined'} by ${Math.abs(marginChange).toFixed(1)} percentage points `;
        response += `(${month1Metrics.margin.toFixed(1)}% vs ${month2Metrics.margin.toFixed(1)}%). `;
        
        if (month2Metrics.activeAccounts !== month1Metrics.activeAccounts) {
          const accountsChange = ((month2Metrics.activeAccounts - month1Metrics.activeAccounts) / month1Metrics.activeAccounts) * 100;
          response += `The department had ${accountsChange > 0 ? 'more' : 'fewer'} active accounts in ${monthsToCompare[1]} (${month2Metrics.activeAccounts} vs ${month1Metrics.activeAccounts} in ${monthsToCompare[0]}).`;
        }
        
        // Prepare chart data
        if (entities.visualization || entities.metrics.length > 0) {
          chartData = {
            labels: [monthsToCompare[0], monthsToCompare[1]],
            datasets: [
              {
                label: 'Profit',
                data: [month1Metrics.profit, month2Metrics.profit]
              },
              {
                label: 'Sales',
                data: [month1Metrics.spend, month2Metrics.spend]
              }
            ]
          };
          chartType = entities.visualization_type || 'bar';
        }
      } else {
        response += `I don't have enough data to compare the ${department} department's performance across those months.`;
      }
    } else {
      // Single month analysis for specific department
      const month = entities.months[0] || 'april';
      const monthMetrics = allMonthsData[month]?.metrics?.departmentBreakdown?.find(
        dept => dept.department.toLowerCase() === department.toLowerCase()
      );
      
      if (monthMetrics) {
        response += `In ${month}, the ${department} department generated £${monthMetrics.profit.toLocaleString()} in profit from £${monthMetrics.spend.toLocaleString()} in sales, `;
        response += `with a margin of ${monthMetrics.margin.toFixed(1)}%. `;
        response += `The department had ${monthMetrics.activeAccounts} active accounts out of ${monthMetrics.accounts} total accounts `;
        response += `and sold ${monthMetrics.packs.toLocaleString()} packs.`;
        
        // Add trend analysis if insights were requested
        if (entities.insights || entities.trend || entities.reasons) {
          const previousMonth = month === 'april' ? 'march' : (month === 'march' ? 'february' : null);
          
          if (previousMonth) {
            const prevMonthMetrics = allMonthsData[previousMonth]?.metrics?.departmentBreakdown?.find(
              dept => dept.department.toLowerCase() === department.toLowerCase()
            );
            
            if (prevMonthMetrics) {
              const profitChange = ((monthMetrics.profit - prevMonthMetrics.profit) / prevMonthMetrics.profit) * 100;
              const spendChange = ((monthMetrics.spend - prevMonthMetrics.spend) / prevMonthMetrics.spend) * 100;
              const marginChange = monthMetrics.margin - prevMonthMetrics.margin;
              
              response += `\n\nCompared to ${previousMonth}, the department's profit ${profitChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(profitChange).toFixed(1)}%, `;
              response += `sales ${spendChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendChange).toFixed(1)}%, `;
              response += `and margin ${marginChange > 0 ? 'improved' : 'declined'} by ${Math.abs(marginChange).toFixed(1)} percentage points.`;
              
              // Add reasons analysis if requested
              if (entities.reasons) {
                const profitAnalysis = analyzeReasons(allMonthsData, 'profit', { type: 'department', name: department });
                if (profitAnalysis.reasons && profitAnalysis.reasons.length > 0) {
                  response += `\n\nPossible reasons for these changes:\n- ${profitAnalysis.reasons.join('\n- ')}`;
                }
              }
            }
          }
        }
        
        // Prepare visualization if requested
        if (entities.visualization) {
          const allMonths = ['february', 'march', 'april'];
          const monthsWithData = [];
          const profitData = [];
          const salesData = [];
          
          for (const m of allMonths) {
            const metrics = allMonthsData[m]?.metrics?.departmentBreakdown?.find(
              dept => dept.department.toLowerCase() === department.toLowerCase()
            );
            
            if (metrics) {
              monthsWithData.push(m);
              profitData.push(metrics.profit);
              salesData.push(metrics.spend);
            }
          }
          
          if (monthsWithData.length > 1) {
            chartData = {
              labels: monthsWithData,
              datasets: [
                {
                  label: 'Profit',
                  data: profitData
                },
                {
                  label: 'Sales',
                  data: salesData
                }
              ]
            };
            chartType = entities.visualization_type || 'line';
          }
        }
      } else {
        response += `I don't have any data for the ${department} department in ${month}.`;
      }
    }
  } else if (entities.comparisons && entities.months.length > 1) {
    // User is asking for a comparison between months (overall performance)
    const monthsToCompare = entities.months.slice(0, 2); // Use first two mentioned months
    response = `Let me compare overall performance between ${monthsToCompare[0]} and ${monthsToCompare[1]}. `;
    
    const month1Metrics = allMonthsData[monthsToCompare[0]]?.metrics;
    const month2Metrics = allMonthsData[monthsToCompare[1]]?.metrics;
    
    if (month1Metrics && month2Metrics) {
      const profitChange = ((month2Metrics.totalProfit - month1Metrics.totalProfit) / month1Metrics.totalProfit) * 100;
      const spendChange = ((month2Metrics.totalSpend - month1Metrics.totalSpend) / month1Metrics.totalSpend) * 100;
      const marginChange = month2Metrics.averageMargin - month1Metrics.averageMargin;
      
      response += `Total profit ${profitChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(profitChange).toFixed(1)}% `;
      response += `(${month1Metrics.totalProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0})} vs ${month2Metrics.totalProfit.toLocaleString('en-US', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0})}). `;
      
      response += `Total sales ${spendChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendChange).toFixed(1)}% `;
      response += `and overall margin ${marginChange > 0 ? 'improved' : 'declined'} by ${Math.abs(marginChange).toFixed(1)} percentage points `;
      response += `(${month1Metrics.averageMargin.toFixed(1)}% vs ${month2Metrics.averageMargin.toFixed(1)}%). `;
      
      // Add more detailed comparisons if insights were requested
      if (entities.insights || entities.reasons) {
        // Compare department performance
        response += `\n\nDepartment comparison:`;
        
        for (const dept1 of month1Metrics.departmentBreakdown) {
          const dept2 = month2Metrics.departmentBreakdown.find(d => d.department === dept1.department);
          
          if (dept2) {
            const deptProfitChange = ((dept2.profit - dept1.profit) / dept1.profit) * 100;
            response += `\n- ${dept1.department}: ${deptProfitChange > 0 ? '+' : ''}${deptProfitChange.toFixed(1)}% profit change`;
          }
        }
        
        // Add reasons for changes if specifically requested
        if (entities.reasons) {
          const profitAnalysis = analyzeReasons(allMonthsData, 'profit');
          if (profitAnalysis.reasons && profitAnalysis.reasons.length > 0) {
            response += `\n\nPossible reasons for these changes:\n- ${profitAnalysis.reasons.join('\n- ')}`;
          }
        }
      }
      
      // Prepare table data for comparison
      tableHeaders = ['Metric', monthsToCompare[0], monthsToCompare[1], 'Change'];
      tableData = [
        { 
          metric: 'Total Profit', 
          [monthsToCompare[0]]: `£${month1Metrics.totalProfit.toLocaleString()}`, 
          [monthsToCompare[1]]: `£${month2Metrics.totalProfit.toLocaleString()}`,
          change: `${profitChange > 0 ? '+' : ''}${profitChange.toFixed(1)}%`
        },
        { 
          metric: 'Total Sales', 
          [monthsToCompare[0]]: `£${month1Metrics.totalSpend.toLocaleString()}`, 
          [monthsToCompare[1]]: `£${month2Metrics.totalSpend.toLocaleString()}`,
          change: `${spendChange > 0 ? '+' : ''}${spendChange.toFixed(1)}%`
        },
        { 
          metric: 'Margin', 
          [monthsToCompare[0]]: `${month1Metrics.averageMargin.toFixed(1)}%`, 
          [monthsToCompare[1]]: `${month2Metrics.averageMargin.toFixed(1)}%`,
          change: `${marginChange > 0 ? '+' : ''}${marginChange.toFixed(1)} pts`
        },
        { 
          metric: 'Total Packs', 
          [monthsToCompare[0]]: month1Metrics.totalPacks.toLocaleString(), 
          [monthsToCompare[1]]: month2Metrics.totalPacks.toLocaleString(),
          change: `${((month2Metrics.totalPacks - month1Metrics.totalPacks) / month1Metrics.totalPacks * 100).toFixed(1)}%`
        },
        { 
          metric: 'Active Accounts', 
          [monthsToCompare[0]]: month1Metrics.activeAccounts.size.toString(), 
          [monthsToCompare[1]]: month2Metrics.activeAccounts.size.toString(),
          change: `${(((month2Metrics.activeAccounts.size - month1Metrics.activeAccounts.size) / month1Metrics.activeAccounts.size) * 100).toFixed(1)}%`
        }
      ];
      
      // Prepare chart data
      chartData = {
        labels: ['Profit', 'Sales'],
        datasets: [
          {
            label: monthsToCompare[0],
            data: [month1Metrics.totalProfit, month1Metrics.totalSpend]
          },
          {
            label: monthsToCompare[1],
            data: [month2Metrics.totalProfit, month2Metrics.totalSpend]
          }
        ]
      };
      chartType = entities.visualization_type || 'bar';
    } else {
      response += `I don't have enough data to compare performance across those months.`;
    }
  } else if (entities.months.length > 0) {
    // User is asking about a specific month's performance
    const month = entities.months[0];
    response = `Here's an overview of performance in ${month}: `;
    
    const monthMetrics = allMonthsData[month]?.metrics;
    
    if (monthMetrics) {
      response += `Total profit was £${monthMetrics.totalProfit.toLocaleString()} from £${monthMetrics.totalSpend.toLocaleString()} in sales, `;
      response += `achieving an overall margin of ${monthMetrics.averageMargin.toFixed(1)}%. `;
      response += `There were ${monthMetrics.activeAccounts.size} active accounts out of ${monthMetrics.totalAccounts.size} total accounts, `;
      response += `with ${monthMetrics.totalPacks.toLocaleString()} packs sold.`;
      
      // Add top performers if insights were requested
      if (entities.insights || message.toLowerCase().includes('top') || message.toLowerCase().includes('best')) {
        response += `\n\nTop performers by profit:`;
        monthMetrics.topPerformersByProfit.slice(0, 3).forEach((rep, index) => {
          response += `\n${index + 1}. ${rep.rep}: £${rep.profit.toLocaleString()}`;
        });
        
        response += `\n\nTop performers by margin:`;
        monthMetrics.topPerformersByMargin.slice(0, 3).forEach((rep, index) => {
          response += `\n${index + 1}. ${rep.rep}: ${rep.margin.toFixed(1)}%`;
        });
      }
      
      // Add department breakdown
      response += `\n\nDepartment breakdown:`;
      monthMetrics.departmentBreakdown.forEach(dept => {
        response += `\n- ${dept.department}: £${dept.profit.toLocaleString()} profit (${dept.margin.toFixed(1)}% margin)`;
      });
      
      // Prepare visualization if requested or appropriate
      if (entities.visualization || entities.metrics.includes('profit')) {
        // Create department profit comparison chart
        chartData = {
          labels: monthMetrics.departmentBreakdown.map(dept => dept.department),
          datasets: [{
            label: 'Profit',
            data: monthMetrics.departmentBreakdown.map(dept => dept.profit)
          }]
        };
        chartType = entities.visualization_type || 'bar';
      }
      
      // Prepare table data
      tableHeaders = ['Department', 'Profit', 'Sales', 'Margin', 'Active Accounts'];
      tableData = monthMetrics.departmentBreakdown.map(dept => ({
        department: dept.department,
        profit: `£${dept.profit.toLocaleString()}`,
        sales: `£${dept.spend.toLocaleString()}`,
        margin: `${dept.margin.toFixed(1)}%`,
        activeAccounts: dept.activeAccounts
      }));
    } else {
      response += `I don't have data for ${month}.`;
    }
  } else if (message.toLowerCase().includes('top performer') || message.toLowerCase().includes('best rep') || message.toLowerCase().includes('best performer')) {
    // User is asking about top performers
    const month = entities.months[0] || 'april';
    response = `Here are the top performers for ${month}: `;
    
    const monthMetrics = allMonthsData[month]?.metrics;
    
    if (monthMetrics) {
      // Extract top performers by profit
      response += `\nTop performers by profit:`;
      monthMetrics.topPerformersByProfit.slice(0, 5).forEach((rep, index) => {
        response += `\n${index + 1}. ${rep.rep}: £${rep.profit.toLocaleString()}`;
      });
      
      // Extract top performers by margin
      response += `\n\nTop performers by margin:`;
      monthMetrics.topPerformersByMargin.slice(0, 5).forEach((rep, index) => {
        response += `\n${index + 1}. ${rep.rep}: ${rep.margin.toFixed(1)}%`;
      });
      
      // Prepare visualization
      chartData = {
        labels: monthMetrics.topPerformersByProfit.slice(0, 5).map(rep => rep.rep),
        datasets: [{
          label: 'Profit',
          data: monthMetrics.topPerformersByProfit.slice(0, 5).map(rep => rep.profit)
        }]
      };
      chartType = entities.visualization_type || 'bar';
      
      // Prepare table data
      tableHeaders = ['Rep', 'Profit', 'Margin'];
      tableData = monthMetrics.topPerformersByProfit.slice(0, 5).map((rep, index) => {
        const marginData = monthMetrics.topPerformersByMargin.find(r => r.rep === rep.rep);
        return {
          rep: `${index + 1}. ${rep.rep}`,
          profit: `£${rep.profit.toLocaleString()}`,
          margin: marginData ? `${marginData.margin.toFixed(1)}%` : 'N/A'
        };
      });
    } else {
      response += `I don't have data for ${month}.`;
    }
  } else if (entities.insights || entities.trend) {
    // User is asking for general insights or trends
    response = `Here are some key insights from the sales data:\n\n`;
    
    // Analyze profit trends
    const profitTrends = analyzeTrends(allMonthsData, 'profit');
    response += `Profit trend (Feb-Apr): ${profitTrends.overall.analysis}\n\n`;
    
    // Add department trends if available
    const departments = ['retail', 'reva', 'wholesale'];
    response += `Department performance:\n`;
    
    for (const dept of departments) {
      if (profitTrends[dept] && profitTrends[dept].analysis) {
        response += `- ${profitTrends[dept].analysis}\n`;
      }
    }
    
    // Add top performer insights
    const aprilMetrics = allMonthsData.april?.metrics;
    const marchMetrics = allMonthsData.march?.metrics;
    
    if (aprilMetrics && marchMetrics) {
      response += `\nTop performers in April:\n`;
      
      // Compare current top performers to previous performance
      for (let i = 0; i < Math.min(3, aprilMetrics.topPerformersByProfit.length); i++) {
        const rep = aprilMetrics.topPerformersByProfit[i];
        const marchRepData = allMonthsData.march?.repDetails?.[rep.rep];
        
        response += `${i + 1}. ${rep.rep}: £${rep.profit.toLocaleString()} `;
        
        if (marchRepData) {
          const change = ((rep.profit - marchRepData.totalProfit) / marchRepData.totalProfit) * 100;
          response += `(${change > 0 ? '+' : ''}${change.toFixed(1)}% vs March)\n`;
        } else {
          response += `(new to top performers)\n`;
        }
      }
      
      // Prepare chart data for trend visualization
      const months = ['february', 'march', 'april'];
      chartData = {
        labels: months,
        datasets: [
          {
            label: 'Total Profit',
            data: months.map(m => allMonthsData[m]?.metrics?.totalProfit || 0)
          },
          {
            label: 'Total Sales',
            data: months.map(m => allMonthsData[m]?.metrics?.totalSpend || 0)
          }
        ]
      };
      chartType = entities.visualization_type || 'line';
    } else {
      response += `\nDetailed month-to-month comparison is not available.`;
    }
  } else {
    // Default response for general queries
    const month = entities.months[0] || conversationContext.selectedMonth || 'april'; // Default to most recent or selected month
    response = `Here's a summary of sales performance for ${month}: `;
    
    const monthData = allMonthsData[month];
    
    if (monthData && monthData.metrics) {
      response += `Total profit was £${monthData.metrics.totalProfit.toLocaleString()} from £${monthData.metrics.totalSpend.toLocaleString()} in sales, `;
      response += `with an overall margin of ${monthData.metrics.averageMargin.toFixed(1)}%. `;
      
      // Add comparison to previous month if available
      const previousMonth = month === 'april' ? 'march' : (month === 'march' ? 'february' : null);
      
      if (previousMonth && allMonthsData[previousMonth]?.metrics) {
        const prevMetrics = allMonthsData[previousMonth].metrics;
        const profitChange = ((monthData.metrics.totalProfit - prevMetrics.totalProfit) / prevMetrics.totalProfit) * 100;
        
        response += `This represents a ${profitChange > 0 ? 'growth' : 'decline'} of ${Math.abs(profitChange).toFixed(1)}% in profit compared to ${previousMonth}. `;
      }
      
      // Add top performers
      response += `\n\nTop performers by profit:`;
      monthData.metrics.topPerformersByProfit.slice(0, 3).forEach((rep, index) => {
        response += `\n${index + 1}. ${rep.rep}: £${rep.profit.toLocaleString()}`;
      });
      
      // Add department breakdown summary
      response += `\n\nDepartment breakdown:`;
      monthData.metrics.departmentBreakdown.forEach(dept => {
        response += `\n- ${dept.department}: £${dept.profit.toLocaleString()} profit (${dept.margin.toFixed(1)}% margin)`;
      });
      
      // Suggest follow-up questions
      response += `\n\nYou can ask me about specific reps, departments, or for a comparison between months. Try "Compare February and April profit" or "Show me Craig's performance trend".`;
    } else {
      response += `I don't have data for ${month}.`;
    }
  }
  
  // Return the response and any visualization data
  return {
    response,
    chartData,
    chartType,
    tableData,
    tableHeaders
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const { message, selectedMonth, conversationContext } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Process the message and generate a response
    const responseData = await handleConversation(
      supabase, 
      message, 
      conversationContext || { 
        conversationId: `vera-${Date.now()}`, 
        history: [], 
        selectedMonth: selectedMonth || 'march' 
      }
    );
    
    // Return the response
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in rep-chat function:', error);
    
    return new Response(JSON.stringify({
      response: "I'm sorry, I encountered an error processing your request. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
