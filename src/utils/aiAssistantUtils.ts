
export interface EntityExtraction {
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
  questionType: 'performance' | 'comparison' | 'trend' | 'reason' | 'specific' | 'general' | 'analysis';
}

// Enhanced function to reformulate ambiguous queries
export const reformulateQuery = (query: string): string => {
  // Common vague queries and their more specific versions
  const vagueQueries: Record<string, string> = {
    'how are we doing': 'What is our overall sales performance in the most recent month?',
    'show me performance': 'What are the profit, sales and margins in the latest month?',
    'who is the best': 'Who are the top 3 sales representatives by profit in the most recent month?',
    'sales data': 'What are the key sales metrics for the most recent month?',
    'any insights': 'What are the key insights and trends from our recent sales data?',
    'what happened last month': 'What were the key metrics and notable changes in last month\'s sales performance?',
    'why did profit increase': 'What factors contributed to the profit increase compared to the previous month?',
    'why did sales improve': 'What factors contributed to the sales improvement compared to the previous month?',
    'why did profit decrease': 'What factors contributed to the profit decrease compared to the previous month?',
    'why did margin change': 'What factors contributed to the margin change compared to the previous month?'
  };

  // Check for exact matches first
  const lowerQuery = query.toLowerCase();
  for (const [vague, specific] of Object.entries(vagueQueries)) {
    if (lowerQuery === vague) {
      return specific;
    }
  }

  // Check for partial matches
  for (const [vague, specific] of Object.entries(vagueQueries)) {
    if (lowerQuery.includes(vague)) {
      return specific;
    }
  }

  // Special case handling
  if (lowerQuery.includes('top')) {
    if (lowerQuery.includes('customer') || lowerQuery.includes('account')) {
      return `Who are the top 5 customers by profit in the most recent month?`;
    }
    if (!lowerQuery.includes('profit') && !lowerQuery.includes('margin') && !lowerQuery.includes('sales')) {
      return `Who are the top performing representatives by profit in the most recent month?`;
    }
  }

  // Handle analytical questions
  if (lowerQuery.includes('why') && 
      (lowerQuery.includes('increase') || lowerQuery.includes('decrease') || 
       lowerQuery.includes('change') || lowerQuery.includes('improve'))) {
    
    // Extract month information if present
    let month = 'April';
    if (lowerQuery.includes('january')) month = 'January';
    if (lowerQuery.includes('february')) month = 'February';
    if (lowerQuery.includes('march')) month = 'March';
    if (lowerQuery.includes('april')) month = 'April';
    
    // Extract metric information
    let metric = 'profit';
    if (lowerQuery.includes('margin')) metric = 'margin';
    if (lowerQuery.includes('sales') || lowerQuery.includes('spend')) metric = 'sales';
    
    return `Analyze why ${metric} ${lowerQuery.includes('decrease') ? 'decreased' : 'increased'} in ${month} compared to the previous month.`;
  }

  // Query seems specific enough already
  return query;
};

// Function to determine the question type for better response formatting
export const determineQuestionType = (entities: EntityExtraction): EntityExtraction['questionType'] => {
  if (entities.reasons) {
    return 'reason';
  }

  if (entities.comparisons || entities.months.length > 1) {
    return 'comparison';
  }
  
  if (entities.trend) {
    return 'trend';
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
};

// Generate follow-up questions based on the current context
export const generateFollowUpQuestions = (
  questionType: EntityExtraction['questionType'],
  entities: EntityExtraction,
  month: string
): string[] => {
  const followUps: string[] = [];
  
  // General follow-ups based on question type
  switch(questionType) {
    case 'performance':
      followUps.push(`Who are the top performers in ${month}?`);
      followUps.push(`Why did profit ${Math.random() > 0.5 ? 'increase' : 'decrease'} in ${month}?`);
      break;
      
    case 'comparison':
      if (entities.months.length > 1) {
        followUps.push(`What factors caused the change between ${entities.months[0]} and ${entities.months[1]}?`);
      } else {
        followUps.push(`Compare ${month} with the previous month`);
      }
      followUps.push(`Why did performance change between these months?`);
      break;
      
    case 'specific':
      if (entities.repNames.length > 0) {
        const rep = entities.repNames[0];
        followUps.push(`How does ${rep}'s performance compare to last month?`);
        followUps.push(`What are ${rep}'s best customers?`);
      }
      if (entities.departments.length > 0) {
        const dept = entities.departments[0];
        followUps.push(`Who are the top performers in ${dept}?`);
        followUps.push(`How is ${dept} trending over time?`);
      }
      break;
      
    case 'trend':
      followUps.push("What's driving this trend?");
      followUps.push("Which departments show the strongest growth?");
      break;
      
    case 'reason':
      followUps.push("What actions should we take based on this?");
      followUps.push(`Show me the data visualization for ${month}`);
      followUps.push(`Which reps improved the most in ${month}?`);
      break;
      
    case 'analysis':
      followUps.push("How does this compare to previous trends?");
      followUps.push("Which factors had the biggest impact?");
      followUps.push("What specific actions would improve performance?");
      break;
      
    default:
      followUps.push(`Who improved most since last month?`);
      followUps.push(`Show me department comparison for ${month}`);
  }
  
  // Add relevant exploration questions
  if (!entities.metrics.includes('margin') && questionType !== 'comparison') {
    followUps.push(`What about margin performance in ${month}?`);
  }
  
  if (entities.repNames.length === 0 && questionType !== 'general') {
    followUps.push("Who are our top performers by profit?");
  }
  
  // Filter to max 4 questions and shuffle them
  const shuffled = followUps.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
};

// New function to help determine if the query requires AI analysis
export const requiresAIAnalysis = (query: string, entities: EntityExtraction): boolean => {
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
};

// Format data for AI analysis
export const formatDataForAIAnalysis = (
  monthData: any[], 
  comparisonData: any[], 
  currentMonth: string, 
  previousMonth: string,
  query: string
): string => {
  // Calculate summary metrics for current month
  const currentTotalSpend = monthData.reduce((sum, item) => sum + (Number(item.Spend) || 0), 0);
  const currentTotalProfit = monthData.reduce((sum, item) => sum + (Number(item.Profit) || 0), 0);
  const currentMargin = currentTotalSpend > 0 ? (currentTotalProfit / currentTotalSpend) * 100 : 0;
  
  // Calculate summary metrics for previous month
  const prevTotalSpend = comparisonData.reduce((sum, item) => sum + (Number(item.Spend) || 0), 0);
  const prevTotalProfit = comparisonData.reduce((sum, item) => sum + (Number(item.Profit) || 0), 0);
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
    const repName = item.Rep === 'RETAIL' || item.Rep === 'REVA' || item.Rep === 'Wholesale' 
      ? (item["Sub-Rep"] || item.Rep) 
      : item.Rep;
    
    if (!repName || repName === 'RETAIL' || repName === 'REVA' || repName === 'Wholesale') return;
    
    if (!repMap.has(repName)) {
      repMap.set(repName, { profit: 0, spend: 0 });
    }
    
    repMap.get(repName).profit += Number(item.Profit) || 0;
    repMap.get(repName).spend += Number(item.Spend) || 0;
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
    const dept = item.Department || 'RETAIL';
    
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { profit: 0, spend: 0 });
    }
    
    deptMap.get(dept).profit += Number(item.Profit) || 0;
    deptMap.get(dept).spend += Number(item.Spend) || 0;
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
};
