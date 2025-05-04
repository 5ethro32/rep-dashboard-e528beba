-- SQL function to aggregate metrics by department for a given month
CREATE OR REPLACE FUNCTION get_department_metrics(month_param TEXT)
RETURNS TABLE (
  department TEXT,
  record_count BIGINT,
  total_spend NUMERIC,
  total_profit NUMERIC,
  total_packs NUMERIC,
  total_accounts BIGINT,
  rep_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    LOWER(department) as department,
    COUNT(*) as record_count,
    SUM(spend) as total_spend,
    SUM(profit) as total_profit,
    SUM(packs) as total_packs,
    COUNT(DISTINCT account_ref) as total_accounts,
    COUNT(DISTINCT rep_name) as rep_count
  FROM 
    unified_sales_data
  WHERE 
    reporting_month = month_param
  GROUP BY 
    LOWER(department);
END;
$$;

-- Function to execute arbitrary SQL (admin only, for fallback)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if user has admin role
  IF (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin' THEN
    EXECUTE sql_query INTO result;
    RETURN result;
  ELSE
    RAISE EXCEPTION 'Permission denied: Admin role required';
  END IF;
END;
$$;

-- Function to get month data
CREATE OR REPLACE FUNCTION get_month_data(month_param TEXT)
RETURNS SETOF unified_sales_data
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM unified_sales_data
  WHERE reporting_month = month_param;
END;
$$; 