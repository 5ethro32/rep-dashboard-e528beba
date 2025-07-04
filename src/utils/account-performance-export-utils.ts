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
    
    // Helper function to create a unique account key
    const createAccountKey = (item: any) => {
      const accountRef = item['Account Ref'] || item.account_ref || '';
      const accountName = item['Account Name'] || item.account_name || '';
      
      // Use account ref if available, otherwise use account name
      return accountRef && accountRef.trim() ? accountRef : accountName.trim().toLowerCase();
    };
    
    // Create maps of all accounts from both months
    const currentAccountMap = new Map();
    const previousAccountMap = new Map();
    
    // Build current month account map
    currentMonthData.forEach(item => {
      const accountKey = createAccountKey(item);
      if (accountKey) {
        currentAccountMap.set(accountKey, item);
      }
    });
    
    // Build previous month account map
    if (previousMonthData && previousMonthData.length > 0) {
      previousMonthData.forEach(item => {
        const accountKey = createAccountKey(item);
        if (accountKey) {
          previousAccountMap.set(accountKey, item);
        }
      });
    }
    
    // Get union of all account keys from both months
    const allAccountKeys = new Set([...currentAccountMap.keys(), ...previousAccountMap.keys()]);
    
    // Prepare current month data for export (including all accounts)
    const currentMonthExportData = Array.from(allAccountKeys).map((accountKey, index) => {
      const currentItem = currentAccountMap.get(accountKey);
      const previousItem = previousAccountMap.get(accountKey);
      
      // Use current month data if available, otherwise create placeholder with previous month account details
      const item = currentItem || previousItem || {};
      
      return {
        'Rank': index + 1,
        'Account Name': item['Account Name'] || item.account_name || '',
        'Account Ref': item['Account Ref'] || item.account_ref || '',
        'Rep': item.Rep || item.rep_name || '',
        'Sub-Rep': item['Sub-Rep'] || item.sub_rep || '',
        'Department': item.Department || item.department || '',
        'Profit': currentItem ? (typeof currentItem.Profit === 'number' ? currentItem.Profit : (typeof currentItem.profit === 'number' ? currentItem.profit : 0)) : 0,
        'Spend': currentItem ? (typeof currentItem.Spend === 'number' ? currentItem.Spend : (typeof currentItem.spend === 'number' ? currentItem.spend : 0)) : 0,
        'Margin %': (() => {
          if (!currentItem) return '0.00';
          const profit = typeof currentItem.Profit === 'number' ? currentItem.Profit : (typeof currentItem.profit === 'number' ? currentItem.profit : 0);
          const spend = typeof currentItem.Spend === 'number' ? currentItem.Spend : (typeof currentItem.spend === 'number' ? currentItem.spend : 0);
          return spend > 0 ? ((profit / spend) * 100).toFixed(2) : '0.00';
        })()
      };
    });
    
    // Sort by account name alphabetically
    currentMonthExportData.sort((a, b) => {
      const nameA = a['Account Name'].toLowerCase();
      const nameB = b['Account Name'].toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    // Update ranks after sorting
    currentMonthExportData.forEach((item, index) => {
      item.Rank = index + 1;
    });
    
    // Add current month sheet
    const currentMonthSheet = XLSX.utils.json_to_sheet(currentMonthExportData);
    XLSX.utils.book_append_sheet(workbook, currentMonthSheet, options.selectedMonth || 'Current Month');
    
    // Prepare previous month data for export (including all accounts)
    if (previousMonthData && previousMonthData.length > 0) {
      const previousMonthExportData = Array.from(allAccountKeys).map((accountKey, index) => {
        const currentItem = currentAccountMap.get(accountKey);
        const previousItem = previousAccountMap.get(accountKey);
        
        // Use previous month data if available, otherwise create placeholder with current month account details
        const item = previousItem || currentItem || {};
        
        return {
          'Rank': index + 1,
          'Account Name': item['Account Name'] || item.account_name || '',
          'Account Ref': item['Account Ref'] || item.account_ref || '',
          'Rep': item.Rep || item.rep_name || '',
          'Sub-Rep': item['Sub-Rep'] || item.sub_rep || '',
          'Department': item.Department || item.department || '',
          'Profit': previousItem ? (typeof previousItem.Profit === 'number' ? previousItem.Profit : (typeof previousItem.profit === 'number' ? previousItem.profit : 0)) : 0,
          'Spend': previousItem ? (typeof previousItem.Spend === 'number' ? previousItem.Spend : (typeof previousItem.spend === 'number' ? previousItem.spend : 0)) : 0,
          'Margin %': (() => {
            if (!previousItem) return '0.00';
            const profit = typeof previousItem.Profit === 'number' ? previousItem.Profit : (typeof previousItem.profit === 'number' ? previousItem.profit : 0);
            const spend = typeof previousItem.Spend === 'number' ? previousItem.Spend : (typeof previousItem.spend === 'number' ? previousItem.spend : 0);
            return spend > 0 ? ((profit / spend) * 100).toFixed(2) : '0.00';
          })()
        };
      });
      
      // Sort by account name alphabetically
      previousMonthExportData.sort((a, b) => {
        const nameA = a['Account Name'].toLowerCase();
        const nameB = b['Account Name'].toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      // Update ranks after sorting
      previousMonthExportData.forEach((item, index) => {
        item.Rank = index + 1;
      });
      
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
      ['Total Unique Accounts', allAccountKeys.size.toLocaleString()],
      ['Current Month Records (with data)', currentMonthData.length.toLocaleString()],
      ['Previous Month Records (with data)', previousMonthData?.length?.toLocaleString() || 'N/A'],
      ['', ''],
      ['EXPORT NOTES', ''],
      ['Both worksheets include ALL accounts from both months', ''],
      ['Accounts with £0 in a month show as £0 on that worksheet', ''],
      ['This matches the UI display which shows all accounts side-by-side', ''],
      ['', ''],
      ['TOTALS - CURRENT MONTH (accounts with data)', ''],
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
      exportedCount: allAccountKeys.size, // Total unique accounts across both months
      fileName,
      previousMonthCount: previousMonthData?.length || 0
    };
    
  } catch (error) {
    console.error('Error exporting account performance data:', error);
    throw new Error('Failed to export account performance data');
  }
}; 