// Debug script to test the isFullMonth detection
// Run this in browser console on the daily-rep-performance page

console.log('🔍 Testing isFullMonth Detection...');

// Import the date-fns functions (assuming they're available)
const { startOfMonth, endOfMonth, isSameDay } = window.dateFns || {};

if (!startOfMonth) {
  console.log('⚠️ date-fns not available in window scope. Testing manually...');
  
  // Manual implementation to test
  const testIsFullMonth = (startDate, endDate) => {
    const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    console.log('Testing full month detection:');
    console.log('  Start date:', startDate.toISOString());
    console.log('  End date:', endDate.toISOString());
    console.log('  Expected month start:', monthStart.toISOString());
    console.log('  Expected month end:', monthEnd.toISOString());
    console.log('  Start dates match:', startDate.getTime() === monthStart.getTime());
    console.log('  End dates match:', endDate.getTime() === monthEnd.getTime());
    
    return startDate.getTime() === monthStart.getTime() && 
           endDate.getTime() === monthEnd.getTime();
  };
  
  // Test with June 2025
  const juneStart = new Date('2025-06-01T00:00:00.000Z');
  const juneEnd = new Date('2025-06-30T23:59:59.999Z');
  
  console.log('🗓️ Testing June 1-30, 2025:');
  const isJuneFullMonth = testIsFullMonth(juneStart, juneEnd);
  console.log('  Result:', isJuneFullMonth ? '✅ Full month detected' : '❌ Not detected as full month');
  
  // Test what the shortcut actually creates
  const today = new Date();
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);
  
  console.log('\n🔧 Testing Last Month shortcut:');
  console.log('  Shortcut start:', lastMonthStart.toISOString());
  console.log('  Shortcut end:', lastMonthEnd.toISOString());
  const isShortcutFullMonth = testIsFullMonth(lastMonthStart, lastMonthEnd);
  console.log('  Result:', isShortcutFullMonth ? '✅ Full month detected' : '❌ Not detected as full month');
  
} else {
  console.log('✅ date-fns available, testing with actual functions...');
  
  // Test with actual date-fns functions
  const testWithDateFns = (startDate, endDate) => {
    const monthStart = startOfMonth(startDate);
    const monthEnd = endOfMonth(startDate);
    
    console.log('Testing with date-fns:');
    console.log('  Start date:', startDate.toISOString());
    console.log('  End date:', endDate.toISOString());
    console.log('  date-fns month start:', monthStart.toISOString());
    console.log('  date-fns month end:', monthEnd.toISOString());
    console.log('  isSameDay start:', isSameDay(startDate, monthStart));
    console.log('  isSameDay end:', isSameDay(endDate, monthEnd));
    
    return isSameDay(startDate, monthStart) && isSameDay(endDate, monthEnd);
  };
  
  const juneStart = new Date('2025-06-01T00:00:00.000Z');
  const juneEnd = new Date('2025-06-30T23:59:59.999Z');
  
  console.log('🗓️ Testing June 1-30, 2025 with date-fns:');
  const result = testWithDateFns(juneStart, juneEnd);
  console.log('  Result:', result ? '✅ Full month detected' : '❌ Not detected as full month');
}

console.log('✅ isFullMonth debug complete!'); 