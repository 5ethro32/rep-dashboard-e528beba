
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric'
  });
};

export const getWeekStart = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  result.setDate(diff);
  return result;
};

export const getWeekEnd = (date: Date): Date => {
  const result = getWeekStart(date);
  result.setDate(result.getDate() + 6);
  return result;
};

export const formatWeekRange = (startDate: Date, endDate: Date): string => {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  const timestamp = date.getTime();
  return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
};

// Added functions for the TrendLineChart component
export const getWorkingDayPercentage = (currentDate: Date): number => {
  // Calculate the percentage of working days completed in the month
  const now = new Date(currentDate);
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Total days in the month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Current day of the month
  const currentDay = now.getDate();
  
  // Estimate working days (excluding weekends) - simplified calculation
  let totalWorkingDays = 0;
  let completedWorkingDays = 0;
  
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      totalWorkingDays++;
      
      if (day <= currentDay) {
        completedWorkingDays++;
      }
    }
  }
  
  // Calculate percentage
  return (completedWorkingDays / totalWorkingDays) * 100;
};

export const projectMonthlyValue = (currentValue: number, percentageComplete: number): number => {
  // Prevent division by zero
  if (percentageComplete <= 0) return currentValue;
  
  // Project the full month value based on current value and percentage complete
  return currentValue * (100 / percentageComplete);
};
