/**
 * Dummy data service for testing dashboard metrics
 * Provides static test data that mimics the structure of real data
 */

// Types to match our data structure
export interface DummyDepartmentMetric {
  department: string;
  recordCount: number;
  totalSpend: number;
  totalProfit: number;
  totalPacks: number;
  totalAccounts: number;
  repCount: number;
  averageMargin: number;
}

export interface DummyMetricsResponse {
  current: DummyDepartmentMetric[];
  previous: DummyDepartmentMetric[];
  changes: Record<string, Record<string, number>>;
}

// Create dummy metrics data for each department
const createDummyDepartmentData = (department: string, multiplier: number = 1): DummyDepartmentMetric => {
  const spend = 100000 * multiplier;
  const profit = 20000 * multiplier;
  
  return {
    department,
    recordCount: 50 * multiplier,
    totalSpend: spend,
    totalProfit: profit,
    totalPacks: 500 * multiplier,
    totalAccounts: 30 * multiplier,
    repCount: 10 * multiplier,
    averageMargin: (profit / spend) * 100
  };
};

// Create comparison data between months
const createDummyComparison = (currentMonth: string): DummyMetricsResponse => {
  // Multipliers to create different data for different months
  const multipliers: Record<string, number> = {
    'February': 0.7,
    'March': 0.85,
    'April': 1.0,
    'May': 1.15
  };
  
  const currentMultiplier = multipliers[currentMonth] || 1;
  
  // Determine previous month and its multiplier
  const monthOrder = ['February', 'March', 'April', 'May'];
  const currentIndex = monthOrder.indexOf(currentMonth);
  const previousMonth = currentIndex > 0 ? monthOrder[currentIndex - 1] : null;
  const previousMultiplier = previousMonth ? multipliers[previousMonth] : 0;
  
  // Create current month data for each department
  const current = [
    createDummyDepartmentData('retail', currentMultiplier),
    createDummyDepartmentData('reva', currentMultiplier * 0.8),
    createDummyDepartmentData('wholesale', currentMultiplier * 1.2)
  ];
  
  // Create previous month data if applicable
  const previous = previousMonth ? [
    createDummyDepartmentData('retail', previousMultiplier),
    createDummyDepartmentData('reva', previousMultiplier * 0.8),
    createDummyDepartmentData('wholesale', previousMultiplier * 1.2)
  ] : [];
  
  // Calculate percentage changes between months
  const changes: Record<string, Record<string, number>> = {};
  
  if (previousMonth) {
    current.forEach((curr, index) => {
      const prev = previous[index];
      const deptChanges: Record<string, number> = {};
      
      // Calculate percentage changes for each metric
      Object.entries(curr).forEach(([key, value]) => {
        if (typeof value === 'number' && key !== 'department') {
          const prevValue = (prev as any)[key] as number;
          if (prevValue !== 0) {
            deptChanges[key] = ((value - prevValue) / prevValue) * 100;
          } else {
            deptChanges[key] = 0;
          }
        }
      });
      
      changes[curr.department] = deptChanges;
    });
  }
  
  return { current, previous, changes };
};

/**
 * Gets dummy comparison data between months
 * @param currentMonth - Current month (e.g., 'March')
 * @returns Object containing metrics and calculated changes
 */
export const getDummyMonthlyComparison = (currentMonth: string): DummyMetricsResponse => {
  return createDummyComparison(currentMonth);
};

/**
 * Gets available months in the dummy data
 * @returns Array of month names
 */
export const getDummyAvailableMonths = (): string[] => {
  return ['May', 'April', 'March', 'February'];
};

/**
 * Gets all departments in the dummy data
 * @returns Array of department names
 */
export const getDummyDepartments = (): string[] => {
  return ['retail', 'reva', 'wholesale'];
}; 