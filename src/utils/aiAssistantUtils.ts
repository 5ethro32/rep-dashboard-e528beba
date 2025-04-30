
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
  questionType: 'performance' | 'comparison' | 'trend' | 'reason' | 'specific' | 'general';
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
    'what happened last month': 'What were the key metrics and notable changes in last month\'s sales performance?'
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

  // Query seems specific enough already
  return query;
};

// Function to determine the question type for better response formatting
export const determineQuestionType = (entities: EntityExtraction): EntityExtraction['questionType'] => {
  if (entities.comparisons || entities.months.length > 1) {
    return 'comparison';
  }
  
  if (entities.trend) {
    return 'trend';
  }
  
  if (entities.reasons) {
    return 'reason';
  }
  
  if (entities.repNames.length > 0 || entities.customers.length > 0 || entities.departments.length > 0) {
    return 'specific';
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
