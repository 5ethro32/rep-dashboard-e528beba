
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

// Calculate the percentage of working days completed in the month
export const getWorkingDayPercentage = (currentDate: Date): number => {
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

// Project monthly value based on percentage completion
export const projectMonthlyValue = (currentValue: number, percentageComplete: number): number => {
  // Prevent division by zero
  if (percentageComplete <= 0) return currentValue;
  
  // Project the full month value based on current value and percentage complete
  return currentValue * (100 / percentageComplete);
};

// Get the first day of the month
export const getFirstDayOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  return result;
};

// Get the last day of the month
export const getLastDayOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  return result;
};

// Format date as Month Year
export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
};

// Format date as Day Month
export const formatDayMonth = (date: Date): string => {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  });
};

// Get day of week as text
export const getDayOfWeek = (date: Date): string => {
  return date.toLocaleDateString('en-GB', { weekday: 'long' });
};

// Check if two dates are the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Add days to a date
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
