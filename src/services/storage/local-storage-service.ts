
export const saveRepPerformanceData = (data: any) => {
  try {
    localStorage.setItem('rep-performance-data', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save rep performance data to local storage:', error);
  }
};

export const loadStoredRepPerformanceData = () => {
  try {
    const storedData = localStorage.getItem('rep-performance-data');
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error('Failed to load rep performance data from local storage:', error);
    return null;
  }
};
