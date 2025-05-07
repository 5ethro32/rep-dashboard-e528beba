
import { isWeekend, getDaysInMonth, isWithinInterval } from 'date-fns';

/**
 * Calculate the percentage of working days completed in the current month
 */
export const getWorkingDayPercentage = (date: Date = new Date()): number => {
  // Get the current month and year
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const currentDay = date.getDate();
  
  // Create first and last day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  // Calculate total working days in the month (exclude weekends)
  let totalWorkingDays = 0;
  let workingDaysElapsed = 0;
  
  const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth));
  
  // Count total working days in the month and working days elapsed so far
  for (let day = 1; day <= daysInMonth; day++) {
    const checkDate = new Date(currentYear, currentMonth, day);
    
    if (!isWeekend(checkDate)) {
      totalWorkingDays++;
      
      // If this day is on or before current date, count it as elapsed
      if (day <= currentDay) {
        workingDaysElapsed++;
      }
    }
  }
  
  // Calculate percentage completed (avoid division by zero)
  return totalWorkingDays > 0 ? (workingDaysElapsed / totalWorkingDays) * 100 : 0;
};

/**
 * Project the expected monthly value based on current progress
 * @param currentValue Current value achieved so far in the month
 * @param percentComplete Percentage of working days completed in the month
 */
export const projectMonthlyValue = (currentValue: number, percentComplete: number): number => {
  // Avoid division by zero
  if (percentComplete <= 0) return 0;
  
  // Simple linear projection
  return (currentValue / (percentComplete / 100));
};
