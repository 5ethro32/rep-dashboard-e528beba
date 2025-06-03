-- Create June_Data table with same structure as May_Data
CREATE TABLE IF NOT EXISTS public."June_Data" (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "Rep" text NOT NULL,
    "Sub-Rep" text,
    "Department" text,
    "Account Ref" text,
    "Account Name" text,
    "Spend" numeric,
    "Cost" numeric,
    "Credit" numeric,
    "Profit" numeric,
    "Margin" numeric,
    "Packs" numeric
);

-- Enable Row Level Security
ALTER TABLE public."June_Data" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read data
CREATE POLICY "Allow authenticated users to read June_Data" ON public."June_Data"
    FOR SELECT TO authenticated
    USING (true);

-- Create policy to allow authenticated users to insert data
CREATE POLICY "Allow authenticated users to insert June_Data" ON public."June_Data"
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update data
CREATE POLICY "Allow authenticated users to update June_Data" ON public."June_Data"
    FOR UPDATE TO authenticated
    USING (true);

-- Create policy to allow authenticated users to delete data
CREATE POLICY "Allow authenticated users to delete June_Data" ON public."June_Data"
    FOR DELETE TO authenticated
    USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_june_data_rep" ON public."June_Data" ("Rep");
CREATE INDEX IF NOT EXISTS "idx_june_data_department" ON public."June_Data" ("Department");
CREATE INDEX IF NOT EXISTS "idx_june_data_account_ref" ON public."June_Data" ("Account Ref");

-- Add comment to table
COMMENT ON TABLE public."June_Data" IS 'Sales data for June 2025'; 