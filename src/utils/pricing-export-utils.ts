
import * as XLSX from 'xlsx';

export interface PricingExportOptions {
  includeAllItems?: boolean;
  includeModifiedOnly?: boolean;
  includeExceptionsOnly?: boolean;
  includeWorkflowStatus?: boolean;
  includePriceHistory?: boolean;
  includeRationales?: boolean;
  fileName?: string;
}

export const exportPricingData = (
  data: any[],
  options: PricingExportOptions = {}
) => {
  // Filter data based on options
  let exportData = [...data];
  
  if (options.includeModifiedOnly) {
    exportData = exportData.filter(item => item.priceModified);
  }
  
  if (options.includeExceptionsOnly) {
    exportData = exportData.filter(item => item.flag1 || item.flag2);
  }
  
  // Map data to export format
  const mappedData = exportData.map(item => {
    const baseItem = {
      'Description': item.description || '',
      'Stock': item.inStock || 0,
      'Usage': item.revaUsage || 0,
      'Rank': item.usageRank || 0,
      'Average Cost': item.avgCost || 0,
      'Market Low': item.marketLow || 0,
      'True Market Low': item.trueMarketLow || 0,
      'Current Price': item.currentREVAPrice || 0,
      'Current Margin %': item.currentREVAMargin ? (item.currentREVAMargin * 100).toFixed(2) : '0.00',
      'Proposed Price': item.proposedPrice || 0,
      'Proposed Margin %': item.proposedMargin ? (item.proposedMargin * 100).toFixed(2) : '0.00',
      'Rule Applied': item.appliedRule || '',
      'Flag 1': item.flag1 ? 'Yes' : 'No',
      'Flag 2': item.flag2 ? 'Yes' : 'No',
      'Edited': item.priceModified ? 'Yes' : 'No'
    };
    
    // Add rationale information if requested and available
    if (options.includeRationales && item.priceChangeRationale) {
      baseItem['Change Rationale'] = item.priceChangeRationaleDescription || item.priceChangeRationale || '';
    }
    
    // Add workflow status if requested
    if (options.includeWorkflowStatus && item.workflowStatus) {
      return {
        ...baseItem,
        'Status': item.workflowStatus,
        'Submitted By': item.submittedBy || '',
        'Submission Date': item.submissionDate || '',
        'Reviewer': item.reviewer || '',
        'Review Date': item.reviewDate || '',
        'Comments': item.reviewComments || ''
      };
    }
    
    return baseItem;
  });
  
  // Generate workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(mappedData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing Data');
  
  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fileName = options.fileName || `REVA_Pricing_Export_${timestamp}.xlsx`;
  
  // Trigger download
  XLSX.writeFile(workbook, fileName);
  
  return {
    exportedCount: mappedData.length,
    fileName
  };
};
