
-- Function to get the total count of records
CREATE OR REPLACE FUNCTION public.get_total_count()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM sales_data_march);
END;
$$;

-- Function to get counts by department
CREATE OR REPLACE FUNCTION public.get_department_counts()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_object_agg("Department", counts) INTO result
  FROM (
    SELECT "Department", COUNT(*) as counts 
    FROM sales_data_march 
    GROUP BY "Department"
  ) as dept_counts;
  
  RETURN result;
END;
$$;

-- Function to get count of wholesale records
CREATE OR REPLACE FUNCTION public.get_wholesale_count()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM sales_data_march WHERE "Department" = 'Wholesale');
END;
$$;

-- Function to get all unique department values
CREATE OR REPLACE FUNCTION public.get_unique_departments()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(DISTINCT "Department") INTO result
  FROM sales_data_march;
  
  RETURN result;
END;
$$;

-- Function to get all wholesale data
CREATE OR REPLACE FUNCTION public.get_wholesale_data()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', id,
      'rep', "Rep",
      'profit', "Profit"
    )
  ) INTO result
  FROM sales_data_march
  WHERE "Department" = 'Wholesale';
  
  RETURN result;
END;
$$;

-- Function to get combined sales data for reps by name
CREATE OR REPLACE FUNCTION public.get_combined_rep_data(rep_name text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  WITH rep_data AS (
    -- Get data where the person is the main rep
    SELECT "Department", "Profit", "Spend", "Packs", "Account Ref"
    FROM sales_data_march
    WHERE "Rep" = rep_name
    
    UNION ALL
    
    -- Get data where the person is a sub-rep
    SELECT "Department", "Profit", "Spend", "Packs", "Account Ref"
    FROM sales_data_march
    WHERE "Sub-Rep" = rep_name
  )
  SELECT json_build_object(
    'total_profit', COALESCE(SUM("Profit"), 0),
    'total_spend', COALESCE(SUM("Spend"), 0),
    'total_packs', COALESCE(SUM("Packs"), 0),
    'total_accounts', COUNT(DISTINCT "Account Ref"),
    'departments', (SELECT json_agg(DISTINCT "Department") FROM rep_data)
  ) INTO result
  FROM rep_data;
  
  RETURN result;
END;
$$;

-- Function to get account counts by department
CREATE OR REPLACE FUNCTION public.get_account_counts_by_department()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  WITH account_counts AS (
    SELECT 
      "Department", 
      COUNT(DISTINCT "Account Ref") as total_accounts,
      COUNT(DISTINCT CASE WHEN "Spend" > 0 THEN "Account Ref" END) as active_accounts
    FROM sales_data_march
    GROUP BY "Department"
  )
  SELECT json_object_agg("Department", 
    json_build_object(
      'total', total_accounts,
      'active', active_accounts
    )
  ) INTO result
  FROM account_counts;
  
  RETURN result;
END;
$$;

-- Function to get overall metrics across all departments
CREATE OR REPLACE FUNCTION public.get_overall_metrics()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_profit', SUM("Profit"),
    'total_spend', SUM("Spend"),
    'total_packs', SUM("Packs"),
    'average_margin', CASE WHEN SUM("Spend") > 0 THEN (SUM("Profit") / SUM("Spend") * 100) ELSE 0 END,
    'total_accounts', COUNT(DISTINCT "Account Ref"),
    'active_accounts', COUNT(DISTINCT CASE WHEN "Spend" > 0 THEN "Account Ref" END)
  ) INTO result
  FROM sales_data_march;
  
  RETURN result;
END;
$$;

-- Function to get department-specific total profit
CREATE OR REPLACE FUNCTION public.get_department_profit(dept text)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT SUM("Profit") FROM sales_data_march WHERE "Department" = dept);
END;
$$;


-- Function to get top performing reps by profit (excluding departments)
CREATE OR REPLACE FUNCTION public.get_top_reps_by_profit(limit_count integer DEFAULT 5)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  WITH rep_profits AS (
    -- Get profits where person is the main rep
    SELECT "Rep" as rep_name, SUM("Profit") as profit
    FROM sales_data_march
    WHERE "Rep" NOT IN ('RETAIL', 'REVA', 'Wholesale')
    GROUP BY "Rep"
    
    UNION ALL
    
    -- Get profits where person is the sub-rep
    SELECT "Sub-Rep" as rep_name, SUM("Profit") as profit
    FROM sales_data_march
    WHERE "Sub-Rep" IS NOT NULL AND "Sub-Rep" != ''
    GROUP BY "Sub-Rep"
  ),
  combined_profits AS (
    SELECT rep_name, SUM(profit) as total_profit
    FROM rep_profits
    GROUP BY rep_name
    ORDER BY total_profit DESC
    LIMIT limit_count
  )
  SELECT json_agg(
    json_build_object(
      'rep', rep_name,
      'profit', total_profit
    )
  ) INTO result
  FROM combined_profits;
  
  RETURN result;
END;
$$;
