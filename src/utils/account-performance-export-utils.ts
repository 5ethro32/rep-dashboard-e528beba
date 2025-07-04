import * as XLSX from 'xlsx';

export interface AccountPerformanceExportOptions {
  selectedMonth?: string;
  selectedUser?: string;
  includeDepartmentFilter?: boolean;
  includeRetail?: boolean;
  includeReva?: boolean;
  includeWholesale?: boolean;
  fileName?: string;
}

export const exportAccountPerformanceData = (
  currentMonthData: any[],
  previousMonthData: any[],
  options: AccountPerformanceExportOptions = {}
) => {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare current month data for export
    const currentMonthExportData = currentMonthData.map((item, index) => ({
      'Rank': index + 1,
      'Account Name': item['Account Name'] || item.account_name || '',
      'Account Ref': item['Account Ref'] || item.account_ref || '',
      'Rep': item.Rep || item.rep_name || '',
      'Sub-Rep': item['Sub-Rep'] || item.sub_rep || '',
      'Department': item.Department || item.department || '',
      'Profit': typeof item.Profit === 'number' ? item.Profit : (typeof item.profit === 'number' ? item.profit : 0),
      'Spend': typeof item.Spend === 'number' ? item.Spend : (typeof item.spend === 'number' ? item.spend : 0),
      'Margin %': (() => {
        const profit = typeof item.Profit === 'number' ? item.Profit : (typeof item.profit === 'number' ? item.profit : 0);
        const spend = typeof item.Spend === 'number' ? item.Spend : (typeof item.spend === 'number' ? item.spend : 0);
        return spend > 0 ? ((profit / spend) * 100).toFixed(2) : '0.00';
      })()
    }));
    
    // Add current month sheet
    const currentMonthSheet = XLSX.utils.json_to_sheet(currentMonthExportData);
    XLSX.utils.book_append_sheet(workbook, currentMonthSheet, options.selectedMonth || 'Current Month');
    
    // Add previous month data if available
    if (previousMonthData && previousMonthData.length > 0) {
      const previousMonthExportData = previousMonthData.map((item, index) => ({
        'Rank': index + 1,
        'Account Name': item['Account Name'] || item.account_name || '',
        'Account Ref': item['Account Ref'] || item.account_ref || '',
        'Rep': item.Rep || item.rep_name || '',
        'Sub-Rep': item['Sub-Rep'] || item.sub_rep || '',
        'Department': item.Department || item.department || '',
        'Profit': typeof item.Profit === 'number' ? item.Profit : (typeof item.profit === 'number' ? item.profit : 0),
        'Spend': typeof item.Spend === 'number' ? item.Spend : (typeof item.spend === 'number' ? item.spend : 0),
        'Margin %': (() => {
          const profit = typeof item.Profit === 'number' ? item.Profit : (typeof item.profit === 'number' ? item.profit : 0);
          const spend = typeof item.Spend === 'number' ? item.Spend : (typeof item.spend === 'number' ? item.spend : 0);
          return spend > 0 ? ((profit / spend) * 100).toFixed(2) : '0.00';
        })()
      }));
      
      const previousMonthSheet = XLSX.utils.json_to_sheet(previousMonthExportData);
      XLSX.utils.book_append_sheet(workbook, previousMonthSheet, 'Previous Month');
    }
    
    // Create summary sheet
    const summaryData = [
      ['ACCOUNT PERFORMANCE EXPORT SUMMARY', ''],
      ['Export Date', new Date().toLocaleDateString()],
      ['Selected Month', options.selectedMonth || 'Not specified'],
      ['Selected User', options.selectedUser || 'All Data'],
      ['', ''],
      ['DEPARTMENT FILTERS', ''],
      ['Retail Included', options.includeRetail ? 'Yes' : 'No'],
      ['REVA Included', options.includeReva ? 'Yes' : 'No'],
      ['Wholesale Included', options.includeWholesale ? 'Yes' : 'No'],
      ['', ''],
      ['DATA SUMMARY', ''],
      ['Current Month Records', currentMonthData.length.toLocaleString()],
      ['Previous Month Records', previousMonthData?.length?.toLocaleString() || 'N/A'],
      ['', ''],
      ['TOTALS - CURRENT MONTH', ''],
      ['Total Profit', `£${currentMonthData.reduce((sum, item) => {
        const profit = typeof item.Profit === 'number' ? item.Profit : (typeof item.profit === 'number' ? item.profit : 0);
        return sum + profit;
      }, 0).toLocaleString()}`],
      ['Total Spend', `£${currentMonthData.reduce((sum, item) => {
        const spend = typeof item.Spend === 'number' ? item.Spend : (typeof item.spend === 'number' ? item.spend : 0);
        return sum + spend;
      }, 0).toLocaleString()}`],
      ['Average Margin %', (() => {
        const totalProfit = currentMonthData.reduce((sum, item) => {
          const profit = typeof item.Profit === 'number' ? item.Profit : (typeof item.profit === 'number' ? item.profit : 0);
          return sum + profit;
        }, 0);
        const totalSpend = currentMonthData.reduce((sum, item) => {
          const spend = typeof item.Spend === 'number' ? item.Spend : (typeof item.spend === 'number' ? item.spend : 0);
          return sum + spend;
        }, 0);
        return totalSpend > 0 ? ((totalProfit / totalSpend) * 100).toFixed(2) + '%' : '0.00%';
      })()]
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const monthPart = options.selectedMonth ? `_${options.selectedMonth.replace(/\s+/g, '_')}` : '';
    const userPart = options.selectedUser && options.selectedUser !== 'All Data' ? `_${options.selectedUser.replace(/\s+/g, '_')}` : '';
    const fileName = options.fileName || `Account_Performance_Export${monthPart}${userPart}_${timestamp}.xlsx`;
    
    // Trigger download
    XLSX.writeFile(workbook, fileName);
    
    return {
      exportedCount: currentMonthData.length,
      fileName,
      previousMonthCount: previousMonthData?.length || 0
    };
    
  } catch (error) {
    console.error('Error exporting account performance data:', error);
    throw new Error('Failed to export account performance data');
  }
}; 