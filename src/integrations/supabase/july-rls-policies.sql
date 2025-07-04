-- RLS Policies for July_Data and July_Data_Comparison tables
-- These policies allow authenticated users to read data from the July tables

-- Enable RLS on July_Data table
ALTER TABLE public."July_Data" ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to SELECT from July_Data
CREATE POLICY "Allow authenticated users to read July_Data" ON public."July_Data"
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow service role full access to July_Data (for admin operations)
CREATE POLICY "Allow service role full access to July_Data" ON public."July_Data"
FOR ALL
TO service_role
USING (true);

-- Optional: Policy to allow anon users to read July_Data (if your app allows anonymous access)
-- Uncomment the following if you need anonymous access:
-- CREATE POLICY "Allow anon users to read July_Data" ON public."July_Data"
-- FOR SELECT
-- TO anon
-- USING (true);

-- Enable RLS on July_Data_Comparison table
ALTER TABLE public."July_Data_Comparison" ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to SELECT from July_Data_Comparison
CREATE POLICY "Allow authenticated users to read July_Data_Comparison" ON public."July_Data_Comparison"
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow service role full access to July_Data_Comparison (for admin operations)
CREATE POLICY "Allow service role full access to July_Data_Comparison" ON public."July_Data_Comparison"
FOR ALL
TO service_role
USING (true);

-- Optional: Policy to allow anon users to read July_Data_Comparison (if your app allows anonymous access)
-- Uncomment the following if you need anonymous access:
-- CREATE POLICY "Allow anon users to read July_Data_Comparison" ON public."July_Data_Comparison"
-- FOR SELECT
-- TO anon
-- USING (true);

-- Verify the policies are created for July_Data
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'July_Data';

-- Verify the policies are created for July_Data_Comparison
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'July_Data_Comparison'; 