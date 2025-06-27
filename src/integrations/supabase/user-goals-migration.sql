-- Create user_goals table for storing custom user goals
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_display_name TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('profit', 'margin', 'activeRatio', 'packs')),
  target_value DECIMAL(15,2) NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);

-- Create index on user_id and goal_type for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_goals_user_goal_type ON public.user_goals(user_id, goal_type);

-- Enable RLS on user_goals table
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read their own goals
CREATE POLICY "Users can read their own goals" ON public.user_goals
FOR SELECT
TO authenticated
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy to allow authenticated users to insert their own goals
CREATE POLICY "Users can insert their own goals" ON public.user_goals
FOR INSERT
TO authenticated
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy to allow authenticated users to update their own goals
CREATE POLICY "Users can update their own goals" ON public.user_goals
FOR UPDATE
TO authenticated
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy to allow authenticated users to delete their own goals
CREATE POLICY "Users can delete their own goals" ON public.user_goals
FOR DELETE
TO authenticated
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy to allow service role full access
CREATE POLICY "Allow service role full access to user_goals" ON public.user_goals
FOR ALL
TO service_role
USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON public.user_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user goals with fallback to auto-calculated goals
CREATE OR REPLACE FUNCTION public.get_user_goals_with_fallback(input_user_id text, input_user_display_name text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  custom_goals json;
  calculated_goals json;
BEGIN
  -- Get custom goals for the user
  SELECT json_object_agg(goal_type, target_value) INTO custom_goals
  FROM public.user_goals
  WHERE user_id = input_user_id;
  
  -- If no custom goals exist, return empty so the app can use calculated goals
  IF custom_goals IS NULL THEN
    RETURN json_build_object('hasCustomGoals', false, 'goals', json_build_object());
  END IF;
  
  -- Return custom goals
  RETURN json_build_object('hasCustomGoals', true, 'goals', custom_goals);
END;
$$;