
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
