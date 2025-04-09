
-- Function to get April MTD data by department
CREATE OR REPLACE FUNCTION public.get_april_mtd_data_by_department(dept TEXT)
RETURNS JSONB
LANGUAGE PLPGSQL
AS $$
BEGIN
  RETURN (
    SELECT json_agg(t)
    FROM (
      SELECT *
      FROM mtd_daily
      WHERE "Department" = dept
    ) t
  );
END;
$$;
