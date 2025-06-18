-- RLS Policies for June_Data_Comparison table
-- These policies allow authenticated users to read data from the June_Data_Comparison table

-- Enable RLS on June_Data_Comparison table (if not already enabled)
ALTER TABLE public."June_Data_Comparison" ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to SELECT from June_Data_Comparison
CREATE POLICY "Allow authenticated users to read June_Data_Comparison" ON public."June_Data_Comparison"
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow service role full access (for admin operations)
CREATE POLICY "Allow service role full access to June_Data_Comparison" ON public."June_Data_Comparison"
FOR ALL
TO service_role
USING (true);

-- Optional: Policy to allow anon users to read (if your app allows anonymous access)
-- Uncomment the following if you need anonymous access:
-- CREATE POLICY "Allow anon users to read June_Data_Comparison" ON public."June_Data_Comparison"
-- FOR SELECT
-- TO anon
-- USING (true);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'June_Data_Comparison'; 