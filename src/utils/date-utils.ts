
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
