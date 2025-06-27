-- Drop existing policies for user_goals table
DROP POLICY IF EXISTS "Users can read their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.user_goals;

-- Create simplified RLS policies that work with Supabase auth
-- Policy to allow authenticated users to read their own goals
CREATE POLICY "Users can read their own goals" ON public.user_goals
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy to allow authenticated users to insert their own goals
CREATE POLICY "Users can insert their own goals" ON public.user_goals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Policy to allow authenticated users to update their own goals
CREATE POLICY "Users can update their own goals" ON public.user_goals
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy to allow authenticated users to delete their own goals
CREATE POLICY "Users can delete their own goals" ON public.user_goals
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_goals';