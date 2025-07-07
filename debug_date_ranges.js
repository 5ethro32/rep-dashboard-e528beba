// Debug script to run in browser console to check date range differences
// Run this on the daily-rep-performance page

console.log('🔍 Testing Date Range Generation...');

// Test the Last Month shortcut calculation
const today = new Date();
console.log('Today:', today.toISOString());

const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month

console.log('🗓️ Last Month Shortcut:');
console.log('  Start:', lastMonthStart.toISOString());
console.log('  End:', lastMonthEnd.toISOString());
console.log('  Start Date:', lastMonthStart.toDateString());
console.log('  End Date:', lastMonthEnd.toDateString());

// Test manual June selection
const manualJuneStart = new Date('2025-06-01T00:00:00');
const manualJuneEnd = new Date('2025-06-30T00:00:00');

console.log('📅 Manual June Selection:');
console.log('  Start:', manualJuneStart.toISOString());
console.log('  End:', manualJuneEnd.toISOString());
console.log('  Start Date:', manualJuneStart.toDateString());
console.log('  End Date:', manualJuneEnd.toDateString());

// Check if they're the same
const sameStart = lastMonthStart.toDateString() === manualJuneStart.toDateString();
const sameEnd = lastMonthEnd.toDateString() === manualJuneEnd.toDateString();

console.log('🔍 Comparison:');
console.log('  Same start date:', sameStart);
console.log('  Same end date:', sameEnd);
console.log('  Both ranges identical:', sameStart && sameEnd);

// Check what gets sent to the server
const formatForServer = (date) => {
  return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD
};

console.log('📡 Server Format:');
console.log('  Last Month Start:', formatForServer(lastMonthStart));
console.log('  Last Month End:', formatForServer(lastMonthEnd));
console.log('  Manual June Start:', formatForServer(manualJuneStart));
console.log('  Manual June End:', formatForServer(manualJuneEnd));

// Test comparison period calculation
console.log('🔄 Comparison Periods:');

// For Last Month (June), comparison should be May
const mayStart = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() - 1, 1);
const mayEnd = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), 0);

console.log('  Last Month comparison (May):');
console.log('    Start:', mayStart.toDateString(), formatForServer(mayStart));
console.log('    End:', mayEnd.toDateString(), formatForServer(mayEnd));

// For manual June selection, what comparison period gets calculated?
const diffDays = Math.ceil((manualJuneEnd - manualJuneStart) / (1000 * 60 * 60 * 24));
const customCompStart = new Date(manualJuneStart.getTime() - (diffDays + 1) * 24 * 60 * 60 * 1000);
const customCompEnd = new Date(manualJuneStart.getTime() - 24 * 60 * 60 * 1000);

console.log('  Manual June comparison (custom logic):');
console.log('    Diff days:', diffDays);
console.log('    Start:', customCompStart.toDateString(), formatForServer(customCompStart));
console.log('    End:', customCompEnd.toDateString(), formatForServer(customCompEnd));

// Check current dashboard state
if (window.location.pathname === '/daily-rep-performance') {
  console.log('📊 Current Dashboard State:');
  
  // Try to access the date picker state if possible
  setTimeout(() => {
    const dateButton = document.querySelector('button[type="button"] span');
    if (dateButton) {
      console.log('  Current date display:', dateButton.textContent);
    }
    
    // Look for the comparison text
    const comparisonElements = document.querySelectorAll('[class*="text-gray-400"]');
    comparisonElements.forEach((el, i) => {
      if (el.textContent && el.textContent.includes('vs ')) {
        console.log('  Comparison period:', el.textContent);
      }
    });
  }, 1000);
}

console.log('✅ Date range analysis complete!'); 