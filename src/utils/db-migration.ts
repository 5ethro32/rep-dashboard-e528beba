
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Helper function to check if a table exists
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    // Using execute_sql instead of direct query to avoid type errors
    const { data, error } = await supabase
      .rpc('execute_sql', {
        sql_query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        `
      } as any);
    
    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

// Helper function to create the unified_sales_data table
export const createUnifiedTable = async (): Promise<boolean> => {
  try {
    // First check if the table already exists
    const exists = await tableExists('unified_sales_data');
    if (exists) {
      console.log('unified_sales_data table already exists');
      return true;
    }

    // Try to use the RPC function for creating the table
    const { error } = await supabase.rpc('create_unified_sales_table' as any);
    
    if (error) {
      // Fallback to direct SQL if RPC fails
      console.log('RPC failed, trying direct SQL instead');
      const { error: sqlError } = await supabase
        .rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS unified_sales_data (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              source_id TEXT,
              source_table TEXT,
              reporting_year INTEGER,
              reporting_month TEXT,
              reporting_period TEXT,
              rep_name TEXT NOT NULL,
              sub_rep TEXT,
              account_ref TEXT,
              account_name TEXT,
              department TEXT,
              spend DECIMAL(12,2),
              profit DECIMAL(12,2),
              margin DECIMAL(6,2),
              packs INTEGER,
              cost DECIMAL(12,2),
              credit DECIMAL(12,2),
              import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              data_month TEXT
            );
          `
        } as any);
        
      if (sqlError) throw sqlError;
    }
    
    console.log('Successfully created unified_sales_data table');
    return true;
  } catch (error) {
    console.error('Error creating unified_sales_data table:', error);
    toast({
      title: 'Table Creation Error',
      description: 'Failed to create the unified sales data table.',
      variant: 'destructive'
    });
    return false;
  }
};

// Custom function to execute SQL for migration
export const executeMigrationSQL = async (
  sourceTable: string, 
  monthName: string, 
  monthCode: string,
  year: number = 2024
): Promise<number> => {
  try {
    let sqlQuery: string;
    if (sourceTable === 'sales_data') {
      // March data (snake_case fields)
      sqlQuery = `
        INSERT INTO unified_sales_data (
          source_id, source_table, 
          reporting_year, reporting_month, reporting_period,
          rep_name, sub_rep, 
          account_ref, account_name,
          department, 
          spend, profit, margin, packs, cost, credit,
          data_month
        )
        SELECT
          id::TEXT, '${sourceTable}',
          ${year}, '${monthName}', '${monthCode}',
          rep_name, sub_rep,
          account_ref, account_name,
          rep_type,
          spend, profit, margin, packs, cost, credit,
          '${monthName}'
        FROM ${sourceTable}
        RETURNING COUNT(*)
      `;
    } else {
      // Other months (PascalCase with spaces fields)
      sqlQuery = `
        INSERT INTO unified_sales_data (
          source_id, source_table, 
          reporting_year, reporting_month, reporting_period,
          rep_name, sub_rep, 
          account_ref, account_name,
          department, 
          spend, profit, margin, packs, cost, credit,
          data_month
        )
        SELECT
          id::TEXT, '${sourceTable}',
          ${year}, '${monthName}', '${monthCode}',
          "Rep", "Sub-Rep",
          "Account Ref", "Account Name",
          "Department",
          "Spend", "Profit", "Margin", "Packs", "Cost", "Credit",
          '${monthName}'
        FROM ${sourceTable}
        RETURNING COUNT(*)
      `;
    }
    
    // Execute the SQL using rpc to avoid type errors
    const { data, error } = await supabase
      .rpc('execute_sql', { sql_query: sqlQuery } as any);
      
    if (error) throw error;
    
    const count = data && data[0] ? parseInt(data[0].count) : 0;
    return count;
  } catch (error) {
    console.error(`Error migrating data from ${sourceTable}:`, error);
    return 0;
  }
};

// Helper function to migrate data from a source table to the unified table
export const migrateDataFromTable = async (
  sourceTable: string, 
  monthName: string, 
  monthCode: string,
  year: number = 2024
): Promise<number> => {
  try {
    console.log(`Starting migration from ${sourceTable} to unified_sales_data for ${monthName}`);
    
    // First try using the RPC function
    try {
      const { data, error } = await supabase
        .rpc('migrate_table_data', {
          source_table_name: sourceTable,
          month_name: monthName,
          month_code: monthCode,
          year_value: year
        } as any);
      
      if (error) throw error;
      console.log(`Successfully migrated ${data} records from ${sourceTable}`);
      return data as number;
    } catch (rpcError) {
      // Fallback to custom SQL migration
      console.log(`RPC method failed, falling back to SQL execution: ${rpcError}`);
      const count = await executeMigrationSQL(sourceTable, monthName, monthCode, year);
      console.log(`Successfully migrated ${count} records from ${sourceTable} using SQL`);
      return count;
    }
  } catch (error) {
    console.error(`Error migrating data from ${sourceTable}:`, error);
    toast({
      title: 'Migration Error',
      description: `Failed to migrate data from ${sourceTable}.`,
      variant: 'destructive'
    });
    return 0;
  }
};

// Main migration function
export const migrateAllData = async (): Promise<{
  success: boolean;
  counts: Record<string, number>;
}> => {
  const results = {
    success: false,
    counts: {
      february: 0,
      march: 0,
      april: 0,
      may: 0,
      total: 0
    }
  };

  try {
    // Step 1: Create the unified table
    const tableCreated = await createUnifiedTable();
    if (!tableCreated) {
      return results;
    }

    // Step 2: Migrate data from each source table
    // February
    results.counts.february = await migrateDataFromTable(
      'sales_data_februrary', 'February', '2024-02'
    );

    // March
    results.counts.march = await migrateDataFromTable(
      'sales_data', 'March', '2024-03'
    );

    // April
    results.counts.april = await migrateDataFromTable(
      'mtd_daily', 'April', '2024-04'
    );

    // May
    results.counts.may = await migrateDataFromTable(
      'May_Data', 'May', '2024-05'
    );

    // Calculate total
    results.counts.total = 
      results.counts.february + 
      results.counts.march + 
      results.counts.april + 
      results.counts.may;

    if (results.counts.total > 0) {
      results.success = true;
      toast({
        title: 'Migration Complete',
        description: `Successfully migrated ${results.counts.total} records to the unified data table.`,
        variant: 'default'
      });
    } else {
      toast({
        title: 'Migration Warning',
        description: 'No records were migrated. Please check the console for details.',
        variant: 'destructive'
      });
    }

    return results;
  } catch (error) {
    console.error('Error during migration process:', error);
    toast({
      title: 'Migration Failed',
      description: 'An unexpected error occurred during migration.',
      variant: 'destructive'
    });
    return results;
  }
};
