import { Database } from '@/integrations/supabase/types';

// Type for the unified sales data
type UnifiedSalesData = Database['public']['Tables']['unified_sales_data']['Row'];

// Types for the various source tables with different field naming conventions
type SalesDataFebruary = Database['public']['Tables']['sales_data_februrary']['Row'];
type SalesDataMarch = Database['public']['Tables']['sales_data']['Row'];
type MtdDaily = Database['public']['Tables']['mtd_daily']['Row'];
type MayData = Database['public']['Tables']['May_Data']['Row'];

/**
 * Maps unified data fields to the format expected by existing components
 * that were built for the original tables
 */
export const mapUnifiedToLegacy = (
  unifiedRecord: UnifiedSalesData,
  targetFormat: 'february' | 'march' | 'april' | 'may' = 'march'
): any => {
  // Log the original record for debugging
  console.log(`DEBUG - Original unified record (${targetFormat}):`, {
    id: unifiedRecord.id,
    source_id: unifiedRecord.source_id,
    rep_name: unifiedRecord.rep_name,
    department: unifiedRecord.department,
    spend: unifiedRecord.spend, 
    profit: unifiedRecord.profit,
    margin: unifiedRecord.margin
  });
  
  let result;
  
  // Different mappings based on which legacy format we need
  switch (targetFormat) {
    case 'february':
    case 'april':
    case 'may':
      // These all use PascalCase with spaces
      result = {
        id: unifiedRecord.source_id || unifiedRecord.id,
        "Rep": unifiedRecord.rep_name,
        "Sub-Rep": unifiedRecord.sub_rep,
        "Account Ref": unifiedRecord.account_ref,
        "Account Name": unifiedRecord.account_name,
        "Department": unifiedRecord.department,
        "Spend": unifiedRecord.spend,
        "Profit": unifiedRecord.profit,
        "Margin": unifiedRecord.margin,
        "Packs": unifiedRecord.packs,
        "Cost": unifiedRecord.cost,
        "Credit": unifiedRecord.credit
      };
      break;
    case 'march':
      // March uses snake_case
      result = {
        id: Number(unifiedRecord.source_id) || unifiedRecord.id,
        rep_name: unifiedRecord.rep_name,
        sub_rep: unifiedRecord.sub_rep,
        account_ref: unifiedRecord.account_ref,
        account_name: unifiedRecord.account_name,
        rep_type: unifiedRecord.department,
        reporting_period: unifiedRecord.reporting_period,
        spend: unifiedRecord.spend,
        profit: unifiedRecord.profit,
        margin: unifiedRecord.margin,
        packs: unifiedRecord.packs,
        cost: unifiedRecord.cost,
        credit: unifiedRecord.credit
      };
      break;
  }
  
  // Log the mapped record for debugging
  console.log(`DEBUG - Mapped record (${targetFormat}):`, {
    id: result.id,
    rep: result.Rep || result.rep_name,
    department: result.Department || result.rep_type,
    spend: result.Spend || result.spend, 
    profit: result.Profit || result.profit,
    margin: result.Margin || result.margin
  });
  
  return result;
};

/**
 * Maps any of the legacy data formats to the unified structure
 */
export const mapLegacyToUnified = (
  record: SalesDataFebruary | SalesDataMarch | MtdDaily | MayData,
  sourceTable: string,
  month: string,
  year: number = 2024
): Partial<UnifiedSalesData> => {
  // Check which type of record we're dealing with
  if ('rep_name' in record) {
    // This is Sales Data (March data)
    const salesDataRecord = record as SalesDataMarch;
    return {
      source_id: String(salesDataRecord.id),
      source_table: sourceTable,
      reporting_year: year,
      reporting_month: month,
      reporting_period: salesDataRecord.reporting_period,
      rep_name: salesDataRecord.rep_name,
      sub_rep: salesDataRecord.sub_rep,
      account_ref: salesDataRecord.account_ref,
      account_name: salesDataRecord.account_name,
      department: salesDataRecord.rep_type,
      spend: salesDataRecord.spend,
      profit: salesDataRecord.profit,
      margin: salesDataRecord.margin,
      packs: salesDataRecord.packs,
      cost: salesDataRecord.cost,
      credit: salesDataRecord.credit,
      data_month: month
    };
  } else {
    // This is PascalCase with spaces (February, April, May)
    const otherRecord = record as SalesDataFebruary | MtdDaily | MayData;
    return {
      source_id: otherRecord.id,
      source_table: sourceTable,
      reporting_year: year,
      reporting_month: month,
      reporting_period: `${year}-${month.substring(0, 3).toLowerCase()}`,
      rep_name: otherRecord.Rep,
      sub_rep: otherRecord["Sub-Rep"],
      account_ref: otherRecord["Account Ref"],
      account_name: otherRecord["Account Name"],
      department: otherRecord.Department,
      spend: otherRecord.Spend,
      profit: otherRecord.Profit,
      margin: otherRecord.Margin,
      packs: otherRecord.Packs,
      cost: otherRecord.Cost,
      credit: otherRecord.Credit,
      data_month: month
    };
  }
};

/**
 * Generic function to convert any record to a consistent format
 * for use in components that expect a specific field structure
 */
export const normalizeRecord = <T extends Record<string, any>>(
  record: UnifiedSalesData | SalesDataFebruary | SalesDataMarch | MtdDaily | MayData,
  outputFormat: 'unified' | 'february' | 'march' | 'april' | 'may' = 'unified'
): T => {
  // First determine the input type
  let sourceFormat: 'unified' | 'february' | 'march' | 'april' | 'may';
  
  if ('reporting_month' in record && 'source_table' in record) {
    sourceFormat = 'unified';
  } else if ('rep_name' in record) {
    sourceFormat = 'march';
  } else {
    // Determine which PascalCase format based on any available metadata
    // Default to February if we can't tell
    sourceFormat = 'february';
  }
  
  // If source and output formats match, return as is
  if (sourceFormat === outputFormat) {
    return record as unknown as T;
  }
  
  // Convert to unified first if source isn't unified
  let unifiedRecord: UnifiedSalesData;
  if (sourceFormat !== 'unified') {
    // Need to determine month from context - default to sourceFormat
    const month = sourceFormat === 'february' ? 'February' : 
                 sourceFormat === 'march' ? 'March' :
                 sourceFormat === 'april' ? 'April' : 'May';
                 
    unifiedRecord = mapLegacyToUnified(
      record as any,
      `${sourceFormat}_data`, 
      month,
      2024
    ) as UnifiedSalesData;
  } else {
    unifiedRecord = record as UnifiedSalesData;
  }
  
  // If output is unified, we're done
  if (outputFormat === 'unified') {
    return unifiedRecord as unknown as T;
  }
  
  // Otherwise convert unified to the target legacy format
  return mapUnifiedToLegacy(unifiedRecord, outputFormat) as unknown as T;
}; 