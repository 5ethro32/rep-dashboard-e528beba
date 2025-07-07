-- Migration: Add RLS policies for Daily_Data table
-- This enables authenticated users to read from the Daily_Data table

-- Enable RLS on Daily_Data table
ALTER TABLE public."Daily_Data" ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to SELECT from Daily_Data
CREATE POLICY "Allow authenticated users to read Daily_Data" ON public."Daily_Data"
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow service role full access to Daily_Data (for admin operations)
CREATE POLICY "Allow service role full access to Daily_Data" ON public."Daily_Data"
FOR ALL
TO service_role
USING (true);

-- Optional: Policy to allow anon users to read Daily_Data (if your app allows anonymous access)
-- Uncomment the following if you need anonymous access:
-- CREATE POLICY "Allow anon users to read Daily_Data" ON public."Daily_Data"
-- FOR SELECT
-- TO anon
-- USING (true); 